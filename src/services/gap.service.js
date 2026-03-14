const sql = require("../config/db");

async function findLargestGap(startDate, endDate) {

  const events = await sql`
    SELECT *
    FROM historical_events
    WHERE start_date >= ${startDate}
    AND end_date <= ${endDate}
    ORDER BY start_date
  `;

  if (events.length < 2) {
    return {
      largestGap: null,
      message: "Too few events"
    };
  }

  let maxGap = 0;
  let gapResult = null;

  for (let i = 0; i < events.length - 1; i++) {

    const end = new Date(events[i].end_date);
    const nextStart = new Date(events[i + 1].start_date);

    const gap = nextStart - end;

    if (gap > maxGap) {

      maxGap = gap;

      gapResult = {
        startOfGap: end,
        endOfGap: nextStart,
        durationMinutes: gap / 60000
      };

    }
  }

  return {
    largestGap: gapResult,
    message: "Largest gap found"
  };
}

module.exports = { findLargestGap };