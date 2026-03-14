const sql = require("../config/db");

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 10;

async function searchEvents(filters) {

  const {
    name,
    start_date_after,
    end_date_before,
    min_research_value,
    max_research_value,
    parent_event_id,
    sort_by = "start_date",
    sort_order = "asc"
  } = filters;

  let limit = parseInt(filters.limit, 10);
  let page = parseInt(filters.page, 10);

  if (isNaN(limit) || limit < 1) limit = DEFAULT_LIMIT;
  if (limit > MAX_LIMIT) limit = MAX_LIMIT;
  if (isNaN(page) || page < 1) page = 1;

  const offset = (page - 1) * limit;

  const conditions = [];

  if (name) {
    conditions.push(sql`event_name ILIKE ${"%" + name + "%"}`);
  }

  if (start_date_after) {
    const d = new Date(start_date_after);
    if (!isNaN(d)) conditions.push(sql`start_date > ${d}`);
  }

  if (end_date_before) {
    const d = new Date(end_date_before);
    if (!isNaN(d)) conditions.push(sql`end_date < ${d}`);
  }

  if (min_research_value != null) {
    const v = parseInt(min_research_value, 10);
    if (!isNaN(v)) conditions.push(sql`research_value >= ${v}`);
  }

  if (max_research_value != null) {
    const v = parseInt(max_research_value, 10);
    if (!isNaN(v)) conditions.push(sql`research_value <= ${v}`);
  }

  if (parent_event_id) {
    conditions.push(sql`parent_event_id = ${parent_event_id}`);
  }

  const whereClause =
    conditions.length
      ? sql`WHERE ${conditions.reduce((acc, c, i) => i === 0 ? c : sql`${acc} AND ${c}`)}`
      : sql``;

  const allowedSorts = ["start_date", "end_date", "event_name", "research_value", "duration_minutes"];
  const sortCol = allowedSorts.includes(sort_by) ? sort_by : "start_date";
  const dir = sort_order.toLowerCase() === "desc" ? sql`DESC` : sql`ASC`;

  const [{ count: totalEvents }] = await sql`
    SELECT COUNT(*)::int AS count
    FROM historical_events
    ${whereClause}
  `;

  const events = await sql`
    SELECT event_id, event_name
    FROM historical_events
    ${whereClause}
    ORDER BY ${sql(sortCol)} ${dir}
    LIMIT ${limit}
    OFFSET ${offset}
  `;

  return { events, totalEvents, page, limit };
}

module.exports = { searchEvents };
