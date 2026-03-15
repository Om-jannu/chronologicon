const { getOverlappingEvents } = require("../services/overlap.service");
const { findLargestGap } = require("../services/gap.service");
const { findInfluencePath } = require("../services/influence.service");

async function getOverlapping(req, res) {
  const { startDate, endDate } = req.query;
  const result = await getOverlappingEvents(startDate, endDate);
  res.json(result);
}

async function getTemporalGaps(req, res) {
  const { startDate, endDate } = req.query;
  const gap = await findLargestGap(startDate, endDate);
  res.json(gap);
}

async function getInfluence(req, res) {
  const { sourceEventId, targetEventId } = req.query;
  if (!sourceEventId || !targetEventId) {
    return res.status(400).json({
      error: "Both sourceEventId and targetEventId query parameters are required."
    });
  }

  const result = await findInfluencePath(
    sourceEventId,
    targetEventId
  );

  res.json(result);
}

module.exports = {
  getOverlappingEvents: getOverlapping,
  getTemporalGaps,
  getEventInfluence: getInfluence
};