"use client";

import { useMemo } from "react";
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    Legend,
} from "recharts";
import { DailyListening } from "../../types";

interface Props {
    data: DailyListening[];
}

/** Compute a simple moving average over `window` points. */
function movingAverage(values: number[], window: number): (number | null)[] {
    return values.map((_, i) => {
        if (i < window - 1) return null;
        let sum = 0;
        for (let j = i - window + 1; j <= i; j++) sum += values[j];
        return sum / window;
    });
}

export default function DailyListeningChart({ data }: Props) {
    // Downsample for performance: show every Nth point if > 500
    const step = data.length > 500 ? Math.ceil(data.length / 500) : 1;
    const sampled = data.filter((_, i) => i % step === 0);

    // 30-day moving-average trendline (adjusted for downsample step)
    const trendData = useMemo(() => {
        const window = Math.max(Math.round(30 / step), 3);
        const hours = sampled.map((d) => d.hours);
        const trend = movingAverage(hours, window);
        return sampled.map((d, i) => ({ ...d, trend: trend[i] }));
    }, [sampled, step]);

    return (
        <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={trendData}>
                <defs>
                    <linearGradient id="gradGreen" x1="0" y1="0" x2="0" y2="1">
                        <stop
                            offset="0%"
                            stopColor="#1db954"
                            stopOpacity={0.4}
                        />
                        <stop
                            offset="100%"
                            stopColor="#1db954"
                            stopOpacity={0}
                        />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                    dataKey="date"
                    tickFormatter={(v: string) => v.slice(0, 7)}
                    minTickGap={60}
                />
                <YAxis tickFormatter={(v: number) => `${v.toFixed(0)}h`} />
                <Tooltip
                    formatter={(value: number, name: string) => [
                        `${Number(value).toFixed(1)} hrs`,
                        name === "Trend" ? "30-day avg" : "Listening",
                    ]}
                    labelFormatter={(label) => String(label)}
                />
                <Legend />
                <Area
                    type="monotone"
                    dataKey="hours"
                    stroke="#1db954"
                    fill="url(#gradGreen)"
                    strokeWidth={1.5}
                    name="Daily listening"
                />
                <Line
                    type="monotone"
                    dataKey="trend"
                    stroke="#ff6b6b"
                    strokeWidth={2}
                    dot={false}
                    connectNulls
                    name="Trend"
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}
