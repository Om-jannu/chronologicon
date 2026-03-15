const express = require("express");
const controller = require("../controllers/events.controller");

const router = express.Router();

router.post("/ingest", controller.ingestEvents);
router.get(
  "/ingestion-status/:jobId",
  controller.ingestionStatus
);
router.get("/search", controller.searchEvents);
router.get("/timeline/:rootEventId", controller.getTimeline);

module.exports = router;