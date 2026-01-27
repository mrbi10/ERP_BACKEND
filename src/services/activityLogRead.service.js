const logService = require("../services/activityLogRead.service");

exports.getLogs = async (req, res) => {
  const { module, userId, limit } = req.query;

  const logs = await logService.getLogs({
    module,
    userId,
    limit
  });

  res.json(logs);
};
