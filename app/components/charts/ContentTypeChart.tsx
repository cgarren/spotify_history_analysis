"use client";

import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    Legend,
} from "recharts";
import { ContentTypeSplit, TopPodcast } from "../../types";
import InfoTooltip from "../InfoTooltip";

interface Props {
    data: ContentTypeSplit[];
    topPodcasts: TopPodcast[];
}

export default function ContentTypeChart({ data, topPodcasts }: Props) {
    return (
        <div className="flex flex-col gap-6">
            <div>
                <h4 className="text-xs text-muted mb-2">
                    Music vs Podcasts vs Audiobooks (Monthly)
                    <InfoTooltip text="Monthly hours broken down by content type. Shows how your mix of music, podcasts, and audiobooks changes over time." />
                </h4>
                <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                            dataKey="month"
                            tickFormatter={(v: string) => v.slice(2)}
                            minTickGap={40}
                            fontSize={10}
                        />
                        <YAxis
                            tickFormatter={(v: number) => `${v.toFixed(0)}h`}
                        />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Area
                            type="monotone"
                            dataKey="music"
                            stackId="1"
                            stroke="#1db954"
                            fill="#1db954"
                            fillOpacity={0.7}
                        />
                        <Area
                            type="monotone"
                            dataKey="podcast"
                            stackId="1"
                            stroke="#1e90ff"
                            fill="#1e90ff"
                            fillOpacity={0.7}
                        />
                        <Area
                            type="monotone"
                            dataKey="audiobook"
                            stackId="1"
                            stroke="#ffd93d"
                            fill="#ffd93d"
                            fillOpacity={0.7}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
            {topPodcasts.length > 0 && (
                <div>
                    <h4 className="text-xs text-muted mb-2">
                        Top Podcasts
                        <InfoTooltip text="Your most-listened podcast shows ranked by total hours." />
                    </h4>
                    <div className="space-y-2">
                        {topPodcasts.map((pod, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <span className="text-xs text-muted w-5 text-right">
                                    {i + 1}.
                                </span>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm truncate">
                                            {pod.name}
                                        </span>
                                        <span className="text-xs text-muted ml-2">
                                            {pod.hours.toFixed(1)}h
                                        </span>
                                    </div>
                                    <div className="w-full bg-card-border rounded-full h-1.5 mt-1">
                                        <div
                                            className="h-1.5 rounded-full"
                                            style={{
                                                width: `${(pod.hours / topPodcasts[0].hours) * 100}%`,
                                                backgroundColor: "#1e90ff",
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
