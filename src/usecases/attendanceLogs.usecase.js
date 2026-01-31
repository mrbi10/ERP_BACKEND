const attendanceLogsService = require("../services/attendanceLogs.service");
const { logActivity } = require("../services/activityLog.service");

// ================= GET TODAY LATE =================
exports.getTodayLateEntries = async (req, res) => {
  try {
    const { role } = req.user;

    if (!["Principal", "CA", "HOD"].includes(role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const rows = await attendanceLogsService.getTodayLateEntries(req.user);

    await logActivity({
      req,
      user: req.user,
      module: "ATTENDANCE",
      actionType: "VIEW",
      action: "VIEW_LATE_ENTRIES",
      description: "Viewed today's late entries"
    });

    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.getAttendanceLogs = async (req, res) => {
  try {
    const rows = await attendanceLogsService.getAttendanceLogs(req);

    await logActivity({
      req,
      user: req.user,
      module: "ATTENDANCE",
      actionType: "VIEW",
      action: "VIEW_LOGS",
      description: "Viewed attendance logs"
    });

    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ================= LIVE ATTENDANCE =================
exports.getLiveAttendance = async (req, res) => {
  try {
    const { role } = req.user;

    if (!["Principal", "HOD", "Security"].includes(role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const rows = await attendanceLogsService.getLiveAttendance(req.user);

    await logActivity({
      req,
      user: req.user,
      module: "ATTENDANCE",
      actionType: "VIEW",
      action: "VIEW_LIVE_ATTENDANCE",
      description: "Viewed live attendance board"
    });

    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ================= TODAY SUMMARY =================
exports.getTodaySummary = async (req, res) => {
  try {
    const { role } = req.user;

    if (!["Principal", "HOD", "CA"].includes(role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const summary = await attendanceLogsService.getTodaySummary(req.user);

    await logActivity({
      req,
      user: req.user,
      module: "ATTENDANCE",
      actionType: "VIEW",
      action: "VIEW_TODAY_SUMMARY",
      description: "Viewed attendance summary"
    });

    res.json({ success: true, data: summary });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ================= MANUAL ENTRY =================
exports.markManualEntry = async (req, res) => {
  try {
    const { role } = req.user;

    if (!["Security", "CA", "Principal"].includes(role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const result = await attendanceLogsService.markManualEntry(req);

    await logActivity({
      req,
      user: req.user,
      module: "ATTENDANCE",
      actionType: "CREATE",
      action: "MANUAL_ENTRY",
      description: `${result.person_type} ${result.entry_type}`
    });

    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};


exports.getAttendanceHistory = async (req, res) => {
  try {
    const data = await attendanceLogsService.getAttendanceHistory(
      req.user,
      req.query
    );

    await logActivity({
      req,
      user: req.user,
      module: "ATTENDANCE",
      actionType: "VIEW",
      action: "VIEW_HISTORY",
      description: "Viewed attendance history"
    });

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ================= GET PEOPLE LIST =================
exports.getPeopleList = async (req, res) => {
  try {
    const { role } = req.user;

    if (!["Principal", "HOD", "CA"].includes(role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }

    const data = await attendanceLogsService.getPeopleList(req.user, req.query);

    res.json({
      success: true,
      data
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
