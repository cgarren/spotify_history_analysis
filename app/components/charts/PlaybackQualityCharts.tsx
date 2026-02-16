"use client";

import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    LineChart,
    Line,
    Legend,
    PieChart,
    Pie,
    Cell,
} from "recharts";
import { PlaybackQuality } from "../../types";
import InfoTooltip from "../InfoTooltip";

interface Props {
    data: PlaybackQuality;
}

const PIE_COLORS = ["#1db954", "#6bcb77", "#ff6b6b", "#ffd93d", "#6c5ce7", "#a29bfe"];

export default function PlaybackQualityCharts({ data }: Props) {
    return (
        <div className="flex flex-col gap-6">
            {/* Overview stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="text-center">
                    <p className="text-xs text-muted">
                        Total Errors
                        <InfoTooltip text="Total playback errors encountered by the Spotify client." />
                    </p>
                    <p className="text-2xl font-bold text-[#e74c3c]">
                        {data.totalErrors.toLocaleString()}
                    </p>
                </div>
                <div className="text-center">
                    <p className="text-xs text-muted">
                        Fatal Errors
                        <InfoTooltip text="Errors that completely stopped playback." />
                    </p>
                    <p className="text-2xl font-bold text-[#e74c3c]">
                        {data.fatalErrors.toLocaleString()}
                    </p>
                </div>
                <div className="text-center">
                    <p className="text-xs text-muted">
                        Total Stutters
                        <InfoTooltip text="Audio stutter events detected during playback." />
                    </p>
                    <p className="text-2xl font-bold text-[#f39c12]">
                        {data.totalStutters.toLocaleString()}
                    </p>
                </div>
                <div className="text-center">
                    <p className="text-xs text-muted">
                        Error Retry Rate
                        <InfoTooltip text="When a playback error occurs, how often you retry the same track vs skip to something else." />
                    </p>
                    <p className="text-2xl font-bold text-accent">
                        {data.errorToleranceRetryPct}%
                    </p>
                    <p className="text-[10px] text-muted">
                        {data.errorToleranceRetries} retries /{" "}
                        {data.errorToleranceSkips} skips
                    </p>
                </div>
            </div>

            {/* Audio Quality Profile */}
            {data.bitrateDistribution.length > 0 && (() => {
                const total = data.bitrateDistribution.reduce((s, d) => s + d.count, 0);
                const withPct = data.bitrateDistribution.map((d, i) => ({
                    ...d,
                    pct: total > 0 ? Math.round((d.count / total) * 100) : 0,
                    color: PIE_COLORS[i % PIE_COLORS.length],
                }));
                return (
                    <div>
                        <h4 className="text-xs text-muted mb-2">
                            Audio Quality Profile
                            <InfoTooltip text="Distribution of audio bitrates across your downloads. Higher bitrate = better quality." />
                        </h4>
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart>
                                    <Pie
                                        data={data.bitrateDistribution}
                                        dataKey="count"
                                        nameKey="bitrate"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={80}
                                        label={({ name, percent }) => {
                                            const p = (percent ?? 0) * 100;
                                            return p >= 5 ? `${name} (${p.toFixed(0)}%)` : "";
                                        }}
                                        labelLine={false}
                                        fontSize={11}
                                    >
                                        {withPct.map((entry, i) => (
                                            <Cell key={i} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "#1e1e1e",
                                            border: "1px solid #2a2a2a",
                                            borderRadius: 8,
                                            fontSize: 12,
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            {/* Legend for all slices */}
                            <div className="flex flex-col gap-1.5 min-w-[140px]">
                                {withPct.map((entry, i) => (
                                    <div key={i} className="flex items-center gap-2 text-xs">
                                        <div
                                            className="w-3 h-3 rounded-sm shrink-0"
                                            style={{ backgroundColor: entry.color }}
                                        />
                                        <span className="text-[#e0e0e0]">
                                            {entry.bitrate}
                                        </span>
                                        <span className="text-muted ml-auto">
                                            {entry.pct}%
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* Error Rate Over Time */}
            {data.errorOverTime.length > 0 && (
                <div>
                    <h4 className="text-xs text-muted mb-2">
                        Playback Error Rate Over Time
                        <InfoTooltip text="Weekly playback errors, split by severity. Fatal errors stop playback entirely." />
                    </h4>
                    <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={data.errorOverTime}>
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
                            <Line
                                type="monotone"
                                dataKey="total"
                                stroke="#f39c12"
                                strokeWidth={2}
                                dot={false}
                                name="Total"
                            />
                            <Line
                                type="monotone"
                                dataKey="fatal"
                                stroke="#e74c3c"
                                strokeWidth={2}
                                dot={false}
                                name="Fatal"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Stutter Timeline */}
            {data.stutterTimeline.length > 0 && (
                <div>
                    <h4 className="text-xs text-muted mb-2">
                        Stutter Timeline
                        <InfoTooltip text="Audio stutter events detected per week. Stutters can indicate network issues or device performance problems." />
                    </h4>
                    <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={data.stutterTimeline}>
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
                                formatter={(value) => [value, "Stutters"]}
                            />
                            <Bar
                                dataKey="count"
                                fill="#f39c12"
                                radius={[2, 2, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Download Activity */}
            {data.downloadOverTime.length > 0 && (
                <div>
                    <h4 className="text-xs text-muted mb-2">
                        Download Activity Over Time
                        <InfoTooltip text="Weekly track downloads. Bursts may indicate preparing for offline listening (flights, trips)." />
                    </h4>
                    <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={data.downloadOverTime}>
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
                                formatter={(value) => [value, "Downloads"]}
                            />
                            <Bar
                                dataKey="downloads"
                                fill="#6c5ce7"
                                radius={[2, 2, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}
