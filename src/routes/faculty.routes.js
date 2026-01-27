const express = require("express");
const router = express.Router();

const authenticateToken = require("../middlewares/authenticateToken");
const authorize = require("../middlewares/authorize");
const facultyusecase = require("../usecases/faculty.usecase");

router.get(
  "/",
  authenticateToken,
  authorize(["Principal", "HOD"]),
  async (req, res) => {
    try {
      const result = await facultyusecase.getFacultyList(req);
      res.json(result);
    } catch (err) {
      console.error("Faculty route error:", err);
      res.status(500).json({
        success: false,
        message: err.message || "Server error while fetching faculty list",
      });
    }
  }
);

module.exports = router;
