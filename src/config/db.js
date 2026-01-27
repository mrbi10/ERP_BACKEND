const mysql = require("mysql2/promise");

const isAzure = process.env.DB_ENV === "azure";

const pool = mysql.createPool({
  host: isAzure ? process.env.AZURE_DB_HOST : process.env.DB_HOST,
  user: isAzure ? process.env.AZURE_DB_USER : process.env.DB_USER,
  password: isAzure ? process.env.AZURE_DB_PASSWORD : process.env.DB_PASSWORD,
  database: isAzure ? process.env.AZURE_DB_NAME : process.env.DB_NAME,
  port: isAzure
    ? process.env.AZURE_DB_PORT || 3306
    : process.env.DB_PORT || 3306,

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: "Z",

  ...(isAzure && {
    ssl: {
      rejectUnauthorized: true
    }
  })
});

pool.getConnection()
  .then(conn => {
    console.log(`MySQL connected (${isAzure ? "AZURE" : "LOCAL"})`);
    conn.release();
  })
  .catch(err => {
    console.error("MySQL connection failed:", err.message);
  });

module.exports = pool;
