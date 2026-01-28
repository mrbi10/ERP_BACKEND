const pool = require("../config/db");

exports.getAnnouncements = async (user) => {
  let dept_id = null;
  let class_id = null;
  const params = [];

  if (user.role === "student") {
    const [[s]] = await pool.query(
      "SELECT dept_id, class_id FROM students WHERE roll_no = ?",
      [user.roll_no]
    );
    if (!s) return [];
    dept_id = s.dept_id;
    class_id = s.class_id;
  } else {
    const [[u]] = await pool.query(
      "SELECT dept_id, assigned_class_id FROM users WHERE user_id = ?",
      [user.id]
    );
    if (!u) return [];
    dept_id = u.dept_id;
    class_id = u.assigned_class_id;
  }

  let query = `
    SELECT a.*, u.name AS created_by_name
    FROM announcements a
    LEFT JOIN users u ON u.user_id = a.created_by
    WHERE a.target_type = 'all'
  `;

  if (user.role === "student" || user.role === "CA") {
    query += `
      OR (a.target_type = 'department' AND a.target_id = ?)
      OR (a.target_type = 'class' AND a.target_id = ?)
    `;
    params.push(dept_id, class_id);
  }

  if (user.role === "staff") {
    query += `
      OR (a.target_type = 'department' AND a.target_id = ?)
    `;
    params.push(dept_id);
  }

  if (user.role === "HOD") {
    query += `
      OR (a.target_type = 'department' AND a.target_id = ?)
      OR (a.target_type = 'class' AND a.target_id IN (
        SELECT class_id FROM classes WHERE dept_id = ?
      ))
    `;
    params.push(dept_id, dept_id);
  }

  if (user.role === "Principal") {
    query = `
      SELECT a.*, u.name AS created_by_name
      FROM announcements a
      LEFT JOIN users u ON u.user_id = a.created_by
    `;
  }

  query += " ORDER BY a.created_at DESC";

  const [rows] = await pool.query(query, params);
  return rows;
};

exports.createAnnouncement = async (user, data) => {
  const { title, message, target_type, target_id } = data;

  const [result] = await pool.query(
    `INSERT INTO announcements (title, message, target_type, target_id, created_by)
     VALUES (?, ?, ?, ?, ?)`,
    [title, message, target_type, target_id, user.id]
  );

  return result.insertId;
};

exports.updateAnnouncement = async (user, id, data) => {
  const [[row]] = await pool.query(
    "SELECT * FROM announcements WHERE id = ?",
    [id]
  );
  if (!row) throw new Error("Not found");

  await pool.query(
    `UPDATE announcements
     SET title = ?, message = ?, target_type = ?, target_id = ?
     WHERE id = ?`,
    [data.title, data.message, data.target_type, data.target_id, id]
  );
};

exports.deleteAnnouncement = async (user, id) => {
  const [[row]] = await pool.query(
    "SELECT created_by FROM announcements WHERE id = ?",
    [id]
  );
  if (!row) throw new Error("Not found");

  await pool.query("DELETE FROM announcements WHERE id = ?", [id]);
};
