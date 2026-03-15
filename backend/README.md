# Kelp Historical Events API

A Node.js + Express REST API for ingesting, querying, and analyzing historical event data stored in PostgreSQL. 

---

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure the Database

Create a PostgreSQL database named `kelp`:

```sql
CREATE DATABASE kelp;
```

Run the schema DDL to create tables and indexes:

```bash
psql -d kelp -f src/sql/schema.sql
```

### 3. Configure Environment

Edit `backend/.env` (or `src/config/db.js`) to match your local PostgreSQL credentials:

```
PORT=3000
```

> **Note:** The current `src/config/db.js` uses hardcoded connection parameters. Update the `host`, `port`, `database`, and `username` fields to match your environment.

### 4. Run the Application

```bash
# Development (auto-reload with nodemon)
npm run dev

# Production
npm start
```

The server starts on `http://localhost:3000`.

---

## API Documentation

Base URL: `http://localhost:3000`

### Events Endpoints

All event routes are prefixed with `/api/events`.

---

#### POST /api/events/ingest

Starts an asynchronous ingestion job from a pipe-delimited file on disk.

**Request Body:**

```json
{
  "filePath": "/absolute/path/to/kelp-sample-data.csv"
}
```

**Response (202 Accepted):**

```json
{
  "status": "Ingestion initiated",
  "jobId": "ingest-job-1718000000000-x7k2m",
  "message": "Check /api/events/ingestion-status/ingest-job-1718000000000-x7k2m for updates."
}
```

**Example:**

```bash
curl -X POST http://localhost:3000/api/events/ingest \
  -H "Content-Type: application/json" \
  -d '{"filePath": "/Users/you/backend/kelp-sample-data.csv"}'
```

---

#### GET /api/events/ingestion-status/:jobId

Polls the status of an ingestion job.

**Response (200):**

```json
{
  "jobId": "ingest-job-1718000000000-x7k2m",
  "status": "COMPLETED",
  "processedLines": 25,
  "errorLines": 5,
  "totalLines": 30,
  "errors": [
    "Line 6: Invalid eventId UUID: 'malformed-id-1|Broken Event|...'"
  ],
  "startTime": "2025-06-10T12:00:00.000Z",
  "endTime": "2025-06-10T12:00:01.500Z"
}
```

**Example:**

```bash
curl http://localhost:3000/api/events/ingestion-status/ingest-job-1718000000000-x7k2m
```

---

#### GET /api/events/search

Search and filter events with pagination and sorting.

**Query Parameters:**

| Parameter            | Type   | Description                                |
|----------------------|--------|--------------------------------------------|
| `name`               | string | Partial match on event name (case-insensitive) |
| `start_date_after`   | string | ISO 8601 date — events starting after this |
| `end_date_before`    | string | ISO 8601 date — events ending before this  |
| `min_research_value` | int    | Minimum research value                     |
| `max_research_value` | int    | Maximum research value                     |
| `parent_event_id`    | UUID   | Filter by parent event                     |
| `sort_by`            | string | One of: `start_date`, `end_date`, `event_name`, `research_value`, `duration_minutes` |
| `sort_order`         | string | `asc` or `desc` (default: `asc`)           |
| `page`               | int    | Page number (default: 1)                   |
| `limit`              | int    | Results per page (default: 10, max: 100)   |

**Response (200):**

```json
{
  "totalEvents": 25,
  "page": 1,
  "limit": 10,
  "events": [
    { "event_id": "a1b2c3d4-...", "event_name": "Founding of ArchaeoData" }
  ]
}
```

**Example:**

```bash
curl "http://localhost:3000/api/events/search?name=Alpha&sort_by=start_date&sort_order=asc&page=1&limit=5"
```

---

#### GET /api/events/timeline/:rootEventId

Returns a hierarchical timeline tree rooted at the given event, built via a recursive CTE.

**Response (200):**

```json
{
  "totalEvents": 4,
  "maxDepth": 3,
  "timeline": {
    "event_id": "a1b2c3d4-...",
    "event_name": "Founding of ArchaeoData",
    "start_date": "2023-01-01T10:00:00Z",
    "end_date": "2023-01-01T11:30:00Z",
    "duration_minutes": 90,
    "research_value": 8,
    "description": "Initial establishment...",
    "metadata": {},
    "depth": 1,
    "children": [
      {
        "event_id": "c8d7e6f5-...",
        "event_name": "Pilot Project Alpha",
        "depth": 2,
        "children": [...]
      }
    ]
  }
}
```

**Example:**

```bash
curl http://localhost:3000/api/events/timeline/a1b2c3d4-e5f6-7890-1234-567890abcdef
```

---

### Insights Endpoints

All insight routes are prefixed with `/api/insights`.

---

#### GET /api/insights/overlapping-events

Finds all pairs of events whose time ranges overlap, optionally filtered by a date window.

**Query Parameters:**

| Parameter   | Type   | Description                          |
|-------------|--------|--------------------------------------|
| `startDate` | string | ISO 8601 — only events starting after this |
| `endDate`   | string | ISO 8601 — only events ending before this  |

**Response (200):**

```json
[
  {
    "overlappingEventPairs": [
      { "event_id": "6a7b8c9d-...", "event_name": "Team Brainstorm Session", "start_date": "...", "end_date": "..." },
      { "event_id": "01234567-...", "event_name": "System Upgrade", "start_date": "...", "end_date": "..." }
    ],
    "overlap_duration_minutes": 30
  }
]
```

**Example:**

```bash
curl "http://localhost:3000/api/insights/overlapping-events?startDate=2023-01-01T00:00:00Z&endDate=2023-02-01T00:00:00Z"
```

---

#### GET /api/insights/temporal-gaps

Finds the largest temporal gap (period with no events) within a date range.

**Query Parameters:**

| Parameter   | Type   | Required | Description          |
|-------------|--------|----------|----------------------|
| `startDate` | string | Yes      | ISO 8601 range start |
| `endDate`   | string | Yes      | ISO 8601 range end   |

**Response (200):**

```json
{
  "largestGap": {
    "startOfGap": "2023-01-06T13:00:00.000Z",
    "endOfGap": "2023-01-06T13:30:00.000Z",
    "durationMinutes": 30,
    "precedingEvent": { "event_id": "...", "event_name": "Security Audit", "end_date": "..." },
    "succeedingEvent": { "event_id": "...", "event_name": "Post-Audit Meeting", "start_date": "..." }
  },
  "message": "Largest temporal gap identified."
}
```

**Example:**

```bash
curl "http://localhost:3000/api/insights/temporal-gaps?startDate=2023-01-06T00:00:00Z&endDate=2023-01-07T00:00:00Z"
```

---

#### GET /api/insights/event-influence

Computes the shortest influence path between two events through the parent-child hierarchy, using Dijkstra's algorithm weighted by `duration_minutes`.

**Query Parameters:**

| Parameter       | Type | Required | Description       |
|-----------------|------|----------|-------------------|
| `sourceEventId` | UUID | Yes      | Starting event ID |
| `targetEventId` | UUID | Yes      | Target event ID   |

**Response (200):**

```json
{
  "sourceEventId": "d1e2f3a4-...",
  "targetEventId": "c6d7e8f9-...",
  "shortestPath": [
    { "event_id": "d1e2f3a4-...", "event_name": "Project Gaia Initiation", "duration_minutes": 60 },
    { "event_id": "a4b5c6d7-...", "event_name": "Algorithm Development", "duration_minutes": 480 },
    { "event_id": "b5c6d7e8-...", "event_name": "Model Training", "duration_minutes": 960 },
    { "event_id": "c6d7e8f9-...", "event_name": "Deployment Planning", "duration_minutes": 180 }
  ],
  "totalDurationMinutes": 1680,
  "message": "Shortest temporal path found from source to target event."
}
```

**Example:**

```bash
curl "http://localhost:3000/api/insights/event-influence?sourceEventId=d1e2f3a4-b5c6-7d8e-9f0a-1b2c3d4e5f6a&targetEventId=c6d7e8f9-a0b1-c2d3-e4f5-a6b7c8d9e0f1"
```

---

## Database Schema

See [`src/sql/schema.sql`](src/sql/schema.sql) for the full DDL.

### historical_events

| Column            | Type        | Notes                                      |
|-------------------|-------------|--------------------------------------------|
| `event_id`        | UUID (PK)   | Unique identifier                          |
| `event_name`      | TEXT        | Required                                    |
| `start_date`      | TIMESTAMPTZ | Required                                   |
| `end_date`        | TIMESTAMPTZ | Required                                   |
| `duration_minutes`| INT         | Computed at ingestion time                 |
| `parent_event_id` | UUID (FK)   | Self-referencing, nullable, `ON DELETE SET NULL` |
| `research_value`  | INT         | Numeric importance score                   |
| `description`     | TEXT        | Free-text description                      |
| `metadata`        | JSONB       | Flexible storage for source info, etc.     |
| `created_at`      | TIMESTAMP   | Auto-set on insert                         |

### ingestion_jobs

| Column       | Type        | Notes                          |
|--------------|-------------|--------------------------------|
| `job_id`     | TEXT (PK)   | Generated at ingestion start   |
| `status`     | TEXT        | `PROCESSING` or `COMPLETED`    |
| `metadata`   | JSONB       | Progress, errors, file info    |
| `created_at` | TIMESTAMPTZ | Auto-set                       |
| `updated_at` | TIMESTAMPTZ | Updated on each status change  |

### Indexes

- `idx_parent_event` — B-tree on `parent_event_id` for fast hierarchy traversal
- `idx_start_date` — B-tree on `start_date` for range queries and sorting
- `idx_end_date` — B-tree on `end_date` for range queries
- `idx_metadata` — GIN on `metadata` for JSONB containment queries

The `fk_parent_event` constraint is `DEFERRABLE INITIALLY DEFERRED` so that batch inserts within a transaction can reference parent rows that haven't been committed yet.

---

## Design Choices

### Architecture: Layered Separation of Concerns

```
routes → controllers → services → repositories → PostgreSQL
```

- **Routes** define HTTP endpoints and wire them to controllers.
- **Controllers** handle request/response parsing — no business logic.
- **Services** contain all business logic (sorting, gap computation, BFS/Dijkstra).
- **Repositories** encapsulate all SQL queries using the `postgres` tagged-template library, keeping raw SQL out of the service layer.

### Asynchronous Ingestion with Job Tracking

Ingestion is fire-and-forget from the client's perspective. The `POST /ingest` endpoint returns `202 Accepted` immediately with a `jobId`. The actual file parsing, validation, and database insertion happen asynchronously. Clients poll `/ingestion-status/:jobId` to track progress. This prevents HTTP timeouts on large files and gives visibility into errors per line.

### Topological Sort for Hierarchical Inserts

Events reference parents via `parent_event_id`. To satisfy the foreign key constraint during batch inserts, events are topologically sorted so parents are always inserted before their children. Combined with `DEFERRABLE INITIALLY DEFERRED` on the FK constraint and transactional batching, this ensures referential integrity without disabling constraints.

### Recursive CTE for Timeline

The `/timeline/:rootEventId` endpoint uses a PostgreSQL recursive CTE to walk the parent-child tree from a root event downward. This is index-driven on `parent_event_id` and avoids scanning the full table. For the expected dataset sizes (subtrees of thousands of nodes), this performs well. At extreme scale (hundreds of thousands of nodes per subtree), a closure table pattern would be the next step, but that adds write-time overhead during ingestion that isn't justified here.

### Overlap Detection via Self-Join

Overlapping event pairs are found with a single SQL self-join: `e1.start_date < e2.end_date AND e1.end_date > e2.start_date` with `e1.event_id < e2.event_id` to avoid duplicates. The overlap duration is computed inline using `LEAST`/`GREATEST`. The `idx_start_date` and `idx_end_date` indexes support this efficiently.

### Sweep-Line Gap Analysis

The largest temporal gap is computed in-memory using a sweep-line approach: events in the range are fetched sorted by `start_date`, then a single pass tracks a "watermark" (the latest `end_date` seen so far). Any time the next event's `start_date` exceeds the watermark, that's a gap. The largest one is returned with its bounding events.

### Dijkstra's Algorithm for Influence Paths

The influence path between two events is the shortest weighted path through the parent-child graph, where edge weights are `duration_minutes`. The algorithm first fetches the entire connected component via a recursive CTE (traversing both parent→child and child→parent edges), builds an adjacency list in memory, then runs Dijkstra's shortest-path algorithm. This handles bidirectional traversal of the hierarchy and returns the optimal path with total duration.

### Validation

Each row in the ingestion file is validated before insertion:
- UUID format check for `eventId` and `parentId`
- ISO 8601 date parsing with `end_date >= start_date` enforcement
- Numeric `researchValue` check
- Required `eventName` check
- Malformed rows (wrong column count) are rejected

Invalid rows are collected with line numbers and reported in the job status, not silently dropped.

### Sample Data

The file `kelp-sample-data.csv` is a pipe-delimited (`|`) file with intentionally malformed rows (bad UUIDs, duplicate IDs, wrong field counts) to exercise the validation and error-reporting logic. See the ingestion status endpoint for per-line error details after running an ingest.
