const studentService = require("../services/student.service");

exports.getStudents = async (req, res) => {
  try {
    const students = await studentService.getStudents(req.user);
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
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
  try {
    await studentService.updateStudent(req.params.studentId, req.body);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
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
