const sql = require("../config/db");

async function insertEvent(event) {
  await sql`
    INSERT INTO historical_events
    (event_id, event_name, description, start_date, end_date,
     duration_minutes, parent_event_id)
    VALUES
    (${event.event_id}, ${event.event_name}, ${event.description},
     ${event.start_date}, ${event.end_date}, ${event.duration_minutes},
     ${event.parent_event_id})
  `;
}

async function insertBatchInTx(tx, events) {
  await tx`
    INSERT INTO historical_events
    ${tx(events,
      "event_id", "event_name", "start_date", "end_date",
      "duration_minutes", "parent_event_id", "research_value",
      "description", "metadata"
    )}
    ON CONFLICT (event_id) DO NOTHING
  `;
}

async function beginTransaction(fn) {
  return sql.begin(fn);
}

async function getEvent(eventId) {
  const result = await sql`
    SELECT * FROM historical_events WHERE event_id = ${eventId}
  `;
  return result[0];
}

async function getChildren(parentId) {
  return await sql`
    SELECT * FROM historical_events
    WHERE parent_event_id = ${parentId}
    ORDER BY start_date
  `;
}

async function getTimelineTree(rootEventId) {
  return await sql`
    WITH RECURSIVE timeline AS (
      SELECT event_id, event_name, start_date, end_date,
        duration_minutes, parent_event_id, research_value,
        description, metadata, 1 AS depth
      FROM historical_events
      WHERE event_id = ${rootEventId}
      UNION ALL
      SELECT e.event_id, e.event_name, e.start_date, e.end_date,
        e.duration_minutes, e.parent_event_id, e.research_value,
        e.description, e.metadata, t.depth + 1
      FROM historical_events e
      JOIN timeline t ON e.parent_event_id = t.event_id
    )
    SELECT * FROM timeline ORDER BY depth, start_date
  `;
}

async function searchEvents(whereClause, sortCol, dir, limit, offset) {
  const [{ count: totalEvents }] = await sql`
    SELECT COUNT(*)::int AS count
    FROM historical_events ${whereClause}
  `;
  const events = await sql`
    SELECT event_id, event_name
    FROM historical_events ${whereClause}
    ORDER BY ${sql(sortCol)} ${dir}
    LIMIT ${limit} OFFSET ${offset}
  `;
  return { events, totalEvents };
}

async function findOverlappingPairs(dateFilter) {
  return await sql`
    SELECT
      e1.event_id AS event1_id, e1.event_name AS event1_name,
      e1.start_date AS event1_start, e1.end_date AS event1_end,
      e2.event_id AS event2_id, e2.event_name AS event2_name,
      e2.start_date AS event2_start, e2.end_date AS event2_end,
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
}

async function getEventsInRange(start, end) {
  return await sql`
    SELECT event_id, event_name, start_date, end_date
    FROM historical_events
    WHERE start_date < ${end} AND end_date > ${start}
    ORDER BY start_date, end_date
  `;
}

async function getReachableComponent(sourceId) {
  return await sql`
    WITH RECURSIVE reachable AS (
      SELECT event_id, event_name, duration_minutes, parent_event_id
      FROM historical_events WHERE event_id = ${sourceId}
      UNION
      SELECT e.event_id, e.event_name, e.duration_minutes, e.parent_event_id
      FROM historical_events e
      JOIN reachable r ON e.parent_event_id = r.event_id
        OR e.event_id = r.parent_event_id
    )
    SELECT * FROM reachable
  `;
}

async function getEventBasic(eventId) {
  const [event] = await sql`
    SELECT event_id, event_name, duration_minutes
    FROM historical_events WHERE event_id = ${eventId}
  `;
  return event;
}

function buildWhereFragment(fragment) {
  return sql`WHERE ${fragment}`;
}

function buildCondition(column, op, value) {
  if (op === "ilike") return sql`event_name ILIKE ${value}`;
  if (op === "gt") return sql`start_date > ${value}`;
  if (op === "lt") return sql`end_date < ${value}`;
  if (op === "gte_rv") return sql`research_value >= ${value}`;
  if (op === "lte_rv") return sql`research_value <= ${value}`;
  if (op === "eq_parent") return sql`parent_event_id = ${value}`;
  return sql``;
}

function andConditions(conditions) {
  if (!conditions.length) return sql``;
  return sql`WHERE ${conditions.reduce((acc, c, i) => i === 0 ? c : sql`${acc} AND ${c}`)}`;
}

function sortDirection(order) {
  return order === "desc" ? sql`DESC` : sql`ASC`;
}

function buildOverlapDateFilter(startDate, endDate) {
  const conditions = [];
  if (startDate) {
    const d = new Date(startDate);
    if (!isNaN(d)) conditions.push(sql`e1.start_date >= ${d}`);
  }
  if (endDate) {
    const d = new Date(endDate);
    if (!isNaN(d)) conditions.push(sql`e1.end_date <= ${d}`);
  }
  return conditions.length
    ? conditions.reduce((acc, c) => sql`${acc} AND ${c}`)
    : null;
}

module.exports = {
  insertEvent,
  insertBatchInTx,
  beginTransaction,
  getEvent,
  getEventBasic,
  getChildren,
  getTimelineTree,
  searchEvents,
  findOverlappingPairs,
  getEventsInRange,
  getReachableComponent,
  buildCondition,
  andConditions,
  sortDirection,
  buildOverlapDateFilter
};
