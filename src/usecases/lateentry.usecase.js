const lateEntryService = require("../services/lateentry.service");
const { logActivity } = require("../services/activityLog.service");

// ================= GET TODAY =================
exports.getTodayLateEntries = async (req, res) => {
  try {
    const { role } = req.user;

    if (!["Principal", "CA", "HOD"].includes(role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const rows = await lateEntryService.getTodayLateEntries();

    await logActivity({
      req,
      user: req.user,
      module: "ATTENDANCE",
      actionType: "VIEW",
      action: "VIEW_LATE_ENTRIES_TODAY",
      description: "Viewed today's late entry list"
    });

    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================= MARK LATE =================
exports.markLateStudent = async (req, res) => {
  try {
    const { role } = req.user;

    if (!["Security", "CA", "Principal"].includes(role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const result = await lateEntryService.markLateStudent(req);

    await logActivity({
      req,
      user: req.user,
      module: "ATTENDANCE",
      actionType: "CREATE",
      action: "MARK_LATE_ENTRY",
      refTable: "late_entries",
      refId: result.student.roll_no,
      newData: result.student,
      description: "Student marked as late"
    });

    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
