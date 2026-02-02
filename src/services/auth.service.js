const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");


const buildTokenAndUser = (user) => {
  const sevenHours = Date.now() + 7 * 60 * 60 * 1000;

  const token = jwt.sign(
    {
      id: user.user_id,
      role: user.role,
      name: user.name,
      roll_no: user.role === "student" ? user.roll_no : null,
      dept_id: user.dept_id,
      class_id: user.role === "student" ? user.class_id : null,
      assigned_class_id: user.assigned_class_id || null,
      sessionExpiry: sevenHours,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7h" }
  );

  delete user.password;
  return { token, user };
};


exports.login = async ({ email, password }) => {
  const [rows] = await pool.query(
    `
    SELECT 
      u.user_id,
      u.name,
      u.email,
      u.password,
      u.role,
      u.dept_id,
      u.assigned_class_id,
      u.is_active,
      s.roll_no,
      s.class_id
    FROM users u
    LEFT JOIN students s 
  ON s.user_id = u.user_id AND u.role = 'student'
    WHERE (u.email = ? OR s.roll_no = ?)
      AND u.is_active = 1
    LIMIT 1
    `,
    [email, email]
  );

  if (!rows.length) {
    throw new Error("User not found or inactive");
  }

  const user = rows[0];

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    throw new Error("Incorrect password");
  }

  return buildTokenAndUser(user);

};


exports.loginWithOtp = async (email) => {
  const [rows] = await pool.query(
    `
    SELECT 
      u.user_id,
      u.name,
      u.email,
      u.password,
      u.role,
      u.dept_id,
      u.assigned_class_id,
      u.is_active,
      s.roll_no,
      s.class_id
    FROM users u
    LEFT JOIN students s 
      ON s.user_id = u.user_id AND u.role = 'student'
    WHERE u.email = ?
      AND u.is_active = 1
    LIMIT 1
    `,
    [email]
  );

  if (!rows.length) {
    throw new Error("User not found or inactive");
  }

  const user = rows[0];
  return buildTokenAndUser(user);
};


exports.getUserByEmail = async (email) => {
  const [[row]] = await pool.query(
    `
    SELECT user_id, name, email
    FROM users
    WHERE email = ?
      AND is_active = 1
    `,
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
    `
    SELECT *
    FROM users
    WHERE reset_token = ?
      AND reset_expires > UTC_TIMESTAMP()
      AND is_active = 1
    `,
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

