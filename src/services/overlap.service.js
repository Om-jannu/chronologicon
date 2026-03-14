const sql = require("../config/db");

async function getOverlappingEvents() {

  const rows = await sql`
    SELECT
      e1.event_id AS event1_id,
      e1.event_name AS event1_name,
      e1.start_date AS event1_start,
      e1.end_date AS event1_end,

      e2.event_id AS event2_id,
      e2.event_name AS event2_name,
      e2.start_date AS event2_start,
      e2.end_date AS event2_end

    FROM historical_events e1
    JOIN historical_events e2
    ON e1.event_id < e2.event_id
    AND e1.start_date < e2.end_date
    AND e1.end_date > e2.start_date
  `;

  return rows;
}

module.exports = { getOverlappingEvents };