"use client";

import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
} from "recharts";
import { SearchListenPipeline } from "../../types";
import InfoTooltip from "../InfoTooltip";

interface Props {
    data: SearchListenPipeline;
}

function truncate(s: string, max: number) {
    return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

function formatGap(minutes: number): string {
    if (minutes < 60) return `${minutes.toFixed(0)} min`;
    if (minutes < 1440) return `${(minutes / 60).toFixed(1)} hrs`;
    return `${(minutes / 1440).toFixed(1)} days`;
}

export default function SearchListenPipelineCharts({ data }: Props) {
    return (
        <div className="flex flex-col gap-6">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                    <p className="text-xs text-muted">
                        Impulse Listener
                        <InfoTooltip text="Percentage of searches followed by streaming the same artist within 5 minutes." />
                    </p>
                    <p className="text-2xl font-bold text-[#ffd93d]">
                        {data.impulsePct}%
                    </p>
                    <p className="text-xs text-muted">
                        {data.impulseCount} instant plays
                    </p>
                </div>
                <div className="text-center">
                    <p className="text-xs text-muted">
                        Avg Search→Listen Gap
                        <InfoTooltip text="Average time between searching for an artist and first streaming them." />
                    </p>
                    <p className="text-2xl font-bold text-accent">
                        {formatGap(data.avgGapMinutes)}
                    </p>
                </div>
                <div className="text-center">
                    <p className="text-xs text-muted">
                        Artists Discovered
                        <InfoTooltip text="Number of artists you found via search that you then went on to stream." />
                    </p>
                    <p className="text-2xl font-bold text-accent">
                        {data.searchToObsession.length}
                    </p>
                    <p className="text-xs text-muted">via search</p>
                </div>
            </div>

            {/* Search to Obsession */}
            {data.searchToObsession.length > 0 && (
                <div>
                    <h4 className="text-xs text-muted mb-2">
                        Search to Obsession
                        <InfoTooltip text="Artists you searched for who went on to accumulate the most listening hours after that first search." />
                    </h4>
                    <ResponsiveContainer
                        width="100%"
                        height={data.searchToObsession.length * 32}
                    >
                        <BarChart
                            data={data.searchToObsession}
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
                                            <p className="text-[#1db954] font-semibold">
                                                {row.hours.toFixed(1)} hrs after
                                                search
                                            </p>
                                            <p className="text-[#888] text-xs">
                                                First searched:{" "}
                                                {row.firstSearched}
                                            </p>
                                        </div>
                                    );
                                }}
                            />
                            <Bar
                                dataKey="hours"
                                fill="#e67e22"
                                radius={[0, 4, 4, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}
