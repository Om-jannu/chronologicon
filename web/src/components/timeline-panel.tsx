import { useState } from "react";
import { api, type TimelineNode } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function TreeNode({ node, level = 0 }: { node: TimelineNode; level?: number }) {
  return (
    <div style={{ marginLeft: level * 20 }} className="border-l pl-3 py-1">
      <div className="flex items-center gap-2 text-sm">
        <span className="font-medium">{node.event_name}</span>
        <Badge variant="secondary" className="text-xs">
          {node.duration_minutes}m
        </Badge>
      </div>
      <div className="text-xs text-muted-foreground">
        {new Date(node.start_date).toLocaleString()} →{" "}
        {new Date(node.end_date).toLocaleString()}
      </div>
      {node.children.map((c) => (
        <TreeNode key={c.event_id} node={c} level={level + 1} />
      ))}
    </div>
  );
}

export function TimelinePanel() {
  const [eventId, setEventId] = useState("");
  const [timeline, setTimeline] = useState<TimelineNode | null>(null);
  const [stats, setStats] = useState<{ total: number; depth: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleFetch() {
    setLoading(true);
    setError("");
    setTimeline(null);
    try {
      const data = await api.getTimeline(eventId.trim());
      setTimeline(data.timeline);
      setStats({ total: data.totalEvents, depth: data.maxDepth });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load timeline");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3">
        <div className="flex-1 space-y-1">
          <Label htmlFor="timeline-id">Root Event ID</Label>
          <Input
            id="timeline-id"
            placeholder="UUID of root event"
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleFetch()}
          />
        </div>
        <Button onClick={handleFetch} disabled={loading || !eventId.trim()}>
          {loading ? "Loading..." : "Build Timeline"}
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {timeline && stats && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              {stats.total} events, max depth {stats.depth}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TreeNode node={timeline} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
