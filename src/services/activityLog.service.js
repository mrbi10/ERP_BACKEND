const UAParser = require("ua-parser-js");
const pool = require("../config/db");

exports.logActivity = async ({
  req,
  user,
  module,
  actionType,
  action,
  description,
  refTable = null,
  refId = null,
  oldData = null,
  newData = null
}) => {
  try {
    const parser = new UAParser(req.headers["user-agent"]);
    const ua = parser.getResult();

    const log = {
      user_id: user?.user_id || null,
      role: user?.role || "UNKNOWN",

      module,
      action_type: actionType,
      action,
      description,

      request_method: req.method,
      endpoint: req.originalUrl,

      public_ip: req.ip,
      private_ip:
        req.headers["x-forwarded-for"] ||
        req.socket.remoteAddress ||
        null,

      user_agent: req.headers["user-agent"],
      device_type: ua.device.type || "desktop",
      os: `${ua.os.name || ""} ${ua.os.version || ""}`.trim(),
      browser: `${ua.browser.name || ""} ${ua.browser.version || ""}`.trim(),

      ref_table: refTable,
      ref_id: refId,

      old_data: oldData ? JSON.stringify(oldData) : null,
      new_data: newData ? JSON.stringify(newData) : null
    };

    await pool.query("INSERT INTO activity_logs SET ?", log);
  } catch (err) {
    console.error("Activity log failed:", err.message);
  }
};


