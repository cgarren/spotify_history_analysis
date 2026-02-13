import { Stats } from "./types";
import statsData from "../public/stats.json";
import StatNumber from "./components/StatNumber";
import Card from "./components/Card";
import DailyListeningChart from "./components/charts/DailyListeningChart";
import MonthlyYearlyChart from "./components/charts/MonthlyYearlyChart";
import HourDayBarCharts from "./components/charts/HourDayBarCharts";
import HourDayHeatmap from "./components/charts/HourDayHeatmap";
import TopContentCharts from "./components/charts/TopContentCharts";
import ArtistsOverTimeChart from "./components/charts/ArtistsOverTimeChart";
import SkipAnalysisCharts from "./components/charts/SkipAnalysisCharts";
import BehaviorCharts from "./components/charts/BehaviorCharts";
import PlatformCharts from "./components/charts/PlatformCharts";
import ContentTypeChart from "./components/charts/ContentTypeChart";
import DiscoveryChart from "./components/charts/DiscoveryChart";

const stats = statsData as Stats;

export default function Home() {
  const { overview } = stats;

  return (
    <main className="min-h-screen px-4 py-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Spotify Listening Dashboard
        </h1>
        <p className="text-muted text-sm mt-1">
          {overview.dateRange.start} &mdash; {overview.dateRange.end}
        </p>
      </div>

      {/* Overview stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 mb-8">
        <StatNumber
          label="Total Hours"
          value={overview.totalHours.toLocaleString()}
        />
        <StatNumber
          label="Total Plays"
          value={overview.totalPlays.toLocaleString()}
        />
        <StatNumber
          label="Unique Artists"
          value={overview.uniqueArtists.toLocaleString()}
        />
        <StatNumber
          label="Unique Tracks"
          value={overview.uniqueTracks.toLocaleString()}
        />
        <StatNumber
          label="Unique Albums"
          value={overview.uniqueAlbums.toLocaleString()}
        />
        <StatNumber
          label="Longest Streak"
          value={`${overview.longestStreak}`}
          sub="consecutive days"
        />
        <StatNumber
          label="Avg Listen"
          value={`${stats.avgListenMinutes.toFixed(1)}`}
          sub="minutes per play"
        />
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily listening - full width */}
        <Card title="Daily Listening" className="lg:col-span-2">
          <DailyListeningChart data={stats.dailyListening} />
        </Card>

        {/* Monthly & Yearly */}
        <Card title="Monthly & Yearly Totals">
          <MonthlyYearlyChart
            monthly={stats.monthlyListening}
            yearly={stats.yearlyListening}
          />
        </Card>

        {/* Hour/Day distributions */}
        <Card title="Listening Distribution">
          <HourDayBarCharts
            hourOfDay={stats.hourOfDay}
            dayOfWeek={stats.dayOfWeek}
          />
        </Card>

        {/* Heatmap - full width */}
        <Card title="Hour x Day Heatmap" className="lg:col-span-2">
          <HourDayHeatmap data={stats.heatmap} />
        </Card>

        {/* Top content - full width */}
        <Card title="Top Content" className="lg:col-span-2">
          <TopContentCharts
            artists={stats.topArtists}
            tracks={stats.topTracks}
            albums={stats.topAlbums}
          />
        </Card>

        {/* Artists over time - full width */}
        <Card title="Top Artists Over Time" className="lg:col-span-2">
          <ArtistsOverTimeChart data={stats.artistsOverTime} />
        </Card>

        {/* Skip analysis */}
        <Card title="Skip Analysis">
          <SkipAnalysisCharts
            byArtist={stats.skipByArtist}
            overTime={stats.skipRateOverTime}
          />
        </Card>

        {/* Behavior */}
        <Card title="Listening Behavior">
          <BehaviorCharts
            reasons={stats.reasonBreakdown}
            shuffleOverTime={stats.shuffleOverTime}
            avgListenMinutes={stats.avgListenMinutes}
          />
        </Card>

        {/* Platform & Context */}
        <Card title="Platform & Context">
          <PlatformCharts
            platforms={stats.platformBreakdown}
            offlineVsOnline={stats.offlineVsOnline}
            countries={stats.countryBreakdown}
          />
        </Card>

        {/* Content type split */}
        <Card title="Content Type">
          <ContentTypeChart
            data={stats.contentTypeSplit}
            topPodcasts={stats.topPodcasts}
          />
        </Card>

        {/* Discovery - full width */}
        <Card title="New Artist Discovery Per Month" className="lg:col-span-2">
          <DiscoveryChart data={stats.newArtistDiscovery} />
        </Card>
      </div>

      <footer className="text-center text-muted text-xs mt-12 mb-4">
        Built from Spotify Extended Streaming History data
      </footer>
    </main>
  );
}
