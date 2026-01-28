const subjectService = require("../services/subject.service");

// ===============================
// GET /api/subjects
// ===============================
exports.getSubjects = async (req, res) => {
  try {
    const result = await subjectService.getSubjects(req);
    res.json({ success: true, subjects: result });
  } catch (err) {
    console.error("❌ getSubjects error:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// ===============================
// GET /api/subjects/staff
// ===============================
exports.getStaffSubjects = async (req, res) => {
  try {
    const result = await subjectService.getStaffSubjects(req);
    res.json({
      success: true,
      handled_subjects: result.handled_subjects,
      ca_subjects: result.ca_subjects,
      subjects: result.subjects
    });
  } catch (err) {
    console.error("❌ getStaffSubjects error:", err);
    res.status(500).json({
      success: false,
      message: "Server error while fetching staff subjects"
    });
  }
};
