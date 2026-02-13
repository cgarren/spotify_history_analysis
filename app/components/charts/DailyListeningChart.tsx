"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { DailyListening } from "../../types";

interface Props {
  data: DailyListening[];
}

export default function DailyListeningChart({ data }: Props) {
  // Downsample for performance: show every Nth point if > 500
  const step = data.length > 500 ? Math.ceil(data.length / 500) : 1;
  const sampled = data.filter((_, i) => i % step === 0);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={sampled}>
        <defs>
          <linearGradient id="gradGreen" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1db954" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#1db954" stopOpacity={0} />
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
          formatter={(value: number) => [`${value.toFixed(1)} hrs`, "Listening"]}
          labelFormatter={(label: string) => label}
        />
        <Area
          type="monotone"
          dataKey="hours"
          stroke="#1db954"
          fill="url(#gradGreen)"
          strokeWidth={1.5}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
