import User from "../models/users.js";
import dotenv from "dotenv";
import Project from "../models/projects.js";
import Submission from "../models/submission.js";
import bcrypt from "bcryptjs";
import passport from "passport";
import mongoose from "mongoose";
import Grade from "../models/grades.js";
import Upload from "../models/uploads.js";
import Notification from "../models/notifications.js";
import GradeStructure from "../models/gradeStructure.js";
import Random from "../models/random.js";
import fs from "fs";
import path from "path";
import nodemailer from "nodemailer";

dotenv.config();

export const registerUser = async (req, res) => {
  try {
    const { name, email, id, password, isStudent, isAdvisor, isJudge, isCoordinator } = req.body;
    const lowerCaseEmail = email.toLowerCase();
    const userByEmail = await User.findOne({ email: lowerCaseEmail });
    if (userByEmail) {
      return res.status(400).send("Email already in use");
    }

    const userById = await User.findOne({ id: id });
    if (userById) {
      return res.status(400).send("ID already in use");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      ...req.body,
      email: lowerCaseEmail,
      firstLogin: true,
      password: hashedPassword,
      registerDate: new Date(),
      suspensionRecords: [],
      isStudent: isStudent || false,
      isAdvisor: isAdvisor || false,
      isJudge: isJudge || false,
      isCoordinator: isCoordinator || false,
    });
    await newUser.save();
    res.status(201).send("User registered successfully");
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

export const registerMultiple = async (req, res) => {
  try {
    const users = req.body;
    const existingUsers = [];
    const newUsers = [];
    for (const user of users) {
      const { name, email, id, role } = user;
      const lowerCaseEmail = email.toLowerCase();
      delete user.key;
      delete user.role;
      const userByEmail = await User.findOne({ email: lowerCaseEmail });
      if (userByEmail) {
        existingUsers.push(user);
        continue;
      }
      const userById = await User.findOne({ id: id });
      if (userById) {
        existingUsers.push(user);
        continue;
      }
      const hashedPassword = await bcrypt.hash(String(id), 10);
      const newUser = new User({
        name: name,
        id: id,
        email: lowerCaseEmail,
        firstLogin: true,
        password: hashedPassword,
        registerDate: new Date(),
        suspensionRecords: [],
        isStudent: role.includes("isStudent"),
        isAdvisor: role.includes("isAdvisor"),
        isJudge: role.includes("isJudge"),
        isCoordinator: role.includes("isCoordinator"),
      });
      newUsers.push(newUser);
      await newUser.save();
    }
    res.status(201).send({ message: "Users registered successfully", existingUsers });

    // Send email to new users
    sendEmailsToNewUsers(newUsers);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

export const createAdmin = async (req, res) => {
  try {
    const user = await User.findOne({ email: "admin@jce.ac" });
    if (!user) {
      const hashedPassword = await bcrypt.hash(process.env.ADMIN_USER_PASSWORD, 10);
      const newUser = new User({
        name: "משתמש על",
        email: "admin@jce.ac",
        id: "000000000",
        password: hashedPassword,
        firstLogin: false,
        suspensionRecords: [],
        isStudent: true,
        isAdvisor: true,
        isJudge: true,
        isCoordinator: true,
      });
      await newUser.save();
    }
    res.status(201).send("Admin user created successfully");
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

export const loginUser = (req, res, next) => {
  passport.authenticate("local", async (err, user, info) => {
    if (err) {
      console.error("Authentication error:", err);
      return next(err);
    }

    if (!user) {
      return res.status(401).send(info.message);
    }

    if (user.suspended) {
      return res.status(403).send({ message: "User is suspended", reason: user.suspendedReason });
    }

    req.login(user, async (err) => {
      if (err) {
        console.error("Login error:", err);
        return next(err);
      }

      req.session.save(async (err) => {
        if (err) {
          console.error("Session save error:", err);
          return next(err);
        }

        user.rememberMe = req.body.rememberMe;
        user.expireDate = new Date().getTime() + 1000 * 60 * 60 * 24 * 30; // 1 month
        await user.save();

        const userObj = user.toObject();
        delete userObj.password;
        res.status(200).json(userObj);
      });
    });
  })(req, res, next);
};

export const logoutUser = (req, res, next) => {
  if (!req.session) {
    return res.status(400).json({ message: "No active session found" });
  }

  // Logout the user (removes the user from the session)
  req.logout((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ message: "Error logging out" });
    }

    // Destroy the session in the store
    req.session.destroy((err) => {
      if (err) {
        console.error("Session destruction error:", err);
        return res.status(500).json({ message: "Error destroying session" });
      }

      res.status(200).clearCookie("connect.sid", { path: "/" }).json({ status: "Success" });
    });
  });
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    const usersWithoutPassword = users.map((user) => {
      const userObj = user.toObject();
      delete userObj.password;
      return userObj;
    });
    res.status(200).send(usersWithoutPassword);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

export const getAdvisorUsers = async (req, res) => {
  try {
    const users = await User.find({ isAdvisor: true });
    const usersWithoutPassword = users.map((user) => {
      const userObj = user.toObject();
      delete userObj.password;
      return userObj;
    });
    res.status(200).send(usersWithoutPassword);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

export const checkUserHasProject = async (req, res) => {
  const userId = req.params.userId;
  try {
    const projects = await Project.find({ "students.student": userId });
    if (projects.length > 0) {
      res.status(200).send({ hasProject: true });
    } else {
      res.status(200).send({ hasProject: false });
    }
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

export const getUsersNoProjects = async (req, res) => {
  try {
    const users = await User.find();
    const usersNoProjects = [];
    for (const user of users) {
      const projects = await Project.find({ "students.student": user._id });
      if (projects.length === 0) {
        const userObj = user.toObject();
        delete userObj.password;
        usersNoProjects.push(userObj);
      }
    }
    res.status(200).send({ usersNoProjects });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

export const getPrivileges = async (req, res) => {
  const user = req.user;
  res.status(200).json({ isStudent: user.isStudent, isAdvisor: user.isAdvisor, isCoordinator: user.isCoordinator });
};

export const getUserName = async (req, res) => {
  const userId = req.params.id;

  if (!userId) {
    return res.status(400).send("No user ID provided");
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).send("Invalid user ID");
  }

  try {
    const target = await User.findById(userId);

    if (!target) {
      return res.status(404).send("User not found");
    }
    res.status(200).json({ name: target.name });
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while retrieving the user");
  }
};

export const getUser = async (req, res) => {
  const user = req.user;
  const userObj = user.toObject();
  delete userObj.password;
  res.status(200).json(userObj);
};

export const changePassword = async (req, res) => {
  const user = req.user;
  const { oldPassword, newPassword, interests } = req.body;
  try {
    const userDB = await User.findById(user._id);
    const match = await bcrypt.compare(oldPassword, userDB.password);
    if (!match) {
      return res.status(401).send("Incorrect password");
    }
    if (oldPassword === newPassword) {
      return res.status(400).send("New password must be different from the old password");
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.firstLogin = false;
    user.updatedAt = new Date();
    if (user.isAdvisor && interests !== undefined) {
      user.interests = interests;
    }
    await user.save();
    res.status(200).send("Password changed successfully");
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).send("User not found");
    }
    const userObj = user.toObject();
    delete userObj.password;
    res.status(200).send(userObj);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

export const toggleFavoriteProject = async (req, res) => {
  const user = req.user;
  const { projectId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    return res.status(500).send("Invalid project ID");
  }
  const project = await Project.findById(projectId);
  if (!project) {
    return res.status(404).send("Project not found");
  }

  // Ensure the user has a favorites array
  if (!user.favorites) {
    user.favorites = [];
  }

  const userFavorites = user.favorites;
  const projectIndex = userFavorites.findIndex((fav) => fav._id.toString() === project._id.toString());
  if (projectIndex === -1) {
    // Push the whole project object if not present
    userFavorites.push(project);
    res.status(200).send("Project added to favorites");
  } else {
    // Remove the project object if already in favorites
    userFavorites.splice(projectIndex, 1);
    res.status(200).send("Project removed from favorites");
  }
  // Save the updated user document
  await user.save();
};

export const ensureFavoriteProject = async (req, res) => {
  const user = req.user;
  const { projectId } = req.params;
  if (user.favorites.find((fav) => fav.toString() === projectId)) {
    res.status(200).send({ favorite: true });
  } else {
    res.status(200).send({ favorite: false });
  }
};

export const userEditProfile = async (req, res) => {
  const userId = req.user._id;
  const { name, email, interests } = req.body;
  try {
    const user = await User.findById(userId);
    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (interests !== undefined) user.interests = interests;
    user.updatedAt = new Date();
    await user.save();
    res.status(200).send("Profile updated successfully");
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

export const editUserCoordinator = async (req, res) => {
  const { userId } = req.params;
  const { name, email, id, isStudent, isAdvisor, isJudge, isCoordinator, interests } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send("User not found");
    }

    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (id !== undefined) user.id = id;
    if (isStudent !== undefined) user.isStudent = isStudent;
    if (isAdvisor !== undefined && isAdvisor !== user.isAdvisor) {
      const advisorProjects = await Project.find({ advisors: userId });
      if (advisorProjects.length > 0) {
        throw new Error("Cannot change advisor role while user has associated projects");
      }
      user.isAdvisor = isAdvisor;
    }
    if (isJudge !== undefined && isJudge !== user.isJudge) {
      const judgeSubmissions = await Submission.find({ grades: { $elemMatch: { judge: userId } } });
      if (judgeSubmissions.length > 0) {
        throw new Error("Cannot change judge role while user has associated submissions");
      }
      user.isJudge = isJudge;
    }
    if (isCoordinator !== undefined) user.isCoordinator = isCoordinator;
    if (interests !== undefined) user.interests = interests;
    user.updatedAt = new Date();

    await user.save();
    res.status(200).send("User updated successfully");
  } catch (err) {
    if (err.message.includes("Cannot change advisor role")) {
      res.status(403).send({ message: "Cannot change advisor role while user has associated projects" });
    } else if (err.message.includes("Cannot change judge role")) {
      res.status(403).send({ message: "Cannot change judge role while user has associated submissions" });
    } else {
      res.status(500).send({ message: err.message });
    }
  }
};

export const suspendUser = async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send("User not found");
    }
    user.suspended = true;
    user.suspendedAt = new Date();
    user.suspendedBy = req.user._id;
    user.suspendedReason = req.body.reason || "לא ניתנה סיבה";
    user.updatedAt = new Date();
    user.suspensionRecords.push({
      suspendedBy: req.user._id,
      suspendedAt: new Date(),
      reason: req.body.reason || "לא ניתנה סיבה",
    });

    await user.save();
    res.status(200).send("User suspended successfully");
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

export const unsuspendUser = async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send("User not found");
    }
    user.suspended = false;
    user.suspendedAt = null;
    user.suspendedBy = null;
    user.suspendedReason = null;
    user.updatedAt = new Date();

    await user.save();
    res.status(200).send("User unsuspended successfully");
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

export const deleteSuspendedUser = async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findById(userId).orFail();

    // Find project IDs the user is associated with
    const projectIds = await Project.find({
      $or: [{ "students.student": userId }, { advisors: userId }],
    }).distinct("_id");

    // Remove user from projects
    await Project.updateMany({ "students.student": userId }, { $pull: { students: { student: userId } } });
    await Project.updateMany({ advisors: userId }, { $pull: { advisors: userId } });

    // Remove user from submissions
    await Submission.updateMany({ uploadedBy: userId }, { $unset: { uploadedBy: "" } });
    await Submission.updateMany({ "grades.judge": userId }, { $pull: { grades: { judge: userId } } });

    await user.deleteOne();

    // Check projects and update isTaken if necessary
    const projects = await Project.find({ _id: { $in: projectIds } });

    for (const project of projects) {
      const studentCount = project.students.length;
      const advisorCount = project.advisors.length;
      const openSubmissions = await Submission.countDocuments({ project: project._id });

      if (studentCount === 0 || advisorCount === 0) {
        if (openSubmissions === 0) {
          project.isTaken = false;
          await project.save();
        }
      }
    }

    res.status(200).send("User deleted successfully");
  } catch (err) {
    res.status(404).send("User not found");
  }
};

export const getAdvisorsForUsersInfo = async (req, res) => {
  try {
    const advisors = await User.find({ isAdvisor: true }).select("name email interests");
    const projects = await Project.find();

    const advisorsWithProjectsInfo = advisors.map((advisor) => {
      const advisorProjects = projects.filter((project) => project.advisors.includes(advisor._id));
      const projectsAvailable = advisorProjects.some((project) => !project.isTaken);
      return {
        ...advisor.toObject(),
        projectsAvailable,
      };
    });

    res.status(200).send(advisorsWithProjectsInfo);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

export const getUserProject = async (req, res) => {
  try {
    const user = req.user;
    const project = await Project.findOne({ "students.student": user._id });
    if (!project) {
      return res.status(204).send({ message: "No project found for the user" });
    }
    res.status(200).send(project);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

export const getUserProjectStatistics = async (req, res) => {
  const userId = req.params.id;
  try {
    const statistics = [];
    const projects = await Project.find({ advisors: userId });

    const years = [...new Set(projects.map((project) => project.year))].sort((a, b) => b.localeCompare(a)).slice(0, 5);

    for (const year of years) {
      const projectsInYear = projects.filter((project) => project.year === year);
      const takenProjects = projectsInYear.filter((project) => project.isTaken).length;
      statistics.push({
        year: year,
        projects: projectsInYear.length,
        takenProjects: takenProjects,
      });
    }

    res.status(200).json(statistics);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

export const deleteAllUsers = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    // Delete all users except the current user
    await User.deleteMany({ _id: { $ne: currentUserId } });

    // Delete all projects
    await Project.deleteMany();

    // Delete all submissions and associated grades
    const submissions = await Submission.find();
    for (const submission of submissions) {
      await Grade.deleteMany({ _id: { $in: submission.grades } });
    }
    await Submission.deleteMany();

    // Delete all uploads and associated files
    const uploads = await Upload.find();
    for (const upload of uploads) {
      const filePath = path.join(process.cwd(), `uploads/${upload.destination}`, upload.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    await Upload.deleteMany();

    // Delete notifications
    await Notification.deleteMany();

    // Delete grade structures
    await GradeStructure.deleteMany();

    // Delete random texts
    await Random.deleteMany();

    res.status(200).json({ message: "All users and related data deleted successfully" });
  } catch (error) {
    console.error("Error deleting users and related data:", error);
    res.status(500).json({ message: "Failed to delete users and related data" });
  }
};

export const getActiveAdvisors = async (req, res) => {
  const { year } = req.query;
  try {
    const activeProjects = await Project.find({
      isTaken: true,
      advisors: { $exists: true, $ne: [] },
      students: { $exists: true, $ne: [] },
      year: year,
    }).populate("advisors", "name _id");
    const activeAdvisors = [
      ...new Set(activeProjects.flatMap((project) => project.advisors.map((advisor) => advisor))),
    ]; // Remove duplicates
    res.status(200).json(activeAdvisors);
  } catch (error) {
    console.error("Error getting active advisors:", error);
    res.status(500).json({ message: "Failed to get active advisors" });
  }
};

export const forgotPassword = async (req, res) => {
  const { email, id } = req.body;
  try {
    const user = await User.findOne({ email: email, id: id });
    if (!user) {
      return res.status(200).send("User not found");
    }
    if (user.resetPasswordRequest) {
      return res.status(200).send("Password reset request already sent");
    }
    user.resetPasswordRequest = true;
    user.resetPasswordRequestDate = new Date();
    await user.save();

    // Create notifications for coordinators to know about the request
    const coordinators = await User.find({ isCoordinator: true });
    await Promise.all(
      coordinators.map(async (coordinator) => {
        const notification = new Notification({
          user: coordinator._id,
          message: `התקבלה בקשה לאיפוס סיסמה עבור המשתמש "${user.name}"`,
          link: "/approve-reset-password",
        });
        await notification.save();
      })
    );

    res.status(200).send("Password reset request sent successfully");
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

export const getResetPasswordUsers = async (req, res) => {
  try {
    const users = await User.find({
      $or: [
        { resetPasswordRequest: true },
        { resetPasswordRequestApprovedDate: { $exists: true } },
        { resetPasswordRequestRejectionDate: { $exists: true } },
      ],
    });

    const usersWithoutPassword = users.map((user) => {
      const userObj = user.toObject();
      delete userObj.password;
      return userObj;
    });

    res.status(200).send(usersWithoutPassword);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

export const approveResetPassword = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).send("User not found");
    }
    user.resetPasswordRequest = false;
    user.resetPasswordRequestApprovedDate = new Date();
    user.password = await bcrypt.hash(user.id, 10);
    user.firstLogin = true;
    await user.save();
    res.status(200).send("Password reset approved successfully");
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

export const rejectResetPassword = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).send("User not found");
    }
    user.resetPasswordRequest = false;
    user.resetPasswordRequestRejectionDate = new Date();
    await user.save();
    res.status(200).send("Password reset rejected successfully");
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

export const sendEmailsToNewUsers = async (users) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });

  for (let i = 0; i < users.length; i += 10) {
    const batch = users.slice(i, i + 10);
    await Promise.all(
      batch.map(async (user) => {
        const mailOptions = {
          from: process.env.GMAIL_USER,
          to: user.email,
          subject: "כניסה למערכת - מערכת לניהול פרויקטים",
          html: `
                <html lang="he" dir="rtl">
              <head>
                <meta charset="UTF-8" />
                <title>ברוך הבא!</title>
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
                  <h2 style="color: #333; text-align: center">ברוך הבא!</h2>
                  <p>שלום ${user.name},</p>
                  <p>חשבון במערכת לניהול פרויקטים נוצר עבורך.</p>
                  <p>בהתחברות ראשונה לאתר יהיה עלייך לבצע שינוי סיסמה ראשונית.</p>
                  <p><strong>אימייל:</strong> ${user.email}</p>
                  <p><strong>סיסמה ראשונית:</strong> ${user.id}</p>
                  <p>לחץ על הכפתור למטה כדי להיכנס לאתר ולהגדיר סיסמה חדשה:</p>
                  <p style="text-align: center">
                    <a
                      href="${process.env.FRONTEND_URL}"
                      style="
                        display: inline-block;
                        padding: 10px 15px;
                        background-color: #007bff;
                        color: #fff;
                        text-decoration: none;
                        border-radius: 3px;
                      ">
                      כניסה לאתר
                    </a>
                  </p>
                  <hr />
                  <p>אם לחיצה על הכפתור לא עובדת, העתיקו את הלינק לדפדפן.</p>
                  ${process.env.FRONTEND_URL}
                </div>
              </body>
            </html>
            `,
        };

        transporter.sendMail(mailOptions, (error) => {
          if (error) {
            console.error("Error sending registration email:", error);
          }
        });
      })
    );
    // Wait for 11 seconds before sending the next batch
    await new Promise((resolve) => setTimeout(resolve, 11000));
  }
};

export const checkResetPasswordToken = async (req, res) => {
  const { token } = req.params;
  try {
    const user = await User.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: Date.now() } });
    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token." });
    }
    res.status(200).send("Token found");
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

export const resetPassword = async (req, res) => {
  const { token, password } = req.body;
  try {
    const user = await User.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: Date.now() } });
    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token." });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();
    res.status(200).send("Password reset successfully");
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};
