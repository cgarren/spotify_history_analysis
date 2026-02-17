"use client";

import {
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Line,
    Legend,
} from "recharts";
import { ExplicitContent } from "../../types";

interface Props {
    data: ExplicitContent;
}

const COLORS = {
    explicit: "#e91e63",
    clean: "#1db954",
    librarySaves: "#ffd93d",
};

export default function ExplicitContentCharts({ data }: Props) {
    if (!data.library.total) {
        return (
            <p className="text-sm text-muted">
                No explicit content data available. Ensure saved_tracks.json is
                present in the workspace root.
            </p>
        );
    }

    const libraryPie = [
        { name: "Explicit", value: data.library.explicit },
        { name: "Clean", value: data.library.clean },
    ];

    const pieColors = [COLORS.explicit, COLORS.clean];

    return (
        <div className="flex flex-col gap-8">
            {/* Library donut */}
            <div className="flex justify-center">
                <div className="text-center">
                    <ResponsiveContainer width={200} height={180}>
                        <PieChart>
                            <Pie
                                data={libraryPie}
                                dataKey="value"
                                innerRadius={50}
                                outerRadius={75}
                                paddingAngle={2}
                                startAngle={90}
                                endAngle={-270}
                            >
                                {libraryPie.map((_, i) => (
                                    <Cell
                                        key={i}
                                        fill={pieColors[i]}
                                        stroke="none"
                                    />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    background: "#1a1a1a",
                                    border: "1px solid #333",
                                    borderRadius: 8,
                                    fontSize: 12,
                                }}
                                formatter={(
                                    value: number | undefined,
                                    name?: string,
                                ) => [
                                    `${(value ?? 0).toLocaleString()} tracks`,
                                    name ?? "",
                                ]}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    <p className="text-2xl font-bold text-[#e91e63]">
                        {data.library.explicitPct}% Explicit
                    </p>
                    <p className="text-xs text-muted">
                        {data.library.explicit.toLocaleString()} of{" "}
                        {data.library.total.toLocaleString()} saved tracks
                    </p>
                </div>
            </div>

            {/* Library Adds Trend */}
            {data.libraryAddsTrend.length > 0 && (
                <div>
                    <h4 className="text-xs text-muted mb-3 uppercase tracking-wide">
                        Explicit % of Library Saves by Year
                    </h4>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={data.libraryAddsTrend}>
                            <XAxis
                                dataKey="year"
                                tick={{ fill: "#888", fontSize: 12 }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                tick={{ fill: "#888", fontSize: 12 }}
                                axisLine={false}
                                tickLine={false}
                                yAxisId="pct"
                                domain={[0, "auto"]}
                                tickFormatter={(v: number) => `${v}%`}
                            />
                            <YAxis
                                yAxisId="count"
                                orientation="right"
                                tick={{ fill: "#888", fontSize: 12 }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip
                                contentStyle={{
                                    background: "#1a1a1a",
                                    border: "1px solid #333",
                                    borderRadius: 8,
                                    fontSize: 12,
                                }}
                                labelFormatter={(label) => String(label ?? "")}
                            />
                            <Legend
                                wrapperStyle={{ fontSize: 11, color: "#888" }}
                            />
                            <Bar
                                dataKey="totalAdds"
                                yAxisId="count"
                                fill={COLORS.clean}
                                opacity={0.25}
                                name="Total Saves"
                                radius={[4, 4, 0, 0]}
                            />
                            <Bar
                                dataKey="explicitAdds"
                                yAxisId="count"
                                fill={COLORS.explicit}
                                opacity={0.6}
                                name="Explicit Saves"
                                radius={[4, 4, 0, 0]}
                            />
                            <Line
                                type="monotone"
                                dataKey="explicitPct"
                                yAxisId="pct"
                                stroke={COLORS.librarySaves}
                                strokeWidth={2}
                                dot={{ r: 3, fill: COLORS.librarySaves }}
                                name="Explicit %"
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Top Explicit Artists */}
            {data.topExplicitArtists.length > 0 && (
                <div>
                    <h4 className="text-xs text-muted mb-3 uppercase tracking-wide">
                        Top Explicit Artists in Library
                    </h4>
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart
                            data={data.topExplicitArtists}
                            layout="vertical"
                            margin={{ left: 100 }}
                        >
                            <XAxis
                                type="number"
                                tick={{ fill: "#888", fontSize: 12 }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                type="category"
                                dataKey="name"
                                tick={{ fill: "#ccc", fontSize: 12 }}
                                axisLine={false}
                                tickLine={false}
                                width={95}
                            />
                            <Tooltip
                                contentStyle={{
                                    background: "#1a1a1a",
                                    border: "1px solid #333",
                                    borderRadius: 8,
                                    fontSize: 12,
                                }}
                                formatter={(value: number | undefined) => [
                                    `${(value ?? 0).toLocaleString()} saved tracks`,
                                    "Explicit Saves",
                                ]}
                            />
                            <Bar
                                dataKey="saves"
                                fill={COLORS.explicit}
                                radius={[0, 4, 4, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}
