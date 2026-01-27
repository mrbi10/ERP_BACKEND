const pool = require("../config/db");

// ================= AUTO COUNT =================
exports.getAutoCount = async () => {
  const today = new Date().toISOString().split("T")[0];

  const [rows] = await pool.query(`
    SELECT s.mess_type, COUNT(*) AS count
    FROM attendance a
    INNER JOIN students s ON a.roll_no = s.roll_no
    WHERE a.date = ? AND a.status = 'Present'
    GROUP BY s.mess_type
  `, [today]);

  let jain_present = 0;
  let non_jain_present = 0;

  rows.forEach(r => {
    if (r.mess_type === "jain") jain_present = r.count;
    if (r.mess_type === "non_jain") non_jain_present = r.count;
  });

  return {
    success: true,
    date: today,
    jain_present,
    non_jain_present,
    total: jain_present + non_jain_present
  };
};

// ================= SAVE COUNT =================
exports.saveMessCount = async (req) => {
  const { date, jain_count, non_jain_count } = req.body;
  const created_by = req.user.name;

  await pool.query(`
    INSERT INTO mess_count (date, jain_count, non_jain_count, created_by)
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      jain_count = VALUES(jain_count),
      non_jain_count = VALUES(non_jain_count),
      created_by = VALUES(created_by)
  `, [date, jain_count, non_jain_count, created_by]);

  return { success: true, message: "Mess count saved successfully" };
};

// ================= PAYMENT =================
exports.savePayment = async (req) => {
  const { from_date, to_date, total_plates, price_per_plate } = req.body;
  const paid_by = req.user.name;

  const total_amount = total_plates * price_per_plate;

  await pool.query(`
    INSERT INTO mess_payments
      (from_date, to_date, total_plates, price_per_plate, total_amount, paid_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [from_date, to_date, total_plates, price_per_plate, total_amount, paid_by]);

  return {
    from_date,
    to_date,
    total_plates,
    price_per_plate,
    total_amount,
    paid_by
  };
};

// ================= PAYMENT HISTORY =================
exports.getPaymentHistory = async () => {
  const [rows] = await pool.query(`
    SELECT
      id,
      DATE_FORMAT(from_date,'%Y-%m-%d') AS from_date,
      DATE_FORMAT(to_date,'%Y-%m-%d') AS to_date,
      total_plates,
      price_per_plate,
      total_amount,
      paid_by,
      paid_on
    FROM mess_payments
    ORDER BY paid_on DESC
  `);

  return rows;
};

// ================= NEXT START =================
exports.getNextPaymentStart = async () => {
  const [rows] = await pool.query(`
    SELECT to_date FROM mess_payments ORDER BY to_date DESC LIMIT 1
  `);

  if (!rows.length) {
    return { success: true, next_start: null };
  }

  const next = new Date(rows[0].to_date);
  next.setDate(next.getDate() + 1);

  return {
    success: true,
    next_start: next.toISOString().split("T")[0]
  };
};

// ================= HISTORY =================
exports.getMessHistory = async () => {
  const [rows] = await pool.query(`
    SELECT
      id,
      DATE_FORMAT(date, '%Y-%m-%d') AS date,
      jain_count,
      non_jain_count,
      (jain_count + non_jain_count) AS total,
      created_by,
      created_at
    FROM mess_count
    ORDER BY date DESC
  `);

  return rows;
};

// ================= RANGE =================
exports.getRangeSummary = async (req) => {
  const { from, to } = req.query;
  if (!from || !to) throw new Error("From and To dates are required");

  const [rows] = await pool.query(`
    SELECT
      SUM(jain_count) AS jain_total,
      SUM(non_jain_count) AS non_jain_total,
      SUM(jain_count + non_jain_count) AS total_plates
    FROM mess_count
    WHERE date BETWEEN ? AND ?
  `, [from, to]);

  return {
    success: true,
    from,
    to,
    jain_total: rows[0].jain_total || 0,
    non_jain_total: rows[0].non_jain_total || 0,
    total_plates: rows[0].total_plates || 0
  };
};
