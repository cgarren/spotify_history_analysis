"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { NewArtistDiscovery } from "../../types";

interface Props {
  data: NewArtistDiscovery[];
}

export default function DiscoveryChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="month"
          tickFormatter={(v: string) => v.slice(2)}
          minTickGap={40}
          fontSize={10}
        />
        <YAxis />
        <Tooltip
          formatter={(value: number) => [value, "New Artists"]}
        />
        <Bar dataKey="newArtists" fill="#9b59b6" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
