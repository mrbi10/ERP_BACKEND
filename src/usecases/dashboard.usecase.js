const service = require("../services/dashboard.service");

// ================= ADMIN OVERVIEW =================
exports.getAdminOverview = async (req) => {
  const { deptId, classId } = req.query;
  return service.getAdminOverview({ deptId, classId });
};

// ================= PROFILE =================
exports.getProfile = async (req) => {
  return service.getProfile(req.user);
};
