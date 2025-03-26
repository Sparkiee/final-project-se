import express from "express";
import { ensureAuthenticated, isCoordinator } from "../middleware/auth.js";
import {
  addGrade,
  changeFinalGrade,
  getGradeBySubmission,
  updateNumericValues,
  getAllNumericValues,
  publishGrades,
  updateCalculationMethod,
  deleteGradingTable,
} from "../controllers/gradeController.js";

const router = express.Router();

router.post("/add-grade", ensureAuthenticated, addGrade);
router.put("/change-final-grade/:id", ensureAuthenticated, isCoordinator, changeFinalGrade);
router.get("/submission/:submissionId", ensureAuthenticated, getGradeBySubmission);
router.put("/update-numeric-values", ensureAuthenticated, isCoordinator, updateNumericValues);
router.get("/get-all-numeric-values", ensureAuthenticated, getAllNumericValues);
router.post("/publish-grades", ensureAuthenticated, isCoordinator, publishGrades);
router.put("/update-calculation-method", ensureAuthenticated, isCoordinator, updateCalculationMethod);
router.delete("/delete-grading-table", ensureAuthenticated, isCoordinator, deleteGradingTable);

export default router;
