const attendanceService = require("../services/attendance.service");
const { logActivity } = require("../services/activityLog.service");


exports.markAttendance = async (req, res) => {
  try {
    const result = await attendanceService.markAttendance(req.user, req.body);

    await logActivity({
      req,
      user: req.user,
      module: "ATTENDANCE",
      actionType: "CREATE",
      action: "MARK_ATTENDANCE",
      description: "Marked attendance"
    });

    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};


exports.updateAttendance = async (req, res) => {
  try {
    await attendanceService.updateAttendance(req.user, req.body);

    await logActivity({
      req,
      user: req.user,
      module: "ATTENDANCE",
      actionType: "UPDATE",
      action: "UPDATE_ATTENDANCE",
      description: "Updated attendance record"
    });

    res.json({ success: true, message: "Attendance updated successfully" });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

exports.getAttendance = async (req, res) => {
  try {
    const rows = await attendanceService.getAttendance(req.query);

    await logActivity({
      req,
      user: req.user,
      module: "ATTENDANCE",
      actionType: "VIEW",
      action: "VIEW_ATTENDANCE",
      description: "Viewed attendance records"
    });

    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};


exports.getClassAttendance = async (req, res) => {
  try {
    const rows = await attendanceService.getClassAttendance(
      req.params.classId,
      req.query
    );

    await logActivity({
      req,
      user: req.user,
      module: "ATTENDANCE",
      actionType: "VIEW",
      action: "VIEW_CLASS_ATTENDANCE",
      description: `Viewed attendance for class ${req.params.classId}`
    });

    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};


exports.getSubjectAttendance = async (req, res) => {
  try {
    const rows = await attendanceService.getSubjectAttendance(
      req.params.subjectId,
      req.query
    );

    await logActivity({
      req,
      user: req.user,
      module: "ATTENDANCE",
      actionType: "VIEW",
      action: "VIEW_SUBJECT_ATTENDANCE",
      description: `Viewed attendance for subject ${req.params.subjectId}`
    });

    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};


exports.getStudentAttendance = async (req, res) => {
  try {
    const rows = await attendanceService.getStudentAttendance(req.params.id);

    await logActivity({
      req,
      user: req.user,
      module: "ATTENDANCE",
      actionType: "VIEW",
      action: "VIEW_STUDENT_ATTENDANCE",
      description: `Viewed attendance of student ${req.params.id}`
    });

    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};


exports.getClassSummary = async (req, res) => {
  try {
    const summary = await attendanceService.getClassSummary(req.user);

    await logActivity({
      req,
      user: req.user,
      module: "ATTENDANCE",
      actionType: "VIEW",
      action: "VIEW_CLASS_SUMMARY",
      description: "Viewed class attendance summary"
    });

    res.json(summary);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};


exports.getOverallAttendance = async (req, res) => {
  try {
    const stats = await attendanceService.getOverallAttendance(req.query);

    await logActivity({
      req,
      user: req.user,
      module: "ATTENDANCE",
      actionType: "VIEW",
      action: "VIEW_OVERALL_ATTENDANCE",
      description: "Viewed overall attendance analytics"
    });

    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
