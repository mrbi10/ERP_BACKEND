const express = require("express");
const router = express.Router();
const authenticateToken = require("../middlewares/authenticateToken");
const authorize = require("../middlewares/authorize");
const attendanceUsecase = require("../usecases/attendance.usecase");

// ---------- CORE ----------
router.post(
    "/",
    authenticateToken,
    authorize(["Staff", "CA"]),
    attendanceUsecase.markAttendance
);

router.patch(
    "/",
    authenticateToken,
    authorize(["Staff", "CA", "HOD", "Principal"]),
    attendanceUsecase.updateAttendance
);

// ---------- FETCH ----------
router.get("/", authenticateToken, attendanceUsecase.getAttendance);
router.get("/class/:classId", authenticateToken, attendanceUsecase.getClassAttendance);
router.get("/subject/:subjectId", authenticateToken, attendanceUsecase.getSubjectAttendance);
router.get("/student/:id", authenticateToken, attendanceUsecase.getStudentAttendance);
router.get("/classsummary", authenticateToken, attendanceUsecase.getClassSummary);
router.get("/overallattendance", authenticateToken, attendanceUsecase.getOverallAttendance);


module.exports = router;
