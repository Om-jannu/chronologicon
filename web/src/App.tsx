import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SearchPanel } from "@/components/search-panel";
import { TimelinePanel } from "@/components/timeline-panel";
import { OverlapsPanel } from "@/components/overlaps-panel";
import { GapsPanel } from "@/components/gaps-panel";
import { InfluencePanel } from "@/components/influence-panel";
import { IngestPanel } from "@/components/ingest-panel";

export function App() {
  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="mb-6 text-2xl font-medium">ArchaeoData Explorer</h1>

      <Tabs defaultValue="search">
        <TabsList className="mb-4">
          <TabsTrigger value="search">Search</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="overlaps">Overlaps</TabsTrigger>
          <TabsTrigger value="gaps">Gaps</TabsTrigger>
          <TabsTrigger value="influence">Influence</TabsTrigger>
          <TabsTrigger value="ingest">Ingest</TabsTrigger>
        </TabsList>

        <TabsContent value="search"><SearchPanel /></TabsContent>
        <TabsContent value="timeline"><TimelinePanel /></TabsContent>
        <TabsContent value="overlaps"><OverlapsPanel /></TabsContent>
        <TabsContent value="gaps"><GapsPanel /></TabsContent>
        <TabsContent value="influence"><InfluencePanel /></TabsContent>
        <TabsContent value="ingest"><IngestPanel /></TabsContent>
      </Tabs>
    </div>
  );
}

export default App;
