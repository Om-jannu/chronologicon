const eventsRepo = require("../repositories/events.repository");

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 10;
const ALLOWED_SORTS = ["start_date", "end_date", "event_name", "research_value", "duration_minutes"];

async function searchEvents(filters) {
  const {
    name, start_date_after, end_date_before,
    min_research_value, max_research_value,
    parent_event_id, sort_by = "start_date", sort_order = "asc"
  } = filters;

  let limit = parseInt(filters.limit, 10);
  let page = parseInt(filters.page, 10);
  if (isNaN(limit) || limit < 1) limit = DEFAULT_LIMIT;
  if (limit > MAX_LIMIT) limit = MAX_LIMIT;
  if (isNaN(page) || page < 1) page = 1;
  const offset = (page - 1) * limit;

  const conditions = [];

  if (name) conditions.push(eventsRepo.buildCondition("event_name", "ilike", "%" + name + "%"));
  
  if (start_date_after) {
    const d = new Date(start_date_after);
    if (!isNaN(d)) conditions.push(eventsRepo.buildCondition("start_date", "gt", d));
  }

  if (end_date_before) {
    const d = new Date(end_date_before);
    if (!isNaN(d)) conditions.push(eventsRepo.buildCondition("end_date", "lt", d));
  }

  if (min_research_value != null) {
    const v = parseInt(min_research_value, 10);
    if (!isNaN(v)) conditions.push(eventsRepo.buildCondition("research_value", "gte_rv", v));
  }

  if (max_research_value != null) {
    const v = parseInt(max_research_value, 10);
    if (!isNaN(v)) conditions.push(eventsRepo.buildCondition("research_value", "lte_rv", v));
  }
  
  if (parent_event_id) conditions.push(eventsRepo.buildCondition("parent_event_id", "eq_parent", parent_event_id));

  const whereClause = eventsRepo.andConditions(conditions);
  const sortCol = ALLOWED_SORTS.includes(sort_by) ? sort_by : "start_date";
  const dir = eventsRepo.sortDirection(sort_order.toLowerCase());

  const { events, totalEvents } = await eventsRepo.searchEvents(whereClause, sortCol, dir, limit, offset);
  return { events, totalEvents, page, limit };
}

module.exports = { searchEvents };
