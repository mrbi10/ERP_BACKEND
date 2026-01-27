// src/usecases/activityLog.usecase.js
const logReadService = require("../services/activityLogRead.service");

exports.getLogs = async (req, res) => {
  const { module, userId, limit } = req.query;

  const logs = await logReadService.getLogs({
    module,
    userId,
    limit
  });

  res.json(logs);
};
