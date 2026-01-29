const express = require("express");
const router = express.Router();

const authenticateToken = require("../middlewares/authenticateToken");
const authorize = require("../middlewares/authorize");
const subjectUsecase = require("../usecases/subject.usecase");



router.post(
  "/",
  authenticateToken,
  authorize(["CA", "HOD", "Principal"]),
  subjectUsecase.createSubject
);

router.get(
  "/",
  authenticateToken,
  authorize(["CA", "HOD", "Principal"]),
  subjectUsecase.getSubjects
);

router.patch(
  "/:subject_id",
  authenticateToken,
  authorize(["CA", "HOD", "Principal"]),
  subjectUsecase.updateSubject
);

// soft delete
router.patch(
  "/:subject_id/delete",
  authenticateToken,
  authorize(["CA", "HOD", "Principal"]),
  subjectUsecase.deleteSubject
);

module.exports = router;
