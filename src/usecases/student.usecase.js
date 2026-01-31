const studentService = require("../services/student.service");
const { logActivity } = require("../services/activityLog.service");

exports.getStudents = async (req, res) => {
  try {
    const { class_id, dept_id } = req.query;

    const rows = await studentService.getStudents(req.user, {
      class_id: class_id ? Number(class_id) : null,
      dept_id: dept_id ? Number(dept_id) : null
    });

    res.json({
      success: true,
      data: rows
    });
  } catch (err) {
    console.error("getStudents error:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};



exports.getStudentsByDepartment = async (req, res) => {
  try {
    const rows = await studentService.getStudentsByDepartment(req.params.dept_id);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getStudentsByClass = async (req, res) => {
  try {
    const rows = await studentService.getStudentsByClass(req.user, req.params.classId);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createStudent = async (req, res) => {
  try {
    const result = await studentService.createStudent(req.body);
    res.json(result);
  } catch (err) {
    res.status(err.code === "DUPLICATE" ? 409 : 500).json(err);
  }
};

exports.updateStudent = async (req, res) => {
  console.log(req)
  try {
    const result = await studentService.updateStudent(
      req.params.studentId,
      req.body,
      req.user
    );
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.deleteStudent = async (req, res) => {
  try {
    await studentService.deleteStudent(req.params.student_id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
