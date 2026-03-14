const sql = require("../config/db");

async function insertEvent(event) {

  await sql`
    INSERT INTO historical_events
    (
      event_id,
      event_name,
      description,
      start_date,
      end_date,
      duration_minutes,
      parent_event_id
    )
    VALUES
    (
      ${event.event_id},
      ${event.event_name},
      ${event.description},
      ${event.start_date},
      ${event.end_date},
      ${event.duration_minutes},
      ${event.parent_event_id}
    )
  `;
}

async function getEvent(eventId) {

  const result = await sql`
    SELECT *
    FROM historical_events
    WHERE event_id = ${eventId}
  `;

  return result[0];
}

async function getChildren(parentId) {

  return await sql`
    SELECT *
    FROM historical_events
    WHERE parent_event_id = ${parentId}
    ORDER BY start_date
  `;
}

module.exports = {
  insertEvent,
  getEvent,
  getChildren
};