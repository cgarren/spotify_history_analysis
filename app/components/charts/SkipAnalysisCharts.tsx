"use client";

import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    LineChart,
    Line,
    CartesianGrid,
} from "recharts";
import { SkipByArtist, SkipRateOverTime } from "../../types";
import InfoTooltip from "../InfoTooltip";

interface Props {
    byArtist: SkipByArtist[];
    overTime: SkipRateOverTime[];
}

export default function SkipAnalysisCharts({ byArtist, overTime }: Props) {
    return (
        <div className="flex flex-col gap-6">
            <div>
                <h4 className="text-xs text-muted mb-2">
                    Skip Rate by Top Artists (%)
                    <InfoTooltip text="Percentage of plays that were skipped for each of your most-played artists. Higher = more skips." />
                </h4>
                <ResponsiveContainer width="100%" height={500}>
                    <BarChart
                        data={byArtist}
                        layout="vertical"
                        margin={{ left: 10 }}
                    >
                        <XAxis
                            type="number"
                            tickFormatter={(v: number) => `${v}%`}
                            domain={[0, 100]}
                        />
                        <YAxis
                            type="category"
                            dataKey="name"
                            width={140}
                            tick={{ fontSize: 11 }}
                            interval={0}
                        />
                        <Tooltip
                            formatter={(value, name) => {
                                if (name === "skipRate")
                                    return [`${value}%`, "Skip Rate"];
                                return [value, name];
                            }}
                        />
                        <Bar
                            dataKey="skipRate"
                            fill="#ff6b6b"
                            radius={[0, 4, 4, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <div>
                <h4 className="text-xs text-muted mb-2">
                    Skip Rate Over Time
                    <InfoTooltip text="Your overall monthly skip rate. A skip is when you advance to the next track before it finishes." />
                </h4>
                <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={overTime}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                            dataKey="month"
                            tickFormatter={(v: string) => v.slice(2)}
                            minTickGap={40}
                            fontSize={10}
                        />
                        <YAxis tickFormatter={(v: number) => `${v}%`} />
                        <Tooltip
                            formatter={(value) => [`${value}%`, "Skip Rate"]}
                        />
                        <Line
                            type="monotone"
                            dataKey="skipRate"
                            stroke="#ff6b6b"
                            strokeWidth={2}
                            dot={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
