const service = require("../services/class.service");
const { logActivity } = require("../services/activityLog.service");


// =========================
// GET: Staff / CA / Principal Classes
// =========================
exports.getStaffClasses = async (req, res) => {
  try {
    const rows = await service.getStaffClasses(req.user);

    await logActivity({
      req,
      user: req.user,
      module: "CLASS",
      actionType: "VIEW",
      action: "VIEW_ASSIGNED_CLASSES",
      description: "Viewed assigned classes"
    });

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

    await logActivity({
      req,
      user: req.user,
      module: "CLASS",
      actionType: "VIEW",
      action: "VIEW_ALL_CLASSES",
      description: "Viewed all classes list"
    });

    res.json(rows);
  } catch (err) {
    console.error("Error fetching classes:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getStudentsByClassed = async (req, res) => {
  try {
    const { classId } = req.params;
    const { role, dept_id } = req.user;

    const rows = await service.getStudentsByClassed({
      classId,
      role,
      dept_id,
    });

    await logActivity({
      req,
      user: req.user,
      module: "STUDENT",
      actionType: "VIEW",
      action: "VIEW_STUDENTS_BY_CLASS",
      description: `Viewed students of class ${classId}`
    });

    res.json({
      success: true,
      data: rows
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
