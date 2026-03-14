const eventsRepo = require("../repositories/events.repository");

const MIN_GAP_MINUTES = 1;

async function findLargestGap(startDate, endDate) {
  if (!startDate || !endDate) {
    return { largestGap: null, message: "Both startDate and endDate are required." };
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start) || isNaN(end) || end <= start) {
    return { largestGap: null, message: "Invalid date range." };
  }

  const events = await eventsRepo.getEventsInRange(start, end);

  if (events.length < 2) {
    return { largestGap: null, message: "No significant temporal gaps found within the specified range, or too few events." };
  }

  let watermark = new Date(events[0].end_date);
  let maxGap = 0;
  let gapResult = null;
  let precedingIdx = 0;

  for (let i = 1; i < events.length; i++) {
    const nextStart = new Date(events[i].start_date);
    const gap = nextStart - watermark;

    if (gap > maxGap) {
      maxGap = gap;
      precedingIdx = i - 1;
      for (let j = i - 1; j >= 0; j--) {
        if (new Date(events[j].end_date).getTime() === watermark.getTime()) {
          precedingIdx = j;
          break;
        }
      }
      gapResult = {
        startOfGap: watermark, endOfGap: nextStart,
        durationMinutes: Math.floor(gap / 60000),
        precedingEvent: { event_id: events[precedingIdx].event_id, event_name: events[precedingIdx].event_name, end_date: events[precedingIdx].end_date },
        succeedingEvent: { event_id: events[i].event_id, event_name: events[i].event_name, start_date: events[i].start_date }
      };
    }
    const thisEnd = new Date(events[i].end_date);
    if (thisEnd > watermark) watermark = thisEnd;
  }

  if (!gapResult || gapResult.durationMinutes < MIN_GAP_MINUTES) {
    return { largestGap: null, message: "No significant temporal gaps found within the specified range, or too few events." };
  }

  return { largestGap: gapResult, message: "Largest temporal gap identified." };
}

module.exports = { findLargestGap };
