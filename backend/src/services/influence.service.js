const { isUUID } = require("../utils/validator");
const eventsRepo = require("../repositories/events.repository");

async function findInfluencePath(sourceId, targetId) {
  if (!isUUID(sourceId) || !isUUID(targetId)) {
    return { sourceEventId: sourceId, targetEventId: targetId, shortestPath: [], totalDurationMinutes: 0, message: "Invalid sourceEventId or targetEventId. Must be valid UUIDs." };
  }

  if (sourceId === targetId) {
    const event = await eventsRepo.getEventBasic(sourceId);
    if (!event) return { sourceEventId: sourceId, targetEventId: targetId, shortestPath: [], totalDurationMinutes: 0, message: "Source event not found." };
    return {
      sourceEventId: sourceId, targetEventId: targetId,
      shortestPath: [{ event_id: event.event_id, event_name: event.event_name, duration_minutes: event.duration_minutes }],
      totalDurationMinutes: event.duration_minutes,
      message: "Source and target are the same event."
    };
  }

  const rows = await eventsRepo.getReachableComponent(sourceId);

  if (!rows.length) {
    return { sourceEventId: sourceId, targetEventId: targetId, shortestPath: [], totalDurationMinutes: 0, message: "Source event not found." };
  }

  const nodeMap = new Map();
  const adj = new Map();
  for (const r of rows) {
    nodeMap.set(r.event_id, r);
    if (!adj.has(r.event_id)) adj.set(r.event_id, []);
  }
  for (const r of rows) {
    if (r.parent_event_id && nodeMap.has(r.parent_event_id)) {
      adj.get(r.parent_event_id).push(r.event_id);
      adj.get(r.event_id).push(r.parent_event_id);
    }
  }

  if (!nodeMap.has(targetId)) {
    return { sourceEventId: sourceId, targetEventId: targetId, shortestPath: [], totalDurationMinutes: 0, message: "No temporal path found from source to target event." };
  }

  const dist = new Map();
  const prev = new Map();
  for (const id of nodeMap.keys()) dist.set(id, Infinity);
  dist.set(sourceId, nodeMap.get(sourceId).duration_minutes);
  const pq = [{ id: sourceId, cost: dist.get(sourceId) }];

  while (pq.length) {
    let minIdx = 0;
    for (let i = 1; i < pq.length; i++) {
      if (pq[i].cost < pq[minIdx].cost) minIdx = i;
    }
    const current = pq.splice(minIdx, 1)[0];
    if (current.id === targetId) break;
    if (current.cost > dist.get(current.id)) continue;

    for (const nId of (adj.get(current.id) || [])) {
      const nCost = current.cost + nodeMap.get(nId).duration_minutes;
      if (nCost < dist.get(nId)) {
        dist.set(nId, nCost);
        prev.set(nId, current.id);
        pq.push({ id: nId, cost: nCost });
      }
    }
  }

  if (dist.get(targetId) === Infinity) {
    return { sourceEventId: sourceId, targetEventId: targetId, shortestPath: [], totalDurationMinutes: 0, message: "No temporal path found from source to target event." };
  }

  const path = [];
  let cur = targetId;
  while (cur) {
    const node = nodeMap.get(cur);
    path.unshift({ event_id: node.event_id, event_name: node.event_name, duration_minutes: node.duration_minutes });
    cur = prev.get(cur) || null;
  }

  return {
    sourceEventId: sourceId, targetEventId: targetId,
    shortestPath: path, totalDurationMinutes: dist.get(targetId),
    message: "Shortest temporal path found from source to target event."
  };
}

module.exports = { findInfluencePath };
