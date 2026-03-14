const sql = require("../config/db");

async function findInfluencePath(sourceId, targetId) {

  const rows = await sql`
    SELECT
      event_id,
      parent_event_id,
      duration_minutes,
      event_name
    FROM historical_events
  `;

  const graph = {};

  rows.forEach(e => {

    if (!graph[e.parent_event_id]) {
      graph[e.parent_event_id] = [];
    }

    graph[e.parent_event_id].push(e);

  });

  const distances = {};
  const prev = {};
  const pq = [];

  rows.forEach(e => {
    distances[e.event_id] = Infinity;
  });

  distances[sourceId] = 0;

  pq.push({
    id: sourceId,
    cost: 0
  });

  while (pq.length) {

    pq.sort((a, b) => a.cost - b.cost);

    const current = pq.shift();

    if (current.id === targetId) break;

    const neighbors = graph[current.id] || [];

    for (const n of neighbors) {

      const newCost =
        distances[current.id] + n.duration_minutes;

      if (newCost < distances[n.event_id]) {

        distances[n.event_id] = newCost;

        prev[n.event_id] = current.id;

        pq.push({
          id: n.event_id,
          cost: newCost
        });

      }

    }

  }

  if (!distances[targetId]) {
    return { message: "No influence path found" };
  }

  const path = [];

  let cur = targetId;

  while (cur) {

    path.unshift(cur);

    cur = prev[cur];

  }

  return {
    sourceEventId: sourceId,
    targetEventId: targetId,
    shortestPath: path,
    totalDurationMinutes: distances[targetId]
  };
}

module.exports = { findInfluencePath };