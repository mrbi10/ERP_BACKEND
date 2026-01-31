const express = require("express");
const router = express.Router();

const authenticateToken = require("../middlewares/authenticateToken");
const attendanceLogsUsecase = require("../usecases/attendanceLogs.usecase");

router.get(
  "/late/today",
  authenticateToken,
  attendanceLogsUsecase.getTodayLateEntries
);

router.get(
  "/logs",
  authenticateToken,
  attendanceLogsUsecase.getAttendanceLogs
);

router.get(
  "/live",
  authenticateToken,
  attendanceLogsUsecase.getLiveAttendance
);

router.get(
  "/summary/today",
  authenticateToken,
  attendanceLogsUsecase.getTodaySummary
);

router.post(
  "/entry/manual",
  authenticateToken,
  attendanceLogsUsecase.markManualEntry
);

router.get(
  "/history",
  authenticateToken,
  attendanceLogsUsecase.getAttendanceHistory
);

router.get(
  "/people",
  authenticateToken,
  attendanceLogsUsecase.getPeopleList
);


module.exports = router;
