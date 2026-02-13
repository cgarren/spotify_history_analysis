"use client";

import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
} from "recharts";
import { SearchBehavior } from "../../types";
import InfoTooltip from "../InfoTooltip";

interface Props {
    data: SearchBehavior;
}

function truncate(s: string, max: number) {
    return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

export default function SearchBehaviorCharts({ data }: Props) {
    return (
        <div className="flex flex-col gap-6">
            {/* Overview stats */}
            <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                    <p className="text-xs text-muted">
                        Total Searches
                        <InfoTooltip text="Searches where you clicked on a result. Partial typing is filtered out." />
                    </p>
                    <p className="text-2xl font-bold text-accent">
                        {data.totalSearches.toLocaleString()}
                    </p>
                </div>
                <div className="text-center">
                    <p className="text-xs text-muted">
                        Unique Queries
                        <InfoTooltip text="Number of distinct search terms you used." />
                    </p>
                    <p className="text-2xl font-bold text-accent">
                        {data.uniqueQueries.toLocaleString()}
                    </p>
                </div>
                <div className="text-center">
                    <p className="text-xs text-muted">
                        Avg / Day
                        <InfoTooltip text="Average meaningful searches per day over the search history period." />
                    </p>
                    <p className="text-2xl font-bold text-accent">
                        {data.avgSearchesPerDay}
                    </p>
                </div>
            </div>

            {/* Search activity over time */}
            <div>
                <h4 className="text-xs text-muted mb-2">
                    Search Activity Over Time
                    <InfoTooltip text="Monthly count of searches that led to a result click." />
                </h4>
                <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={data.overTime}>
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
                            formatter={(value) => [value, "Searches"]}
                        />
                        <Bar
                            dataKey="count"
                            fill="#1e90ff"
                            radius={[2, 2, 0, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Top search queries */}
            <div>
                <h4 className="text-xs text-muted mb-2">
                    Top Search Queries
                    <InfoTooltip text="Your most frequently searched terms that led to clicking a result." />
                </h4>
                <ResponsiveContainer
                    width="100%"
                    height={Math.max(300, data.topQueries.length * 24)}
                >
                    <BarChart
                        data={data.topQueries}
                        layout="vertical"
                        margin={{ left: 10 }}
                    >
                        <XAxis type="number" fontSize={10} />
                        <YAxis
                            type="category"
                            dataKey="query"
                            width={160}
                            tick={{ fontSize: 10 }}
                            tickFormatter={(v: string) => truncate(v, 22)}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "#1e1e1e",
                                border: "1px solid #2a2a2a",
                                borderRadius: 8,
                                fontSize: 12,
                            }}
                            formatter={(value) => [value, "Times searched"]}
                        />
                        <Bar
                            dataKey="count"
                            fill="#1e90ff"
                            radius={[0, 4, 4, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Search hour-of-day */}
            <div>
                <h4 className="text-xs text-muted mb-2">
                    When You Search
                    <InfoTooltip text="Distribution of your searches by hour of day." />
                </h4>
                <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={data.hourOfDay}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                        <XAxis
                            dataKey="hour"
                            tickFormatter={(v: number) =>
                                v === 0
                                    ? "12a"
                                    : v < 12
                                      ? `${v}a`
                                      : v === 12
                                        ? "12p"
                                        : `${v - 12}p`
                            }
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
                            labelFormatter={(v) => {
                                const n = Number(v);
                                const ampm = n < 12 ? "AM" : "PM";
                                const h = n === 0 ? 12 : n > 12 ? n - 12 : n;
                                return `${h}:00 ${ampm}`;
                            }}
                            formatter={(value) => [value, "Searches"]}
                        />
                        <Bar
                            dataKey="count"
                            fill="#1e90ff"
                            radius={[2, 2, 0, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
