"use client";

import { HeatmapCell } from "../../types";

interface Props {
  data: HeatmapCell[];
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function HourDayHeatmap({ data }: Props) {
  const maxHours = Math.max(...data.map((d) => d.hours), 1);

  const cellMap = new Map<string, number>();
  for (const d of data) {
    cellMap.set(`${d.dayIndex}-${d.hour}`, d.hours);
  }

  function getColor(value: number): string {
    const ratio = value / maxHours;
    if (ratio === 0) return "#1a1a1a";
    // Green scale from dark to bright
    const g = Math.round(80 + ratio * 175);
    const r = Math.round(10 + ratio * 20);
    return `rgb(${r}, ${g}, 40)`;
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[600px]">
        {/* Hour labels */}
        <div className="flex ml-10 mb-1">
          {HOURS.map((h) => (
            <div
              key={h}
              className="flex-1 text-center text-[10px] text-muted"
            >
              {h % 3 === 0 ? `${h}` : ""}
            </div>
          ))}
        </div>
        {/* Grid rows */}
        {DAYS.map((day, di) => (
          <div key={day} className="flex items-center mb-[2px]">
            <div className="w-10 text-xs text-muted text-right pr-2">{day}</div>
            <div className="flex flex-1 gap-[2px]">
              {HOURS.map((h) => {
                const val = cellMap.get(`${di}-${h}`) ?? 0;
                return (
                  <div
                    key={h}
                    className="flex-1 aspect-square rounded-sm cursor-default"
                    style={{ backgroundColor: getColor(val) }}
                    title={`${day} ${h}:00 — ${val.toFixed(1)} hrs`}
                  />
                );
              })}
            </div>
          </div>
        ))}
        {/* Legend */}
        <div className="flex items-center justify-end mt-2 gap-1">
          <span className="text-[10px] text-muted mr-1">Less</span>
          {[0, 0.2, 0.4, 0.6, 0.8, 1].map((r) => (
            <div
              key={r}
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: getColor(r * maxHours) }}
            />
          ))}
          <span className="text-[10px] text-muted ml-1">More</span>
        </div>
      </div>
    </div>
  );
}
