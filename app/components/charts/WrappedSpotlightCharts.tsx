"use client";

import { Wrapped2024 } from "../../types";
import InfoTooltip from "../InfoTooltip";

interface Props {
    data: Wrapped2024;
}

const ERA_GRADIENTS: Record<string, { from: string; to: string }> = {
    "yellow-blue": { from: "#ffd93d", to: "#1e90ff" },
    red: { from: "#ff6b6b", to: "#e91e63" },
    "red-yellow": { from: "#e91e63", to: "#ffd93d" },
    blue: { from: "#1e90ff", to: "#00bcd4" },
    green: { from: "#1db954", to: "#6bcb77" },
    purple: { from: "#9b59b6", to: "#6c5ce7" },
};

function getEraColors(color: string) {
    return ERA_GRADIENTS[color] || { from: "#1db954", to: "#6bcb77" };
}

export default function WrappedSpotlightCharts({ data }: Props) {
    return (
        <div className="flex flex-col gap-6">
            {/* Hero stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center">
                    <p className="text-xs text-muted">
                        Total 2024 Hours
                        <InfoTooltip text="Total hours of music listened to in 2024, from your Wrapped data." />
                    </p>
                    <p className="text-3xl font-bold text-accent">
                        {data.totalHours.toLocaleString()}
                    </p>
                </div>
                <div className="text-center">
                    <p className="text-xs text-muted">
                        Global Ranking
                        <InfoTooltip text="You listened more than this percentage of all Spotify users worldwide." />
                    </p>
                    <p className="text-3xl font-bold text-[#ffd93d]">
                        Top {data.topPercentGlobally}%
                    </p>
                </div>
                <div className="text-center">
                    <p className="text-xs text-muted">
                        Distinct Tracks
                        <InfoTooltip text="Number of unique tracks you played at least once in 2024." />
                    </p>
                    <p className="text-3xl font-bold text-accent">
                        {data.distinctTracks.toLocaleString()}
                    </p>
                </div>
                <div className="text-center">
                    <p className="text-xs text-muted">
                        Unique Artists
                        <InfoTooltip text="Number of different artists you listened to in 2024." />
                    </p>
                    <p className="text-3xl font-bold text-accent">
                        {data.uniqueArtists.toLocaleString()}
                    </p>
                </div>
            </div>

            {/* Peak day callout */}
            <div className="bg-[#1a1a1a] rounded-xl p-4 text-center border border-[#2a2a2a]">
                <p className="text-xs text-muted mb-1">
                    Biggest Listening Day
                    <InfoTooltip text="The single calendar day in 2024 when you listened to the most music." />
                </p>
                <p className="text-xl font-bold text-[#ffd93d]">
                    {data.mostListenedDay}
                </p>
                <p className="text-sm text-muted">
                    {data.mostListenedDayMinutes.toFixed(0)} minutes (
                    {(data.mostListenedDayMinutes / 60).toFixed(1)} hours)
                </p>
            </div>

            {/* Top track */}
            <div className="bg-[#1a1a1a] rounded-xl p-4 text-center border border-[#2a2a2a]">
                <p className="text-xs text-muted mb-1">
                    #1 Track Play Count
                    <InfoTooltip text="How many times your single most-played track was played in 2024." />
                </p>
                <p className="text-3xl font-bold text-accent">
                    {data.topTrackPlayCount} plays
                </p>
                <p className="text-xs text-muted mt-1">
                    First played {data.topTrackFirstPlayed}
                </p>
            </div>

            {/* Music Evolution Eras */}
            {data.eras.length > 0 && (
                <div>
                    <h4 className="text-xs text-muted mb-3 uppercase tracking-wide">
                        Your Music Evolution
                        <InfoTooltip text="Spotify's analysis of how your taste shifted through different genres and moods across 2024." />
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {data.eras.map((era, i) => {
                            const colors = getEraColors(era.color);
                            return (
                                <div
                                    key={i}
                                    className="rounded-xl p-4 border border-[#2a2a2a] relative overflow-hidden"
                                    style={{
                                        background: `linear-gradient(135deg, ${colors.from}15, ${colors.to}15)`,
                                    }}
                                >
                                    <div
                                        className="absolute top-0 left-0 w-full h-1"
                                        style={{
                                            background: `linear-gradient(90deg, ${colors.from}, ${colors.to})`,
                                        }}
                                    />
                                    <p
                                        className="text-lg font-bold mb-1"
                                        style={{ color: colors.from }}
                                    >
                                        {era.peakMonth} 2024
                                    </p>
                                    <p className="text-sm font-semibold text-[#e0e0e0] capitalize">
                                        {era.genre}
                                    </p>
                                    <p className="text-xs text-muted capitalize">
                                        {era.mood} · {era.descriptor}
                                    </p>
                                    {era.tracks.length > 0 && (
                                        <div className="mt-3 space-y-1">
                                            {era.tracks.map((t, j) => (
                                                <p
                                                    key={j}
                                                    className="text-xs text-[#aaa]"
                                                >
                                                    ♪ {t}
                                                </p>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
