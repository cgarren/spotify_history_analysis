"use client";

import { useState } from "react";
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
} from "recharts";
import { DeviceEvolution, VersionEvent, OsVersionEvent } from "../../types";
import InfoTooltip from "../InfoTooltip";

interface Props {
    data: DeviceEvolution;
}

/* ------------------------------------------------------------------ */
/*  Segmented Timeline Component                                       */
/* ------------------------------------------------------------------ */

interface TimelineSegment {
    label: string;
    startDate: Date;
    endDate: Date;
}

interface TimelineLane {
    name: string;
    color: string;
    segments: TimelineSegment[];
}

function buildSegments(
    items: { date: string; label: string }[],
    globalEnd: Date,
): TimelineSegment[] {
    if (items.length === 0) return [];
    const sorted = [...items].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
    return sorted.map((item, i) => ({
        label: item.label,
        startDate: new Date(item.date),
        endDate:
            i < sorted.length - 1
                ? new Date(sorted[i + 1].date)
                : globalEnd,
    }));
}

function formatDate(d: Date): string {
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDateFull(d: Date): string {
    return d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

function SegmentedTimeline({ lanes }: { lanes: TimelineLane[] }) {
    const [hoveredSeg, setHoveredSeg] = useState<{
        lane: number;
        seg: number;
        x: number;
        y: number;
    } | null>(null);

    // Global time range across all lanes
    let globalMin = Infinity;
    let globalMax = -Infinity;
    for (const lane of lanes) {
        for (const seg of lane.segments) {
            globalMin = Math.min(globalMin, seg.startDate.getTime());
            globalMax = Math.max(globalMax, seg.endDate.getTime());
        }
    }
    if (!isFinite(globalMin) || !isFinite(globalMax)) return null;
    const totalMs = globalMax - globalMin;

    // Build date ticks (every ~2 months)
    const ticks: { pct: number; label: string }[] = [];
    const tickStart = new Date(globalMin);
    tickStart.setDate(1);
    tickStart.setMonth(tickStart.getMonth() + 1);
    const tickEnd = new Date(globalMax);
    const current = new Date(tickStart);
    while (current <= tickEnd) {
        const pct = ((current.getTime() - globalMin) / totalMs) * 100;
        if (pct >= 0 && pct <= 100) {
            ticks.push({
                pct,
                label: current.toLocaleDateString("en-US", {
                    month: "short",
                    year: "2-digit",
                }),
            });
        }
        current.setMonth(current.getMonth() + 2);
    }

    const LANE_COLORS = [
        ["#1db954", "#16a34a"], // green shades (alternating)
        ["#6c5ce7", "#8b7cf7"], // purple shades
    ];

    return (
        <div className="relative">
            {lanes.map((lane, li) => {
                const colors = LANE_COLORS[li % LANE_COLORS.length];
                return (
                    <div key={li} className="mb-3">
                        <p className="text-[10px] text-muted mb-1 font-semibold uppercase tracking-wide">
                            {lane.name}
                        </p>
                        <div className="relative h-8 rounded-md overflow-hidden bg-[#1a1a1a] flex">
                            {lane.segments.map((seg, si) => {
                                const startPct =
                                    ((seg.startDate.getTime() - globalMin) /
                                        totalMs) *
                                    100;
                                const widthPct =
                                    ((seg.endDate.getTime() -
                                        seg.startDate.getTime()) /
                                        totalMs) *
                                    100;
                                const bgColor = colors[si % colors.length];
                                return (
                                    <div
                                        key={si}
                                        className="h-full flex items-center justify-center overflow-hidden cursor-default relative"
                                        style={{
                                            width: `${widthPct}%`,
                                            backgroundColor: bgColor,
                                            borderRight:
                                                si < lane.segments.length - 1
                                                    ? "1px solid #121212"
                                                    : "none",
                                        }}
                                        onMouseEnter={(e) =>
                                            setHoveredSeg({
                                                lane: li,
                                                seg: si,
                                                x: e.clientX,
                                                y: e.clientY,
                                            })
                                        }
                                        onMouseLeave={() =>
                                            setHoveredSeg(null)
                                        }
                                    >
                                        {widthPct > 6 && (
                                            <span className="text-[9px] text-white font-medium truncate px-1">
                                                {seg.label}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}

            {/* Date axis */}
            <div className="relative h-4 mt-1">
                {ticks.map((tick, i) => (
                    <span
                        key={i}
                        className="absolute text-[9px] text-muted -translate-x-1/2"
                        style={{ left: `${tick.pct}%` }}
                    >
                        {tick.label}
                    </span>
                ))}
            </div>

            {/* Tooltip */}
            {hoveredSeg && (() => {
                const seg =
                    lanes[hoveredSeg.lane].segments[hoveredSeg.seg];
                return (
                    <div
                        className="fixed z-50 bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm pointer-events-none shadow-lg"
                        style={{
                            left: hoveredSeg.x + 12,
                            top: hoveredSeg.y - 40,
                        }}
                    >
                        <p className="font-semibold text-[#e0e0e0]">
                            {seg.label}
                        </p>
                        <p className="text-[10px] text-muted">
                            {formatDateFull(seg.startDate)} —{" "}
                            {formatDateFull(seg.endDate)}
                        </p>
                    </div>
                );
            })()}
        </div>
    );
}

export default function DeviceEvolutionCharts({ data }: Props) {
    // Build app version timeline lanes (split by platform)
    const appLanes: TimelineLane[] = [];
    if (data.appVersionTimeline.length > 0) {
        const allDates = data.appVersionTimeline.map(
            (e) => new Date(e.date).getTime(),
        );
        const globalEnd = new Date(Math.max(...allDates));
        globalEnd.setDate(globalEnd.getDate() + 7); // extend a week past last

        const mobile = data.appVersionTimeline
            .filter((e) => e.version.startsWith("8.") || e.version.startsWith("9."))
            .map((e) => ({ date: e.date, label: e.version }));
        const desktop = data.appVersionTimeline
            .filter((e) => e.version.startsWith("1."))
            .map((e) => ({ date: e.date, label: e.version }));

        if (mobile.length > 0) {
            appLanes.push({
                name: "Mobile (iOS)",
                color: "#1db954",
                segments: buildSegments(mobile, globalEnd),
            });
        }
        if (desktop.length > 0) {
            appLanes.push({
                name: "Desktop (macOS)",
                color: "#6c5ce7",
                segments: buildSegments(desktop, globalEnd),
            });
        }
    }

    // Build OS version timeline lanes (split by platform)
    const osLanes: TimelineLane[] = [];
    if (data.osVersionTimeline.length > 0) {
        const allDates = data.osVersionTimeline.map(
            (e) => new Date(e.date).getTime(),
        );
        const globalEnd = new Date(Math.max(...allDates));
        globalEnd.setDate(globalEnd.getDate() + 7);

        const ios = data.osVersionTimeline
            .filter((e) => e.os.startsWith("ios"))
            .map((e) => ({
                date: e.date,
                label: e.os.replace("ios ", "iOS "),
            }));
        const osx = data.osVersionTimeline
            .filter((e) => e.os.startsWith("osx"))
            .map((e) => ({
                date: e.date,
                label: e.os.replace("osx ", "macOS "),
            }));

        if (ios.length > 0) {
            osLanes.push({
                name: "iOS",
                color: "#1db954",
                segments: buildSegments(ios, globalEnd),
            });
        }
        if (osx.length > 0) {
            osLanes.push({
                name: "macOS",
                color: "#6c5ce7",
                segments: buildSegments(osx, globalEnd),
            });
        }
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Device Fingerprint Cards */}
            {data.deviceFingerprint.length > 0 && (
                <div>
                    <h4 className="text-xs font-medium text-muted uppercase tracking-wide mb-3">
                        Your Devices
                        <InfoTooltip text="All devices detected in your technical logs with first and last seen dates." />
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {data.deviceFingerprint.map((device, i) => (
                            <div
                                key={i}
                                className="bg-[#1a1a1a] rounded-lg p-3 flex flex-col"
                            >
                                <p className="text-sm font-semibold text-[#e0e0e0]">
                                    {device.model}
                                </p>
                                <p className="text-[10px] text-muted">
                                    {device.firstSeen} — {device.lastSeen}
                                </p>
                                <p className="text-[10px] text-accent mt-1">
                                    {device.eventCount.toLocaleString()} events
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* App Version Timeline */}
            {appLanes.length > 0 && (
                <div>
                    <h4 className="text-xs font-medium text-muted uppercase tracking-wide mb-3">
                        App Version Timeline
                        <InfoTooltip text="Spotify app version history split by platform. Each segment shows a version's active period. Hover for details." />
                    </h4>
                    <SegmentedTimeline lanes={appLanes} />
                </div>
            )}

            {/* OS Version History */}
            {osLanes.length > 0 && (
                <div>
                    <h4 className="text-xs font-medium text-muted uppercase tracking-wide mb-3">
                        OS Version History
                        <InfoTooltip text="Operating system version history split by platform. Each segment shows how long you ran each OS version." />
                    </h4>
                    <SegmentedTimeline lanes={osLanes} />
                </div>
            )}

            {/* Multi-Device Juggler */}
            {data.multiDeviceWeekly.length > 0 && (
                <div>
                    <h4 className="text-xs font-medium text-muted uppercase tracking-wide mb-3">
                        Multi-Device Usage
                        <InfoTooltip text="How many distinct devices you used per week. Average shown in the stat." />
                    </h4>
                    <div className="flex items-center gap-4 mb-3">
                        <div className="bg-[#1a1a1a] rounded-lg p-3 text-center">
                            <p className="text-xs text-muted">
                                Avg Devices / Week
                            </p>
                            <p className="text-2xl font-bold text-accent">
                                {data.avgDevicesPerWeek}
                            </p>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={180}>
                        <LineChart data={data.multiDeviceWeekly}>
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
                            <YAxis fontSize={10} allowDecimals={false} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "#1e1e1e",
                                    border: "1px solid #2a2a2a",
                                    borderRadius: 8,
                                    fontSize: 12,
                                }}
                                formatter={(value) => [value, "Devices"]}
                            />
                            <Line
                                type="stepAfter"
                                dataKey="deviceCount"
                                stroke="#1db954"
                                strokeWidth={2}
                                dot={false}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Session Hour of Day (when you open Spotify) */}
            {data.sessionHourOfDay.length > 0 && (
                <div>
                    <h4 className="text-xs font-medium text-muted uppercase tracking-wide mb-3">
                        When You Open Spotify
                        <InfoTooltip text="Distribution of streaming session starts by hour of day, based on raw core stream events." />
                    </h4>
                    <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={data.sessionHourOfDay}>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#2a2a2a"
                            />
                            <XAxis dataKey="hour" fontSize={10} />
                            <YAxis fontSize={10} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "#1e1e1e",
                                    border: "1px solid #2a2a2a",
                                    borderRadius: 8,
                                    fontSize: 12,
                                }}
                                formatter={(value) => [value, "Sessions"]}
                            />
                            <Bar
                                dataKey="count"
                                fill="#1db954"
                                radius={[2, 2, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}
