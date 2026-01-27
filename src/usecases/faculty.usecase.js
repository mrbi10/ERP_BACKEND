const service = require("../services/faculty.service");

exports.getFacultyList = async (req) => {
  const { page = 1, limit = 10 } = req.query;

  return service.getFacultyList({
    page: Number(page),
    limit: Number(limit),
  });
};
