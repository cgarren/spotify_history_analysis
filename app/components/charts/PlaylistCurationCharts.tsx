"use client";

import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    AreaChart,
    Area,
    Legend,
} from "recharts";
import { useState } from "react";
import { PlaylistCuration, PlaylistCurationMetrics, CurationHeatmapCell } from "../../types";
import InfoTooltip from "../InfoTooltip";

interface Props {
    data: PlaylistCuration;
}

type CurationView = "all" | "userOnly";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function CurationHeatmap({ data }: { data: CurationHeatmapCell[] }) {
    const maxCount = Math.max(...data.map((d) => d.count), 1);

    const cellMap = new Map<string, number>();
    for (const d of data) {
        cellMap.set(`${d.dayIndex}-${d.hour}`, d.count);
    }

    function getColor(value: number): string {
        const ratio = value / maxCount;
        if (ratio === 0) return "#1a1a1a";
        // Blue-purple scale for curation (vs green for listening)
        const b = Math.round(100 + ratio * 155);
        const r = Math.round(40 + ratio * 120);
        const g = Math.round(20 + ratio * 60);
        return `rgb(${r}, ${g}, ${b})`;
    }

    return (
        <div className="overflow-x-auto">
            <div className="min-w-[600px]">
                <div className="flex ml-10 mb-1">
                    {HOURS.map((h) => (
                        <div
                            key={h}
                            className="flex-1 text-center text-[10px] text-muted"
                        >
                            {h % 3 === 0 ? `${h}` : ""}
                        </div>
                    ))}
                </div>
                {DAYS.map((day, di) => (
                    <div key={day} className="flex items-center mb-[2px]">
                        <div className="w-10 text-xs text-muted text-right pr-2">
                            {day}
                        </div>
                        <div className="flex flex-1 gap-[2px]">
                            {HOURS.map((h) => {
                                const val = cellMap.get(`${di}-${h}`) ?? 0;
                                return (
                                    <div
                                        key={h}
                                        className="flex-1 aspect-square rounded-sm cursor-default"
                                        style={{
                                            backgroundColor: getColor(val),
                                        }}
                                        title={`${day} ${h}:00 — ${val} events`}
                                    />
                                );
                            })}
                        </div>
                    </div>
                ))}
                <div className="flex items-center justify-end mt-2 gap-1">
                    <span className="text-[10px] text-muted mr-1">Less</span>
                    {[0, 0.2, 0.4, 0.6, 0.8, 1].map((r) => (
                        <div
                            key={r}
                            className="w-3 h-3 rounded-sm"
                            style={{
                                backgroundColor: getColor(r * maxCount),
                            }}
                        />
                    ))}
                    <span className="text-[10px] text-muted ml-1">More</span>
                </div>
            </div>
        </div>
    );
}

function truncate(s: string, max: number) {
    return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

const VIEW_TABS: { key: CurationView; label: string; tooltip: string }[] = [
    { key: "all", label: "All Activity", tooltip: "All playlist add/remove events including automated tools." },
    { key: "userOnly", label: "My Adds Only", tooltip: "Only adds/removes initiated from the Spotify app (excludes automated tool activity)." },
];

export default function PlaylistCurationCharts({ data: rawData }: Props) {
    const [view, setView] = useState<CurationView>("all");
    const data: PlaylistCurationMetrics = rawData[view];

    return (
        <div className="flex flex-col gap-6">
            {/* View toggle */}
            <div className="flex items-center gap-2">
                {VIEW_TABS.map((t) => (
                    <button
                        key={t.key}
                        onClick={() => setView(t.key)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            view === t.key
                                ? "bg-accent text-black"
                                : "bg-card-border text-muted hover:text-foreground"
                        }`}
                    >
                        {t.label}
                    </button>
                ))}
                <InfoTooltip text="Toggle between all playlist events (including automated tools like JamBase) and only your manual adds/removes from the Spotify app." />
            </div>

            {/* Overview stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="text-center">
                    <p className="text-xs text-muted">
                        Total Adds
                        <InfoTooltip text="Total track-to-playlist additions recorded in technical logs." />
                    </p>
                    <p className="text-2xl font-bold text-accent">
                        {data.totalAdds.toLocaleString()}
                    </p>
                </div>
                <div className="text-center">
                    <p className="text-xs text-muted">
                        Total Removes
                        <InfoTooltip text="Total track removals from playlists." />
                    </p>
                    <p className="text-2xl font-bold text-accent">
                        {data.totalRemoves.toLocaleString()}
                    </p>
                </div>
                <div className="text-center">
                    <p className="text-xs text-muted">
                        Adds / Week
                        <InfoTooltip text="Average tracks added to playlists per week." />
                    </p>
                    <p className="text-2xl font-bold text-accent">
                        {data.addsPerWeek}
                    </p>
                </div>
                <div className="text-center">
                    <p className="text-xs text-muted">
                        Removes / Week
                        <InfoTooltip text="Average tracks removed from playlists per week." />
                    </p>
                    <p className="text-2xl font-bold text-accent">
                        {data.removesPerWeek}
                    </p>
                </div>
            </div>

            {/* Playlist Churn Over Time */}
            {data.churnOverTime.length > 0 && (
                <div>
                    <h4 className="text-xs text-muted mb-2">
                        Playlist Churn Over Time
                        <InfoTooltip text="Weekly adds vs removes. Shows how actively you curate your playlists over time." />
                    </h4>
                    <ResponsiveContainer width="100%" height={250}>
                        <AreaChart data={data.churnOverTime}>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#2a2a2a"
                            />
                            <XAxis
                                dataKey="week"
                                tickFormatter={(v: string) =>
                                    v.length > 10 ? v.slice(0, 10) : v
                                }
                                minTickGap={60}
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
                            />
                            <Legend />
                            <Area
                                type="monotone"
                                dataKey="adds"
                                stackId="1"
                                fill="#1db954"
                                stroke="#1db954"
                                fillOpacity={0.6}
                                name="Adds"
                            />
                            <Area
                                type="monotone"
                                dataKey="removes"
                                stackId="2"
                                fill="#e74c3c"
                                stroke="#e74c3c"
                                fillOpacity={0.6}
                                name="Removes"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Curation Heatmap */}
            {data.curationHeatmap.length > 0 && (
                <div>
                    <h4 className="text-xs text-muted mb-2">
                        Curation Hour Heatmap
                        <InfoTooltip text="When you curate playlists (add/remove tracks) by hour and day of week. Compare with the listening heatmap to see organizing vs listening time." />
                    </h4>
                    <CurationHeatmap data={data.curationHeatmap} />
                </div>
            )}

            {/* Playlist Regret + Impulse Add side by side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Playlist Regret */}
                <div className="bg-[#1a1a1a] rounded-lg p-4">
                    <h4 className="text-xs text-muted mb-2">
                        Playlist Regret Score
                        <InfoTooltip text="Tracks removed within 7 days of being added. A 'buyer's remorse' metric for playlist curation." />
                    </h4>
                    <p className="text-3xl font-bold text-[#e74c3c]">
                        {data.regretPct}%
                    </p>
                    <p className="text-xs text-muted mt-1">
                        {data.regretCount.toLocaleString()} tracks removed
                        within a week of adding
                    </p>
                </div>

                {/* Abandoned Adds */}
                <div className="bg-[#1a1a1a] rounded-lg p-4">
                    <h4 className="text-xs text-muted mb-2">
                        Abandoned Adds
                        <InfoTooltip text="Tracks you added to a playlist but never streamed again afterward. Saved and forgotten." />
                    </h4>
                    <p className="text-3xl font-bold text-[#f39c12]">
                        {data.abandonedCount.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted mt-1">
                        {data.abandonedPct}% of unique tracks added
                    </p>
                </div>
            </div>

            {/* Abandoned Adds examples */}
            {data.abandonedExamples.length > 0 && (
                <div>
                    <h4 className="text-xs text-muted mb-2">
                        Sample Abandoned Tracks
                        <InfoTooltip text="Examples of tracks you added to playlists but never played again." />
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                        {data.abandonedExamples.map((t, i) => (
                            <div
                                key={i}
                                className="text-xs flex items-center gap-2 py-1 px-2 rounded bg-[#1a1a1a]"
                            >
                                <span className="text-[#e0e0e0]">
                                    {truncate(t.name, 30)}
                                </span>
                                <span className="text-muted">
                                    {truncate(t.artist, 20)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Impulse Add Timing */}
            {data.impulseAddTiming.length > 0 && (
                <div>
                    <h4 className="text-xs text-muted mb-2">
                        Impulse Add Timing
                        <InfoTooltip text="How long after first hearing a track do you add it to a playlist? Shows if you're an instant curator or a slow evaluator." />
                    </h4>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={data.impulseAddTiming}>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#2a2a2a"
                            />
                            <XAxis dataKey="bin" fontSize={10} />
                            <YAxis fontSize={10} />
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
                                dataKey="count"
                                fill="#1db954"
                                radius={[4, 4, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}
