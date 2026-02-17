"use client";

import { useState } from "react";
import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    LineChart,
    Line,
} from "recharts";
import { LibraryHealth } from "../../types";
import InfoTooltip from "../InfoTooltip";

interface Props {
    data: LibraryHealth;
}

function truncate(s: string, max: number) {
    return s.length > max ? s.slice(0, max - 1) + "…" : s;
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

export default function LibraryHealthCharts({ data }: Props) {
    const [interactionView, setInteractionView] = useState<"all" | "userOnly">(
        "all",
    );
    const [libraryTopView, setLibraryTopView] = useState<"artists" | "albums">(
        "artists",
    );

    const emptyInteractions = {
        totalAdds: 0,
        totalRemoves: 0,
        netChange: 0,
        activeMonths: 0,
        interactionWindow: { start: null, end: null },
        weeklyTrend: [],
        kindBreakdown: [],
    };

    const collectionInteractions = data.collectionInteractions ?? {
        supportsUserOnly: false,
        all: emptyInteractions,
        userOnly: emptyInteractions,
    };

    const activeInteractions =
        interactionView === "userOnly" &&
        collectionInteractions.supportsUserOnly
            ? collectionInteractions.userOnly
            : collectionInteractions.all;

    const utilizationData = [
        { name: "Listened", value: data.utilizedCount },
        { name: "Never played", value: data.librarySize - data.utilizedCount },
    ];

    const neverPlayedExamples = data.neverPlayedExamples ?? [];
    const artistConcentration = data.artistConcentration ?? [];
    const albumConcentration = data.albumConcentration ?? [];
    const topLibraryData =
        libraryTopView === "artists" ? artistConcentration : albumConcentration;

    return (
        <div className="flex flex-col gap-6">
            {/* Overview stats */}
            <div className="grid grid-cols-2 gap-3">
                <div className="text-center">
                    <p className="text-xs text-muted">
                        Library Size
                        <InfoTooltip text="Total tracks saved to your Liked Songs library." />
                    </p>
                    <p className="text-2xl font-bold text-accent">
                        {data.librarySize.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted">saved tracks</p>
                </div>
                <div className="text-center">
                    <p className="text-xs text-muted">
                        Not Played Recently
                        <InfoTooltip text="Saved tracks you played before, but not in the last 12 months (different from never-played tracks)." />
                    </p>
                    <p className="text-2xl font-bold text-[#ff6b6b]">
                        {data.forgottenSaves.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted">
                        {data.forgottenSavesPct}% of library
                    </p>
                </div>
            </div>

            {/* Library interactions */}
            <div className="flex flex-col gap-4">
                {collectionInteractions.supportsUserOnly && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setInteractionView("all")}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                interactionView === "all"
                                    ? "bg-accent text-black"
                                    : "bg-card-border text-muted hover:text-foreground"
                            }`}
                        >
                            All Activity
                        </button>
                        <button
                            onClick={() => setInteractionView("userOnly")}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                interactionView === "userOnly"
                                    ? "bg-accent text-black"
                                    : "bg-card-border text-muted hover:text-foreground"
                            }`}
                        >
                            My Adds Only
                        </button>
                        <InfoTooltip text="Tracks and other items you've added to or removed from your library over time. Other activity like listen-later and followed shows is summarized separately." />
                    </div>
                )}

                {activeInteractions.weeklyTrend.length > 0 && (
                    <div>
                        <h4 className="text-xs text-muted mb-2">
                            Library Adds & Removes Over Time
                            <InfoTooltip text="How many items you added to and removed from your library each week." />
                        </h4>
                        <ResponsiveContainer width="100%" height={220}>
                            <LineChart
                                data={activeInteractions.weeklyTrend}
                                margin={{
                                    top: 5,
                                    right: 20,
                                    bottom: 5,
                                    left: 0,
                                }}
                            >
                                <XAxis
                                    dataKey="week"
                                    fontSize={10}
                                    tickFormatter={(value: string) =>
                                        formatWeekTick(value)
                                    }
                                    minTickGap={24}
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
                                        formatWeekRangeLabel(
                                            typeof label === "string"
                                                ? label
                                                : String(label ?? ""),
                                        )
                                    }
                                />
                                <Line
                                    type="monotone"
                                    dataKey="adds"
                                    stroke="#1db954"
                                    strokeWidth={2}
                                    dot={false}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="removes"
                                    stroke="#ff6b6b"
                                    strokeWidth={2}
                                    dot={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {activeInteractions.kindBreakdown.length > 0 && (
                    <div>
                        <h4 className="text-xs text-muted mb-2">
                            Library Interaction Types
                            <InfoTooltip text="Breakdown of your library adds and removes by type (tracks, albums, artists, etc.)." />
                        </h4>
                        <ResponsiveContainer
                            width="100%"
                            height={Math.max(
                                180,
                                activeInteractions.kindBreakdown.length * 30,
                            )}
                        >
                            <BarChart
                                data={activeInteractions.kindBreakdown}
                                layout="vertical"
                                margin={{ left: 10 }}
                            >
                                <XAxis type="number" fontSize={10} />
                                <YAxis
                                    type="category"
                                    dataKey="kind"
                                    width={120}
                                    tick={{ fontSize: 10 }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "#1e1e1e",
                                        border: "1px solid #2a2a2a",
                                        borderRadius: 8,
                                        fontSize: 12,
                                    }}
                                />
                                <Bar
                                    dataKey="adds"
                                    fill="#1db954"
                                    radius={[0, 4, 4, 0]}
                                />
                                <Bar
                                    dataKey="removes"
                                    fill="#ff6b6b"
                                    radius={[0, 4, 4, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            {/* Utilization donut */}
            <div>
                <h4 className="text-xs text-muted mb-2 text-center">
                    Library Usage Breakdown
                    <InfoTooltip text="Breakdown of saved tracks you've listened to at least once vs. tracks you've never played." />
                </h4>
                <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                        <Pie
                            data={utilizationData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={2}
                            fontSize={11}
                            label={({ name, percent }) =>
                                `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                            }
                        >
                            <Cell fill="#1db954" />
                            <Cell fill="#333" />
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "#1e1e1e",
                                border: "1px solid #2a2a2a",
                                borderRadius: 8,
                                fontSize: 12,
                            }}
                            formatter={(value) => [
                                Number(value).toLocaleString(),
                                "Tracks",
                            ]}
                        />
                    </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-3 mt-2 text-center">
                    <div>
                        <p className="text-xs text-muted">Utilization</p>
                        <p className="text-sm font-semibold text-accent">
                            {data.utilizationRate}% listened
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-muted">Never Played</p>
                        <p className="text-sm font-semibold text-[#ff6b6b]">
                            {(
                                data.librarySize - data.utilizedCount
                            ).toLocaleString()}{" "}
                            tracks
                        </p>
                    </div>
                </div>
                {neverPlayedExamples.length > 0 && (
                    <div className="mt-3">
                        <h4 className="text-xs text-muted mb-2">
                            Sample Never-Played Tracks
                            <InfoTooltip text="Examples of tracks in your library that never appear in your streaming history." />
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                            {neverPlayedExamples.map((t, i) => (
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
            </div>

            {/* Unsaved Favorites */}
            {data.unsavedFavorites.length > 0 && (
                <div>
                    <h4 className="text-xs text-muted mb-2">
                        Unsaved Favorites
                        <InfoTooltip text="Your most-played tracks by hours that aren't in your Liked Songs library." />
                    </h4>
                    <ResponsiveContainer
                        width="100%"
                        height={data.unsavedFavorites.length * 32}
                    >
                        <BarChart
                            data={data.unsavedFavorites}
                            layout="vertical"
                            margin={{ left: 10 }}
                        >
                            <XAxis
                                type="number"
                                tickFormatter={(v: number) => `${v}h`}
                                fontSize={10}
                            />
                            <YAxis
                                type="category"
                                dataKey="name"
                                width={180}
                                tick={{ fontSize: 10 }}
                                tickFormatter={(v: string) => truncate(v, 25)}
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
                                            <p className="text-[#888]">
                                                {row.artist}
                                            </p>
                                            <p className="text-[#ff6b6b] font-semibold mt-1">
                                                {row.hours.toFixed(1)} hrs — not
                                                in library!
                                            </p>
                                        </div>
                                    );
                                }}
                            />
                            <Bar
                                dataKey="hours"
                                fill="#ff6b6b"
                                radius={[0, 4, 4, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Library concentration */}
            {(artistConcentration.length > 0 ||
                albumConcentration.length > 0) && (
                <div>
                    <h4 className="text-xs text-muted mb-2">
                        Top in Your Library
                        <InfoTooltip text="See which artists or albums have the most saved tracks in your library." />
                    </h4>
                    <div className="flex gap-2 mb-3">
                        <button
                            onClick={() => setLibraryTopView("artists")}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                libraryTopView === "artists"
                                    ? "bg-accent text-black"
                                    : "bg-card-border text-muted hover:text-foreground"
                            }`}
                        >
                            Artists
                        </button>
                        <button
                            onClick={() => setLibraryTopView("albums")}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                libraryTopView === "albums"
                                    ? "bg-accent text-black"
                                    : "bg-card-border text-muted hover:text-foreground"
                            }`}
                        >
                            Albums
                        </button>
                    </div>
                    <ResponsiveContainer
                        width="100%"
                        height={Math.max(220, topLibraryData.length * 28)}
                    >
                        <BarChart
                            data={topLibraryData}
                            layout="vertical"
                            margin={{ left: 10 }}
                        >
                            <XAxis type="number" fontSize={10} />
                            <YAxis
                                type="category"
                                dataKey="name"
                                width={200}
                                tick={{ fontSize: 10 }}
                                tickFormatter={(v: string) => truncate(v, 28)}
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
                                            {row.artist && (
                                                <p className="text-[#888]">
                                                    {row.artist}
                                                </p>
                                            )}
                                            <p className="text-accent font-semibold mt-1">
                                                {row.count.toLocaleString()}{" "}
                                                saved tracks
                                            </p>
                                        </div>
                                    );
                                }}
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
        </div>
    );
}
