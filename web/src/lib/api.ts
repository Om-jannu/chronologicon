const BASE = "/api";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, init);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

export const api = {
  searchEvents: (params: Record<string, string>) =>
    request<{
      totalEvents: number;
      page: number;
      limit: number;
      events: { event_id: string; event_name: string }[];
    }>(`/events/search?${new URLSearchParams(params)}`),

  getTimeline: (rootEventId: string) =>
    request<{
      totalEvents: number;
      maxDepth: number;
      timeline: TimelineNode;
    }>(`/events/timeline/${rootEventId}`),

  getOverlaps: (params: Record<string, string>) =>
    request<OverlapResult[]>(
      `/insights/overlapping-events?${new URLSearchParams(params)}`
    ),

  getTemporalGaps: (params: Record<string, string>) =>
    request<GapResult>(
      `/insights/temporal-gaps?${new URLSearchParams(params)}`
    ),

  getInfluence: (sourceEventId: string, targetEventId: string) =>
    request<InfluenceResult>(
      `/insights/event-influence?${new URLSearchParams({ sourceEventId, targetEventId })}`
    ),

  ingest: (filePath: string) =>
    request<{ jobId: string }>(
      `/events/ingest`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filePath }),
      }
    ),

  getJobStatus: (jobId: string) =>
    request<JobStatus>(`/events/ingestion-status/${jobId}`),
};

export type TimelineNode = {
  event_id: string;
  event_name: string;
  start_date: string;
  end_date: string;
  duration_minutes: number;
  depth: number;
  children: TimelineNode[];
};

export type OverlapResult = {
  overlappingEventPairs: {
    event_id: string;
    event_name: string;
    start_date: string;
    end_date: string;
  }[];
  overlap_duration_minutes: number;
};

export type GapResult = {
  largestGap: {
    startOfGap: string;
    endOfGap: string;
    durationMinutes: number;
    precedingEvent: { event_id: string; event_name: string; end_date: string };
    succeedingEvent: { event_id: string; event_name: string; start_date: string };
  } | null;
  message: string;
};

export type InfluenceResult = {
  sourceEventId: string;
  targetEventId: string;
  shortestPath: { event_id: string; event_name: string; duration_minutes: number }[];
  totalDurationMinutes: number;
  message: string;
};

export type JobStatus = {
  jobId: string;
  status: string;
  processedLines: number;
  errorLines: number;
  totalLines: number;
  errors: string[];
  startTime: string | null;
  endTime: string | null;
};
