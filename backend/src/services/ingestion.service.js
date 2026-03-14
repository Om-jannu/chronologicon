const fs = require("fs");
const path = require("path");
const readline = require("readline");

const { validateEvent } = require("../utils/validator");
const eventsRepo = require("../repositories/events.repository");
const jobsRepo = require("../repositories/jobs.repository");

const BATCH_SIZE = 10;

async function ingestFile(filePath, job, jobId) {

  const stat = fs.statSync(filePath);
  const fileName = path.basename(filePath);

  job.fileMetadata = {
    fileName, filePath, fileSize: stat.size, totalLines: 0
  };
  job.startTime = new Date().toISOString();

  await jobsRepo.createJob(jobId, "PROCESSING", {
    startTime: job.startTime,
    fileMetadata: job.fileMetadata
  });

  const stream = fs.createReadStream(filePath);
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  const validEvents = [];
  let lineNumber = 0;

  for await (const line of rl) {
    lineNumber++;
    if (lineNumber === 1) continue;

    try {
      const parts = line.split("|");
      const result = validateEvent(parts);

      if (!result.valid) {
        job.errorLines++;
        job.errors.push({ lineNumber, line, error: result.error });
        continue;
      }

      const { eventId, eventName, startDate, endDate, parentId, researchValue, description } = result.data;
      const durationMinutes = Math.floor((endDate - startDate) / 60000);

      validEvents.push({
        event_id: eventId, event_name: eventName,
        start_date: startDate, end_date: endDate,
        duration_minutes: durationMinutes,
        parent_event_id: parentId,
        research_value: researchValue, description,
        metadata: { researchValue, description, sourceFile: fileName, fileSize: stat.size, lineNumber }
      });
    } catch (err) {
      job.errorLines++;
      job.errors.push({ lineNumber, line, error: err.message });
    }
  }

  job.fileMetadata.totalLines = lineNumber - 1;
  job.totalLines = lineNumber - 1;

  const jobMeta = () => ({
    startTime: job.startTime, endTime: job.endTime || null,
    processedLines: job.processedLines, errorLines: job.errorLines,
    totalLines: job.totalLines, errors: job.errors,
    fileMetadata: job.fileMetadata
  });

  await jobsRepo.updateJob(jobId, "PROCESSING", jobMeta());

  const sorted = topologicalSort(validEvents);

  await eventsRepo.beginTransaction(async (tx) => {
    for (let i = 0; i < sorted.length; i += BATCH_SIZE) {
      const batch = sorted.slice(i, i + BATCH_SIZE);
      await eventsRepo.insertBatchInTx(tx, batch);
      job.processedLines += batch.length;
    }
  });

  job.endTime = new Date().toISOString();
  job.status = "COMPLETED";
  await jobsRepo.updateJob(jobId, job.status, jobMeta());
}

function topologicalSort(events) {
  const eventMap = new Map();
  for (const e of events) eventMap.set(e.event_id, e);
  const sorted = [];
  const visited = new Set();
  function visit(event) {
    if (visited.has(event.event_id)) return;
    visited.add(event.event_id);
    if (event.parent_event_id && eventMap.has(event.parent_event_id)) {
      visit(eventMap.get(event.parent_event_id));
    }
    sorted.push(event);
  }
  for (const e of events) visit(e);
  return sorted;
}

module.exports = { ingestFile };
