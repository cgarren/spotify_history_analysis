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
} from "recharts";
import { ApiLatency } from "../../types";
import InfoTooltip from "../InfoTooltip";

interface Props {
    data: ApiLatency;
}

function truncate(s: string, max: number) {
    return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

export default function ApiLatencyCharts({ data }: Props) {
    return (
        <div className="flex flex-col gap-6">
            {/* Responsiveness Score */}
            <div className="flex items-center gap-4">
                <div className="bg-[#1a1a1a] rounded-lg p-4 text-center">
                    <p className="text-xs text-muted">
                        Median API Latency
                        <InfoTooltip text="Median response time across all Spotify API requests from your client. Lower is better." />
                    </p>
                    <p className="text-3xl font-bold text-accent">
                        {data.medianLatency}
                        <span className="text-sm text-muted ml-1">ms</span>
                    </p>
                </div>
            </div>

            {/* Latency Over Time */}
            {data.latencyOverTime.length > 0 && (
                <div>
                    <h4 className="text-xs font-medium text-muted uppercase tracking-wide mb-3">
                        Latency Over Time
                        <InfoTooltip text="Weekly average and P95 (worst 5%) API latency. Shows if Spotify is getting faster or slower for you." />
                    </h4>
                    <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={data.latencyOverTime}>
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
                            <YAxis
                                fontSize={10}
                                tickFormatter={(v) => `${v}ms`}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "#1e1e1e",
                                    border: "1px solid #2a2a2a",
                                    borderRadius: 8,
                                    fontSize: 12,
                                }}
                                formatter={(value, name) => [
                                    `${value}ms`,
                                    name,
                                ]}
                            />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="avg"
                                stroke="#1db954"
                                strokeWidth={2}
                                dot={false}
                                name="Average"
                            />
                            <Line
                                type="monotone"
                                dataKey="p95"
                                stroke="#f39c12"
                                strokeWidth={2}
                                dot={false}
                                name="P95"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Feature Usage Fingerprint */}
            {data.featureFingerprint.length > 0 && (
                <div>
                    <h4 className="text-xs font-medium text-muted uppercase tracking-wide mb-3">
                        Feature Usage Fingerprint
                        <InfoTooltip text="Top API operations reveal which Spotify features you use most — search, recommendations, playlists, player controls, etc." />
                    </h4>
                    <ResponsiveContainer
                        width="100%"
                        height={Math.max(
                            250,
                            Math.min(data.featureFingerprint.length, 20) * 24,
                        )}
                    >
                        <BarChart
                            data={data.featureFingerprint}
                            layout="vertical"
                            margin={{ left: 10 }}
                        >
                            <XAxis type="number" fontSize={10} />
                            <YAxis
                                type="category"
                                dataKey="operation"
                                width={160}
                                tick={{ fontSize: 9 }}
                                tickFormatter={(v: string) => truncate(v, 25)}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "#1e1e1e",
                                    border: "1px solid #2a2a2a",
                                    borderRadius: 8,
                                    fontSize: 12,
                                }}
                                formatter={(value) => [
                                    value,
                                    "Requests",
                                ]}
                            />
                            <Bar
                                dataKey="count"
                                fill="#1db954"
                                radius={[0, 4, 4, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* API Endpoint Breakdown */}
            {data.endpointBreakdown.length > 0 && (
                <div>
                    <h4 className="text-xs font-medium text-muted uppercase tracking-wide mb-3">
                        API Endpoint Breakdown
                        <InfoTooltip text="Most-called Spotify Web API endpoints, revealing the raw HTTP requests your apps make." />
                    </h4>
                    <ResponsiveContainer
                        width="100%"
                        height={Math.max(
                            200,
                            Math.min(data.endpointBreakdown.length, 15) * 24,
                        )}
                    >
                        <BarChart
                            data={data.endpointBreakdown}
                            layout="vertical"
                            margin={{ left: 10 }}
                        >
                            <XAxis type="number" fontSize={10} />
                            <YAxis
                                type="category"
                                dataKey="endpoint"
                                width={180}
                                tick={{ fontSize: 9 }}
                                tickFormatter={(v: string) => truncate(v, 28)}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "#1e1e1e",
                                    border: "1px solid #2a2a2a",
                                    borderRadius: 8,
                                    fontSize: 12,
                                }}
                                formatter={(value) => [value, "Requests"]}
                            />
                            <Bar
                                dataKey="count"
                                fill="#6c5ce7"
                                radius={[0, 4, 4, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Error Rate Over Time */}
            {data.errorOverTime.length > 0 && (
                <div>
                    <h4 className="text-xs font-medium text-muted uppercase tracking-wide mb-3">
                        API Error Rate Over Time
                        <InfoTooltip text="Percentage of HTTP requests that returned error status codes (4xx/5xx) each week." />
                    </h4>
                    <ResponsiveContainer width="100%" height={180}>
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
                            <YAxis
                                fontSize={10}
                                tickFormatter={(v) => `${v}%`}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "#1e1e1e",
                                    border: "1px solid #2a2a2a",
                                    borderRadius: 8,
                                    fontSize: 12,
                                }}
                                formatter={(value, name) => {
                                    if (name === "errorRate")
                                        return [`${value}%`, "Error Rate"];
                                    return [value, String(name)];
                                }}
                            />
                            <Line
                                type="monotone"
                                dataKey="errorRate"
                                stroke="#e74c3c"
                                strokeWidth={2}
                                dot={false}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}
