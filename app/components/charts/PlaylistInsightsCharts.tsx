"use client";

import { useState } from "react";

import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
} from "recharts";
import { PlaylistInsights } from "../../types";
import InfoTooltip from "../InfoTooltip";

interface Props {
    data: PlaylistInsights;
}

type GrowthView = "all" | "userOnly";

function truncate(s: string, max: number) {
    return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

export default function PlaylistInsightsCharts({ data }: Props) {
    const [growthView, setGrowthView] = useState<GrowthView>("all");
    const hasUserOnlyGrowthData = data.growthOverTimeUserOnly.length > 0;
    const growthData =
        growthView === "all"
            ? data.growthOverTime
            : data.growthOverTimeUserOnly;

    return (
        <div className="flex flex-col gap-6">
            {/* Overview stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="text-center">
                    <p className="text-xs text-muted">
                        Total Playlists
                        <InfoTooltip text="Total number of playlists in your Spotify account." />
                    </p>
                    <p className="text-2xl font-bold text-accent">
                        {data.totalPlaylists}
                    </p>
                </div>
                <div className="text-center">
                    <p className="text-xs text-muted">
                        Total Tracks
                        <InfoTooltip text="Combined track count across all of your playlists." />
                    </p>
                    <p className="text-2xl font-bold text-accent">
                        {data.totalTracks.toLocaleString()}
                    </p>
                </div>
                <div className="text-center">
                    <p className="text-xs text-muted">
                        Avg Playlist Size
                        <InfoTooltip text="Average number of tracks per playlist." />
                    </p>
                    <p className="text-2xl font-bold text-accent">
                        {data.avgPlaylistSize}
                    </p>
                </div>
                <div className="text-center">
                    <p className="text-xs text-muted">
                        Largest Playlist
                        <InfoTooltip text="Your playlist with the most tracks." />
                    </p>
                    <p className="text-lg font-bold text-accent">
                        {data.largestPlaylist.tracks}
                    </p>
                    <p className="text-xs text-muted">
                        {truncate(data.largestPlaylist.name, 25)}
                    </p>
                </div>
            </div>

            {/* Playlist growth over time */}
            <div>
                {hasUserOnlyGrowthData && (
                    <div className="flex gap-2 mb-2">
                        <button
                            onClick={() => setGrowthView("all")}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                growthView === "all"
                                    ? "bg-accent text-black"
                                    : "bg-card-border text-muted hover:text-foreground"
                            }`}
                        >
                            All Activity
                        </button>
                        <button
                            onClick={() => setGrowthView("userOnly")}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                growthView === "userOnly"
                                    ? "bg-accent text-black"
                                    : "bg-card-border text-muted hover:text-foreground"
                            }`}
                        >
                            My Adds Only
                        </button>
                    </div>
                )}
                <h4 className="text-xs text-muted mb-2">
                    Tracks Added Over Time
                    <InfoTooltip
                        text={
                            hasUserOnlyGrowthData
                                ? "All Activity uses account playlist snapshot added dates (long history). My Adds Only uses technical logs for manual app-initiated adds."
                                : "Monthly count of tracks added to any of your playlists."
                        }
                    />
                </h4>
                <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={growthData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                        <XAxis
                            dataKey="month"
                            tickFormatter={(v: string) => v.slice(2)}
                            minTickGap={40}
                            fontSize={10}
                        />
                        <YAxis fontSize={10} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "#1e1e1e",
                                border: "1px solid #2a2a2a",
                                borderRadius: 8,
                                fontSize: 12,
                            }}
                            formatter={(value) => [value, "Tracks added"]}
                        />
                        <Bar
                            dataKey="tracks"
                            fill="#1db954"
                            radius={[2, 2, 0, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Top playlists by size */}
            <div>
                <h4 className="text-xs text-muted mb-2">
                    Largest Playlists
                    <InfoTooltip text="Your playlists ranked by number of tracks." />
                </h4>
                <ResponsiveContainer
                    width="100%"
                    height={Math.max(300, data.topBySize.length * 28)}
                >
                    <BarChart
                        data={data.topBySize}
                        layout="vertical"
                        margin={{ left: 10 }}
                    >
                        <XAxis type="number" fontSize={10} />
                        <YAxis
                            type="category"
                            dataKey="name"
                            width={180}
                            tick={{ fontSize: 10 }}
                            tickFormatter={(v: string) => truncate(v, 25)}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "#1e1e1e",
                                border: "1px solid #2a2a2a",
                                borderRadius: 8,
                                fontSize: 12,
                            }}
                            formatter={(value) => [value, "Tracks"]}
                        />
                        <Bar
                            dataKey="tracks"
                            fill="#1db954"
                            radius={[0, 4, 4, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Playlist diversity */}
            {data.diversity.length > 0 && (
                <div>
                    <h4 className="text-xs text-muted mb-2">
                        Playlist Diversity
                        <InfoTooltip text="Ratio of unique artists to total tracks. Higher means more eclectic; lower means more focused on fewer artists." />
                    </h4>
                    <ResponsiveContainer
                        width="100%"
                        height={Math.max(
                            250,
                            Math.min(data.diversity.length, 15) * 28,
                        )}
                    >
                        <BarChart
                            data={data.diversity.slice(0, 15)}
                            layout="vertical"
                            margin={{ left: 10 }}
                        >
                            <XAxis
                                type="number"
                                domain={[0, 1]}
                                tickFormatter={(v: number) =>
                                    `${(v * 100).toFixed(0)}%`
                                }
                                fontSize={10}
                            />
                            <YAxis
                                type="category"
                                dataKey="name"
                                width={180}
                                tick={{ fontSize: 10 }}
                                tickFormatter={(v: string) => truncate(v, 25)}
                            />
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (!active || !payload || !payload.length)
                                        return null;
                                    const row = payload[0].payload;
                                    return (
                                        <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm">
                                            <p className="font-medium text-[#e0e0e0]">
                                                {row.name}
                                            </p>
                                            <p className="text-[#1db954] font-semibold">
                                                {(row.diversity * 100).toFixed(
                                                    1,
                                                )}
                                                % diverse
                                            </p>
                                            <p className="text-[#888] text-xs">
                                                {row.uniqueArtists} artists /{" "}
                                                {row.totalTracks} tracks
                                            </p>
                                        </div>
                                    );
                                }}
                            />
                            <Bar
                                dataKey="diversity"
                                fill="#6bcb77"
                                radius={[0, 4, 4, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}
