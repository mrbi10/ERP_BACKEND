const pool = require("../config/db");

// =========================
// Staff / CA / Principal Classes
// =========================
exports.getStaffClasses = async (user) => {
  const { id: userId, role } = user;

  if (!["Staff", "CA", "Principal"].includes(role)) {
    const err = new Error("Forbidden");
    err.status = 403;
    throw err;
  }

  let rows;

  if (role === "Principal") {
    // Principal sees all classes
    [rows] = await pool.query(
      `
      SELECT class_id, year
      FROM classes
      `
    );
  } else {
    // Staff / CA see only assigned classes
    [rows] = await pool.query(
      `
      SELECT DISTINCT c.class_id, c.year
      FROM classes c
      JOIN staff_class_access sca
        ON c.class_id = sca.class_id
      WHERE sca.user_id = ?
      `,
      [userId]
    );
  }

  return rows;
};

// =========================
// All Classes
// =========================
exports.getAllClasses = async () => {
  const [rows] = await pool.query(
    `
    SELECT class_id, year, section, dept_id
    FROM classes
    ORDER BY year, section
    `
  );

  return rows;
};
