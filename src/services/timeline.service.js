const sql = require("../config/db");
const { isUUID } = require("../utils/validator");

async function buildTimeline(rootEventId) {

  if (!isUUID(rootEventId)) {
    throw new Error("Invalid rootEventId: must be a valid UUID");
  }

  const rows = await sql`
    WITH RECURSIVE timeline AS (

      SELECT
        event_id,
        event_name,
        start_date,
        end_date,
        duration_minutes,
        parent_event_id,
        research_value,
        description,
        metadata,
        1 AS depth
      FROM historical_events
      WHERE event_id = ${rootEventId}

      UNION ALL

      SELECT
        e.event_id,
        e.event_name,
        e.start_date,
        e.end_date,
        e.duration_minutes,
        e.parent_event_id,
        e.research_value,
        e.description,
        e.metadata,
        t.depth + 1
      FROM historical_events e
      JOIN timeline t
        ON e.parent_event_id = t.event_id
    )
    SELECT * FROM timeline
    ORDER BY depth, start_date
  `;

  if (!rows.length) return null;

  const map = new Map();

  for (const r of rows) {
    map.set(r.event_id, {
      event_id: r.event_id,
      event_name: r.event_name,
      start_date: r.start_date,
      end_date: r.end_date,
      duration_minutes: r.duration_minutes,
      research_value: r.research_value,
      description: r.description,
      metadata: r.metadata,
      depth: r.depth,
      children: []
    });
  }

  // root is always the first row (the seed of the CTE)
  const root = map.get(rows[0].event_id);

  for (const r of rows) {
    if (r.event_id === rows[0].event_id) continue;
    const parent = map.get(r.parent_event_id);
    if (parent) {
      parent.children.push(map.get(r.event_id));
    }
  }

  return {
    totalEvents: rows.length,
    maxDepth: rows[rows.length - 1].depth,
    timeline: root
  };
}

module.exports = { buildTimeline };
