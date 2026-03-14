const eventsRepo = require("../repositories/events.repository");

async function getOverlappingEvents(startDate, endDate) {
  const dateFilter = eventsRepo.buildOverlapDateFilter(startDate, endDate);
  const rows = await eventsRepo.findOverlappingPairs(dateFilter);

  return rows.map(r => ({
    overlappingEventPairs: [
      { event_id: r.event1_id, event_name: r.event1_name, start_date: r.event1_start, end_date: r.event1_end },
      { event_id: r.event2_id, event_name: r.event2_name, start_date: r.event2_start, end_date: r.event2_end }
    ],
    overlap_duration_minutes: r.overlap_duration_minutes
  }));
}

module.exports = { getOverlappingEvents };
