const fs = require("fs");
const readline = require("readline");

const sql = require("../config/db");
const { validateEvent } = require("../utils/validator");

const BATCH_SIZE = 10;

async function ingestFile(filePath, job) {

  const stream = fs.createReadStream(filePath);

  const rl = readline.createInterface({
    input: stream,
    crlfDelay: Infinity
  });

  const validEvents = [];
  let isFirstLine = true;

  for await (const line of rl) {

    if (isFirstLine) {
      isFirstLine = false;
      continue;
    }

    try {

      const parts = line.split("|");

      const result = validateEvent(parts);

      if (!result.valid) {

        job.errorLines++;

        job.errors.push({
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
          description
        }
      });

    } catch (err) {

      job.errorLines++;

      job.errors.push({
        line,
        error: err.message
      });

    }

  }

  const sorted = topologicalSort(validEvents);

  await sql.begin(async (tx) => {

    for (let i = 0; i < sorted.length; i += BATCH_SIZE) {

      const batch = sorted.slice(i, i + BATCH_SIZE);

      await insertBatch(tx, batch);

      job.processedLines += batch.length;

    }

  });

  job.status = "COMPLETED";

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