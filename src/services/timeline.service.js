const sql = require("../config/db");

async function buildTimeline(rootEventId) {

  const rows = await sql`

    WITH RECURSIVE timeline AS (

      SELECT
        event_id,
        event_name,
        start_date,
        end_date,
        duration_minutes,
        parent_event_id,
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
        t.depth + 1
      FROM historical_events e
      JOIN timeline t
      ON e.parent_event_id = t.event_id

    )

    SELECT * FROM timeline
    ORDER BY depth, start_date
  `;

  if (!rows.length) return null;

  const map = {};

  rows.forEach(r => {
    map[r.event_id] = {
      event_id: r.event_id,
      event_name: r.event_name,
      start_date: r.start_date,
      end_date: r.end_date,
      duration_minutes: r.duration_minutes,
      children: []
    };
  });

  let root = null;

  rows.forEach(r => {

    if (!r.parent_event_id) {
      root = map[r.event_id];
    } else if (map[r.parent_event_id]) {
      map[r.parent_event_id].children.push(map[r.event_id]);
    }

  });

  return root;
}

module.exports = { buildTimeline };