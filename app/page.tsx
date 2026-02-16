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
import PlaylistInsightsCharts from "./components/charts/PlaylistInsightsCharts";
import SearchBehaviorCharts from "./components/charts/SearchBehaviorCharts";
import WrappedSpotlightCharts from "./components/charts/WrappedSpotlightCharts";
import LibraryHealthCharts from "./components/charts/LibraryHealthCharts";
import PlaylistStreamOverlapCharts from "./components/charts/PlaylistStreamOverlapCharts";
import SearchListenPipelineCharts from "./components/charts/SearchListenPipelineCharts";
import PlaylistCurationCharts from "./components/charts/PlaylistCurationCharts";
import PlaybackQualityCharts from "./components/charts/PlaybackQualityCharts";
import SocialSharingCharts from "./components/charts/SocialSharingCharts";
import DeviceEvolutionCharts from "./components/charts/DeviceEvolutionCharts";
import ApiLatencyCharts from "./components/charts/ApiLatencyCharts";
import NotificationEngagementCharts from "./components/charts/NotificationEngagementCharts";

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
                    info="Total listening time across all music, podcasts, and audiobooks."
                />
                <StatNumber
                    label="Total Plays"
                    value={overview.totalPlays.toLocaleString()}
                    info="Total number of individual play events, including skips and partial listens."
                />
                <StatNumber
                    label="Unique Artists"
                    value={overview.uniqueArtists.toLocaleString()}
                    info="Number of distinct artists you've listened to at least once."
                />
                <StatNumber
                    label="Unique Tracks"
                    value={overview.uniqueTracks.toLocaleString()}
                    info="Number of distinct songs you've listened to at least once."
                />
                <StatNumber
                    label="Unique Albums"
                    value={overview.uniqueAlbums.toLocaleString()}
                    info="Number of distinct albums you've listened to at least one track from."
                />
                <StatNumber
                    label="Longest Streak"
                    value={`${overview.longestStreak}`}
                    sub="consecutive days"
                    info="Most consecutive days in a row with at least one play."
                />
                <StatNumber
                    label="Avg Listen"
                    value={`${stats.avgListenMinutes.toFixed(1)}`}
                    sub="minutes per play"
                    info="Average duration of each play event. Low values may reflect frequent skipping."
                />
            </div>

            {/* Charts grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Daily listening - full width */}
                <Card
                    title="Daily Listening"
                    info="Total hours listened each day. Useful for spotting seasonal patterns and periods of heavy or light listening."
                    className="lg:col-span-2"
                >
                    <DailyListeningChart data={stats.dailyListening} />
                </Card>

                {/* Monthly & Yearly */}
                <Card
                    title="Monthly & Yearly Totals"
                    info="Aggregated listening hours by month and year, showing how your listening volume has changed over time."
                >
                    <MonthlyYearlyChart
                        monthly={stats.monthlyListening}
                        yearly={stats.yearlyListening}
                    />
                </Card>

                {/* Hour/Day distributions */}
                <Card
                    title="Listening Distribution"
                    info="When you listen most. Hour-of-day shows your daily rhythm; day-of-week shows which days are heaviest."
                >
                    <HourDayBarCharts
                        hourOfDay={stats.hourOfDay}
                        dayOfWeek={stats.dayOfWeek}
                    />
                </Card>

                {/* Heatmap - full width */}
                <Card
                    title="Hour x Day Heatmap"
                    info="A 2D view of listening intensity by hour and day of week. Brighter green = more hours. Hover cells for exact values."
                    className="lg:col-span-2"
                >
                    <HourDayHeatmap data={stats.heatmap} />
                </Card>

                {/* Top content - full width */}
                <Card
                    title="Top Content"
                    info="Your most-listened artists, tracks, and albums ranked by total hours. Switch tabs to explore each."
                    className="lg:col-span-2"
                >
                    <TopContentCharts
                        artists={stats.topArtists}
                        tracks={stats.topTracks}
                        albums={stats.topAlbums}
                    />
                </Card>

                {/* Artists over time - full width */}
                <Card
                    title="Top Artists Over Time"
                    info="Monthly listening hours for your top 10 artists as a stacked area chart, showing how your taste evolves."
                    className="lg:col-span-2"
                >
                    <ArtistsOverTimeChart data={stats.artistsOverTime} />
                </Card>

                {/* Skip analysis */}
                <Card
                    title="Skip Analysis"
                    info="How often you skip tracks. The bar chart shows skip rate for your most-played artists; the line tracks your overall skip rate over time."
                >
                    <SkipAnalysisCharts
                        byArtist={stats.skipByArtist}
                        overTime={stats.skipRateOverTime}
                    />
                </Card>

                {/* Behavior */}
                <Card
                    title="Listening Behavior"
                    info="How you interact with the player. Start/end reasons show what triggers plays and stops. Shuffle trend shows how often shuffle is on."
                >
                    <BehaviorCharts
                        reasons={stats.reasonBreakdown}
                        shuffleOverTime={stats.shuffleOverTime}
                        avgListenMinutes={stats.avgListenMinutes}
                    />
                </Card>

                {/* Platform & Context */}
                <Card
                    title="Platform & Context"
                    info="Which devices you listen on, how much is offline vs online, and which countries you've listened from."
                >
                    <PlatformCharts
                        platforms={stats.platformBreakdown}
                        offlineVsOnline={stats.offlineVsOnline}
                        countries={stats.countryBreakdown}
                    />
                </Card>

                {/* Content type split */}
                <Card
                    title="Content Type"
                    info="Breakdown of listening between music, podcasts, and audiobooks over time, plus your top podcast shows."
                >
                    <ContentTypeChart
                        data={stats.contentTypeSplit}
                        topPodcasts={stats.topPodcasts}
                    />
                </Card>

                {/* Discovery - full width */}
                <Card
                    title="New Artist Discovery Per Month"
                    info="How many artists you listened to for the first time each month. Higher bars = more musical exploration."
                    className="lg:col-span-2"
                >
                    <DiscoveryChart data={stats.newArtistDiscovery} />
                </Card>
            </div>

            {/* ================================================================== */}
            {/* Account Data Sections                                               */}
            {/* ================================================================== */}
            <div className="mt-12 mb-8">
                <h2 className="text-2xl font-bold tracking-tight">
                    Account &amp; Library Insights
                </h2>
                <p className="text-muted text-sm mt-1">
                    Metrics from your Spotify Account Data — playlists,
                    searches, library, and Wrapped
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Wrapped 2024 Spotlight - full width */}
                <Card title="2024 Wrapped Spotlight" className="lg:col-span-2">
                    <WrappedSpotlightCharts data={stats.wrapped2024} />
                </Card>

                {/* Playlist Insights - full width */}
                <Card title="Playlist Insights" className="lg:col-span-2">
                    <PlaylistInsightsCharts data={stats.playlistInsights} />
                </Card>

                {/* Search Behavior */}
                <Card title="Search Behavior">
                    <SearchBehaviorCharts data={stats.searchBehavior} />
                </Card>

                {/* Library Insights */}
                <Card title="Library Insights">
                    <LibraryHealthCharts data={stats.libraryHealth} />
                </Card>

                {/* Playlist x Streaming Overlap - full width */}
                <Card
                    title="Playlist x Streaming Overlap"
                    className="lg:col-span-2"
                >
                    <PlaylistStreamOverlapCharts
                        data={stats.playlistStreamOverlap}
                    />
                </Card>

                {/* Search-to-Listen Pipeline - full width */}
                <Card
                    title="Search → Listen Pipeline"
                    className="lg:col-span-2"
                >
                    <SearchListenPipelineCharts
                        data={stats.searchListenPipeline}
                    />
                </Card>
            </div>

            {/* ================================================================== */}
            {/* Technical Log Information Sections                                  */}
            {/* ================================================================== */}
            <div className="mt-12 mb-8">
                <h2 className="text-2xl font-bold tracking-tight">
                    Technical Log Insights
                </h2>
                <p className="text-muted text-sm mt-1">
                    Metrics from Spotify Technical Log Information —
                    playlist curation, playback quality, social sessions,
                    device telemetry, API latency, and notifications
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Playlist Curation - full width */}
                <Card
                    title="Playlist Curation Behavior"
                    info="Real-time playlist management events: when, how, and how fast you curate. Cross-referenced with streaming history for impulse-add timing and abandoned tracks."
                    className="lg:col-span-2"
                >
                    <PlaylistCurationCharts data={stats.playlistCuration} />
                </Card>

                {/* Playback Quality - full width */}
                <Card
                    title="Playback Quality & Reliability"
                    info="Behind-the-scenes look at playback errors, audio stutters, bitrate quality, and download activity from Spotify's technical logs."
                    className="lg:col-span-2"
                >
                    <PlaybackQualityCharts data={stats.playbackQuality} />
                </Card>

                {/* Social & Sharing */}
                <Card
                    title="Social Listening & Sharing"
                    info="Social (Jam) sessions, sharing behavior, and how many listens it takes before you share a track."
                >
                    <SocialSharingCharts data={stats.socialSharing} />
                </Card>

                {/* Push Notifications */}
                <Card
                    title="Push Notification Engagement"
                    info="How you respond to Spotify's push notifications — engagement rate and how often they lead to actual listening."
                >
                    <NotificationEngagementCharts
                        data={stats.pushNotifications}
                    />
                </Card>

                {/* Device & App Evolution - full width */}
                <Card
                    title="Device & App Evolution"
                    info="Your device ecosystem over time: app updates, OS versions, device fingerprints, and multi-device usage patterns."
                    className="lg:col-span-2"
                >
                    <DeviceEvolutionCharts data={stats.deviceEvolution} />
                </Card>

                {/* API & Latency - full width */}
                <Card
                    title="API & Latency Experience"
                    info="A peek behind the curtain: API response times, feature usage fingerprint from GraphQL operations, and error rates."
                    className="lg:col-span-2"
                >
                    <ApiLatencyCharts data={stats.apiLatency} />
                </Card>
            </div>

            <footer className="text-center text-muted text-xs mt-12 mb-4">
                Built from Spotify Extended Streaming History, Account
                Data &amp; Technical Log Information
            </footer>
        </main>
    );
}
