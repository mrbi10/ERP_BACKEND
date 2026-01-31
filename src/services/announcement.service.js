const pool = require("../config/db");

/**
 * Resolve dept_id & class_id for any user
 */
async function resolveScope(user) {
  if (user.role === "student") {
    const [[s]] = await pool.query(
      `SELECT dept_id, class_id 
       FROM students 
       WHERE roll_no = ? AND is_active = 1`,
      [user.roll_no]
    );
    if (!s) return {};
    return { dept_id: s.dept_id, class_id: s.class_id };
  }

  const [[u]] = await pool.query(
    `SELECT dept_id, assigned_class_id 
     FROM users 
     WHERE user_id = ?`,
    [user.id]
  );

  if (!u) return {};
  return { dept_id: u.dept_id, class_id: u.assigned_class_id };
}

/**
 * GET announcements visible to user
 */
exports.getAnnouncements = async (user) => {
  const { dept_id, class_id } = await resolveScope(user);

  let query = `
    SELECT a.*, u.name AS created_by_name
    FROM announcements a
    LEFT JOIN users u ON u.user_id = a.created_by
    WHERE 1 = 1
  `;
  const params = [];

  // 🔒 Student
  if (user.role === "student") {
    query += `
      AND (
        a.target_type = 'all'
        OR (a.target_type = 'department' AND a.target_id = ?)
        OR (a.target_type = 'class' AND a.target_id = ?)
      )
    `;
    params.push(dept_id, class_id);
  }

  // 🔒 CA
  else if (user.role === "CA") {
    query += `
      AND (
        a.target_type = 'all'
        OR (a.target_type = 'department' AND a.target_id = ?)
        OR (a.target_type = 'class' AND a.target_id = ?)
      )
    `;
    params.push(dept_id, class_id);
  }

  // 🔒 HOD
  else if (user.role === "HOD") {
    query += `
      AND (
        a.target_type = 'all'
        OR (a.target_type = 'department' AND a.target_id = ?)
        OR (
          a.target_type = 'class' AND a.target_id IN (
            SELECT class_id FROM classes WHERE dept_id = ?
          )
        )
      )
    `;
    params.push(dept_id, dept_id);
  }

  // 🔓 Principal → sees everything
  // no filters

  query += " ORDER BY a.created_at DESC";

  const [rows] = await pool.query(query, params);
  return rows;
};


exports.createAnnouncement = async (user, data) => {
  let { title, message, target_type, target_id } = data;

  // 🔐 ENFORCE RULES (backend always wins)
  if (user.role === "CA") {
    target_type = "class";
    target_id = user.assigned_class_id;
  }

  if (user.role === "HOD" && target_type === "department") {
    target_id = user.dept_id;
  }

  if (user.role === "HOD" && target_type === "class") {
    // verify class belongs to HOD dept
    const [[cls]] = await pool.query(
      `SELECT class_id FROM classes WHERE class_id = ? AND dept_id = ?`,
      [target_id, user.dept_id]
    );
    if (!cls) throw new Error("Unauthorized class selection");
  }

  await pool.query(
    `INSERT INTO announcements
     (title, message, target_type, target_id, created_by)
     VALUES (?, ?, ?, ?, ?)`,
    [title, message, target_type, target_id || null, user.id]
  );
};


exports.updateAnnouncement = async (user, id, data) => {
  const [[a]] = await pool.query(
    "SELECT * FROM announcements WHERE id = ?",
    [id]
  );
  if (!a) throw new Error("Not found");

  // Permissions
  if (
    user.role !== "Principal" &&
    user.role !== "HOD" &&
    user.role !== "CA" &&
    a.created_by !== user.id
  ) {
    throw new Error("Unauthorized");
  }

  let { title, message, target_type, target_id } = data;

  // Re-apply role rules
  if (user.role === "CA") {
    target_type = "class";
    target_id = user.assigned_class_id;
  }

  if (user.role === "HOD" && target_type === "department") {
    target_id = user.dept_id;
  }

  await pool.query(
    `UPDATE announcements
     SET title = ?, message = ?, target_type = ?, target_id = ?
     WHERE id = ?`,
    [title, message, target_type, target_id || null, id]
  );
};


exports.deleteAnnouncement = async (user, id) => {
  const [[a]] = await pool.query(
    "SELECT created_by FROM announcements WHERE id = ?",
    [id]
  );
  if (!a) throw new Error("Not found");

  if (
    user.role !== "Principal" &&
    user.role !== "HOD" &&
    user.role !== "CA" &&
    a.created_by !== user.id
  ) {
    throw new Error("Unauthorized");
  }

  await pool.query("DELETE FROM announcements WHERE id = ?", [id]);
};
