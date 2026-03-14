const { ingestFile } = require("../services/ingestion.service");
const jobs = require("../jobs/ingestionJobs");
const sql = require("../config/db");

const { buildTimeline } = require("../services/timeline.service");
const { searchEvents } = require("../services/search.service");

async function ingestEvents(req, res) {

  const { filePath } = req.body;

  const jobId = `ingest-job-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  jobs[jobId] = {
    status: "PROCESSING",
    processedLines: 0,
    errorLines: 0,
    totalLines: 0,
    errors: [],
    startTime: null,
    endTime: null,
    fileMetadata: null
  };

  ingestFile(filePath, jobs[jobId], jobId);

  res.status(202).json({
    status: "Ingestion initiated",
    jobId,
    message: `Check /api/events/ingestion-status/${jobId} for updates.`
  });
}

async function ingestionStatus(req, res) {

  const jobId = req.params.jobId;

  const [row] = await sql`
    SELECT job_id, status, metadata
    FROM ingestion_jobs
    WHERE job_id = ${jobId}
  `;

  if (!row) {
    return res.status(404).json({ error: "Job not found" });
  }

  const meta = row.metadata || {};

  res.json({
    jobId: row.job_id,
    status: row.status,
    processedLines: meta.processedLines || 0,
    errorLines: meta.errorLines || 0,
    totalLines: meta.totalLines || 0,
    errors: (meta.errors || []).map(e =>
      `Line ${e.lineNumber}: ${e.error}: '${e.line}'`
    ),
    startTime: meta.startTime || null,
    endTime: meta.endTime || null
  });
}

async function getTimeline(req, res) {

  const { rootEventId } = req.params;

  try {
    const timeline = await buildTimeline(rootEventId);

    if (!timeline) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.json(timeline);
  } catch (err) {
    if (err.message.startsWith("Invalid rootEventId")) {
      return res.status(400).json({ error: err.message });
    }
    throw err;
  }
}

async function search(req, res) {

  const result = await searchEvents(req.query);

  res.json({
    totalEvents: result.totalEvents,
    page: result.page,
    limit: result.limit,
    events: result.events
  });
}

module.exports = {
  ingestEvents,
  ingestionStatus,
  getTimeline,
  searchEvents: search
};
