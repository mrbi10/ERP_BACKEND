const attendanceService = require("../services/attendance.service");

exports.markAttendance = async (req, res) => {
  try {
    const result = await attendanceService.markAttendance(req.user, req.body);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

exports.updateAttendance = async (req, res) => {
  try {
    await attendanceService.updateAttendance(req.user, req.body);
    res.json({ success: true, message: "Attendance updated successfully" });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

exports.getAttendance = async (req, res) => {
  try {
    const rows = await attendanceService.getAttendance(req.query);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.getClassAttendance = async (req, res) => {
  try {
    const rows = await attendanceService.getClassAttendance(req.params.classId, req.query);
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
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.getStudentAttendance = async (req, res) => {
  try {
    const rows = await attendanceService.getStudentAttendance(req.params.id);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.getClassSummary = async (req, res) => {
  try {
    const summary = await attendanceService.getClassSummary(req.user);
    res.json(summary);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.getOverallAttendance = async (req, res) => {
  try {
    const stats = await attendanceService.getOverallAttendance(req.query);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

