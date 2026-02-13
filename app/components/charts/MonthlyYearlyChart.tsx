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
import { MonthlyListening, YearlyListening } from "../../types";

interface Props {
  monthly: MonthlyListening[];
  yearly: YearlyListening[];
}

export default function MonthlyYearlyChart({ monthly, yearly }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h4 className="text-xs text-muted mb-2">Monthly</h4>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={monthly}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              tickFormatter={(v: string) => v.slice(2)}
              minTickGap={40}
              fontSize={10}
            />
            <YAxis tickFormatter={(v: number) => `${v.toFixed(0)}h`} />
            <Tooltip
              formatter={(value: number) => [`${value.toFixed(1)} hrs`, "Hours"]}
            />
            <Bar dataKey="hours" fill="#1db954" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div>
        <h4 className="text-xs text-muted mb-2">Yearly</h4>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={yearly}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis tickFormatter={(v: number) => `${v.toFixed(0)}h`} />
            <Tooltip
              formatter={(value: number) => [`${value.toFixed(1)} hrs`, "Hours"]}
            />
            <Bar dataKey="hours" fill="#1db954" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
