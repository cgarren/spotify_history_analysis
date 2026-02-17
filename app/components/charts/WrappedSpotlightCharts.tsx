"use client";

import { WrappedSpotlight, WrappedSection } from "../../types";

interface Props {
    data: WrappedSpotlight;
}

/* ---------- Era gradient palette (reused from 2024-style eras) ---------- */
const ERA_GRADIENTS: Record<string, { from: string; to: string }> = {
    "yellow-blue": { from: "#ffd93d", to: "#1e90ff" },
    red: { from: "#ff6b6b", to: "#e91e63" },
    "red-yellow": { from: "#e91e63", to: "#ffd93d" },
    blue: { from: "#1e90ff", to: "#00bcd4" },
    green: { from: "#1db954", to: "#6bcb77" },
    purple: { from: "#9b59b6", to: "#6c5ce7" },
};
const DEFAULT_ERA_COLORS = { from: "#1db954", to: "#6bcb77" };

/* ---------- Section renderers ---------- */

function CalloutSection({ section }: { section: WrappedSection }) {
    const item = section.items[0];
    if (!item) return null;
    return (
        <div className="bg-[#1a1a1a] rounded-xl p-4 text-center border border-[#2a2a2a]">
            <p className="text-xs text-muted mb-1">{section.title}</p>
            <p className="text-xl font-bold text-[#ffd93d]">{item.label}</p>
            <p className="text-sm text-muted">{item.value}</p>
        </div>
    );
}

function StatListSection({ section }: { section: WrappedSection }) {
    return (
        <div>
            <h4 className="text-xs text-muted mb-3 uppercase tracking-wide">
                {section.title}
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {section.items.map((item, i) => (
                    <div
                        key={i}
                        className="bg-[#1a1a1a] rounded-lg p-3 border border-[#2a2a2a] text-center"
                    >
                        <p className="text-xs text-muted">{item.label}</p>
                        <p className="text-lg font-bold text-accent">
                            {item.value}
                        </p>
                        {item.detail && (
                            <p className="text-xs text-muted mt-0.5 capitalize">
                                {item.detail}
                            </p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

function EraCardsSection({
    section,
    year,
}: {
    section: WrappedSection;
    year: number;
}) {
    return (
        <div>
            <h4 className="text-xs text-muted mb-3 uppercase tracking-wide">
                {section.title}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {section.items.map((item, i) => {
                    const colors =
                        ERA_GRADIENTS[item.color ?? ""] ?? DEFAULT_ERA_COLORS;
                    return (
                        <div
                            key={i}
                            className="rounded-xl p-4 border border-[#2a2a2a] relative overflow-hidden"
                            style={{
                                background: `linear-gradient(135deg, ${colors.from}15, ${colors.to}15)`,
                            }}
                        >
                            <div
                                className="absolute top-0 left-0 w-full h-1"
                                style={{
                                    background: `linear-gradient(90deg, ${colors.from}, ${colors.to})`,
                                }}
                            />
                            <p
                                className="text-lg font-bold mb-1"
                                style={{ color: colors.from }}
                            >
                                {item.label} {year}
                            </p>
                            <p className="text-sm font-semibold text-[#e0e0e0] capitalize">
                                {item.value}
                            </p>
                            {item.detail && (
                                <p className="text-xs text-muted capitalize">
                                    {item.detail}
                                </p>
                            )}
                            {item.tracks && item.tracks.length > 0 && (
                                <div className="mt-3 space-y-1">
                                    {item.tracks.map((t, j) => (
                                        <p
                                            key={j}
                                            className="text-xs text-[#aaa]"
                                        >
                                            ♪ {t}
                                        </p>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function ArchiveSection({ section }: { section: WrappedSection }) {
    return (
        <div>
            <h4 className="text-xs text-muted mb-3 uppercase tracking-wide">
                {section.title}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {section.items.map((item, i) => (
                    <div
                        key={i}
                        className="bg-[#1a1a1a] rounded-xl p-4 border border-[#2a2a2a]"
                    >
                        <p className="text-xs text-muted mb-1">{item.value}</p>
                        <p className="text-sm font-semibold text-[#e0e0e0] mb-2">
                            {item.label}
                        </p>
                        {item.detail && (
                            <p className="text-xs text-[#aaa] leading-relaxed">
                                {item.detail}
                            </p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ---------- Main component ---------- */

export default function WrappedSpotlightCharts({ data }: Props) {
    if (!data.year) {
        return (
            <p className="text-sm text-muted">
                No Wrapped data found. Place a Wrapped file (e.g.
                Wrapped2025.json) in your Spotify Account Data folder and re-run
                preprocessing.
            </p>
        );
    }

    /* Determine hero grid columns based on highlight count */
    const highlightCount = data.highlights.length;
    const gridCols =
        highlightCount <= 3
            ? "grid-cols-3"
            : highlightCount <= 4
              ? "grid-cols-2 sm:grid-cols-4"
              : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5";

    return (
        <div className="flex flex-col gap-6">
            {/* Hero highlights */}
            {highlightCount > 0 && (
                <div className={`grid ${gridCols} gap-4`}>
                    {data.highlights.map((h, i) => (
                        <div key={i} className="text-center">
                            <p className="text-xs text-muted">{h.label}</p>
                            <p className="text-2xl font-bold text-accent">
                                {h.value}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {/* Dynamic sections */}
            {data.sections.map((section, i) => {
                switch (section.type) {
                    case "callout":
                        return <CalloutSection key={i} section={section} />;
                    case "stat-list":
                        return <StatListSection key={i} section={section} />;
                    case "era-cards":
                        return (
                            <EraCardsSection
                                key={i}
                                section={section}
                                year={data.year}
                            />
                        );
                    case "archive":
                        return <ArchiveSection key={i} section={section} />;
                    default:
                        return null;
                }
            })}
        </div>
    );
}
