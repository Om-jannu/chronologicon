const { ingestFile } = require("../services/ingestion.service");
const jobs = require("../jobs/ingestionJobs");

const { buildTimeline } = require("../services/timeline.service");
const { searchEvents } = require("../services/search.service");

async function ingestEvents(req, res) {

  const { filePath } = req.body;

  const jobId = `job-${Date.now()}`;

  jobs[jobId] = {
    status: "PROCESSING",
    processedLines: 0,
    errorLines: 0,
    errors: []
  };

  ingestFile(filePath, jobs[jobId]);

  res.status(202).json({
    status: "Ingestion initiated",
    jobId
  });
}

function ingestionStatus(req, res) {

  const job = jobs[req.params.jobId];

  if (!job) {
    return res.status(404).json({ error: "Job not found" });
  }

  res.json(job);
}

async function getTimeline(req, res) {

  const { rootEventId } = req.params;

  const timeline = await buildTimeline(rootEventId);

  if (!timeline) {
    return res.status(404).json({ message: "Event not found" });
  }

  res.json(timeline);
}

async function search(req, res) {

  const events = await searchEvents(req.query);

  res.json({
    totalEvents: events.length,
    page: req.query.page || 1,
    limit: req.query.limit || 10,
    events
  });
}

module.exports = {
  ingestEvents,
  ingestionStatus,
  getTimeline,
  searchEvents: search
};