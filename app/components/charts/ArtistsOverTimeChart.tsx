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
import { ArtistsOverTime } from "../../types";

interface Props {
  data: ArtistsOverTime;
}

const COLORS = [
  "#1db954",
  "#1e90ff",
  "#ff6b6b",
  "#ffd93d",
  "#6bcb77",
  "#9b59b6",
  "#e67e22",
  "#1abc9c",
  "#e91e63",
  "#00bcd4",
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;
  // Reverse so the top of the stack is listed first (matches visual order)
  const items = [...payload].reverse().filter((p: any) => p.value > 0);
  return (
    <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg px-3 py-2 text-xs max-w-[220px]">
      <p className="font-medium text-[#e0e0e0] mb-1.5">{label}</p>
      {items.map((item: any, i: number) => (
        <div key={i} className="flex items-center justify-between gap-3 py-0.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-[#ccc] truncate">{item.dataKey}</span>
          </div>
          <span className="text-[#e0e0e0] font-medium flex-shrink-0">
            {Number(item.value).toFixed(1)}h
          </span>
        </div>
      ))}
    </div>
  );
}

export default function ArtistsOverTimeChart({ data }: Props) {
  const artists = Object.keys(data.artists);
  // Build a color map so legend + areas use consistent colors
  const colorMap: Record<string, string> = {};
  artists.forEach((a, i) => {
    colorMap[a] = COLORS[i % COLORS.length];
  });

  const chartData = data.months.map((month, i) => {
    const row: Record<string, string | number> = { month };
    for (const artist of artists) {
      row[artist] = data.artists[artist][i];
    }
    return row;
  });

  // Reversed artist list for legend (top of stack first)
  const legendArtists = [...artists].reverse();

  return (
    <div>
      <ResponsiveContainer width="100%" height={350}>
        <AreaChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="month"
            tickFormatter={(v: string) => v.slice(2)}
            minTickGap={40}
            fontSize={10}
          />
          <YAxis tickFormatter={(v: number) => `${v.toFixed(0)}h`} />
          <Tooltip content={<CustomTooltip />} />
          {artists.map((artist) => (
            <Area
              key={artist}
              type="monotone"
              dataKey={artist}
              stackId="1"
              stroke={colorMap[artist]}
              fill={colorMap[artist]}
              fillOpacity={0.6}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
      {/* Custom legend matching stack order (top of stack first) */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
        {legendArtists.map((artist) => (
          <div key={artist} className="flex items-center gap-1.5">
            <div
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: colorMap[artist] }}
            />
            <span className="text-[11px] text-muted">{artist}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
