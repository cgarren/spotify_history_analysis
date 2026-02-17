"use client";

import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
} from "recharts";
import { SocialSharing } from "../../types";
import InfoTooltip from "../InfoTooltip";

interface Props {
    data: SocialSharing;
}

const PIE_COLORS = [
    "#1db954",
    "#6bcb77",
    "#ff6b6b",
    "#ffd93d",
    "#6c5ce7",
    "#a29bfe",
    "#fd79a8",
];

function truncate(s: string, max: number) {
    return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

export default function SocialSharingCharts({ data }: Props) {
    return (
        <div className="flex flex-col gap-6">
            {/* Overview stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="text-center">
                    <p className="text-xs text-muted">
                        Social Sessions
                        <InfoTooltip text="Total social listening sessions (Jam/Group sessions) you participated in." />
                    </p>
                    <p className="text-2xl font-bold text-accent">
                        {data.totalSocialSessions}
                    </p>
                </div>
                <div className="text-center">
                    <p className="text-xs text-muted">
                        Avg Duration
                        <InfoTooltip text="Average length of social listening sessions in minutes." />
                    </p>
                    <p className="text-2xl font-bold text-accent">
                        {data.avgSessionMinutes}
                    </p>
                    <p className="text-[10px] text-muted">minutes</p>
                </div>
                <div className="text-center">
                    <p className="text-xs text-muted">
                        Longest Session
                        <InfoTooltip text="Your longest social listening session." />
                    </p>
                    <p className="text-2xl font-bold text-accent">
                        {data.longestSessionMinutes}
                    </p>
                    <p className="text-[10px] text-muted">minutes</p>
                </div>
                <div className="text-center">
                    <p className="text-xs text-muted">
                        Total Shares
                        <InfoTooltip text="Total times you shared Spotify content (tracks, playlists, albums)." />
                    </p>
                    <p className="text-2xl font-bold text-accent">
                        {data.totalShares}
                    </p>
                </div>
            </div>

            {/* Social Session Timeline */}
            {data.sessions.length > 0 &&
                (() => {
                    // Aggregate sessions into weekly averages
                    const weekMap = new Map<
                        string,
                        { total: number; count: number }
                    >();
                    for (const s of data.sessions) {
                        const d = new Date(s.start);
                        // Week start (Monday)
                        const day = d.getDay();
                        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
                        const weekStart = new Date(d);
                        weekStart.setDate(diff);
                        const key = weekStart.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "2-digit",
                        });
                        const existing = weekMap.get(key) ?? {
                            total: 0,
                            count: 0,
                        };
                        existing.total += s.durationMinutes;
                        existing.count += 1;
                        weekMap.set(key, existing);
                    }
                    const weeklyData = Array.from(weekMap.entries()).map(
                        ([week, v]) => ({
                            week,
                            avgMinutes: Math.round(v.total / v.count),
                            sessions: v.count,
                        }),
                    );

                    return (
                        <div>
                            <h4 className="text-xs text-muted mb-2">
                                Avg Session Minutes by Week
                                <InfoTooltip text="Average social listening session duration per week." />
                            </h4>
                            <ResponsiveContainer width="100%" height={220}>
                                <LineChart
                                    data={weeklyData}
                                    margin={{
                                        top: 5,
                                        right: 20,
                                        bottom: 5,
                                        left: 0,
                                    }}
                                >
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke="#2a2a2a"
                                    />
                                    <XAxis dataKey="week" fontSize={10} />
                                    <YAxis
                                        fontSize={10}
                                        tickFormatter={(v: number) => `${v}m`}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "#1e1e1e",
                                            border: "1px solid #2a2a2a",
                                            borderRadius: 8,
                                            fontSize: 12,
                                        }}
                                        formatter={(value, name) => {
                                            if (name === "avgMinutes")
                                                return [
                                                    `${value} min`,
                                                    "Avg Duration",
                                                ];
                                            return [value, name];
                                        }}
                                        labelFormatter={(label, payload) => {
                                            const item = payload?.[0]?.payload;
                                            return item
                                                ? `Week of ${label} (${item.sessions} session${item.sessions !== 1 ? "s" : ""})`
                                                : label;
                                        }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="avgMinutes"
                                        stroke="#1db954"
                                        strokeWidth={2}
                                        dot={{ r: 4, fill: "#1db954" }}
                                        activeDot={{ r: 6 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    );
                })()}

            {/* Share Destinations + Share Over Time side by side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Share Destinations */}
                {data.shareDestinations.length > 0 && (
                    <div>
                        <h4 className="text-xs text-muted mb-2">
                            Share Destinations
                            <InfoTooltip text="Where you share Spotify content — SMS, copy link, native share, etc." />
                        </h4>
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie
                                    data={data.shareDestinations}
                                    dataKey="count"
                                    nameKey="destination"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={70}
                                    label={({ name, percent }) =>
                                        `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`
                                    }
                                    labelLine
                                    fontSize={10}
                                >
                                    {data.shareDestinations.map((_, i) => (
                                        <Cell
                                            key={i}
                                            fill={
                                                PIE_COLORS[
                                                    i % PIE_COLORS.length
                                                ]
                                            }
                                        />
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
                    </div>
                )}

                {/* Share Over Time */}
                {data.shareOverTime.length > 0 && (
                    <div>
                        <h4 className="text-xs text-muted mb-2">
                            Share Activity Over Time
                            <InfoTooltip text="Monthly count of shares. Shows when you feel most compelled to share music." />
                        </h4>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={data.shareOverTime}>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="#2a2a2a"
                                />
                                <XAxis
                                    dataKey="month"
                                    tickFormatter={(v: string) => v.slice(2)}
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
                                    formatter={(value) => [value, "Shares"]}
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

            {/* Share-Worthy Threshold */}
            {data.shareWorthyThreshold.length > 0 && (
                <div>
                    <h4 className="text-xs text-muted mb-2">
                        Share-Worthy Threshold
                        <InfoTooltip text="How many times you listened to a track before sharing it. Shows your confidence threshold before recommending music." />
                    </h4>
                    <ResponsiveContainer
                        width="100%"
                        height={Math.max(
                            150,
                            data.shareWorthyThreshold.length * 28,
                        )}
                    >
                        <BarChart
                            data={data.shareWorthyThreshold}
                            layout="vertical"
                            margin={{ left: 10 }}
                        >
                            <XAxis type="number" fontSize={10} />
                            <YAxis
                                type="category"
                                dataKey="name"
                                width={160}
                                tick={{ fontSize: 10 }}
                                tickFormatter={(v: string) => truncate(v, 22)}
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
                                            <p className="text-[#888] text-xs">
                                                by {row.artist}
                                            </p>
                                            <p className="text-accent font-semibold">
                                                {row.priorPlays} plays before
                                                sharing
                                            </p>
                                        </div>
                                    );
                                }}
                            />
                            <Bar
                                dataKey="priorPlays"
                                fill="#1db954"
                                radius={[0, 4, 4, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}
