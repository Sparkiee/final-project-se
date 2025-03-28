import express from "express";
import {
  loginUser,
  logoutUser,
  registerUser,
  getPrivileges,
  getUserName,
  getUser,
  toggleFavoriteProject,
  ensureFavoriteProject,
  getAdvisorUsers,
  getUsersNoProjects,
  getUserProfile,
  getAllUsers,
  editUserCoordinator,
  suspendUser,
  unsuspendUser,
  deleteSuspendedUser,
  changePassword,
  registerMultiple,
  checkUserHasProject,
  getAdvisorsForUsersInfo,
  createAdmin,
  getUserProject,
  userEditProfile,
  getUserProjectStatistics,
  deleteAllUsers,
  getActiveAdvisors,
  sendEmailsToNewUsers,
  checkResetPasswordToken,
  resetPassword,
  forgotPassword,
  getResetPasswordUsers,
  approveResetPassword,
  rejectResetPassword,
} from "../controllers/userController.js";
import {
  getUnreadNotifications,
  getAllNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  deleteNotification,
  clearAllNotifications,
} from "../controllers/notificationController.js";
import { ensureAuthenticated, isCoordinator, isAdvisorOrCoordinator } from "../middleware/auth.js";
import verifyRecaptcha from "../middleware/recaptcha.js";

const router = express.Router();

router.post("/register", ensureAuthenticated, registerUser);
router.post("/register-multiple", ensureAuthenticated, registerMultiple);
router.post("/create-admin", createAdmin);
router.post("/login", verifyRecaptcha, loginUser);
router.post("/logout", logoutUser);
router.post("/toggle-favorite", ensureAuthenticated, toggleFavoriteProject);
router.get("/ensure-favorite/:projectId", ensureAuthenticated, ensureFavoriteProject);
router.get("/get-user-info/:id", ensureAuthenticated, getUserProfile);
router.put("/change-password", ensureAuthenticated, changePassword);
router.get("/advisor-users", ensureAuthenticated, isAdvisorOrCoordinator, getAdvisorUsers);
router.get("/check-auth", ensureAuthenticated, (req, res) => {
  res.status(200).json({
    authenticated: !req.user.firstLogin,
    isStudent: req.user.isStudent,
    isAdvisor: req.user.isAdvisor,
    isJudge: req.user.isJudge,
    isCoordinator: req.user.isCoordinator,
  });
});

router.get("/privileges", ensureAuthenticated, getPrivileges);
router.get("/get-user-name/:id", ensureAuthenticated, getUserName);
router.get("/get-user", ensureAuthenticated, getUser);
router.get("/users-no-projects", ensureAuthenticated, getUsersNoProjects);
router.get("/all-users", ensureAuthenticated, isCoordinator, getAllUsers);
router.put("/edit-user-coordinator/:userId", ensureAuthenticated, isCoordinator, editUserCoordinator);
router.put("/suspend-user/:userId", ensureAuthenticated, isCoordinator, suspendUser);
router.put("/unsuspend-user/:userId", ensureAuthenticated, isCoordinator, unsuspendUser);
router.delete("/delete-suspended-user/:userId", ensureAuthenticated, isCoordinator, deleteSuspendedUser);
router.get("/check-user-has-projects/:userId", ensureAuthenticated, checkUserHasProject);
router.get("/advisors-for-users-info", ensureAuthenticated, getAdvisorsForUsersInfo);
router.get("/user-project", ensureAuthenticated, getUserProject);
router.put("/user-edit-profile/:id", ensureAuthenticated, userEditProfile);
router.get("/get-user-project-statistics/:id", ensureAuthenticated, getUserProjectStatistics);
router.delete("/delete-all", ensureAuthenticated, isCoordinator, deleteAllUsers);
router.post("/send-emails-to-new-users", ensureAuthenticated, isCoordinator, sendEmailsToNewUsers);
router.get("/get-active-advisors", ensureAuthenticated, getActiveAdvisors);
router.post("/forgot-password", forgotPassword);
router.get("/reset-password-requests", ensureAuthenticated, isCoordinator, getResetPasswordUsers);
router.post("/approve-reset-password/:id", ensureAuthenticated, isCoordinator, approveResetPassword);
router.post("/reject-reset-password/:id", ensureAuthenticated, isCoordinator, rejectResetPassword);

// Notifications
router.get("/notifications", ensureAuthenticated, getUnreadNotifications);
router.get("/notifications/all", ensureAuthenticated, getAllNotifications);
router.put("/notifications/read", ensureAuthenticated, markAllNotificationsAsRead);
router.put("/notifications/read/:notificationId", ensureAuthenticated, markNotificationAsRead);
router.delete("/notifications/delete/:notificationId", ensureAuthenticated, deleteNotification);
router.put("/notifications/clear", ensureAuthenticated, clearAllNotifications);

// Password reset
router.get("/check-reset-password-token/:token", checkResetPasswordToken);
router.post("/reset-password", resetPassword);

export default router;
