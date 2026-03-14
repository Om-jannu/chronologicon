import { useState } from "react";
import { api, type InfluenceResult } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function InfluencePanel() {
  const [sourceId, setSourceId] = useState("");
  const [targetId, setTargetId] = useState("");
  const [result, setResult] = useState<InfluenceResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleFetch() {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const data = await api.getInfluence(sourceId.trim(), targetId.trim());
      setResult(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3">
        <div className="flex-1 space-y-1">
          <Label htmlFor="source-id">Source Event ID</Label>
          <Input id="source-id" placeholder="UUID" value={sourceId}
            onChange={(e) => setSourceId(e.target.value)} />
        </div>
        <div className="flex-1 space-y-1">
          <Label htmlFor="target-id">Target Event ID</Label>
          <Input id="target-id" placeholder="UUID" value={targetId}
            onChange={(e) => setTargetId(e.target.value)} />
        </div>
        <Button onClick={handleFetch}
          disabled={loading || !sourceId.trim() || !targetId.trim()}>
          {loading ? "Loading..." : "Find Path"}
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{result.message}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {result.shortestPath.length > 0 ? (
              <>
                <p>
                  <span className="text-muted-foreground">Total Duration:</span>{" "}
                  {result.totalDurationMinutes} minutes
                </p>
                <div className="space-y-1">
                  {result.shortestPath.map((step, i) => (
                    <div key={step.event_id} className="flex items-center gap-2">
                      {i > 0 && <span className="text-muted-foreground">→</span>}
                      <span>{step.event_name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {step.duration_minutes}m
                      </Badge>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">No path found.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
