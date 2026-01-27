const express = require("express");
const router = express.Router();

const authenticateToken = require("../middlewares/authenticateToken");
const authorize = require("../middlewares/authorize");
const dashboardusecase = require("../usecases/dashboard.usecase");

// ---------------- ADMIN OVERVIEW ----------------
router.get(
  "/admin/overview",
  authenticateToken,
  authorize(["Principal", "HOD", "CA", "Staff"]),
  async (req, res) => {
    try {
      const result = await dashboardusecase.getAdminOverview(req);
      res.json(result);
    } catch (err) {
      console.error("Admin overview route error:", err);
      res.status(500).json({ message: err.message });
    }
  }
);

// ---------------- PROFILE ----------------
router.get(
  "/profile",
  authenticateToken,
  async (req, res) => {
    try {
      const result = await dashboardusecase.getProfile(req);
      res.json(result);
    } catch (err) {
      console.error("Profile route error:", err);
      res.status(500).json({ message: err.message });
    }
  }
);

module.exports = router;
