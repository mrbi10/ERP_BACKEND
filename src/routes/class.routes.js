const express = require("express");
const router = express.Router();
const authenticateToken = require("../middlewares/authenticateToken");
const authorize = require("../middlewares/authorize");
const classusecase = require("../usecases/class.usecase");

// Staff / CA / Principal
router.get("/staff/classes", authenticateToken, classusecase.getStaffClasses);

// All classes
router.get("/classes", authenticateToken, classusecase.getAllClasses);


router.get(
  "/classes/:classId/students",
  authenticateToken,
  classusecase.getStudentsByClassed
);

module.exports = router;
