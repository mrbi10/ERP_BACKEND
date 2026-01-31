const messService = require("../services/mess.service");
const { logActivity } = require("../services/activityLog.service");

// ===== MENU =====
exports.getMessMenu = async (req, res) => {
  try {
    const data = await messService.getMessMenu(req.query.day);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ===== AUTO COUNT =====
exports.getAutoCount = async (req, res) => {
  try {
    const data = await messService.getAutoCount();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ===== DAILY COUNT =====
exports.saveMessCount = async (req, res) => {
  try {
    const result = await messService.saveMessCount(req);

    await logActivity({
      user: req.user.name,
      action: "SAVE_MESS_COUNT",
      module: "MESS",
      data: req.body
    });

    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateMessCount = async (req, res) => {
  try {
    const result = await messService.updateMessCount(req);

    await logActivity({
      user: req.user.name,
      action: "UPDATE_MESS_COUNT",
      module: "MESS",
      data: { date: req.params.date, ...req.body }
    });

    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteMessCount = async (req, res) => {
  try {
    const result = await messService.deleteMessCount(req);

    await logActivity({
      user: req.user.name,
      action: "DELETE_MESS_COUNT",
      module: "MESS",
      data: { date: req.params.date }
    });

    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ===== PAYMENTS =====
exports.savePayment = async (req, res) => {
  try {
    const result = await messService.savePayment(req);

    await logActivity({
      user: req.user.name,
      action: "SAVE_MESS_PAYMENT",
      module: "MESS",
      data: result
    });

    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deletePayment = async (req, res) => {
  try {
    const result = await messService.deletePayment(req);

    await logActivity({
      user: req.user.name,
      action: "DELETE_MESS_PAYMENT",
      module: "MESS",
      data: { payment_id: req.params.id }
    });

    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ===== READ =====
exports.getPaymentHistory = async (req, res) => {
  try {
    const data = await messService.getPaymentHistory();
    res.json({ records: data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getNextPaymentStart = async (req, res) => {
  try {
    const data = await messService.getNextPaymentStart();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMessHistory = async (req, res) => {
  try {
    const data = await messService.getMessHistory();
    res.json({ records: data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getRangeSummary = async (req, res) => {
  try {
    const data = await messService.getRangeSummary(req);
    res.json(data);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updatePayment = async (req, res) => {
  try {
    const result = await messService.updatePayment(req);

    await logActivity({
      user: req.user.name,
      action: "UPDATE_MESS_PAYMENT",
      module: "MESS",
      old_data: result.old,
      new_data: result.new
    });

    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
