import { useState } from "react";
import { api, type GapResult } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function GapsPanel() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [result, setResult] = useState<GapResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleFetch() {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const data = await api.getTemporalGaps({ startDate, endDate });
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
          <Label htmlFor="gap-start">Start Date</Label>
          <Input id="gap-start" type="datetime-local" value={startDate}
            onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="flex-1 space-y-1">
          <Label htmlFor="gap-end">End Date</Label>
          <Input id="gap-end" type="datetime-local" value={endDate}
            onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <Button onClick={handleFetch} disabled={loading || !startDate || !endDate}>
          {loading ? "Loading..." : "Find Largest Gap"}
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{result.message}</CardTitle>
          </CardHeader>
          {result.largestGap && (
            <CardContent className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-muted-foreground">Gap Start:</span>
                  <p>{new Date(result.largestGap.startOfGap).toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Gap End:</span>
                  <p>{new Date(result.largestGap.endOfGap).toLocaleString()}</p>
                </div>
              </div>
              <p>
                <span className="text-muted-foreground">Duration:</span>{" "}
                {result.largestGap.durationMinutes} minutes
              </p>
              <div className="grid grid-cols-2 gap-2 rounded-md border p-2">
                <div>
                  <span className="text-muted-foreground text-xs">Preceding</span>
                  <p>{result.largestGap.precedingEvent.event_name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Succeeding</span>
                  <p>{result.largestGap.succeedingEvent.event_name}</p>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}
