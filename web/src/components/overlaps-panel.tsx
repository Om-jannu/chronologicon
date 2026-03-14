import { useState } from "react";
import { api, type OverlapResult } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function OverlapsPanel() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [results, setResults] = useState<OverlapResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleFetch() {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string> = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const data = await api.getOverlaps(params);
      setResults(data);
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
          <Label htmlFor="overlap-start">Start Date</Label>
          <Input id="overlap-start" type="datetime-local" value={startDate}
            onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="flex-1 space-y-1">
          <Label htmlFor="overlap-end">End Date</Label>
          <Input id="overlap-end" type="datetime-local" value={endDate}
            onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <Button onClick={handleFetch} disabled={loading}>
          {loading ? "Loading..." : "Find Overlaps"}
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{results.length} overlapping pair{results.length !== 1 && "s"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {results.map((r, i) => (
              <div key={i} className="rounded-md border p-3 text-sm space-y-1">
                <div className="flex items-center justify-between">
                  <span>{r.overlappingEventPairs[0].event_name}</span>
                  <span className="text-muted-foreground">↔</span>
                  <span>{r.overlappingEventPairs[1].event_name}</span>
                </div>
                <Badge variant="secondary">{r.overlap_duration_minutes}m overlap</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
