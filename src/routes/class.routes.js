const express = require("express");
const router = express.Router();
const authenticateToken = require("../middlewares/authenticateToken");
const authorize = require("../middlewares/authorize");
const classusecase = require("../usecases/class.usecase");

// Staff / CA / Principal
router.get("/staff/classes", authenticateToken, classusecase.getStaffClasses);

// All classes
router.get("/", authenticateToken, classusecase.getAllClasses);

module.exports = router;
