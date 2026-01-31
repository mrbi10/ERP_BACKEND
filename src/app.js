require("dotenv").config();
const express = require("express");
const cors = require("cors");

require("./config/db"); 

const app = express();

app.use(cors());
app.use(express.json());

// health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", time: new Date() });
});

app.get("/api/status", (req, res) => {
  res.json({ ok: true });
});


// routes
app.use("/api", require("./routes/auth.routes"));

app.use("/api/logs", require("./routes/activityLog.routes"));
app.use("/api/placement-training", require("./routes/placement.routes"));
app.use("/api/mess/",require("./routes/mess.routes"));
app.use("/api/attendance-logs", require("./routes/attendanceLogs.routes"));
app.use("/api/attendance", require("./routes/attendance.routes"));
app.use("/api/students", require("./routes/student.routes"));
app.use("/api/announcements", require("./routes/announcement.routes"));
app.use("/api/", require("./routes/class.routes"));
app.use("/api/", require("./routes/dashboard.routes"));
app.use("/api/faculty", require("./routes/faculty.routes"));
app.use("/api/marks", require("./routes/marks.routes"));
app.use("/api/subjects", require("./routes/subject.routes"));


module.exports = app;
