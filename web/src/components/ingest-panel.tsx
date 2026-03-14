import { useState, useEffect, useRef } from "react";
import { api, type JobStatus } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function IngestPanel() {
  const [filePath, setFilePath] = useState("");
  const [jobId, setJobId] = useState("");
  const [status, setStatus] = useState<JobStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function handleIngest() {
    setLoading(true);
    setError("");
    setStatus(null);
    try {
      const data = await api.ingest(filePath);
      setJobId(data.jobId);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ingest failed");
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!jobId) return;
    const poll = async () => {
      try {
        const s = await api.getJobStatus(jobId);
        setStatus(s);
        if (s.status === "COMPLETED" || s.status === "FAILED") {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setLoading(false);
        }
      } catch { /* ignore polling errors */ }
    };
    poll();
    intervalRef.current = setInterval(poll, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [jobId]);

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3">
        <div className="flex-1 space-y-1">
          <Label htmlFor="file-path">File Path (server-side)</Label>
          <Input
            id="file-path"
            placeholder="/path/to/kelp-sample-data.csv"
            value={filePath}
            onChange={(e) => setFilePath(e.target.value)}
          />
        </div>
        <Button onClick={handleIngest} disabled={loading || !filePath.trim()}>
          {loading ? "Ingesting..." : "Ingest"}
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {status && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              Job: {status.jobId.slice(0, 20)}...
              <Badge
                variant={status.status === "COMPLETED" ? "default" : "secondary"}
              >
                {status.status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <span className="text-muted-foreground">Processed</span>
                <p>{status.processedLines}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Errors</span>
                <p>{status.errorLines}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Total</span>
                <p>{status.totalLines}</p>
              </div>
            </div>
            {status.errors.length > 0 && (
              <div className="max-h-40 overflow-y-auto rounded-md border p-2">
                {status.errors.map((e, i) => (
                  <p key={i} className="text-xs text-destructive">{e}</p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
