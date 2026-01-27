const pool = require("../config/db");

exports.getFacultyList = async ({ page, limit }) => {
  const offset = (page - 1) * limit;

  const [faculty] = await pool.query(
    `
    SELECT 
      u.user_id,
      u.name,
      u.email,
      u.role,
      u.dept_id,

      -- CA Class
      GROUP_CONCAT(
        DISTINCT CASE WHEN sca.access_type = 'ca' 
          THEN CONCAT(c.year)
        END ORDER BY c.year SEPARATOR ', '
      ) AS ca_class,

      -- Teaching classes
      GROUP_CONCAT(
        DISTINCT CASE WHEN sca.access_type = 'teaching' 
          THEN CONCAT(c.year)
        END ORDER BY c.year SEPARATOR ', '
      ) AS teaching_classes

    FROM users u
    LEFT JOIN staff_class_access sca ON u.user_id = sca.user_id
    LEFT JOIN classes c ON sca.class_id = c.class_id
    WHERE u.role IN ('Staff', 'CA')
    GROUP BY u.user_id
    ORDER BY u.name ASC
    LIMIT ? OFFSET ?
    `,
    [limit, offset]
  );

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total FROM users WHERE role IN ('Staff', 'CA')`
  );

  const total = countRows[0]?.total || 0;
  const totalPages = Math.ceil(total / limit);

  return {
    success: true,
    total,
    currentPage: page,
    totalPages,
    users: faculty.map((f) => ({
      id: f.user_id,
      name: f.name,
      email: f.email,
      role: f.role,
      dept_id: f.dept_id,
      ca_class: f.ca_class || null,
      teaching_classes: f.teaching_classes || null,
    })),
  };
};
