const express = require("express");
const router = express.Router();

const marksUseCase = require("../usecases/marks.usecase");
const authenticateToken = require("../middlewares/authenticateToken");
const authorize = require("../middlewares/authorize");

router.post(
    "/",
    authenticateToken,
    authorize(["Staff", "CA"]),
    marksUseCase.addOrUpdateMarks
);

router.get(
    "/student/:roll_no",
    authenticateToken,
    marksUseCase.getMarksByStudent
);

router.get(
    "/class/:classId",
    authenticateToken,
    marksUseCase.getMarksByClass
);

router.get(
    "/overview",
    authenticateToken,
    authorize(["Principal"]),
    marksUseCase.getMarksOverview
);

router.get(
    "/department-analysis",
    authenticateToken,
    authorize(["Principal"]),
    marksUseCase.getDepartmentAnalysis
);

router.get(
    "/top-performers",
    authenticateToken,
    authorize(["Principal", "CA", "HOD", "student"]),
    marksUseCase.getTopPerformers
);

module.exports = router;
