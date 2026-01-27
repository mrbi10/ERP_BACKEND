const express = require("express");
const router = express.Router();
const authenticateToken = require("../middlewares/authenticateToken");
const authorize = require("../middlewares/authorize");
const studentUsecase = require("../usecases/student.usecase");

router.get("/", authenticateToken, studentUsecase.getStudents);
router.get("/departments/:dept_id/students", authenticateToken, studentUsecase.getStudentsByDepartment);
router.get("/classes/:classId/students", authenticateToken, studentUsecase.getStudentsByClass);

router.post(
    "/student",
    authenticateToken,
    authorize(["Principal", "CA", "HOD", "Staff"]),
    studentUsecase.createStudent
);

router.put(
    "/student/:studentId",
    authenticateToken,
    authorize(["Staff", "CA", "HOD", "Principal"]),
    studentUsecase.updateStudent
);

router.delete(
    "/student/:student_id",
    authenticateToken,
    authorize(["Principal", "CA", "HOD"]),
    studentUsecase.deleteStudent
);

module.exports = router;
