const messService = require("../services/mess.service");
const { logActivity } = require("../services/activityLog.service");

// ================= AUTO COUNT =================
exports.getAutoCount = async (req, res) => {
  try {
    const result = await messService.getAutoCount();

    await logActivity({
      req,
      user: req.user,
      module: "MESS",
      actionType: "READ",
      action: "AUTO_COUNT",
      description: "Fetched today's auto plate count"
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ================= SAVE COUNT =================
exports.saveMessCount = async (req, res) => {
  try {
    const result = await messService.saveMessCount(req);

    await logActivity({
      req,
      user: req.user,
      module: "MESS",
      actionType: "UPSERT",
      action: "SAVE_COUNT",
      refTable: "mess_count",
      newData: req.body
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ================= PAYMENT =================
exports.savePayment = async (req, res) => {
  try {
    const result = await messService.savePayment(req);

    await logActivity({
      req,
      user: req.user,
      module: "MESS",
      actionType: "CREATE",
      action: "SAVE_PAYMENT",
      refTable: "mess_payments",
      newData: result
    });

    res.json({ success: true, message: "Payment recorded successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Payment save failed" });
  }
};

// ================= PAYMENT HISTORY =================
exports.getPaymentHistory = async (req, res) => {
  try {
    const records = await messService.getPaymentHistory();

    res.json({ success: true, records });
  } catch {
    res.status(500).json({ success: false, message: "Failed to load payment history" });
  }
};

// ================= NEXT START =================
exports.getNextPaymentStart = async (req, res) => {
  try {
    const result = await messService.getNextPaymentStart();
    res.json(result);
  } catch {
    res.status(500).json({ success: false, message: "Failed to load next start date" });
  }
};

// ================= HISTORY =================
exports.getMessHistory = async (req, res) => {
  try {
    const records = await messService.getMessHistory();
    res.json({ success: true, records });
  } catch {
    res.status(500).json({ success: false, message: "Server error while fetching history" });
  }
};

// ================= RANGE =================
exports.getRangeSummary = async (req, res) => {
  try {
    const result = await messService.getRangeSummary(req);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
