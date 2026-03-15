const express = require("express");
const controller = require("../controllers/insights.controller");

const router = express.Router();

router.get("/overlapping-events", controller.getOverlappingEvents);
router.get("/temporal-gaps", controller.getTemporalGaps);
router.get("/event-influence", controller.getEventInfluence);

module.exports = router;