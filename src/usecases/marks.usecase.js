const marksService = require("../services/marks.service");

/**
 * POST /api/marks
 */
exports.addOrUpdateMarks = async (req, res) => {
  try {
    const { student_id, subject_id, exam_type, mark, total } = req.body;

    if (!student_id || !subject_id || !exam_type) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    await marksService.addOrUpdateMarks({
      student_id,
      subject_id,
      exam_type,
      mark,
      total,
      entered_by: req.user.id
    });

    res.json({ success: true, message: "Marks saved successfully" });

  } catch (err) {
    console.error("Add/Update Marks error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET /api/marks/student/:roll_no
 */
exports.getMarksByStudent = async (req, res) => {
  try {
    const { roll_no } = req.params;

    const student = await marksService.getStudentByRollNo(roll_no);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const marks = await marksService.getMarksByStudentId(student.student_id);

    res.json({
      success: true,
      student: {
        roll_no,
        name: student.student_name,
        student_id: student.student_id
      },
      marks
    });

  } catch (err) {
    console.error("Get marks by student error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * GET /api/marks/class/:classId
 */
exports.getMarksByClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const rows = await marksService.getMarksByClass(classId);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET /api/marks/overview
 */
exports.getMarksOverview = async (req, res) => {
  try {
    const rows = await marksService.getMarksOverview();
    res.json({ success: true, departments: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error fetching overview" });
  }
};

/**
 * GET /api/marks/department-analysis
 */
exports.getDepartmentAnalysis = async (req, res) => {
  try {
    const rows = await marksService.getDepartmentAnalysis();
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error fetching analysis" });
  }
};

/**
 * GET /api/marks/top-performers
 */
exports.getTopPerformers = async (req, res) => {
  try {
    const rows = await marksService.getTopPerformers();
    res.json({ success: true, students: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error fetching toppers" });
  }
};
