import { useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SearchPanel() {
  const [name, setName] = useState("");
  const [results, setResults] = useState<
    { event_id: string; event_name: string }[]
  >([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSearch() {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string> = {};
      if (name) params.name = name;
      const data = await api.searchEvents(params);
      setResults(data.events);
      setTotal(data.totalEvents);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3">
        <div className="flex-1 space-y-1">
          <Label htmlFor="search-name">Event Name</Label>
          <Input
            id="search-name"
            placeholder="Search events..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
        <Button onClick={handleSearch} disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              {total} result{total !== 1 && "s"} found
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {results.map((e) => (
                <li
                  key={e.event_id}
                  className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                >
                  <span>{e.event_name}</span>
                  <code className="text-xs text-muted-foreground">
                    {e.event_id.slice(0, 8)}...
                  </code>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
