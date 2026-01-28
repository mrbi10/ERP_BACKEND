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


exports.getUserByEmail = async (email) => {
  const [[row]] = await pool.query(
    "SELECT user_id, name, email FROM users WHERE email = ?",
    [email]
  );
  return row;
};

exports.saveResetToken = async (userId, token, expires) => {
  await pool.query(
    "UPDATE users SET reset_token = ?, reset_expires = ? WHERE user_id = ?",
    [token, expires, userId]
  );
};

exports.getUserByResetToken = async (token) => {
  const [[row]] = await pool.query(
    "SELECT * FROM users WHERE reset_token = ? AND reset_expires > NOW()",
    [token]
  );
  return row;
};

exports.updatePassword = async (userId, hashedPassword) => {
  await pool.query(
    "UPDATE users SET password = ?, reset_token = NULL WHERE user_id = ?",
    [hashedPassword, userId]
  );
};

