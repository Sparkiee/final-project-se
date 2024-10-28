import express from "express";
import {
  getProjects,
  createProject,
  getProjectsNoStudent,
  checkIfUserIsCandidate,
  approveCandidate,
  removeStudentFromProject,
  switchProjectRegistration,
  getProjectsStatus,
  updateProject
} from "../controllers/projectController.js";
import { ensureAuthenticated, isAdvisorOrCoordinator } from "../middleware/auth.js";
import {
  getAvailableProjects,
  getProject,
  addCandidateToProject,
  removeCandidateFromProject,
  getSelfProjects
} from "../controllers/projectController.js";

const router = express.Router();

router.get("/", getProjects);
router.post("/create-project", ensureAuthenticated, isAdvisorOrCoordinator, createProject);
router.get("/available-projects", ensureAuthenticated, getAvailableProjects);
router.get("/no-student", getProjectsNoStudent);
router.get("/get-project/:id", getProject);
router.post("/add-candidate", ensureAuthenticated, addCandidateToProject);
router.get("/check-if-candidate/:id", ensureAuthenticated, checkIfUserIsCandidate);
router.get("/get-self-projects", ensureAuthenticated, isAdvisorOrCoordinator, getSelfProjects);
router.post("/remove-candidate", ensureAuthenticated, removeCandidateFromProject);
router.post("/approve-candidate", ensureAuthenticated, isAdvisorOrCoordinator, approveCandidate);
router.post("/remove-student", ensureAuthenticated, isAdvisorOrCoordinator, removeStudentFromProject);
router.post("/switch-registration", ensureAuthenticated, isAdvisorOrCoordinator, switchProjectRegistration);
router.get("/status", getProjectsStatus);
router.put("/edit-project/:id", ensureAuthenticated, isAdvisorOrCoordinator, updateProject);

export default router;
