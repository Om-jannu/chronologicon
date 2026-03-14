const sql = require("../config/db");

async function getOverlappingEvents(startDate, endDate) {

  const conditions = [];

  if (startDate) {
    const d = new Date(startDate);
    if (!isNaN(d)) conditions.push(sql`e1.start_date >= ${d}`);
  }

  if (endDate) {
    const d = new Date(endDate);
    if (!isNaN(d)) conditions.push(sql`e1.end_date <= ${d}`);
  }

  const dateFilter = conditions.length
    ? conditions.reduce((acc, c) => sql`${acc} AND ${c}`)
    : null;

  const rows = await sql`
    SELECT
      e1.event_id   AS event1_id,
      e1.event_name AS event1_name,
      e1.start_date AS event1_start,
      e1.end_date   AS event1_end,

      e2.event_id   AS event2_id,
      e2.event_name AS event2_name,
      e2.start_date AS event2_start,
      e2.end_date   AS event2_end,

      EXTRACT(EPOCH FROM (
        LEAST(e1.end_date, e2.end_date) -
        GREATEST(e1.start_date, e2.start_date)
      ))::int / 60 AS overlap_duration_minutes

    FROM historical_events e1
    JOIN historical_events e2
      ON e1.event_id < e2.event_id
      AND e1.start_date < e2.end_date
      AND e1.end_date > e2.start_date
    ${dateFilter ? sql`WHERE ${dateFilter}` : sql``}
    ORDER BY overlap_duration_minutes DESC
  `;

  return rows.map(r => ({
    overlappingEventPairs: [
      {
        event_id: r.event1_id,
        event_name: r.event1_name,
        start_date: r.event1_start,
        end_date: r.event1_end
      },
      {
        event_id: r.event2_id,
        event_name: r.event2_name,
        start_date: r.event2_start,
        end_date: r.event2_end
      }
    ],
    overlap_duration_minutes: r.overlap_duration_minutes
  }));
}

module.exports = { getOverlappingEvents };
