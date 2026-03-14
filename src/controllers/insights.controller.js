const { getOverlappingEvents } = require("../services/overlap.service");
const { findLargestGap } = require("../services/gap.service");
const { findInfluencePath } = require("../services/influence.service");

async function getOverlapping(req, res) {

  const result = await getOverlappingEvents();

  res.json(result);
}

async function getTemporalGaps(req, res) {

  const { startDate, endDate } = req.query;

  const gap = await findLargestGap(startDate, endDate);

  res.json(gap);
}

async function getInfluence(req, res) {

  const { sourceEventId, targetEventId } = req.query;

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