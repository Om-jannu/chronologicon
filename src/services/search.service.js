const sql = require("../config/db");

async function searchEvents(filters) {

  const {
    name,
    start_date_after,
    end_date_before,
    limit = 10,
    page = 1
  } = filters;

  const offset = (page - 1) * limit;

  const conditions = [];

  if (name) {
    conditions.push(sql`event_name ILIKE ${"%" + name + "%"}`);
  }

  if (start_date_after) {
    conditions.push(sql`start_date > ${start_date_after}`);
  }

  if (end_date_before) {
    conditions.push(sql`end_date < ${end_date_before}`);
  }

  const whereClause =
    conditions.length
      ? sql`WHERE ${sql.join(conditions, sql` AND `)}`
      : sql``;

  return await sql`
    SELECT event_id, event_name
    FROM historical_events
    ${whereClause}
    LIMIT ${limit}
    OFFSET ${offset}
  `;
}

module.exports = { searchEvents };