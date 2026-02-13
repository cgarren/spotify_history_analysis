"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { TopArtist, TopTrack, TopAlbum } from "../../types";
import { useState } from "react";

interface Props {
  artists: TopArtist[];
  tracks: TopTrack[];
  albums: TopAlbum[];
}

type Tab = "artists" | "tracks" | "albums";

interface ChartRow {
  name: string;
  artist?: string;
  hours: number;
}

function truncate(s: string, max: number) {
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

export default function TopContentCharts({ artists, tracks, albums }: Props) {
  const [tab, setTab] = useState<Tab>("artists");

  const tabs: { key: Tab; label: string }[] = [
    { key: "artists", label: "Artists" },
    { key: "tracks", label: "Tracks" },
    { key: "albums", label: "Albums" },
  ];

  const currentData: ChartRow[] =
    tab === "artists"
      ? artists.map((a) => ({ name: a.name, hours: a.hours }))
      : tab === "tracks"
        ? tracks.map((t) => ({ name: t.name, artist: t.artist, hours: t.hours }))
        : albums.map((a) => ({ name: a.name, artist: a.artist, hours: a.hours }));

  const hasArtist = tab !== "artists";
  const labelMaxLen = hasArtist ? 28 : 20;

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              tab === t.key
                ? "bg-accent text-black"
                : "bg-card-border text-muted hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={500}>
        <BarChart data={currentData} layout="vertical" margin={{ left: 10 }}>
          <XAxis type="number" tickFormatter={(v: number) => `${v}h`} />
          <YAxis
            type="category"
            dataKey="name"
            width={200}
            tick={{ fontSize: 11 }}
            tickFormatter={(v: string) => truncate(v, labelMaxLen)}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload || !payload.length) return null;
              const row = payload[0].payload as ChartRow;
              return (
                <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm">
                  <p className="font-medium text-[#e0e0e0]">{row.name}</p>
                  {row.artist && (
                    <p className="text-[#888]">{row.artist}</p>
                  )}
                  <p className="text-[#1db954] font-semibold mt-1">
                    {row.hours.toFixed(1)} hrs
                  </p>
                </div>
              );
            }}
          />
          <Bar dataKey="hours" fill="#1db954" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
