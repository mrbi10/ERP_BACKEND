const express = require("express");
const router = express.Router();
const authenticateToken = require("../middlewares/authenticateToken");
const authorize = require("../middlewares/authorize");
const classusecase = require("../usecases/class.usecase");

// Staff / CA / Principal
router.get("/staff/classes", authenticateToken, classusecase.getStaffClasses);

// All classes
router.get("/classes", authenticateToken, classusecase.getAllClasses);


router.get(
    "/classes/:classId/students",
    authenticateToken,
    async (req, res) => {
        try {
            const result = await classusecase.getStudentsByClassed(req);
            res.json(result);
        } catch (err) {
            console.error("Class students route error:", err);
            res.status(500).json({
                message: err.message || "Server error",
            });
        }
    }
);
module.exports = router;
