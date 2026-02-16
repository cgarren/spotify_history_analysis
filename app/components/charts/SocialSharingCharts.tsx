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
} from "recharts";
import { SocialSharing } from "../../types";
import InfoTooltip from "../InfoTooltip";

interface Props {
    data: SocialSharing;
}

const PIE_COLORS = ["#1db954", "#6bcb77", "#ff6b6b", "#ffd93d", "#6c5ce7", "#a29bfe", "#fd79a8"];

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
            {data.sessions.length > 0 && (
                <div>
                    <h4 className="text-xs text-muted mb-2">
                        Social Session Timeline (Last 20)
                        <InfoTooltip text="Each bar represents a social listening session. Length indicates duration. Showing the 20 most recent." />
                    </h4>
                    <div className="space-y-1">
                        {data.sessions.slice(-20).map((session, i) => {
                            const maxDuration = Math.max(
                                ...data.sessions.map(
                                    (s) => s.durationMinutes,
                                ),
                                1,
                            );
                            const widthPct = Math.max(
                                (session.durationMinutes / maxDuration) * 100,
                                5,
                            );
                            const startDate = new Date(
                                session.start,
                            ).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                            });
                            return (
                                <div key={i} className="flex items-center gap-2">
                                    <span className="text-[10px] text-muted w-16 text-right shrink-0">
                                        {startDate}
                                    </span>
                                    <div
                                        className="h-5 rounded bg-accent/70 flex items-center px-2"
                                        style={{ width: `${widthPct}%` }}
                                        title={`${session.durationMinutes} min`}
                                    >
                                        <span className="text-[10px] text-white whitespace-nowrap">
                                            {session.durationMinutes} min
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

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
                                    if (
                                        !active ||
                                        !payload ||
                                        !payload.length
                                    )
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
