const express = require("express");
const router = express.Router();

const authenticateToken = require("../middlewares/authenticateToken");
const subjectUsecase = require("../usecases/subject.usecase");

// --- Get Subjects (by role / class / dept) ---
router.get(
  "/",
  authenticateToken,
  subjectUsecase.getSubjects
);

// --- Get Subjects handled by Staff / CA ---
router.get(
  "/staff",
  authenticateToken,
  subjectUsecase.getStaffSubjects
);

module.exports = router;
