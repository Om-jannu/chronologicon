const fs = require("fs");
const path = require("path");
const readline = require("readline");

const sql = require("../config/db");
const { validateEvent } = require("../utils/validator");

const BATCH_SIZE = 10;

async function ingestFile(filePath, job, jobId) {

  const stat = fs.statSync(filePath);
  const fileName = path.basename(filePath);

  job.fileMetadata = {
    fileName,
    filePath,
    fileSize: stat.size,
    totalLines: 0
  };

  job.startTime = new Date().toISOString();

  // persist initial job row
  await sql`
    INSERT INTO ingestion_jobs (job_id, status, metadata)
    VALUES (
      ${jobId},
      'PROCESSING',
      ${sql.json({
        startTime: job.startTime,
        fileMetadata: job.fileMetadata
      })}
    )
  `;

  const stream = fs.createReadStream(filePath);

  const rl = readline.createInterface({
    input: stream,
    crlfDelay: Infinity
  });

  const validEvents = [];
  let lineNumber = 0;

  for await (const line of rl) {

    lineNumber++;

    // skip header
    if (lineNumber === 1) {
      continue;
    }

    try {

      const parts = line.split("|");

      const result = validateEvent(parts);

      if (!result.valid) {

        job.errorLines++;

        job.errors.push({
          lineNumber,
          line,
          error: result.error
        });

        continue;
      }

      const {
        eventId,
        eventName,
        startDate,
        endDate,
        parentId,
        researchValue,
        description
      } = result.data;

      const durationMinutes =
        Math.floor((endDate - startDate) / 60000);

      validEvents.push({
        event_id: eventId,
        event_name: eventName,

        start_date: startDate,
        end_date: endDate,

        duration_minutes: durationMinutes,

        parent_event_id: parentId,

        research_value: researchValue,
        description,

        metadata: {
          researchValue,
          description,
          sourceFile: fileName,
          fileSize: stat.size,
          lineNumber
        }
      });

    } catch (err) {

      job.errorLines++;

      job.errors.push({
        lineNumber,
        line,
        error: err.message
      });

    }

  }

  job.fileMetadata.totalLines = lineNumber - 1; // exclude header
  job.totalLines = lineNumber - 1;

  // persist state after file parsing (errors/totalLines available before insert phase)
  await sql`
    UPDATE ingestion_jobs
    SET
      metadata = ${sql.json({
        startTime: job.startTime,
        endTime: null,
        processedLines: job.processedLines,
        errorLines: job.errorLines,
        totalLines: job.totalLines,
        errors: job.errors,
        fileMetadata: job.fileMetadata
      })},
      updated_at = NOW()
    WHERE job_id = ${jobId}
  `;

  const sorted = topologicalSort(validEvents);

  await sql.begin(async (tx) => {

    for (let i = 0; i < sorted.length; i += BATCH_SIZE) {

      const batch = sorted.slice(i, i + BATCH_SIZE);

      await insertBatch(tx, batch);

      job.processedLines += batch.length;

    }

  });

  job.endTime = new Date().toISOString();
  job.status = "COMPLETED";

  // persist final job state
  await sql`
    UPDATE ingestion_jobs
    SET
      status = ${job.status},
      metadata = ${sql.json({
        startTime: job.startTime,
        endTime: job.endTime,
        processedLines: job.processedLines,
        errorLines: job.errorLines,
        totalLines: job.totalLines,
        errors: job.errors,
        fileMetadata: job.fileMetadata
      })},
      updated_at = NOW()
    WHERE job_id = ${jobId}
  `;

}

function topologicalSort(events) {

  const eventMap = new Map();
  for (const e of events) {
    eventMap.set(e.event_id, e);
  }

  const sorted = [];
  const visited = new Set();

  function visit(event) {
    if (visited.has(event.event_id)) return;
    visited.add(event.event_id);

    // if parent is in this batch, insert parent first
    if (event.parent_event_id && eventMap.has(event.parent_event_id)) {
      visit(eventMap.get(event.parent_event_id));
    }

    sorted.push(event);
  }

  for (const e of events) {
    visit(e);
  }

  return sorted;
}

async function insertBatch(tx, events) {

  await tx`
    INSERT INTO historical_events
    ${tx(events,
      "event_id",
      "event_name",
      "start_date",
      "end_date",
      "duration_minutes",
      "parent_event_id",
      "research_value",
      "description",
      "metadata"
    )}
    ON CONFLICT (event_id) DO NOTHING
  `;

}

module.exports = { ingestFile };