const eventsRepo = require("../repositories/events.repository");

async function getOverlappingEvents(startDate, endDate) {
  const dateFilter = eventsRepo.buildOverlapDateFilter(startDate, endDate);
  const rows = await eventsRepo.findOverlappingPairs(dateFilter);

  const results = rows.map(r => {
    const overlapStart = Math.max(
      new Date(r.event1_start).getTime(),
      new Date(r.event2_start).getTime()
    );
    const overlapEnd = Math.min(
      new Date(r.event1_end).getTime(),
      new Date(r.event2_end).getTime()
    );
    const overlapMinutes = Math.floor((overlapEnd - overlapStart) / 60000);

    return {
      overlappingEventPairs: [
        { event_id: r.event1_id, event_name: r.event1_name,
          start_date: r.event1_start, end_date: r.event1_end },
        { event_id: r.event2_id, event_name: r.event2_name,
          start_date: r.event2_start, end_date: r.event2_end }
      ],
      overlap_duration_minutes: overlapMinutes
    };
  });

  // Sort by overlap duration descending (was ORDER BY in SQL)
  results.sort((a, b) => b.overlap_duration_minutes - a.overlap_duration_minutes);

  return results;
}

module.exports = { getOverlappingEvents };
