import Project from "../models/projects.js";
import Submission from "../models/submission.js";
import User from "../models/users.js";
import Grade from "../models/grades.js";
import Upload from "../models/uploads.js";
import Notification from "../models/notifications.js";
import fs from "fs";
import path from "path";

export const createSubmission = async (req, res) => {
  try {
    const projects = await Project.find({
      isTerminated: false,
      isFinished: false,
      isTaken: true,
      year: req.body.submissionYear,
    });
    await Promise.all(
      projects.map(async (project) => {
        let newGrade;
        let gradeByAdvisor;
        const checkExist = await Submission.find({ project: project._id, name: req.body.name });
        if (checkExist.length > 0) {
          return; // Skip this project if submission already exists
        }
        if (project.advisors.length > 0) {
          newGrade = new Grade({ judge: project.advisors[0]._id });
          gradeByAdvisor = await newGrade.save();
        }

        const user = await User.findById(project.advisors[0]._id);
        user.isJudge = true;
        await user.save();

        const submission = new Submission({
          name: req.body.name,
          project: project._id,
          submissionDate: new Date(req.body.submissionDate),
          grades: [gradeByAdvisor],
          isGraded: req.body.isGraded,
          isReviewed: req.body.isReviewed,
          fileNeeded: req.body.fileNeeded,
          submissionInfo: req.body.submissionInfo,
        });
        await submission.save();

        // Create notifications for students
        await Promise.all(
          project.students.map(async (student) => {
            const notification = new Notification({
              user: student.student,
              message: `נוצרה הגשה חדשה: ${req.body.name}`,
              link: "/my-submissions",
            });
            await notification.save();
          }),
        );
      }),
    );
    res.status(201).json({ message: "Submissions created successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const createSpecificSubmission = async (req, res) => {
  try {
    await Promise.all(
      req.body.projects.map(async (projectId) => {
        const project = await Project.findById(projectId);

        let newGrade;
        let gradeByAdvisor;
        if (project.advisors.length > 0) {
          newGrade = new Grade({ judge: project.advisors[0]._id });
          gradeByAdvisor = await newGrade.save();
        }

        const user = await User.findById(project.advisors[0]._id);
        user.isJudge = true;
        await user.save();

        const submission = new Submission({
          name: req.body.name,
          project: project._id,
          submissionDate: new Date(req.body.submissionDate),
          grades: [gradeByAdvisor],
          isGraded: req.body.isGraded,
          isReviewed: req.body.isReviewed,
          fileNeeded: req.body.fileNeeded,
          submissionInfo: req.body.submissionInfo,
        });
        await submission.save();

        // Create notifications for students
        await Promise.all(
          project.students.map(async (student) => {
            const notification = new Notification({
              user: student.student,
              message: `נוצרה הגשה חדשה: ${req.body.name}`,
              link: "/my-submissions",
            });
            await notification.save();
          }),
        );
      }),
    );
    res.status(201).json({ message: "Submissions created successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getAllProjectSubmissions = async (req, res) => {
  try {
    const activeProjects = await Project.find({ isTerminated: false, isFinished: false, isTaken: true });
    const projectsList = await Promise.all(
      activeProjects.map(async (project) => {
        const submissions = await Submission.find({ project: project._id });
        const submissionsWithGrades = await Promise.all(
          submissions.map(async (submission) => {
            const grades = await Promise.all(
              submission.grades.map(async (gradeId) => {
                const grade = await Grade.findById(gradeId);
                const judge = await User.findById(grade.judge);
                return {
                  key: grade._id,
                  gradeid: grade._id,
                  judge: grade.judge,
                  judgeName: judge ? judge.name : null,
                  grade: grade.grade,
                  videoQuality: grade.videoQuality,
                  workQuality: grade.workQuality,
                  writingQuality: grade.writingQuality,
                  journalActive: grade.journalActive,
                  commits: grade.commits,
                };
              }),
            );
            return {
              key: submission._id,
              submissionid: submission._id,
              name: submission.name,
              submissionDate: submission.submissionDate,
              uploadDate: submission.uploadDate,
              grades: grades,
              submitted: submission.file ? true : submission.fileNeeded ? false : true,
              isGraded: submission.isGraded,
              isReviewed: submission.isReviewed,
              fileNeeded: submission.fileNeeded,
              overridden: submission.overridden,
              finalGrade: submission.finalGrade,
              file: submission.file,
              editable: submission.editable,
            };
          }),
        );
        return {
          key: project._id,
          projectid: project._id,
          title: project.title,
          year: project.year,
          submissions: submissionsWithGrades,
        };
      }),
    );

    let resolvedProjectsList = await Promise.all(projectsList);
    resolvedProjectsList = resolvedProjectsList.map((project) => {
      project.submissions = project.submissions.sort((a, b) => new Date(a.submissionDate) - new Date(b.submissionDate));
      return project;
    });

    res.status(200).json(resolvedProjectsList.filter((project) => project.submissions.length > 0));
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getAllSubmissions = async (req, res) => {
  try {
    const activeProjects = await Project.find({ isTerminated: false, isFinished: false, isTaken: true });
    const activeProjectIds = activeProjects.map((project) => project._id);

    const submissions = await Submission.find({ project: { $in: activeProjectIds } });
    const submissionsWithDetails = await Promise.all(
      submissions.map(async (submission) => {
        const project = await Project.findById(submission.project);
        return {
          ...submission._doc,
          projectName: project ? project.title : null,
          gradesDetailed: await Promise.all(
            submission.grades.map(async (grade) => {
              const gradeInfo = await Grade.findById(grade);
              const judge = await User.findById(gradeInfo.judge);
              return {
                key: gradeInfo ? gradeInfo._id : null,
                judge: gradeInfo ? gradeInfo.judge : null,
                judgeName: judge ? judge.name : null,
                grade: gradeInfo ? gradeInfo.grade : null,
                comment: gradeInfo ? gradeInfo.comment : null,
                numericGrade: gradeInfo ? gradeInfo.numericGrade : null,
                videoQuality: gradeInfo ? gradeInfo.videoQuality : null,
                editable: gradeInfo ? gradeInfo.editable : null,
                overridden: submission.overridden,
              };
            }),
          ),
          key: submission._id,
        };
      }),
    );
    res.status(200).json(submissionsWithDetails);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getStudentSubmissions = async (req, res) => {
  try {
    const project = await Project.findOne({ students: { $elemMatch: { student: req.user._id } } });
    if (!project) {
      return res.status(200).json({ message: "No project found" });
    }
    const submissions = await Submission.find({ project: project._id });
    const submissionsWithDetails = await Promise.all(
      submissions.map(async (submission) => ({
        ...submission._doc,
        key: submission._id,
        project: submission.project,
        submissionName: submission.name,
        submissionDate: submission.submissionDate,
        file: submission.file,
        fileNeeded: submission.fileNeeded,
        grades: await Promise.all(
          submission.grades.map(async (gradeId) => {
            const grade = await Grade.findById(gradeId);
            return {
              videoQuality: grade.videoQuality,
              workQuality: grade.workQuality,
              writingQuality: grade.writingQuality,
              journalActive: grade.journalActive,
              commits: grade.commits,
            };
          }),
        ),
      })),
    ).then((result) => result.sort((a, b) => new Date(a.submissionDate) - new Date(b.submissionDate)));

    res.status(200).json(submissionsWithDetails);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

export const getJudgeSubmissions = async (req, res) => {
  try {
    // First find all grades where the user is the judge
    const submissions = await Submission.find()
      .populate({
        path: "grades",
        match: { judge: req.user._id },
        populate: {
          path: "judge",
          select: "name email",
        },
      })
      .populate("project", "title description")
      .populate("file", "filename")
      .exec();

    // Filter submissions to only include ones where the user has grades
    const filteredSubmissions = submissions.filter((submission) => submission.grades && submission.grades.length > 0);

    // Map to the required format
    const submissionsWithDetails = filteredSubmissions.map((submission) => ({
      key: submission._id,
      projectName: submission.project ? submission.project.title : null,
      submissionName: submission.name,
      submissionDate: submission.submissionDate,
      grade: submission.grades[0]?.grade || null,
      comment: submission.grades[0]?.comment || "",
      videoQuality: submission.grades[0]?.videoQuality || null,
      projectId: submission.project ? submission.project._id : null,
      editable: submission.grades[0]?.editable,
      isGraded: submission.isGraded,
      isReviewed: submission.isReviewed,
      submitted: submission.file ? true : submission.fileNeeded ? false : true,
      file: submission.file,
      fileNeeded: submission.fileNeeded,
      fileName: submission.file ? submission.file.filename : null,
    }));

    res.status(200).json(submissionsWithDetails);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getSubmission = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id)
      .populate("project", "title advisors")
      .populate({
        path: "grades",
        match: { judge: req.user._id },
        populate: {
          path: "judge",
          select: "name email",
        },
      })
      .exec();

    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    const grade = submission.grades[0];
    if (grade && !grade.editable) {
      return res.status(403).json({ message: "You are not allowed to edit this grade" });
    }

    const submissionData = {
      projectId: submission.project._id,
      projectName: submission.project.title,
      advisorId: submission.project.advisors[0]._id,
      submissionName: submission.name,
      submissionDate: submission.submissionDate,
      existingGrade: (submission.isGraded && grade?.grade) || null,
      existingVideoQuality: grade?.videoQuality || "",
      existingWorkQuality: grade?.workQuality || "",
      existingWritingQuality: grade?.writingQuality || "",
      existingJournalActive: grade?.journalActive || "",
      existingCommits: grade?.commits || "",
      isReviewed: submission.isReviewed,
      isGraded: submission.isGraded,
      editable: grade?.editable,
    };

    res.status(200).json(submissionData);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const copyJudges = async (req, res) => {
  try {
    const activeProjects = await Project.find({ isTerminated: false, isFinished: false, isTaken: true });
    const activeProjectIds = activeProjects.map((project) => project._id);
    const submissions = await Submission.find({ project: { $in: activeProjectIds }, name: req.body.sourceSubmission });
    await Promise.all(
      submissions.map(async (submission) => {
        const project = await Project.findById(submission.project);
        const newGrades = await Promise.all(
          project.advisors.map(async (advisor) => {
            const newGrade = new Grade({ judge: advisor });
            return await newGrade.save();
          }),
        );
        submission.grades = newGrades;
        await submission.save();
      }),
    );
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const assignJudgesAI = async (req, res) => {
  
};

export const assignJudgesAutomatically = async (req, res) => {
  const workload = {};
  // Get all active projects
  const activeProjects = await Project.find({
    isTerminated: false,
    isFinished: false,
    isTaken: true,
    year: req.body.submissionYear,
  });

  const activeProjectIds = activeProjects.map((project) => project._id);

  // Get all advisors and assign them a workload
  activeProjects.forEach((project) => {
    const advisor = project.advisors[0].toString();
    if (!workload[advisor]) {
      workload[advisor] = { projects: 0, quota: 0, assigned: 0 };
    }
    workload[advisor].projects++;
    workload[advisor].assigned++;
    workload[advisor].quota += 3;
  });

  // Get all judges and assign them a workload
  const judges = await User.find({ isJudge: true });
  judges.forEach((judge) => {
    if (!workload[judge._id]) {
      workload[judge._id] = { projects: 0, quota: 0, assigned: 0 };
    }
  });

  // Get all submissions for active projects and shuffle them
  const submissions = await Submission.find({ project: { $in: activeProjectIds } });
  const totalGrades = submissions.reduce((acc, submission) => acc + submission.grades.length, 0);

  // Convert workload object to an array of values
  const workloadArray = Object.values(workload);

  // Check if there are enough judges for the assignment
  if (
    submissions.length * 3 - totalGrades >
    workloadArray.reduce((acc, judge) => acc + judge.quota - judge.assigned, 0)
  )
    return res.status(500).json({ message: "Not enough judges for the assignment" });

  for (const submission of submissions) {
    // Use Promise.all to handle all grades for the submission in parallel
    const currentJudges = await Promise.all(
      submission.grades.map(async (grade) => {
        const gradeInfo = await Grade.findById(grade);
        const advisor = gradeInfo.judge.toString();
        return advisor;
      }),
    );
    // Calculate remaining slots for judges
    const remainingSlots = Math.max(0, 3 - currentJudges.length);
    if (remainingSlots > 0) {
      const potentialJudges = Object.keys(workload).filter((judge) => {
        return (
          workload[judge].assigned < workload[judge].quota && // Check quota
          !currentJudges.includes(judge) // Check judge isn't already assigned
        );
      });
      if (potentialJudges.length === 0 || potentialJudges.length < remainingSlots) {
        res.status(500).json({ message: "No enough potential judges found" });
        return;
      }

      // Shuffle potential judges for fairness by assigned to quota ratio
      const shuffledJudges = potentialJudges
        .map((judge) => ({
          judge,
          ratio: workload[judge].assigned / workload[judge].quota,
          quota: workload[judge].quota,
        }))
        .sort((a, b) => {
          if (a.ratio === b.ratio) {
            return a.quota - b.quota; // Sort by largest quota first
          }
          return b.ratio - a.ratio;
        })
        .map((item) => item.judge);
      for (let i = 0; i < remainingSlots && shuffledJudges.length > 0; i++) {
        const selectedJudge = shuffledJudges.pop();
        currentJudges.push(selectedJudge);
        workload[selectedJudge].assigned++;
        const newGrade = new Grade({ judge: selectedJudge });
        await newGrade.save();
        const notification = new Notification({
          user: selectedJudge,
          message: `מונתה לשפיטת: "${submission.name}", עבור פרויקט: "${submission.project.title}"`,
        });
        await notification.save();
        submission.grades.push(newGrade._id);
      }
      await submission.save();
    }
  }
  res.status(200).json({ message: "Judges assigned successfully" });
};

export const updateJudgesInSubmission = async (req, res) => {
  try {
    const { submissionID, judges } = req.body;
    const submission = await Submission.findById(submissionID).populate("project").populate("grades");
    if (!submission) {
      return res.status(404).send({ message: "Submission not found" });
    }

    // Validate judges
    const validateJudges = async (judges) => {
      const validJudges = [];
      for (const judgeID of judges) {
        const judge = await User.findById(judgeID);
        if (!judge || !judge.isJudge) {
          throw new Error(`Invalid judge ID: ${judgeID}`);
        }
        validJudges.push(judgeID);
      }
      return validJudges;
    };

    const validJudges = await validateJudges(judges);

    // Find judges to remove
    const judgesToRemove = submission.grades.filter((grade) => !validJudges.includes(grade.judge.toString()));

    // Remove grades associated with judges to remove
    if (judgesToRemove.length !== 0) {
      await Promise.all(
        judgesToRemove.map(async (grade) => {
          await Grade.findByIdAndDelete(grade._id);
          const notification = new Notification({
            user: grade.judge,
            message: `הוסרת משפיטת: "${submission.name}" עבור פרויקט: "${submission.project.title}"`,
          });
          await notification.save();
        }),
      );
    }

    // Filter out removed grades from submission
    submission.grades = submission.grades.filter((grade) => !judgesToRemove.includes(grade));

    // Find new judges to add
    const newJudges = validJudges.filter(
      (judgeID) => !submission.grades.some((grade) => grade.judge && grade.judge.toString() === judgeID),
    );

    if (newJudges.length !== 0) {
      // Add new grades for new judges
      const newGrades = await Promise.all(
        newJudges.map(async (judgeID) => {
          const newGrade = new Grade({ judge: judgeID });
          await newGrade.save();
          const notification = new Notification({
            user: judgeID,
            message: `מונתה לשפיטת: "${submission.name}" עבור פרויקט: "${submission.project.title}"`,
          });
          await notification.save();
          return newGrade._id;
        }),
      );
      submission.grades = [...submission.grades, ...newGrades];
    }

    await submission.save();
    res.status(200).send({ message: "Judges updated successfully", submission });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

export const updateSubmissionFile = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id).populate("project");
    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    Object.keys(req.body).forEach((key) => {
      submission[key] = req.body[key];
    });
    submission.uploadDate = new Date();
    submission.uploadedBy = req.user._id;

    await submission.save();

    // Create notifications for students
    await Promise.all(
      submission.project.students.map(async (student) => {
        const notification = new Notification({
          user: student.student,
          message: req.body.sentFromDelete
            ? `קובץ נמחק עבור "${submission.name}" ע"י ${req.user.name}`
            : `הועלה קובץ עבור: "${submission.name}" ע"י ${req.user.name}`,
        });
        await notification.save();
      }),
    );

    res.status(200).json({ message: "Submission updated successfully", submission });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteSubmission = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id).populate("project");
    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }
    if (submission.file) {
      const file = await Upload.findById(submission.file);
      if (file) {
        const filePath = path.join(process.cwd(), `uploads/${file.destination}`, file.filename);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        await Upload.deleteOne({ _id: submission.file });
      }
    }
    const grades = await Grade.find({ _id: { $in: submission.grades } });
    await Promise.all(
      grades.map(async (grade) => {
        await grade.deleteOne({ _id: grade._id });
      }),
    );
    await Submission.deleteOne({ _id: submission._id });
    res.status(200).json({ message: "Submission deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteActiveSubmissions = async (req, res) => {
  try {
    const activeProjects = await Project.find({
      isTerminated: false,
      isFinished: false,
      isTaken: true,
      year: req.body.submissionYear,
    });
    const activeProjectIds = activeProjects.map((project) => project._id);
    const submissionsToDelete = await Submission.find({
      project: { $in: activeProjectIds },
      name: req.body.submissionName,
    });

    await Promise.all(
      submissionsToDelete.map(async (submission) => {
        if (submission.file) {
          const file = await Upload.findById(submission.file);
          if (file) {
            const filePath = path.join(process.cwd(), `uploads/${file.destination}`, file.filename);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            await Upload.deleteOne({ _id: submission.file });
          }
        }
        const grades = await Grade.find({ _id: { $in: submission.grades } });
        await Promise.all(
          grades.map(async (grade) => {
            await grade.deleteOne({ _id: grade._id });
          }),
        );
        await Submission.deleteOne({ _id: submission._id });
      }),
    );

    res.status(200).json({ message: "Active submissions deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateSubmissionInformation = async (req, res) => {
  try {
    const submissions = await Submission.find({ name: req.body.submissionOldName }).populate("project");
    const activeProjects = await Project.find({
      isTerminated: false,
      isFinished: false,
      isTaken: true,
      year: req.body.submissionYear,
    });
    const activeProjectIds = activeProjects.map((project) => project._id.toString()); // Convert ObjectIds to strings

    await Promise.all(
      submissions.map(async (submission) => {
        if (activeProjectIds.includes(submission.project._id.toString())) {
          Object.keys(req.body).forEach((key) => {
            submission[key] = req.body[key];
          });
          submission.name = req.body.SubmissionName;
          await submission.save();
        }
      }),
    );

    res.status(200).json({ message: "Submissions updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateSpecificSubmission = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id).populate("project");
    if (!submission) {
      return res.status(404).json({ message: "הגשה לא נמצאה" });
    } else {
      Object.keys(req.body).forEach((key) => {
        submission[key] = req.body[key];
      });
      await submission.save();
      res.status(200).json({ message: "Submission updated successfully", submission });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getSubmissionDetails = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id)
      .populate("project", "title")
      .populate({
        path: "grades",
        match: { judge: req.user._id },
        populate: { path: "judge", select: "name email" },
      })
      .exec();

    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    const grade = submission.grades[0];

    const submissionDetails = {
      submissionName: submission.name,
      projectName: submission.project.title,
      judgeName: grade.judge.name,
      grade: grade.grade,
      videoQuality: grade.videoQuality,
      workQuality: grade.workQuality,
      writingQuality: grade.writingQuality,
      journalActive: grade.journalActive,
      commits: grade.commits,
      updatedAt: grade.updatedAt,
      numericValue: grade.numericGrade,
      isGraded: submission.isGraded,
      isReviewed: submission.isReviewed,
      overridden: submission.overridden,
    };

    res.status(200).json(submissionDetails);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getSpecificProjectSubmissions = async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const submissions = await Submission.find({ project: projectId }).populate("project", "title");
    const submissionsWithDetails = await Promise.all(
      submissions.map(async (submission) => {
        const grades = await Promise.all(
          submission.grades.map(async (gradeId) => {
            const grade = await Grade.findById(gradeId);
            const judge = await User.findById(grade.judge);
            return {
              key: grade._id,
              gradeid: grade._id,
              judge: grade.judge,
              judgeName: judge ? judge.name : null,
              grade: grade.grade,
              videoQuality: grade.videoQuality,
              workQuality: grade.workQuality,
              writingQuality: grade.writingQuality,
              journalActive: grade.journalActive,
              commits: grade.commits,
            };
          }),
        );
        return {
          key: submission._id,
          submissionid: submission._id,
          name: submission.name,
          submissionDate: submission.submissionDate,
          uploadDate: submission.uploadDate,
          grades: grades,
          submitted: submission.file ? true : submission.fileNeeded ? false : true,
          isGraded: submission.isGraded,
          isReviewed: submission.isReviewed,
          overridden: submission.overridden,
          projectName: submission.project.title,
          finalGrade: submission.finalGrade,
          overridden: submission.overridden,
          editable: submission.editable,
          file: submission.file,
          fileNeeded: submission.fileNeeded,
        };
      }),
    );
    res.status(200).json(submissionsWithDetails);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getGradeDistribution = async (req, res) => {
  try {
    const submissionId = req.params.id;
    const submission = await Submission.findById(submissionId).populate("project");

    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    const projectYear = submission.project.year;
    const submissionName = submission.name;
    const currentSubmissionFinalGrade = submission.finalGrade;
    const projects = await Project.find({ year: projectYear });
    const projectIds = projects.map((project) => project._id);

    const submissions = await Submission.find({
      project: { $in: projectIds },
      name: submissionName,
    });

    const gradeRanges = [
      { range: "0-54", min: 0, max: 54 },
      { range: "55-64", min: 55, max: 64 },
      { range: "65-69", min: 65, max: 69 },
      { range: "70-74", min: 70, max: 74 },
      { range: "75-79", min: 75, max: 79 },
      { range: "80-84", min: 80, max: 84 },
      { range: "85-89", min: 85, max: 89 },
      { range: "90-94", min: 90, max: 94 },
      { range: "95-100", min: 95, max: 100 },
    ];

    const allGrades = submissions.map((submission) => submission.finalGrade).filter((grade) => grade !== null);
    const totalGrades = allGrades.length;

    const average = allGrades.reduce((sum, grade) => sum + grade, 0) / totalGrades;
    const sortedGrades = [...allGrades].sort((a, b) => a - b);
    const median = sortedGrades[Math.floor(totalGrades / 2)];
    const lowest = sortedGrades[0];
    const highest = sortedGrades[sortedGrades.length - 1];
    const failPercentage = (allGrades.filter((grade) => grade <= 54).length / totalGrades) * 100;

    const distribution = gradeRanges.map((range) => {
      const count = allGrades.filter((grade) => grade >= range.min && grade <= range.max).length;
      return {
        range: range.range,
        percentage: Math.round((count / totalGrades) * 100),
        count,
      };
    });

    const descendingGrades = [...sortedGrades].reverse();
    const numberOfGrades = allGrades.length;
    const currentSubmissionGradeIndex = descendingGrades.indexOf(currentSubmissionFinalGrade);

    res.status(200).json({
      distribution,
      average,
      median,
      lowest,
      highest,
      failPercentage,
      submissionName,
      projectYear,
      currentSubmissionFinalGrade,
      numberOfGrades,
      currentSubmissionGradeIndex,
    });
  } catch (error) {
    console.error("Error fetching grade distribution:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteAllSubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find();
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
    }
    await Submission.deleteMany();
    res.status(200).json({ message: "All submissions deleted successfully" });
  } catch (error) {
    console.error("Error deleting submissions:", error);
    res.status(500).json({ message: "Failed to delete submissions" });
  }
};
