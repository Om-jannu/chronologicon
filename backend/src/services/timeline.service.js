const { isUUID } = require("../utils/validator");
const eventsRepo = require("../repositories/events.repository");

async function buildTimeline(rootEventId) {

  if (!isUUID(rootEventId)) {
    throw new Error("Invalid rootEventId: must be a valid UUID");
  }

  const rows = await eventsRepo.getTimelineTree(rootEventId);

  if (!rows.length) return null;

  const map = new Map();

  for (const r of rows) {
    map.set(r.event_id, {
      event_id: r.event_id, event_name: r.event_name,
      start_date: r.start_date, end_date: r.end_date,
      duration_minutes: r.duration_minutes,
      research_value: r.research_value,
      description: r.description, metadata: r.metadata,
      depth: r.depth, children: []
    });
  }

  const root = map.get(rows[0].event_id);

  for (const r of rows) {
    if (r.event_id === rows[0].event_id) continue;
    const parent = map.get(r.parent_event_id);
    if (parent) parent.children.push(map.get(r.event_id));
  }

  return {
    totalEvents: rows.length,
    maxDepth: rows[rows.length - 1].depth,
    timeline: root
  };
}

module.exports = { buildTimeline };
