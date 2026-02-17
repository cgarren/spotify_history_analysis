"use client";

import { useState } from "react";

import {
    ResponsiveContainer,
    BarChart,
    LineChart,
    Line,
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

function truncateSmart(s: string, max: number) {
    if (s.length <= max) return s;
    const candidate = s.slice(0, max + 1);
    const lastSpace = candidate.lastIndexOf(" ");
    if (lastSpace >= Math.floor(max * 0.55)) {
        return s.slice(0, lastSpace) + "…";
    }
    return s.slice(0, max - 1) + "…";
}

function formatWeekTick(week: string) {
    if (!week) return "";
    const [startRaw] = week.split("/");
    const start = new Date(`${startRaw}T00:00:00`);
    if (Number.isNaN(start.getTime())) return startRaw ?? week;

    return start.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
    });
}

function formatWeekRangeLabel(week: string) {
    if (!week) return "";
    const [startRaw, endRaw] = week.split("/");
    const start = new Date(`${startRaw}T00:00:00`);
    const end = new Date(`${endRaw}T00:00:00`);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return week;
    }

    const startMonthDay = start.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
    });
    const endMonthDay = end.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
    });

    if (start.getFullYear() === end.getFullYear()) {
        return `${startMonthDay} – ${endMonthDay}, ${start.getFullYear()}`;
    }

    return `${startMonthDay}, ${start.getFullYear()} – ${endMonthDay}, ${end.getFullYear()}`;
}

export default function SearchBehaviorCharts({ data }: Props) {
    const [hoveredQuery, setHoveredQuery] = useState<{
        x: number;
        y: number;
        query: string;
        count: number;
    } | null>(null);

    const maxQueryCount = Math.max(...data.topQueries.map((q) => q.count), 1);
    const centerWeightedQueries = [...data.topQueries].sort(
        (a, b) => b.count - a.count || a.query.localeCompare(b.query),
    );

    const placedBubbles: Array<{
        query: string;
        count: number;
        radius: number;
        x: number;
        y: number;
        fontSize: number;
        fontWeight: 500 | 600 | 700;
        bgAlpha: number;
        maxChars: number;
    }> = [];

    const CLOUD_WIDTH = 1000;
    const CLOUD_HEIGHT = 460;
    const CENTER_X = CLOUD_WIDTH / 2;
    const CENTER_Y = CLOUD_HEIGHT / 2 + 10;
    const SAFE_PADDING = 10;
    const CLUSTER_RX = 420;
    const CLUSTER_RY = 170;

    function inCluster(x: number, y: number, radius: number) {
        const nx = (x - CENTER_X) / (CLUSTER_RX - radius);
        const ny = (y - CENTER_Y) / (CLUSTER_RY - radius);
        return nx * nx + ny * ny <= 1;
    }

    for (const q of centerWeightedQueries) {
        const scale = q.count / maxQueryCount;
        const baseRadius = 40 + scale * 34;
        let radius = baseRadius;
        let bestX = CENTER_X;
        let bestY = CENTER_Y;
        let placed = false;
        const minRadius = 16;

        for (let shrinkStep = 0; shrinkStep < 16 && !placed; shrinkStep++) {
            if (shrinkStep > 0) {
                radius = Math.max(
                    minRadius,
                    baseRadius * (1 - shrinkStep * 0.08),
                );
            }

            for (let step = 0; step < 12000; step++) {
                const angle = step * 0.37;
                const spiral = Math.sqrt(step) * 6.4;
                const x = CENTER_X + Math.cos(angle) * spiral;
                const y = CENTER_Y + Math.sin(angle) * spiral * 0.8;

                if (
                    x - radius < SAFE_PADDING ||
                    x + radius > CLOUD_WIDTH - SAFE_PADDING ||
                    y - radius < SAFE_PADDING ||
                    y + radius > CLOUD_HEIGHT - SAFE_PADDING
                ) {
                    continue;
                }

                if (!inCluster(x, y, radius)) {
                    continue;
                }

                const collides = placedBubbles.some((bubble) => {
                    const dx = bubble.x - x;
                    const dy = bubble.y - y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    return distance < bubble.radius + radius + 6;
                });

                if (!collides) {
                    bestX = x;
                    bestY = y;
                    placed = true;
                    break;
                }
            }
        }

        if (!placed) {
            let bestFallback: { x: number; y: number; dist: number } | null =
                null;
            for (
                let gy = SAFE_PADDING + 20;
                gy <= CLOUD_HEIGHT - SAFE_PADDING - 20;
                gy += 10
            ) {
                for (
                    let gx = SAFE_PADDING + 20;
                    gx <= CLOUD_WIDTH - SAFE_PADDING - 20;
                    gx += 10
                ) {
                    if (!inCluster(gx, gy, radius)) continue;
                    const collides = placedBubbles.some((bubble) => {
                        const dx = bubble.x - gx;
                        const dy = bubble.y - gy;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        return distance < bubble.radius + radius + 6;
                    });
                    if (collides) continue;
                    const dxCenter = gx - CENTER_X;
                    const dyCenter = gy - CENTER_Y;
                    const dist = dxCenter * dxCenter + dyCenter * dyCenter;
                    if (!bestFallback || dist < bestFallback.dist) {
                        bestFallback = { x: gx, y: gy, dist };
                    }
                }
            }
            if (bestFallback) {
                bestX = bestFallback.x;
                bestY = bestFallback.y;
                placed = true;
            }
        }

        if (!placed) {
            continue;
        }

        placedBubbles.push({
            query: q.query,
            count: q.count,
            radius,
            x: bestX,
            y: bestY,
            fontSize: 11 + Math.round(scale * 17),
            fontWeight: scale > 0.75 ? 700 : scale > 0.45 ? 600 : 500,
            bgAlpha: 0.12 + scale * 0.2,
            maxChars: Math.max(10, Math.floor((radius * 2) / 8.8)),
        });
    }

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
                <h4 className="text-xs font-medium text-muted uppercase tracking-wide mb-3">
                    Search Activity Over Time
                    <InfoTooltip text="Weekly count of searches that led to a result click." />
                </h4>
                <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={data.overTime}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                        <XAxis
                            dataKey="week"
                            tickFormatter={(v: string) => formatWeekTick(v)}
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
                            labelFormatter={(label) =>
                                formatWeekRangeLabel(String(label ?? ""))
                            }
                            formatter={(value) => [value, "Searches"]}
                        />
                        <Line
                            type="monotone"
                            dataKey="count"
                            stroke="#1e90ff"
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 4 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Top search queries */}
            <div>
                <h4 className="text-xs font-medium text-muted uppercase tracking-wide mb-3">
                    Top Search Queries
                    <InfoTooltip text="Your most frequently searched terms that led to clicking a result." />
                </h4>
                <div className="rounded-lg border border-card-border bg-card-bg p-3 min-h-[320px]">
                    <p className="text-xs text-muted mb-3">
                        Bigger bubbles = searched more
                    </p>
                    <div className="relative">
                        <svg
                            className="w-full h-[320px]"
                            viewBox={`0 0 ${CLOUD_WIDTH} ${CLOUD_HEIGHT}`}
                            role="img"
                            aria-label="Top search query bubble cloud"
                        >
                            {placedBubbles.map((bubble, i) => (
                                <g
                                    key={`${bubble.query}-${i}`}
                                    onMouseMove={(e) => {
                                        const native =
                                            e.nativeEvent as MouseEvent;
                                        setHoveredQuery({
                                            x: native.offsetX,
                                            y: native.offsetY,
                                            query: bubble.query,
                                            count: bubble.count,
                                        });
                                    }}
                                    onMouseLeave={() => setHoveredQuery(null)}
                                >
                                    <title>{`${bubble.query} • ${bubble.count} searches`}</title>
                                    <circle
                                        cx={bubble.x}
                                        cy={bubble.y}
                                        r={bubble.radius}
                                        stroke="#1e90ff"
                                        strokeWidth={2}
                                        fill={`rgba(30, 144, 255, ${bubble.bgAlpha.toFixed(2)})`}
                                    />
                                    <text
                                        x={bubble.x}
                                        y={bubble.y}
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        fill="#e0e0e0"
                                        style={{
                                            fontSize: `${bubble.fontSize}px`,
                                            fontWeight: bubble.fontWeight,
                                            pointerEvents: "none",
                                        }}
                                    >
                                        {truncateSmart(
                                            bubble.query,
                                            bubble.maxChars,
                                        )}
                                    </text>
                                </g>
                            ))}
                        </svg>
                        {hoveredQuery && (
                            <div
                                className="pointer-events-none absolute bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm"
                                style={{
                                    left: hoveredQuery.x + 10,
                                    top: hoveredQuery.y + 10,
                                    zIndex: 200,
                                }}
                            >
                                <p className="font-medium text-[#e0e0e0]">
                                    {hoveredQuery.query}
                                </p>
                                <p className="text-[#1e90ff] font-semibold mt-1">
                                    {hoveredQuery.count} searches
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Search hour-of-day */}
            <div>
                <h4 className="text-xs font-medium text-muted uppercase tracking-wide mb-3">
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
