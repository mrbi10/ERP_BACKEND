const pool = require("../config/db");


// ================= MESS MENU =================
exports.getMessMenu = async (day) => {
  let query = "SELECT * FROM mess_menu";
  const params = [];

  if (day) {
    query += " WHERE day_of_week = ?";
    params.push(day);
  }

  query += `
    ORDER BY FIELD(
      day_of_week,
      'Monday','Tuesday','Wednesday','Thursday',
      'Friday','Saturday','Sunday'
    )
  `;

  const [rows] = await pool.query(query, params);

  if (!rows.length) {
    return [];
  }

  return rows.map(row => ({
    day: row.day_of_week,
    jain: {
      main_dish: row.jain_main_dish,
      side_dish_1: row.jain_side_dish_1,
      side_dish_2: row.jain_side_dish_2,
      rasam_curry: row.jain_rasam_curry,
      extras_1: row.jain_extras_1,
      extras_2: row.jain_extras_2
    },
    non_jain: {
      main_dish: row.non_jain_main_dish,
      sabji_1: row.non_jain_sabji_1,
      sabji_2: row.non_jain_sabji_2,
      sambar: row.non_jain_sambar,
      rasam: row.non_jain_rasam,
      extras: row.non_jain_extras
    }
  }));
};


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


exports.updateMessCount = async (req) => {
  const { date } = req.params;
  const { jain_count, non_jain_count } = req.body;
  const user = req.user.name;

  const [[row]] = await pool.query(
    "SELECT * FROM mess_count WHERE date = ?",
    [date]
  );

  if (!row) throw new Error("Record not found");
  if (row.is_locked) throw new Error("This day is locked due to payment");

  await pool.query(
    `UPDATE mess_count
     SET jain_count = ?, non_jain_count = ?, created_by = ?
     WHERE date = ?`,
    [jain_count, non_jain_count, user, date]
  );

  await pool.query(
    `INSERT INTO mess_logs (action, reference_type, reference_id, old_data, new_data, performed_by)
     VALUES ('UPDATE','MESS_DAY', ?, ?, ?, ?)`,
    [
      row.id,
      JSON.stringify(row),
      JSON.stringify({ jain_count, non_jain_count }),
      user
    ]
  );

  return { success: true };
};

exports.updatePayment = async (req) => {
  const { id } = req.params;
  const { price_per_plate } = req.body;

  const [[oldPayment]] = await pool.query(
    "SELECT * FROM mess_payments WHERE id = ?",
    [id]
  );

  if (!oldPayment) {
    throw new Error("Payment not found");
  }

  const total_amount = oldPayment.total_plates * price_per_plate;

  await pool.query(
    `
    UPDATE mess_payments
    SET price_per_plate = ?, total_amount = ?
    WHERE id = ?
    `,
    [price_per_plate, total_amount, id]
  );

  return {
    old: oldPayment,
    new: {
      ...oldPayment,
      price_per_plate,
      total_amount
    }
  };
};

