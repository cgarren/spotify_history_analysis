"use client";

import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
} from "recharts";
import { PlaylistStreamOverlap } from "../../types";
import InfoTooltip from "../InfoTooltip";

interface Props {
    data: PlaylistStreamOverlap;
}

function truncate(s: string, max: number) {
    return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

export default function PlaylistStreamOverlapCharts({ data }: Props) {
    return (
        <div className="flex flex-col gap-6">
            {/* Hero stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center">
                    <p className="text-xs text-muted">
                        Combined Loyalty
                        <InfoTooltip text="Percentage of your total listening that came from tracks in your playlists or Liked Songs combined." />
                    </p>
                    <p className="text-3xl font-bold text-accent">
                        {data.combinedLoyaltyScore}%
                    </p>
                    <p className="text-xs text-muted">
                        {data.combinedStreamHours.toLocaleString()} hrs
                    </p>
                </div>
                <div className="text-center">
                    <p className="text-xs text-muted">
                        Playlist Loyalty
                        <InfoTooltip text="Percentage of your listening hours from tracks found in your playlists." />
                    </p>
                    <p className="text-2xl font-bold text-accent">
                        {data.loyaltyScore}%
                    </p>
                    <p className="text-xs text-muted">
                        {data.playlistHours.toLocaleString()} hrs
                    </p>
                </div>
                <div className="text-center">
                    <p className="text-xs text-muted">
                        Library Loyalty
                        <InfoTooltip text="Percentage of your listening hours from tracks saved to your Liked Songs." />
                    </p>
                    <p className="text-2xl font-bold text-accent">
                        {data.libraryLoyaltyScore}%
                    </p>
                    <p className="text-xs text-muted">
                        {data.libraryStreamHours.toLocaleString()} hrs
                    </p>
                </div>
                {data.discoverWeeklyHitRate && (
                    <div className="text-center">
                        <p className="text-xs text-muted">
                            Discover Weekly Hit Rate
                            <InfoTooltip text="Percentage of Discover Weekly tracks you played 3 or more times — tracks that became part of your rotation." />
                        </p>
                        <p className="text-3xl font-bold text-[#ffd93d]">
                            {data.discoverWeeklyHitRate.hitRate}%
                        </p>
                        <p className="text-xs text-muted">
                            {data.discoverWeeklyHitRate.hitTracks} /{" "}
                            {data.discoverWeeklyHitRate.totalTracks} tracks
                        </p>
                    </div>
                )}
            </div>

            {/* Most-played playlists */}
            {data.mostPlayedPlaylists.length > 0 && (
                <div>
                    <h4 className="text-xs font-medium text-muted uppercase tracking-wide mb-3">
                        Most-Played Library/Playlists
                        <InfoTooltip text="Your playlists and Liked Songs library ranked by total streaming hours." />
                    </h4>
                    <ResponsiveContainer
                        width="100%"
                        height={Math.max(
                            300,
                            Math.min(data.mostPlayedPlaylists.length, 15) * 28,
                        )}
                    >
                        <BarChart
                            data={data.mostPlayedPlaylists.slice(0, 15)}
                            layout="vertical"
                            margin={{ left: 10 }}
                        >
                            <XAxis
                                type="number"
                                tickFormatter={(v: number) => `${v}h`}
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
                                                {row.hours.toFixed(1)} hrs
                                                streamed
                                            </p>
                                            <p className="text-[#888] text-xs">
                                                {row.streamedTracks} /{" "}
                                                {row.totalTracks} tracks played
                                            </p>
                                        </div>
                                    );
                                }}
                            />
                            <Bar
                                dataKey="hours"
                                fill="#1db954"
                                radius={[0, 4, 4, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Dead playlists */}
            {data.deadPlaylists.length > 0 && (
                <div>
                    <h4 className="text-xs font-medium text-muted uppercase tracking-wide mb-3">
                        Dead Playlists
                        <InfoTooltip text="Playlists where fewer than 10% of tracks were ever streamed — playlists you created but don't use." />
                    </h4>
                    <div className="space-y-2">
                        {data.deadPlaylists.map((dp, i) => (
                            <div
                                key={i}
                                className="flex items-center justify-between bg-[#1a1a1a] rounded-lg px-4 py-2 border border-[#2a2a2a]"
                            >
                                <span className="text-sm text-[#e0e0e0]">
                                    {truncate(dp.name, 40)}
                                </span>
                                <span className="text-xs text-[#ff6b6b]">
                                    {dp.streamedTracks} / {dp.totalTracks}{" "}
                                    played
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
