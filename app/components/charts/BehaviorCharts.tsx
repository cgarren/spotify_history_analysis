"use client";

import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
} from "recharts";
import { ReasonBreakdown, ShuffleOverTime } from "../../types";
import InfoTooltip from "../InfoTooltip";

interface Props {
    reasons: ReasonBreakdown;
    shuffleOverTime: ShuffleOverTime[];
    avgListenMinutes: number;
}

const PIE_COLORS = [
    "#1db954",
    "#1e90ff",
    "#ff6b6b",
    "#ffd93d",
    "#6bcb77",
    "#9b59b6",
    "#e67e22",
    "#1abc9c",
    "#e91e63",
    "#00bcd4",
];

export default function BehaviorCharts({
    reasons,
    shuffleOverTime,
    avgListenMinutes,
}: Props) {
    // Only show top 6 reasons for cleaner pies
    const startReasons = reasons.start.slice(0, 6);
    const endReasons = reasons.end.slice(0, 6);

    return (
        <div className="flex flex-col gap-6">
            <div className="text-center">
                <p className="text-xs font-medium text-muted uppercase tracking-wide mb-1">
                    Avg Listen Duration
                    <InfoTooltip text="Average time spent on each play event, including partial listens and skips." />
                </p>
                <p className="text-2xl font-bold text-accent">
                    {avgListenMinutes.toFixed(1)} min
                </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <h4 className="text-xs font-medium text-muted uppercase tracking-wide mb-3 text-center">
                        Playback Start Reason
                        <InfoTooltip text="What triggered each play: clickrow = you tapped a song, trackdone = autoplay after previous track, fwdbtn = skip forward, etc." />
                    </h4>
                    <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                            <Pie
                                data={startReasons}
                                dataKey="count"
                                nameKey="reason"
                                cx="50%"
                                cy="50%"
                                outerRadius={70}
                                fontSize={10}
                            >
                                {startReasons.map((_, i) => (
                                    <Cell
                                        key={i}
                                        fill={PIE_COLORS[i % PIE_COLORS.length]}
                                    />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend wrapperStyle={{ fontSize: 10 }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div>
                    <h4 className="text-xs font-medium text-muted uppercase tracking-wide mb-3 text-center">
                        Playback End Reason
                        <InfoTooltip text="Why each play ended: trackdone = song finished, fwdbtn = skipped, endplay = you stopped, backbtn = went back, etc." />
                    </h4>
                    <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                            <Pie
                                data={endReasons}
                                dataKey="count"
                                nameKey="reason"
                                cx="50%"
                                cy="50%"
                                outerRadius={70}
                                fontSize={10}
                            >
                                {endReasons.map((_, i) => (
                                    <Cell
                                        key={i}
                                        fill={PIE_COLORS[i % PIE_COLORS.length]}
                                    />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend wrapperStyle={{ fontSize: 10 }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
            <div>
                <h4 className="text-xs font-medium text-muted uppercase tracking-wide mb-3">
                    Shuffle Usage Over Time
                    <InfoTooltip text="Percentage of plays each month where shuffle mode was active." />
                </h4>
                <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={shuffleOverTime}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                            dataKey="month"
                            tickFormatter={(v: string) => v.slice(2)}
                            minTickGap={40}
                            fontSize={10}
                        />
                        <YAxis tickFormatter={(v: number) => `${v}%`} />
                        <Tooltip
                            formatter={(value) => [`${value}%`, "Shuffle Rate"]}
                        />
                        <Line
                            type="monotone"
                            dataKey="shuffleRate"
                            stroke="#ffd93d"
                            strokeWidth={2}
                            dot={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
