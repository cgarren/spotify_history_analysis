"use client";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from "recharts";
import {
  PlatformBreakdown,
  OfflineVsOnline,
  CountryBreakdown,
} from "../../types";

interface Props {
  platforms: PlatformBreakdown[];
  offlineVsOnline: OfflineVsOnline;
  countries: CountryBreakdown[];
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

function shortenPlatform(name: string): string {
  if (name.toLowerCase().startsWith("partner")) return "Apple TV";
  if (name.toLowerCase().startsWith("os x") || name === "osx") return "macOS";
  if (name === "ios") return "iOS (recent)";
  const iosMatch = name.match(/^iOS\s+([\d.]+)/);
  if (iosMatch) return `iOS ${iosMatch[1]}`;
  return name;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function PlatformTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0];
  return (
    <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm">
      <p className="font-medium text-[#e0e0e0]">{d.name}</p>
      <p className="text-[#1db954] font-semibold">{Number(d.value).toFixed(1)} hrs</p>
    </div>
  );
}

export default function PlatformCharts({
  platforms,
  offlineVsOnline,
  countries,
}: Props) {
  const offOnData = [
    { name: "Online", value: offlineVsOnline.online },
    { name: "Offline", value: offlineVsOnline.offline },
  ];

  const cleanPlatforms = platforms.map((p) => ({
    ...p,
    platform: shortenPlatform(p.platform),
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="text-xs text-muted mb-2 text-center">By Platform</h4>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={cleanPlatforms}
                dataKey="hours"
                nameKey="platform"
                cx="50%"
                cy="50%"
                outerRadius={70}
              >
                {cleanPlatforms.map((_, i) => (
                  <Cell
                    key={i}
                    fill={COLORS[i % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={<PlatformTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          {/* Custom compact legend */}
          <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-1">
            {cleanPlatforms.map((p, i) => (
              <div key={i} className="flex items-center gap-1">
                <div
                  className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                />
                <span className="text-[10px] text-muted">{p.platform}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-xs text-muted mb-2 text-center">
            Online vs Offline
          </h4>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={offOnData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={70}
              >
                <Cell fill="#1db954" />
                <Cell fill="#555" />
              </Pie>
              <Tooltip content={<PlatformTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-x-4 mt-1">
            {offOnData.map((d, i) => (
              <div key={i} className="flex items-center gap-1">
                <div
                  className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: i === 0 ? "#1db954" : "#555" }}
                />
                <span className="text-[10px] text-muted">{d.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {countries.length > 1 && (
        <div>
          <h4 className="text-xs text-muted mb-2">By Country</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={countries}>
              <XAxis dataKey="country" />
              <YAxis tickFormatter={(v: number) => `${v}h`} />
              <Tooltip
                formatter={(value: number) => [
                  `${value.toFixed(1)} hrs`,
                  "Hours",
                ]}
              />
              <Bar dataKey="hours" fill="#1e90ff" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
