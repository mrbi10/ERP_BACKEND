const express = require("express");
const router = express.Router();
const authenticateToken = require("../middlewares/authenticateToken");
const authorize = require("../middlewares/authorize");
const announcementusecase = require("../usecases/announcement.usecase");

router.get("/", authenticateToken, announcementusecase.getAnnouncements);
router.post("/", authenticateToken, announcementusecase.createAnnouncement);
router.patch("/:id", authenticateToken, announcementusecase.updateAnnouncement);
router.delete("/:id", authenticateToken, announcementusecase.deleteAnnouncement);

module.exports = router;
