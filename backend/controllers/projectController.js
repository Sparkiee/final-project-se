import mongoose from "mongoose";
import Project from "../models/projects.js";
import User from "../models/users.js";

export const getProjects = async (req, res) => {
  try {
    const projects = await Project.find();
    res.status(200).send(projects);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

export const getAvailableProjects = async (req, res) => {
  try {
    const projects = await Project.find({ isTerminated: false, isFinished: false, isApproved: true });
    res.status(200).send(projects);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

export const getProjectsByYear = async (req, res) => {
  try {
    const projects = await Project.find({ year: req.params.year });
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

export const createProject = async (req, res) => {
  try {
    const { title, description, year, suitableFor, type, continues, isApproved, advisors, students } = req.body;

    if (!title || !description || !year || !suitableFor || !type) {
      return res.status(400).send({ message: "Missing required fields" });
    }
    const project = await Project.findOne({ title, year });
    if (project) {
      return res.status(400).send({ message: "This Project already exists in that year" });
    }

    let newProject;
    if (req.user.isAdvisor && !req.user.isCoordinator) {
      newProject = new Project({
        ...req.body,
        advisors: [req.user._id],
        continues,
        isApproved,
        isFinished: false,
        isTerminated: false,
        isTaken: false,
        grades: []
      });
    } else {
      const advisorsList = [];
      if (advisors.length > 0) {
        for (const adv of advisors) {
          const advisorUser = await User.findOne({ _id: adv, isAdvisor: true });
          if (!advisorUser) {
            return res.status(505).send({ message: `Advisor ${adv.name} not found` });
          }
          advisorsList.push(advisorUser);
        }
      }
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
      newProject = new Project({
        ...req.body,
        advisors: advisorsList,
        students: studentsList,
        continues,
        isApproved,
        isFinished: false,
        isTerminated: false,
        isTaken: false,
        grades: []
      });
    }

    const savedProject = await newProject.save();

    res.status(201).json({
      message: "Project created successfully",
      project: savedProject
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
    console.log(project.candidates);
    console.log(`Candidate ${req.user.name} added successfully`);
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
    console.log(`Candidate ${req.user.name} removed successfully`);
    res.status(200).send("Candidate removed successfully");
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

export const approveCandidate = async (req, res) => {
  console.log("trying to approve");
  try {
    const project = await Project.findById(req.body.projectID);
    if (!project) {
      return res.status(404).send({ message: "Project not found" });
    }
    console.log("found project");
    const user = await User.findById(req.body.userID);
    const candidate = project.candidates.find((candidate) => candidate.student.toString() === user._id.toString());
    if (candidate) {
      console.log("found candidate");
      if (!project.students) {
        project.students = [];
      }
      if (project.students.find((candidate) => candidate.student.toString() === user._id.toString())) {
        return res.status(400).send({ message: "Candidate is already approved" });
      }
      const { _id, ...candidateWithoutId } = candidate.toObject();
      project.students.push(candidateWithoutId);
      project.candidates = project.candidates.filter(
        (candidate) => candidate.student.toString() !== user._id.toString()
      );
    }
    await project.save();
    console.log(`Candidate ${user.name} approved successfully`);
    res.status(200).send(`Candidate ${candidate.student} approved successfully`);
  } catch (err) {
    console.log(err.message);
    res.status(500).send({ message: err.message });
  }
};

export const removeStudentFromProject = async (req, res) => {
  try {
    console.log("moving student back to candidates.......");
    const userid = req.body.userID;
    const user = await User.findById(userid);
    const project = await Project.findById(req.body.projectID);
    if (!project) {
      return res.status(404).send({ message: "Project not found" });
    }
    console.log("found project");
    if (!project.students.find((student) => student.student.toString() === userid.toString())) {
      return res.status(400).send({ message: "User is not a student in this project" });
    }
    console.log("found student");
    const student = project.students.find((student) => student.student.toString() === userid.toString());
    project.students = project.students.filter((student) => student.student.toString() !== userid.toString());
    project.candidates.push(student);
    await project.save();
    console.log(`Student ${user.name} moved back to candidates successfully`);
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
    project.isTaken = !project.isTaken;
    await project.save();
    console.log(`Project registration switched successfully`);
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
  console.log("edit project");
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).send({ message: "Project not found" });
    }
    console.log("found project");
    const { title, description, year, suitableFor, type, continues } = req.body;
    console.log(req.body);
    if (!title || !description || !year || !suitableFor || !type) {
      return res.status(400).send({ message: "Missing required fields" });
    }
    console.log("valid fields");
    if (req.user.isAdvisor && !req.user.isCoordinator) {
      project.title = title;
      project.description = description;
      project.year = year;
      project.suitableFor = suitableFor;
      project.type = type;
      project.continues = continues;
      // project.isApproved = isApproved;
    } else {
      // const advisorsList = [];
      // if (advisors.length > 0) {
      //   for (const adv of advisors) {
      //     const advisorUser = await User.findOne({ _id: adv, isAdvisor: true });
      //     if (!advisorUser) {
      //       return res.status(505).send({ message: `Advisor ${adv.name} not found` });
      //     }
      //     advisorsList.push(advisorUser);
      //   }
      // }
      // const studentsList = [];
      // if (students.length > 0) {
      //   for (const stud of students) {
      //     const studentUser = await User.findOne({ id: stud.id, isStudent: true });
      //     if (!studentUser) {
      //       return res.status(505).send({ message: `Student ${stud.name} not found` });
      //     }
      //     studentsList.push({ student: studentUser });
      //   }
      // }
      project.title = title;
      project.description = description;
      project.year = year;
      project.suitableFor = suitableFor;
      project.type = type;
      project.continues = continues;
      // project.isApproved = isApproved;
      // project.advisors = advisorsList;
      // project.students = studentsList;
    }

    const savedProject = await project.save();

    res.status(201).json({
      message: "Project updated successfully",
      project: savedProject
    });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

export const deleteProject = async (req, res) => {};

export const closeProject = async (req, res) => {};

export const addAdvisorToProject = async (req, res) => {};

export const getProjectsStatus = async (req, res) => {
  try {
    const projects = await Project.find();
    const numOfTakenProjects = projects.filter((project) => project.isTaken && project.isApproved).length;
    const numOfOpenProjects = projects.filter((project) => !project.isTaken && project.isApproved).length;
    const numOfFinishedProjects = projects.filter((project) => project.isFinished && project.isApproved).length;
    res.status(200).send({ numOfOpenProjects, numOfTakenProjects, numOfFinishedProjects });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};
