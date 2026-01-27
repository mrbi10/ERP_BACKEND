const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

exports.login = async ({ email, password }) => {
  const [rows] = await pool.query(
    `
    SELECT u.*, s.roll_no
    FROM users u
    LEFT JOIN students s ON u.email = s.email
    WHERE u.email = ? OR s.roll_no = ?
    LIMIT 1
    `,
    [email, email]
  );

  if (!rows.length) {
    throw new Error("User not found");
  }

  const user = rows[0];

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    throw new Error("Incorrect password");
  }
  const sevenHours = Date.now() + 7 * 60 * 60 * 1000;

  const token = jwt.sign(
    {
      id: user.user_id,
      role: user.role,
      name: user.name,
      dept_id: user.dept_id,
      assigned_class_id: user.assigned_class_id || null,
      roll_no: user.roll_no || null,
      sessionExpiry: sevenHours
    },
    process.env.JWT_SECRET,
    { expiresIn: "7h" }
  );

  delete user.password;
  return { token, user };
};
