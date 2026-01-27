const service = require("../services/class.service");

// =========================
// GET: Staff / CA / Principal Classes
// =========================
exports.getStaffClasses = async (req, res) => {
  try {
    const rows = await service.getStaffClasses(req.user);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching staff classes:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// =========================
// GET: All Classes
// =========================
exports.getAllClasses = async (req, res) => {
  try {
    const rows = await service.getAllClasses();
    res.json(rows);
  } catch (err) {
    console.error("Error fetching classes:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
