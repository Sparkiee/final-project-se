import Project from "../models/projects.js";
import User from "../models/users.js";
import Notification from "../models/notifications.js";
import Submission from "../models/submission.js";
import Grade from "../models/grades.js";
import Upload from "../models/uploads.js";
import Config from "../models/config.js";
import Group from "../models/groups.js";
import fs from "fs";
import path from "path";
import OpenAI from "openai";
import ExamTable from "../models/examTable.js";
import mongoose from "mongoose";
import Mission from "../models/mission.js";
import nodemailer from "nodemailer";

const openai = new OpenAI(process.env.OPENAI_API_KEY);

export const getProjects = async (req, res) => {
  try {
    const projects = await Project.find();
    res.status(200).send(projects);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

export const getActiveProjects = async (req, res) => {
  try {
    const projects = await Project.find({ isTerminated: false, isFinished: false });
    res.status(200).send(projects);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

export const getAvailableProjects = async (req, res) => {
  try {
    const config = await Config.findOne();
    if (!config) {
      return res.status(404).send({ message: "Config not found" });
    }
    const projects = await Project.find({ isTerminated: false, isFinished: false, year: config.currentYear });
    res.status(200).send(projects);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

export const getProjectsByYear = async (req, res) => {
  try {
    const projects = await Project.find({
      year: req.params.year,
      isTerminated: false,
      isFinished: false,
      isTaken: true,
    })
      .populate({
        path: "students.student",
        model: "User",
        select: "-password",
      })
      .populate({ path: "advisors", model: "User", select: "-password" });

    res.status(200).send(projects);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

export const getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).send({ message: "Project not found" });
    }
    const projectObj = project.toObject(); // Convert to plain JavaScript object
    delete projectObj.grades;
    delete projectObj.students;
    res.status(200).send(projectObj);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

export const getSelfProjects = async (req, res) => {
  try {
    const userid = req.user._id;
    const user = await User.findById(userid);
    if (!user) {
      return res.status(200).send({ projects: [] });
    }
    const projects = await Project.find({ advisors: { $in: [user] } });
    res.status(200).send({ projects });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

export const getSelfProjectsAsStudent = async (req, res) => {
  try {
    const userid = req.user._id;
    const user = await User.findById(userid);
    if (!user) {
      return res.status(200).send({ projects: [] });
    }
    const projects = await Project.find({ students: { $elemMatch: { student: userid } } }).populate({
      path: "students.student",
      model: "User",
      select: "-password", // Exclude the password field
    });
    res.status(200).send({ projects });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

export const createProject = async (req, res) => {
  try {
    const { title, description, year, suitableFor, type, continues, advisors, students } = req.body;

    if (!title || !description || !year || !suitableFor || !type) {
      return res.status(400).send({ message: "Missing required fields" });
    }
    const project = await Project.findOne({ title, year });
    if (project) {
      return res.status(400).send({ message: "This Project already exists in that year" });
    }

    let newProject;
    const advisorsList = [];
    const studentsList = [];
    if (students.length > 0) {
      for (const stud of students) {
        const studentUser = await User.findOne({ id: stud.id, isStudent: true });
        if (!studentUser) {
          return res.status(505).send({ message: `Student ${stud.name} not found` });
        }
        studentsList.push({ student: studentUser });
      }
    }
    if (req.user.isAdvisor && !req.user.isCoordinator) {
      newProject = new Project({
        ...req.body,
        advisors: [req.user._id],
        continues,
        isFinished: false,
        isTerminated: false,
        isTaken: false,
        grades: [],
        students: studentsList,
        journal: { missions: [] },
      });
    } else {
      if (advisors.length > 0) {
        for (const adv of advisors) {
          const advisorUser = await User.findOne({ _id: adv, isAdvisor: true });
          if (!advisorUser) {
            return res.status(505).send({ message: `Advisor ${adv.name} not found` });
          }
          advisorsList.push(advisorUser);
        }
      }
      newProject = new Project({
        ...req.body,
        advisors: advisorsList,
        students: studentsList,
        continues,
        isFinished: false,
        isTerminated: false,
        isTaken: false,
        grades: [],
        journal: { missions: [] },
      });
    }

    if (newProject.students.length > 0 && newProject.advisors.length > 0) {
      newProject.isTaken = true;
    }

    const savedProject = await newProject.save();

    Promise.all(
      advisorsList.map(async (advisor) => {
        const notification = new Notification({
          user: advisor._id,
          message: `התווספת כמנחה לפרויקט: ${title}`,
          link: `/project/${savedProject._id}`,
        });
        notification.save();
      }),

      studentsList.map(async (student) => {
        const notification = new Notification({
          user: student.student,
          message: `התווספת כסטודנט לפרויקט: ${title}`,
          link: `/project/${savedProject._id}`,
        });
        notification.save();
      })
    );

    res.status(201).json({
      message: "Project created successfully",
      project: savedProject,
    });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

export const getProjectsNoAdvisor = async (req, res) => {
  try {
    const projects = await Project.find({ advisors: [] });
    res.status(200).send(projects);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

export const getProjectsNoStudent = async (req, res) => {
  try {
    const projects = await Project.find({ students: [] });
    res.status(200).send(projects);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

export const addStudentToProject = async (req, res) => {
  try {
    const project = await Project.findById(req.body.projectID);
    if (!project) {
      return res.status(404).send({ message: "Project not found" });
    }

    for (const student of req.body.students) {
      const user = await User.findById(student);
      if (!user) {
        return res.status(404).send({ message: "Student not found" });
      }
      if (project.students.find((student) => student.student.toString() === user._id.toString())) {
        return res.status(400).send({ message: "Student is already in this project" });
      }
      project.students.push({ student: user._id });
      const notification = new Notification({
        user: user._id,
        message: `התווספת כסטודנט לפרויקט: ${project.title}`,
        link: `/project/${project._id}`,
      });
      notification.save();
    }

    if (project.students.length > 0 && project.advisors.length > 0) {
      project.isTaken = true;
    }

    await project.save();
    res.status(200).send("Student added successfully");
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

export const updateStudentsInProject = async (req, res) => {
  try {
    const { projectID, students } = req.body;
    const project = await Project.findById(projectID);
    if (!project) {
      return res.status(404).send({ message: "Project not found" });
    }

    // Validate students
    const validStudents = [];
    for (const studentID of students) {
      const student = await User.findById(studentID);
      if (!student || !student.isStudent) {
        return res.status(400).send({ message: `Invalid student ID: ${studentID}` });
      }
      validStudents.push({ student: student._id });
    }

    project.students = validStudents;

    if (project.students.length === 0) {
      project.isTaken = false;
    }

    await project.save();
    res.status(200).send({ message: "Students updated successfully", project });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

export const addCandidateToProject = async (req, res) => {
  const userid = req.user._id;
  try {
    const user = await User.findById(userid);
    const project = await Project.findById(req.body.projectID);
    if (!project) {
      return res.status(404).send({ message: "Project not found" });
    }
    if (project.isTaken) {
      return res.status(400).send({ error: "Project is already taken", message: "הפרויקט כבר נלקח" });
    }
    if (project.candidates.find((candidate) => candidate.student.toString() === userid.toString())) {
      return res.status(400).send({ message: "You are already a candidate for this project" });
    }
    project.candidates.push({ student: user._id });
    await project.save();

    const notification = new Notification({
      user: user._id,
      message: `התווספת כמתמודד לפרויקט: ${project.title} שים לב כי עליך לקבל אישור מהמנחה של הפרויקט`,
      link: `/project/${project._id}`,
    });
    notification.save();

    res.status(201).send("Candidate added successfully");
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

export const removeCandidateFromProject = async (req, res) => {
  const userid = req.body.userID;
  try {
    const user = await User.findById(userid);
    const project = await Project.findById(req.body.projectID);
    if (!project) {
      return res.status(404).send({ message: "Project not found" });
    }
    if (!project.candidates.find((candidate) => candidate.student.toString() === userid.toString())) {
      return res.status(400).send({ message: "You are not a candidate for this project" });
    }
    project.candidates = project.candidates.filter((candidate) => candidate.student.toString() !== userid.toString());
    await project.save();

    const notification = new Notification({
      user: user._id,
      message: `הוסרת מהמועמדים לפרויקט ${project.title}`,
      link: `/project/${project._id}`,
    });
    notification.save();

    res.status(200).send("Candidate removed successfully");
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

export const approveCandidate = async (req, res) => {
  try {
    const project = await Project.findById(req.body.projectID);
    if (!project) {
      return res.status(404).send({ message: "Project not found" });
    }
    const user = await User.findById(req.body.userID);
    const candidate = project.candidates.find((candidate) => candidate.student.toString() === user._id.toString());
    if (candidate) {
      if (!project.students) {
        project.students = [];
      }
      if (project.students.find((candidate) => candidate.student.toString() === user._id.toString())) {
        return res.status(409).send({ error: "Candidate is already approved", message: "המועמד כבר אושר" });
      }

      const projectResult = await Project.findOne({ students: { $elemMatch: { student: user._id } } });
      if (projectResult) {
        return res
          .status(409)
          .send({ error: "Student is already in another project", message: "הסטודנט כבר נמצא בפרויקט אחר" });
      }
      if (project.students.length >= 2) {
        return res
          .status(409)
          .send({ error: "Project is already full", message: "הפרויקט כבר מלא - רשומים שני סטודנטים" });
      }
      const { _id, ...candidateWithoutId } = candidate.toObject();
      project.students.push(candidateWithoutId);
      project.candidates = project.candidates.filter(
        (candidate) => candidate.student.toString() !== user._id.toString()
      );
    }
    await project.save();

    const notification = new Notification({
      user: user._id,
      message: `התקבלת כסטודנט לפרויקט ${project.title}, בהצלחה!`,
      link: `/project/${project._id}`,
    });
    await notification.save();

    // Send email to the user
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: user.email,
      subject: "🎉 התקבלת לפרויקט - מערכת לניהול פרויקטים",
      html: `
        <html lang="he" dir="rtl">
        <head>
          <meta charset="UTF-8" />
          <title>התקבלת לפרויקט</title>
        </head>
        <body>
          <div style="direction: rtl; font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px">
      <div style="display: flex; align-items: center; align-items: center;">
        <h4 style="color: #464bd8">מערכת לניהול פרויקטים</h4>
        <img
          src="https://i.postimg.cc/bNtFxdXh/project-management-logo.png"
          alt="Project Management Logo"
          style="height: 50px" />
      </div>
      <hr />
            <h2 style="color: #333; text-align: center">🎉 התקבלת לפרויקט</h2>
            <p>שלום ${user.name},</p>
            <p>התקבלת לפרויקט: ${project.title}, בהצלחה!</p>
          </div>
        </body>
        </html>
      `,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending acceptance email:", error);
      }
    });

    res.status(200).send(`Candidate ${candidate.student} approved successfully`);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

export const removeStudentFromProject = async (req, res) => {
  try {
    const userid = req.body.userID;
    const user = await User.findById(userid);
    const project = await Project.findById(req.body.projectID);
    if (!project) {
      return res.status(404).send({ message: "Project not found" });
    }
    if (!project.students.find((student) => student.student.toString() === userid.toString())) {
      return res.status(400).send({ message: "User is not a student in this project" });
    }
    const student = project.students.find((student) => student.student.toString() === userid.toString());
    project.students = project.students.filter((student) => student.student.toString() !== userid.toString());
    project.candidates.push(student);
    await project.save();

    const notification = new Notification({
      user: user._id,
      message: `הוסרת מהסטודנטים של פרויקט ${project.title}`,
      link: `/project/${project._id}`,
    });
    notification.save();
    res.status(200).send("Student moved back to candidates successfully");
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

export const switchProjectRegistration = async (req, res) => {
  try {
    const project = await Project.findById(req.body.projectID);
    if (!project) {
      return res.status(404).send({ message: "Project not found" });
    }
    const submission = await Submission.findOne({ project: project._id });
    if (submission) {
      return res
        .status(200)
        .send({ message: "Project has a submission, cannot switch registration", hasSubmission: true });
    }
    project.isTaken = !project.isTaken;
    await project.save();
    res.status(200).send("Project registration switched successfully");
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

export const checkIfUserIsCandidate = async (req, res) => {
  const userid = req.user._id;
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).send({ message: "Project not found" });
    }
    if (project.candidates.find((candidate) => candidate.student.toString() === userid.toString())) {
      return res.status(200).send({ isCandidate: true });
    }
    res.status(200).send({ isCandidate: false });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

export const updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).send({ message: "Project not found" });
    }
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    const { title, description, year, suitableFor, type, externalEmail, continues } = req.body;
    if (!title || !description || !year || !suitableFor || !type) {
      return res.status(400).send({ message: "Missing required fields" });
    }

    const updatedFields = {
      oldTitle: project.title,
      newTitle: title !== project.title ? title : "שדה לא שונה",
      oldDescription: project.description,
      newDescription: description !== project.description ? description : "שדה לא שונה",
      oldYear: project.year,
      newYear: year !== project.year ? year : "שדה לא שונה",
      oldSuitableFor: project.suitableFor,
      newSuitableFor: suitableFor !== project.suitableFor ? suitableFor : "שדה לא שונה",
      oldType: project.type,
      newType: type !== project.type ? type : "שדה לא שונה",
      oldExternalEmail: project.externalEmail ? project.externalEmail : "לא הוזן",
      newExternalEmail: externalEmail !== project.externalEmail ? externalEmail : "שדה לא שונה",
      oldContinues: project.continues ? "כן" : "לא",
      newContinues: continues !== project.continues ? (continues ? "כן" : "לא") : "שדה לא שונה",
      editDate: new Date(),
      editedBy: { name: user.name, id: user.id },
    };

    project.editRecord.push(updatedFields);

    project.title = title;
    project.description = description;
    project.year = year;
    project.suitableFor = suitableFor;
    project.type = type;
    project.externalEmail = externalEmail;
    project.continues = continues;

    await project.save();
    res.status(201).json({
      message: "Project updated successfully",
      project: project,
    });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

export const addAdvisorToProject = async (req, res) => {
  try {
    const project = await Project.findById(req.body.projectID);
    if (!project) {
      return res.status(404).send({ message: "Project not found" });
    }
    const advisor = await User.findById(req.body.advisorID);
    if (!advisor) {
      return res.status(404).send({ message: "Advisor not found" });
    }
    if (!project.advisors.find((advisor) => advisor.toString() === req.body.advisorID)) {
      project.advisors.push(req.body.advisorID);
    }
    if (project.students.length !== 0) {
      project.isTaken = true;
    }
    await project.save();

    const notification = new Notification({
      user: req.body.advisorID,
      message: `התווספת כמנחה לפרויקט: ${project.title}`,
      link: `/project/${project._id}`,
    });
    notification.save();

    res.status(200).send("Advisor added successfully");
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

export const updateAdvisorInProject = async (req, res) => {
  try {
    const { projectID, advisorID } = req.body;
    const project = await Project.findById(projectID);
    if (!project) {
      return res.status(404).send({ message: "Project not found" });
    }

    const advisor = await User.findById(advisorID);
    if (!advisor || !advisor.isAdvisor) {
      return res.status(400).send({ message: "Invalid advisor ID" });
    }

    const currentAdvisor = project.advisors[0];
    if (currentAdvisor !== advisorID) {
      const notification = new Notification({
        user: currentAdvisor,
        message: `הוסרת כמנחה של פרויקט: ${project.title}`,
        link: `/project/${project._id}`,
      });
      notification.save();
    }

    project.advisors = [advisorID];

    if (project.advisors.length === 0) {
      project.isTaken = false;
    }

    const notification = new Notification({
      user: advisorID,
      message: `התווספת כמנחה לפרויקט: ${project.title}`,
      link: `/project/${project._id}`,
    });
    notification.save();

    await project.save();

    res.status(200).send({ message: "Advisor updated successfully", project });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

export const terminateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.body.projectID);
    if (!project) {
      return res.status(404).send({ message: "Project not found" });
    }

    await Promise.all([
      ...project.students.map(async (student) => {
        const notification = new Notification({
          user: student.student,
          message: `הפרויקט: ${project.title} בו אתה רשום בוטל`,
          link: `/project/${project._id}`,
        });
        await notification.save();
      }),
      ...project.advisors.map(async (advisor) => {
        const notification = new Notification({
          user: advisor,
          message: `הפרויקט: ${project.title} שאתה מנחה בוטל`,
          link: `/project/${project._id}`,
        });
        await notification.save();
      }),
    ]);

    // Save students to termination Record and free them from the project
    project.terminationRecord = project.students;
    project.students = [];
    project.alphaReportJudges = [];
    project.finalReportJudges = [];
    project.examJudges = [];
    project.isTerminated = true;

    // Delete all related submissions and their files
    const submissions = await Submission.find({ project: project._id });
    for (const submission of submissions) {
      if (submission.file) {
        const file = await Upload.findById(submission.file);
        if (file) {
          const filePath = path.join(process.cwd(), `uploads/${file.destination}`, file.filename);
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          await Upload.deleteOne({ _id: submission.file });
        }
      }
      if (submission.extraUploadFile) {
        const extraFile = await Upload.findById(submission.extraUploadFile);
        if (extraFile) {
          const filePath = path.join(process.cwd(), `uploads/${extraFile.destination}`, extraFile.filename);
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          await Upload.deleteOne({ _id: submission.extraUploadFile });
        }
      }
      // Delete all grades related to the submission
      await Grade.deleteMany({ _id: { $in: submission.grades } });
      await submission.deleteOne();
    }

    // Delete all related missions
    await Mission.deleteMany({ _id: { $in: project.journal.missions } });

    // Delete the journal
    project.journal = { missions: [] };

    await project.save();
    res.status(200).send("Project terminated successfully");
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

export const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).send({ message: "Project not found" });
    }
    await project.deleteOne();
    res.status(200).send("Project deleted successfully");
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

export const restoreProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).send({ message: "Project not found" });
    }
    if (!project.isTerminated) {
      return res.status(400).send({ message: "Project is not terminated" });
    }
    project.isTerminated = false;
    project.terminationRecord = [];
    project.isTaken = false;
    project.isFinished = false;
    project.students = [];
    project.alphaReportJudges = [];
    project.finalReportJudges = [];
    project.examJudges = [];
    project.candidates = [];
    project.grades = [];

    await project.save();
    res.status(200).send("Project restored successfully");
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

export const assignAdvisorsAutomatically = async (req, res) => {
  try {
    const projects = await Project.find({ advisors: [] });
    const advisors = await User.find({ isAdvisor: true });

    if (projects.length === 0) {
      return res.status(304).send({ message: "All projects already have advisors" });
    }

    // Create a map to store advisor project counts and ranks
    const advisorStats = new Map();

    // Initialize advisor stats
    advisors.forEach((advisor) => {
      advisorStats.set(advisor._id.toString(), { count: 0, rank: 0 });
    });

    // Calculate current project counts and ranks for each advisor
    const allProjects = await Project.find({ advisors: { $ne: [] } });
    allProjects.forEach((project) => {
      project.advisors.forEach((advisorId) => {
        const stats = advisorStats.get(advisorId.toString());
        if (stats) {
          stats.count += 1;
          if (project.suitableFor === "יחיד") {
            stats.rank += 1;
          } else if (project.suitableFor === "יחיד/זוג") {
            stats.rank += 2;
          } else if (project.suitableFor === "זוג") {
            stats.rank += 3;
          }
        }
      });
    });

    // Sort advisors by a weighted combination of project count and rank
    const sortedAdvisors = Array.from(advisorStats.entries()).sort((a, b) => {
      const aTotal = a[1].count * 1.5 + a[1].rank;
      const bTotal = b[1].count * 1.5 + b[1].rank;
      return aTotal - bTotal;
    });

    // Assign advisors to projects
    for (const project of projects) {
      if (project.advisors.length === 0) {
        const advisorId = sortedAdvisors.shift()[0];
        project.advisors.push(advisorId);
        const stats = advisorStats.get(advisorId);
        stats.count += 1;
        if (project.suitableFor === "יחיד") {
          stats.rank += 1;
        } else if (project.suitableFor === "יחיד/זוג") {
          stats.rank += 2;
        } else if (project.suitableFor === "זוג") {
          stats.rank += 3;
        }
        sortedAdvisors.push([advisorId, stats]);
        sortedAdvisors.sort((a, b) => {
          const aTotal = a[1].count * 1.5 + a[1].rank;
          const bTotal = b[1].count * 1.5 + b[1].rank;
          return aTotal - bTotal;
        });
      }
    }

    await Promise.all(projects.map((project) => project.save()));
    res.status(200).send("Advisors assigned successfully");
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

export const getProjectYears = async (req, res) => {
  try {
    const years = await Project.distinct("year");
    res.status(200).send(years);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

export const startProjectsCoordinator = async (req, res) => {
  try {
    const projects = await Project.find({ year: req.body.year, isTaken: false });
    if (projects.length === 0) {
      return res.status(304).send({ message: "No projects found" });
    }
    projects.forEach((project) => {
      if (project.advisors.length !== 0 && project.students.length !== 0 && !project.isTaken) {
        project.isTaken = true;
      }
    });
    await Promise.all(projects.map((project) => project.save()));
    res.status(200).send("Projects started successfully");
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

export const deleteAllProjects = async (req, res) => {
  try {
    const projects = await Project.find();
    for (const project of projects) {
      // Detach students and advisors
      project.students = [];
      project.advisors = [];
      await project.save();

      // Delete associated submissions
      const submissions = await Submission.find({ project: project._id });
      for (const submission of submissions) {
        // Delete associated grades
        await Grade.deleteMany({ _id: { $in: submission.grades } });

        // Delete associated file
        if (submission.file) {
          const file = await Upload.findById(submission.file);
          if (file) {
            const filePath = path.join(process.cwd(), `uploads/${file.destination}`, file.filename);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            await Upload.deleteOne({ _id: submission.file });
          }
        }

        if (submission.extraUploadFile) {
          const extraFile = await Upload.findById(submission.extraUploadFile);
          if (extraFile) {
            const filePath = path.join(process.cwd(), `uploads/${extraFile.destination}`, extraFile.filename);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            await Upload.deleteOne({ _id: submission.extraUploadFile });
          }
        }
      }
      await Submission.deleteMany({ project: project._id });

      // Delete associated missions
      await Mission.deleteMany({ _id: { $in: project.journal.missions } });
    }
    await Project.deleteMany();
    res.status(200).json({ message: "All projects deleted successfully" });
  } catch (error) {
    console.error("Error deleting projects:", error);
    res.status(500).json({ message: "Failed to delete projects" });
  }
};

export const createExamTableManuel = async (req, res) => {
  try {
    let groups = [];
    let projects = [];
    const config = await Config.findOne();
    if (req.body.groupId === "all") {
      projects = await Project.find({ year: config.currentYear, isTaken: true, isTerminated: false });
    } else {
      groups = await Group.find({ _id: { $in: req.body.groupId } });
      const projectIds = groups[0].projects.map((project) => project._id);
      projects = await Project.find({ _id: { $in: projectIds }, isTaken: true, isTerminated: false });
    }
    if (projects.length === 0) {
      return res.status(404).json({ message: "No projects found" });
    }

    const projectsWithJudges = await Promise.all(
      projects.map(async (project) => {
        for (const student of project.students) {
          const user = await User.findById(student.student);
          if (user) {
            student.student = user;
          }
        }
        const submission = await Submission.findOne({ project: project._id, name: "מבחן סוף" }).populate("grades");
        if (!submission) {
          return null;
        }
        let judges = [];
        if (submission) {
          judges = submission.grades.map((grade) => grade.judge);
          for (const judge of judges) {
            const user = await User.findById(judge);
            if (user) {
              judge.name = user.name;
            }
          }
        }
        return { ...project.toObject(), judges };
      })
    );

    const filteredProjects = projectsWithJudges.filter((project) => project !== null);
    if (filteredProjects.length === 0) {
      return res.status(304).json({ message: "No projects with judges found" });
    }

    const projectDetails = filteredProjects.map((project) => {
      return {
        id: project._id,
        title: project.title,
        students: project.students.map((student) => ({ id: student.student._id, name: student.student.name })),
        judges: project.judges.map((judge) => ({ id: judge._id, name: judge.name })),
      };
    });

    // Step 1: Count the number of appearances for each judge
    const judgeProjectCount = {};

    projectDetails.forEach((project) => {
      project.judges.forEach((judge) => {
        const judgeId = judge.id;
        if (judgeProjectCount[judgeId]) {
          judgeProjectCount[judgeId]++;
        } else {
          judgeProjectCount[judgeId] = 1;
        }
      });
    });

    // Step 2: Sort judges by the number of appearances
    const sortedJudges = Object.entries(judgeProjectCount).sort((a, b) => b[1] - a[1]);

    const examSchedule = [];
    let currentDay = req.body.date ? new Date(req.body.date) : new Date();
    const timeSlots = ["10:00", "10:40", "11:20", "12:00", "12:40", "14:00", "14:40", "15:20", "16:00"];

    for (const judge of sortedJudges) {
      const judgeId = judge[0];
      const projectsWithTopJudge = projectDetails.filter((project) => project.judges.some((j) => j.id.equals(judgeId)));

      for (const project of projectsWithTopJudge) {
        // Check if the project already exists in the examSchedule
        const projectExists = examSchedule.some((day) =>
          day.exams.some((exam) => exam.projects.some((p) => p.id.equals(project.id)))
        );

        if (projectExists) {
          continue;
        }

        // Find an empty time slot for the project
        let scheduled = false;
        for (const day of examSchedule) {
          for (const exam of day.exams) {
            const hasConflict = exam.projects.some((p) =>
              p.judges.some((j) => project.judges.some((pj) => pj.id.equals(j.id)))
            );
            if (exam.projects.length < 4 && !hasConflict) {
              exam.projects.push(project);
              scheduled = true;
              break;
            }
          }
          if (scheduled) {
            break;
          }
        }

        // If no empty slot found, create a new day or time slot
        if (!scheduled) {
          if (examSchedule.length === 0 || examSchedule[examSchedule.length - 1].exams.length >= 9) {
            currentDay.setDate(currentDay.getDate() + 1);
            examSchedule.push({
              date: currentDay.toISOString(),
              exams: timeSlots.map((time) => ({ time, projects: [] })),
            });
          }

          const lastDay = examSchedule[examSchedule.length - 1];
          const nextTimeSlot = lastDay.exams.find((exam) => exam.projects.length < 4);

          if (nextTimeSlot) {
            nextTimeSlot.projects.push(project);
          }
        }
      }
    }

    // Ensure judges and students are arrays of objects
    examSchedule.forEach((day) => {
      day.exams.forEach((exam) => {
        exam.projects.forEach((project) => {
          project.judges = project.judges.map((judge) => ({
            id: judge.id.toString(),
            name: judge.name,
          }));
          project.students = project.students.map((student) => ({
            id: student.id.toString(),
            name: student.name,
          }));
        });
      });
    });

    const newExamTable = new ExamTable({
      groupId: req.body.groupId === "all" ? undefined : req.body.groupId,
      name: groups.length > 0 ? groups[0].name : "כללי",
      year: config.currentYear,
      classes: {
        class1: req.body.class1 !== "" ? req.body.class1 : "כיתה 1",
        class2: req.body.class2 !== "" ? req.body.class2 : "כיתה 2",
        class3: req.body.class3 !== "" ? req.body.class3 : "כיתה 3",
        class4: req.body.class4 !== "" ? req.body.class4 : "כיתה 4",
      },
      days: examSchedule,
    });

    await newExamTable.save();

    res.status(200).json(newExamTable);
  } catch (error) {
    console.error("Error creating exam table:", error);
    res.status(500).json({ message: "Failed to create exam table" });
  }
};

export const getExamTables = async (req, res) => {
  try {
    const examTables = await ExamTable.find();
    res.status(200).json(examTables);
  } catch (error) {
    console.error("Error fetching exam tables:", error);
    res.status(500).json({ message: "Failed to fetch exam tables" });
  }
};

export const editExamTableClasses = async (req, res) => {
  try {
    const examTable = await ExamTable.findById(req.params.id);
    if (!examTable) {
      return res.status(404).json({ message: "Exam table not found" });
    }

    examTable.classes.class1 = req.body.class1 !== "" && req.body.class1;
    examTable.classes.class2 = req.body.class2 !== "" && req.body.class2;
    examTable.classes.class3 = req.body.class3 !== "" && req.body.class3;
    examTable.classes.class4 = req.body.class4 !== "" && req.body.class4;

    await examTable.save();
    res.status(200).json(examTable);
  } catch (error) {
    console.error("Error editing exam table classes:", error);
    res.status(500).json({ message: "Failed to edit exam table classes" });
  }
};

export const deleteExamTable = async (req, res) => {
  try {
    const examTable = await ExamTable.findById(req.params.id);
    if (!examTable) {
      return res.status(404).json({ message: "Exam table not found" });
    }

    await examTable.deleteOne();
    res.status(200).json({ message: "Exam table deleted successfully" });
  } catch (error) {
    console.error("Error deleting exam table:", error);
    res.status(500).json({ message: "Failed to delete exam table" });
  }
};

export const createExamTable = async (req, res) => {
  try {
    let groups = [];
    let projects = [];
    const config = await Config.findOne();
    if (req.body.groupId === "all") {
      projects = await Project.find({ year: config.currentYear, isTaken: true, isTerminated: false });
    } else {
      groups = await Group.find({ _id: { $in: req.body.groupId } });
      const projectIds = groups[0].projects.map((project) => project._id);
      projects = await Project.find({ _id: { $in: projectIds }, isTaken: true, isTerminated: false });
    }
    if (projects.length === 0) {
      return res.status(404).json({ message: "No projects found" });
    }

    const projectsWithJudges = await Promise.all(
      projects.map(async (project) => {
        for (const student of project.students) {
          const user = await User.findById(student.student);
          if (user) {
            student.student = user;
          }
        }
        const submission = await Submission.findOne({ project: project._id, name: "מבחן סוף" }).populate("grades");
        if (!submission) {
          return null;
        }
        let judges = [];
        if (submission) {
          judges = submission.grades.map((grade) => grade.judge);
          for (const judge of judges) {
            const user = await User.findById(judge);
            if (user) {
              judge.name = user.name;
            }
          }
        }
        return { ...project.toObject(), judges };
      })
    );

    const filteredProjects = projectsWithJudges.filter((project) => project !== null);
    if (filteredProjects.length === 0) {
      return res.status(304).json({ message: "No projects with judges found" });
    }

    const projectDetails = filteredProjects.map((project) => {
      return {
        id: project._id,
        title: project.title,
        students: project.students.map((student) => ({ id: student.student._id, name: student.student.name })),
        judges: project.judges.map((judge) => ({ id: judge._id, name: judge.name })),
      };
    });

    // Shuffle function to randomize the order of projects
    const shuffleArray = (array) => {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
    };

    // Shuffle the projectDetails array
    shuffleArray(projectDetails);

    let prompt = `
    You are a project coordinator arranging a timetable for final exams. Each project's students will present their project to a panel of judges, who will grade the project and presentation.
    Let's go over the steps for you to make the best schedule for the exams.
    **Introduction:**
    - There are 9 time slots for exams, each lasting 40 minutes, including breaks.
    - **Exam Timing:**
      - First exam starts at 10:00 and ends at 10:40.
      - Second exam starts at 10:40 and ends at 11:20.
      - Third exam starts at 11:20 and ends at 12:00.
      - Fourth exam starts at 12:00 and ends at 12:40.
      - Fifth exam starts at 12:40 and ends at 13:20.
      - A break is scheduled between 13:20 and 14:00.
      - Sixth exam starts at 14:00 and ends at 14:40.
      - Seventh exam starts at 14:40 and ends at 15:20.
      - Eighth exam starts at 15:20 and ends at 16:00.
      - The last exam of the day starts at 16:00.
    - In each time slot, you can schedule up to 4 exams.
    **Step 1:**
    - In every project you have judges, I want you to first make a map of how many times each judge appears in the project details provided.
    **Step 2:**
    - When you find the numbers, I want you to take the judge with the most projects and schedule them as one of the 4 projects in each time slot, until that judge is scheduled for all their projects.
    - Keep in mind that there can be more than one judge in each project, so you will need to update the numbering for each judge in the project.
    **Step 3:**
    - Continue this process with the next judge with the most projects, until all judges are scheduled.
    - If there are conflicts with judges, you can move the project to the next time slot.
    - If all time slots are full, you can move the project to the next day.
    **Step 4:**
    - Run over the schedule and make sure that there are no conflicts with judges.
    - If there are, you can move the project to the next time slot or day.

    Below are the project details and their assigned judges.
    ${JSON.stringify(projectDetails, null, 2)}

    The output should be a JSON object like this:
    {
    "days": [
      {
        "date": "2025-01-16T09:25:22.418Z",
        "exams": [
          {
            "time": "10:00",
            "projects": [
              {
                "id": "project_id1",
                "title": "project_title1",
                "students": ["student1_object", "student2_object", ...],
                "judges": ["judge1_object", "judge2_object", "judge3_object"]
              },
              {
                "id": "project2",
                "title": "project_title2",
                "students": ["student3_object", "student4_object", ...],
                "judges": ["judge4_object", "judge5_object", "judge6_object"]
              },
              {
                "id": "project3",
                "title": "project_title3",
                "students": ["student5_object", "student6_object", ...],
                "judges": ["judge7_object", "judge8_object", "judge9_object"]
              },
              {
                "id": "project4",
                "title": "project_title4",
                "students": ["student7_object", "student8_object", ...],
                "judges": ["judge10_object", "judge11_object", "judge12_object"]
              },
            ]
          }
          // ...more exams
        ]
      }'
      // ...more days
    ]
    }
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Generate a JSON object for the exam schedule, based only on the input data." },
        { role: "user", content: prompt },
      ],
    });

    const response = completion.choices[0].message.content.trim();
    let examTable;
    try {
      // Attempt to parse the response as JSON
      examTable = JSON.parse(response);
    } catch (error) {
      // Fallback: Try to extract JSON manually if wrapped in extra text
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        examTable = JSON.parse(jsonMatch[0]); // Parse the matched JSON string
      } else {
        throw new Error("Failed to extract JSON from OpenAI response");
      }
    }

    // Function to recursively cast project IDs to ObjectId
    const castProjectIdsToObjectId = (obj) => {
      if (Array.isArray(obj)) {
        obj.forEach(castProjectIdsToObjectId);
      } else if (obj && typeof obj === "object") {
        for (const key in obj) {
          if (key === "id" && typeof obj[key] === "string") {
            obj[key] = new mongoose.Types.ObjectId(obj[key]);
          } else {
            castProjectIdsToObjectId(obj[key]);
          }
        }
      }
    };

    // Cast all project IDs to ObjectId
    castProjectIdsToObjectId(examTable);

    const newExamTable = new ExamTable({
      groupId: req.body.groupId === "all" ? undefined : req.body.groupId,
      name: groups.length > 0 ? groups[0].name : "כללי",
      year: config.currentYear,
      classes: {
        class1: req.body.class1 !== "" ? req.body.class1 : "כיתה 1",
        class2: req.body.class2 !== "" ? req.body.class2 : "כיתה 2",
        class3: req.body.class3 !== "" ? req.body.class3 : "כיתה 3",
        class4: req.body.class4 !== "" ? req.body.class4 : "כיתה 4",
      },
      days: examTable.days,
    });

    await newExamTable.save();

    res.status(200).json(newExamTable);
  } catch (error) {
    console.error("Error creating exam table:", error);
    res.status(500).json({ message: "Failed to create exam table" });
  }
};

export const deleteExamTableCell = async (req, res) => {
  try {
    const examTable = await ExamTable.findById(req.params.id);
    if (!examTable) {
      return res.status(404).json({ message: "Exam table not found" });
    }

    const { dayIndex, examIndex, projectIndex } = req.body;
    if (dayIndex < 0 || dayIndex >= examTable.days.length) {
      return res.status(400).json({ message: "Invalid day index" });
    }

    const day = examTable.days[dayIndex];
    if (examIndex < 0 || examIndex >= day.exams.length) {
      return res.status(400).json({ message: "Invalid exam index" });
    }

    const exam = day.exams[examIndex];
    if (projectIndex < 0 || projectIndex >= exam.projects.length) {
      return res.status(400).json({ message: "Invalid project index" });
    }

    exam.projects.splice(projectIndex, 1);
    await examTable.save();

    res.status(200).json(examTable);
  } catch (error) {
    console.error("Error deleting exam table cell:", error);
    res.status(500).json({ message: "Failed to delete exam table cell" });
  }
};

export const addExamTableCell = async (req, res) => {
  try {
    const examTable = await ExamTable.findById(req.params.id);
    if (!examTable) {
      return res.status(404).json({ message: "Exam table not found" });
    }

    const { dayIndex, examIndex, projectIndex, project } = req.body;
    if (dayIndex < 0 || dayIndex >= examTable.days.length) {
      return res.status(400).json({ message: "Invalid day index" });
    }

    const day = examTable.days[dayIndex];
    if (examIndex < 0 || examIndex >= day.exams.length) {
      return res.status(400).json({ message: "Invalid exam index" });
    }

    const exam = day.exams[examIndex];
    if (projectIndex < 0 || projectIndex > exam.projects.length) {
      return res.status(400).json({ message: "Invalid project index" });
    }

    exam.projects.splice(projectIndex, 0, project);
    await examTable.save();

    res.status(200).json(examTable);
  } catch (error) {
    console.error("Error adding exam table cell:", error);
    res.status(500).json({ message: "Failed to add exam table cell" });
  }
};

export const getProjectJudges = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const submission = await Submission.findOne({ project: project._id, name: "מבחן סוף" }).populate({
      path: "grades",
      populate: {
        path: "judge",
        model: "User",
      },
    });
    if (!submission) {
      return res.status(404).json({ message: "Final exam submission not found" });
    }

    const judges = submission.grades.map((grade) => grade.judge);

    res.status(200).json(judges);
  } catch (error) {
    console.error("Error fetching project judges:", error);
    res.status(500).json({ message: "Failed to fetch project judges" });
  }
};

export const getProjectsForExamTable = async (req, res) => {
  try {
    const projects = await Project.find({ isTaken: true, isTerminated: false });

    const projectsWithJudges = await Promise.all(
      projects.map(async (project) => {
        for (const student of project.students) {
          const user = await User.findById(student.student);
          if (user) {
            student.student = user;
          }
        }
        const submission = await Submission.findOne({ project: project._id, name: "מבחן סוף" }).populate("grades");
        if (!submission) {
          return null; // Filter out projects without "מבחן סוף" submission
        }
        let judges = [];
        if (submission) {
          judges = submission.grades.map((grade) => grade.judge);
          for (const judge of judges) {
            const user = await User.findById(judge);
            if (user) {
              judge.name = user.name;
            }
          }
        }
        return { ...project.toObject(), judges };
      })
    );

    const filteredProjects = projectsWithJudges.filter((project) => project !== null);

    const projectDetails = filteredProjects.map((project) => {
      return {
        _id: project._id,
        title: project.title,
        year: project.year,
        students: project.students.map((student) => ({ id: student.student._id, name: student.student.name })),
        judges: project.judges.map((judge) => ({ id: judge._id, name: judge.name })),
      };
    });

    res.status(200).json(projectDetails);
  } catch (error) {
    console.error("Error fetching projects for exam table:", error);
    res.status(500).json({ message: "Failed to fetch projects for exam table" });
  }
};

export const editExamTableDates = async (req, res) => {
  try {
    const examTable = await ExamTable.findById(req.params.id);
    if (!examTable) {
      return res.status(404).json({ message: "Exam table not found" });
    }

    const { dates } = req.body;
    if (!Array.isArray(dates) || dates.length !== examTable.days.length) {
      return res.status(400).json({ message: "Invalid dates array" });
    }

    examTable.days.forEach((day, index) => {
      day.date = new Date(dates[index]);
    });

    await examTable.save();
    res.status(200).json(examTable);
  } catch (error) {
    console.error("Error editing exam table dates:", error);
    res.status(500).json({ message: "Failed to edit exam table dates" });
  }
};

export const suggestProject = async (req, res) => {
  try {
    const { title, description, suitableFor, year, candidates, type, externalEmail } = req.body;
    const project = await Project.findOne({ title, year });
    if (project) {
      return res.status(400).send({ message: "This Project already exists in that year" });
    }
    const newProject = new Project({
      title,
      description,
      suitableFor,
      year,
      type,
      externalEmail,
      candidates: candidates.map((student) => ({ student })),
      studentSuggestions: {
        suggestedBy: req.user._id,
        suggestedDate: new Date(),
        stage: 1,
      },
      journal: {
        missions: [],
      },
    });

    const savedProject = await newProject.save();

    // Send notification to the students that aren't the suggester
    const studentIds = candidates.map((student) => student._id.toString());
    const filteredStudentIds = studentIds.filter((studentId) => studentId !== req.user._id.toString());
    await Promise.all(
      filteredStudentIds.map(async (studentId) => {
        const notification = new Notification({
          user: studentId,
          message: `הצעת פרויקט: ${title}`,
          link: `/project/${savedProject._id}`,
        });
        await notification.save();
      })
    );

    const coordinators = await User.find({ isCoordinator: true });
    await Promise.all(
      coordinators.map(async (coordinator) => {
        const notification = new Notification({
          user: coordinator._id,
          message: `פרויקט מחכה לאישור: ${title}`,
          link: `/project/${savedProject._id}`,
        });
        await notification.save();
      })
    );

    res.status(200).json({ project: savedProject });
  } catch (error) {
    console.error("Error suggesting project:", error);
    res.status(500).json({ message: "Failed to suggest project" });
  }
};

export const getProjectSuggestions = async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [{ "studentSuggestions.stage": 1 }, { "studentSuggestions.stage": 2 }],
      isTerminated: false,
    })
      .populate("studentSuggestions.suggestedBy")
      .populate("candidates.student");

    const filteredProjects = projects.filter((project) => project.studentSuggestions.suggestedBy !== null);

    res.status(200).json(filteredProjects);
  } catch (error) {
    console.error("Error fetching project suggestions:", error);
    res.status(500).json({ message: "Failed to fetch project suggestions" });
  }
};

export const approveProjectSuggestion = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (project.studentSuggestions.stage !== 1) {
      return res.status(400).json({ message: "Project suggestion is not in the correct stage" });
    }

    // Check if any candidate is already assigned to a different project
    for (const candidate of project.candidates) {
      const existingProject = await Project.findOne({ students: { $elemMatch: { student: candidate.student } } });
      if (existingProject) {
        return res.status(409).json({
          message: `הסטודנט: ${candidate.student.name}, כבר שייך לפרויקט: ${existingProject.title}`,
        });
      }
    }

    // Move students from candidates to students
    project.students = project.candidates.map((candidate) => ({
      student: candidate.student,
      joinDate: new Date(),
    }));
    project.candidates = [];

    project.studentSuggestions.stage = 2;
    project.studentSuggestions.acceptProject = true;
    project.studentSuggestions.acceptDate = new Date();
    await project.save();

    const notification = new Notification({
      user: project.studentSuggestions.suggestedBy._id,
      message: `הצעת הפרויקט: ${project.title} אושרה`,
      link: `/project/${project._id}`,
    });
    await notification.save();

    const user = await User.findById(project.studentSuggestions.suggestedBy._id);

    // Send email to the user
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: user.email,
      subject: "✅ הצעת הפרויקט אושרה - מערכת לניהול פרויקטים",
      html: `
        <html lang="he" dir="rtl">
        <head>
          <meta charset="UTF-8" />
          <title>הצעת הפרויקט אושרה</title>
        </head>
        <body>
          <div style="direction: rtl; font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px">
      <div style="display: flex; align-items: center; align-items: center;">
        <h4 style="color: #464bd8">מערכת לניהול פרויקטים</h4>
        <img
          src="https://i.postimg.cc/bNtFxdXh/project-management-logo.png"
          alt="Project Management Logo"
          style="height: 50px" />
      </div>
      <hr />
            <h2 style="color: #333; text-align: center">✅ הצעת הפרויקט אושרה</h2>
            <p>שלום ${user.name},</p>
            <p>הצעת הפרויקט שלך: ${project.title} אושרה בהצלחה!</p>
            <p>הישאר בקשר עם רכז הפרויקטים בנוגע לשיבוץ מנחה וקבלת הכוונה לפרויקט.</p>
          </div>
        </body>
        </html>
      `,
    };

    transporter.sendMail(mailOptions, (error) => {
      if (error) {
        console.error("Error sending approval email:", error);
      }
    });

    res.status(200).json(project);
  } catch (error) {
    console.error("Error approving project suggestion:", error);
    res.status(500).json({ message: "Failed to approve project suggestion" });
  }
};

export const rejectProjectSuggestion = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (project.studentSuggestions.stage !== 1) {
      return res.status(400).json({ message: "Project suggestion is not in the correct stage" });
    }

    project.studentSuggestions.stage = 2;
    project.studentSuggestions.denyProject = true;
    project.studentSuggestions.denyDate = new Date();
    project.studentSuggestions.denyReason = req.body.reason;
    project.isTerminated = true;
    await project.save();

    const notification = new Notification({
      user: project.studentSuggestions.suggestedBy._id,
      message: `הצעת הפרויקט: ${project.title} נדחתה`,
    });
    await notification.save();

    const user = await User.findById(project.studentSuggestions.suggestedBy._id);

    // Send email to the user
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: user.email,
      subject: "הצעת הפרויקט נדחתה - מערכת לניהול פרויקטים",
      html: `
        <html lang="he" dir="rtl">
        <head>
          <meta charset="UTF-8" />
          <title>הצעת הפרויקט נדחתה</title>
        </head>
        <body>
          <div style="direction: rtl; font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px">
      <div style="display: flex; align-items: center; align-items: center;">
        <h4 style="color: #464bd8">מערכת לניהול פרויקטים</h4>
        <img
          src="https://i.postimg.cc/bNtFxdXh/project-management-logo.png"
          alt="Project Management Logo"
          style="height: 50px" />
      </div>
      <hr />
            <h2 style="color: #333; text-align: center">הצעת הפרויקט נדחתה</h2>
            <p>שלום ${user.name},</p>
            <p>הצעת הפרויקט שלך: ${project.title} נדחתה.</p>
            <p>סיבה: ${req.body.reason ? req.body.reason : "לא ניתנה סיבה."}</p>
            <p>אם יש לך שאלות נוספות, אנא פנה לרכז הפרויקטים.</p>
            <hr />
            <p>ביכולתך להציע פרויקט חדש בכל עת.</p>
          </div>
        </body>
        </html>
      `,
    };

    transporter.sendMail(mailOptions, (error) => {
      if (error) {
        console.error("Error sending rejection email:", error);
      }
    });

    res.status(200).json(project);
  } catch (error) {
    console.error("Error rejecting project suggestion:", error);
    res.status(500).json({ message: "Failed to reject project suggestion" });
  }
};

export const deleteProjectSuggestion = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    await project.deleteOne();
    res.status(200).json({ message: "Project suggestion deleted successfully" });
  } catch (error) {
    console.error("Error deleting project suggestion:", error);
    res.status(500).json({ message: "Failed to delete project suggestion" });
  }
};

export const calculateFinalGrades = async (req, res) => {
  const year = req.query.year;
  try {
    const projects = await Project.find({ year, isTerminated: false, isTaken: true }).populate({
      path: "students.student",
      model: "User",
      select: "-password",
    });
    if (projects.length === 0) {
      return res.status(404).json({ message: "No projects found" });
    }

    const projectsWithGrades = await Promise.all(
      projects.map(async (project) => {
        const finalSubmission = await Submission.findOne({ project: project._id, name: "מבחן סוף" });
        const alphaSubmission = await Submission.findOne({ project: project._id, name: "דוח אלפה" });

        let totalGrade = null;
        if (finalSubmission && alphaSubmission) {
          const finalGrade = finalSubmission.finalGrade;
          const alphaGrade = alphaSubmission.finalGrade;
          totalGrade =
            finalGrade === null || alphaGrade === null ? null : Math.ceil(finalGrade * 0.8 + alphaGrade * 0.2);
        }

        return { ...project.toObject(), totalGrade };
      })
    );

    res.status(200).json(projectsWithGrades);
  } catch (error) {
    console.error("Error calculating final grades:", error);
    res.status(500).json({ message: "Failed to calculate final grades" });
  }
};
