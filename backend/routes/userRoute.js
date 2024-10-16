import express from "express";
import { loginUser, logoutUser, registerUser, getUsersNoProjects, getPrivileges } from "../controllers/userController.js";
import { ensureAuthenticated, isCoordinator } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);

router.get("/check-auth", ensureAuthenticated, (req, res) => {
  res.status(200).json({ authenticated: true });
});

router.get("/privileges", ensureAuthenticated, getPrivileges);

export default router;
