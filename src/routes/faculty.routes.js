const express = require("express");
const router = express.Router();

const authenticateToken = require("../middlewares/authenticateToken");
const authorize = require("../middlewares/authorize");
const facultyUsecase = require("../usecases/faculty.usecase");

// LIST + FILTER
router.get(
  "/",
  authenticateToken,
  authorize(["Principal", "HOD"]),
  (req, res) => facultyUsecase.getFacultyList(req, res)
);

// GET ONE
router.get(
  "/:user_id",
  authenticateToken,
  authorize(["Principal", "HOD"]),
  (req, res) => facultyUsecase.getFacultyById(req, res)
);

// CREATE
router.post(
  "/",
  authenticateToken,
  authorize(["Principal"]),
  (req, res) => facultyUsecase.createFaculty(req, res)
);

// UPDATE
router.put(
  "/:user_id",
  authenticateToken,
  authorize(["Principal", "HOD"]),
  (req, res) => facultyUsecase.updateFaculty(req, res)
);

// DELETE
router.delete(
  "/:user_id",
  authenticateToken,
  authorize(["Principal"]),
  (req, res) => facultyUsecase.deleteFaculty(req, res)
);

module.exports = router;
