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
import { HourOfDay, DayOfWeek } from "../../types";

interface Props {
  hourOfDay: HourOfDay[];
  dayOfWeek: DayOfWeek[];
}

export default function HourDayBarCharts({ hourOfDay, dayOfWeek }: Props) {
  const hourData = hourOfDay.map((h) => ({
    label: `${h.hour}:00`,
    hours: h.hours,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h4 className="text-xs text-muted mb-2">By Hour of Day</h4>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={hourData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" fontSize={10} minTickGap={20} />
            <YAxis tickFormatter={(v: number) => `${v}h`} />
            <Tooltip
              formatter={(value: number) => [`${value.toFixed(1)} hrs`, "Hours"]}
            />
            <Bar dataKey="hours" fill="#1db954" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div>
        <h4 className="text-xs text-muted mb-2">By Day of Week</h4>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={dayOfWeek}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis tickFormatter={(v: number) => `${v}h`} />
            <Tooltip
              formatter={(value: number) => [`${value.toFixed(1)} hrs`, "Hours"]}
            />
            <Bar dataKey="hours" fill="#1e90ff" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
