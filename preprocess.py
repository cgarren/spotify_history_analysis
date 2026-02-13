"""
Preprocess Spotify Extended Streaming History into a single stats.json
for the Next.js dashboard.

Run from the history_analysis_web/ directory:
    python preprocess.py
"""

import glob
import json
import os
from collections import defaultdict

import pandas as pd
import numpy as np

# ---------------------------------------------------------------------------
# 1. Load all streaming history JSON files
# ---------------------------------------------------------------------------
HISTORY_DIR = "../Spotify Extended Streaming History/"

file_list = (
    glob.glob(os.path.join(HISTORY_DIR, "Streaming_History_Audio_*.json"))
    + glob.glob(os.path.join(HISTORY_DIR, "Streaming_History_Video_*.json"))
)

frames = []
for fp in file_list:
    frames.append(pd.read_json(fp))
df = pd.concat(frames, ignore_index=True)

# Basic type coercions
df["ts"] = pd.to_datetime(df["ts"], utc=True)
df["ms_played"] = pd.to_numeric(df["ms_played"], errors="coerce").fillna(0)
df["hours"] = df["ms_played"] / 3_600_000

# Convert UTC to US/Eastern so all time-based stats use local time
df["ts"] = df["ts"].dt.tz_convert("US/Eastern")

# Convenience columns
df["date"] = df["ts"].dt.date
df["month"] = df["ts"].dt.to_period("M")
df["year"] = df["ts"].dt.year
df["hour_of_day"] = df["ts"].dt.hour
df["day_of_week"] = df["ts"].dt.dayofweek  # 0=Mon … 6=Sun

# Classify content type
def classify(row):
    if pd.notna(row.get("master_metadata_track_name")):
        return "music"
    if pd.notna(row.get("episode_name")):
        return "podcast"
    if pd.notna(row.get("audiobook_title")):
        return "audiobook"
    return "other"

df["content_type"] = df.apply(classify, axis=1)

print(f"Loaded {len(df):,} rows spanning {df['ts'].min()} – {df['ts'].max()}")

# ---------------------------------------------------------------------------
# 2. Compute stats
# ---------------------------------------------------------------------------
stats: dict = {}

# ---- Overview -----------------------------------------------------------
total_hours = float(df["hours"].sum())
total_plays = int(len(df))
unique_artists = int(df["master_metadata_album_artist_name"].nunique())
unique_tracks = int(df["master_metadata_track_name"].nunique())
unique_albums = int(df["master_metadata_album_album_name"].nunique())
date_start = str(df["ts"].min().date())
date_end = str(df["ts"].max().date())

# Longest listening streak (consecutive days with > 0 ms played)
daily_mask = df.groupby("date")["ms_played"].sum()
days_with_listening = sorted(daily_mask[daily_mask > 0].index)
longest_streak = current_streak = 1
for i in range(1, len(days_with_listening)):
    diff = (days_with_listening[i] - days_with_listening[i - 1]).days
    if diff == 1:
        current_streak += 1
        longest_streak = max(longest_streak, current_streak)
    else:
        current_streak = 1

stats["overview"] = {
    "totalHours": round(total_hours, 1),
    "totalPlays": total_plays,
    "uniqueArtists": unique_artists,
    "uniqueTracks": unique_tracks,
    "uniqueAlbums": unique_albums,
    "dateRange": {"start": date_start, "end": date_end},
    "longestStreak": longest_streak,
}

# ---- Daily listening hours -----------------------------------------------
daily = df.groupby("date")["hours"].sum().reset_index()
daily.columns = ["date", "hours"]
daily = daily.sort_values("date")
stats["dailyListening"] = [
    {"date": str(r["date"]), "hours": round(r["hours"], 2)}
    for _, r in daily.iterrows()
]

# ---- Monthly listening hours ---------------------------------------------
monthly = df.groupby("month")["hours"].sum().reset_index()
monthly.columns = ["month", "hours"]
monthly = monthly.sort_values("month")
stats["monthlyListening"] = [
    {"month": str(r["month"]), "hours": round(r["hours"], 1)}
    for _, r in monthly.iterrows()
]

# ---- Yearly listening hours ----------------------------------------------
yearly = df.groupby("year")["hours"].sum().reset_index()
yearly.columns = ["year", "hours"]
yearly = yearly.sort_values("year")
stats["yearlyListening"] = [
    {"year": int(r["year"]), "hours": round(r["hours"], 1)}
    for _, r in yearly.iterrows()
]

# ---- Hour-of-day distribution --------------------------------------------
hod = df.groupby("hour_of_day")["hours"].sum()
stats["hourOfDay"] = [
    {"hour": int(h), "hours": round(float(hod.get(h, 0)), 1)} for h in range(24)
]

# ---- Day-of-week distribution --------------------------------------------
DOW_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
dow = df.groupby("day_of_week")["hours"].sum()
stats["dayOfWeek"] = [
    {"day": DOW_NAMES[d], "hours": round(float(dow.get(d, 0)), 1)} for d in range(7)
]

# ---- Hour x Day-of-week heatmap -----------------------------------------
heatmap_data = []
heatmap_group = df.groupby(["day_of_week", "hour_of_day"])["hours"].sum()
for d in range(7):
    for h in range(24):
        heatmap_data.append({
            "day": DOW_NAMES[d],
            "dayIndex": d,
            "hour": h,
            "hours": round(float(heatmap_group.get((d, h), 0)), 2),
        })
stats["heatmap"] = heatmap_data

# ---- Top artists ---------------------------------------------------------
top_artists = (
    df[df["content_type"] == "music"]
    .groupby("master_metadata_album_artist_name")["hours"]
    .sum()
    .nlargest(20)
    .reset_index()
)
top_artists.columns = ["name", "hours"]
stats["topArtists"] = [
    {"name": r["name"], "hours": round(r["hours"], 1)}
    for _, r in top_artists.iterrows()
]

# ---- Top tracks ----------------------------------------------------------
top_tracks = (
    df[df["content_type"] == "music"]
    .groupby(["master_metadata_track_name", "master_metadata_album_artist_name"])["hours"]
    .sum()
    .nlargest(20)
    .reset_index()
)
top_tracks.columns = ["name", "artist", "hours"]
stats["topTracks"] = [
    {"name": r["name"], "artist": r["artist"], "hours": round(r["hours"], 1)}
    for _, r in top_tracks.iterrows()
]

# ---- Top albums ----------------------------------------------------------
top_albums = (
    df[df["content_type"] == "music"]
    .groupby(["master_metadata_album_album_name", "master_metadata_album_artist_name"])["hours"]
    .sum()
    .nlargest(20)
    .reset_index()
)
top_albums.columns = ["name", "artist", "hours"]
stats["topAlbums"] = [
    {"name": r["name"], "artist": r["artist"], "hours": round(r["hours"], 1)}
    for _, r in top_albums.iterrows()
]

# ---- Artists over time (top 10, monthly) ---------------------------------
top10_artist_names = [a["name"] for a in stats["topArtists"][:10]]
music_df = df[df["content_type"] == "music"].copy()
music_df["month_str"] = music_df["month"].astype(str)
aot = (
    music_df[music_df["master_metadata_album_artist_name"].isin(top10_artist_names)]
    .groupby(["month_str", "master_metadata_album_artist_name"])["hours"]
    .sum()
    .reset_index()
)
aot.columns = ["month", "artist", "hours"]
months_sorted = sorted(aot["month"].unique())
artists_over_time: dict = {"months": months_sorted, "artists": {}}
for artist in top10_artist_names:
    artist_data = aot[aot["artist"] == artist].set_index("month")["hours"]
    artists_over_time["artists"][artist] = [
        round(float(artist_data.get(m, 0)), 2) for m in months_sorted
    ]
stats["artistsOverTime"] = artists_over_time

# ---- Skip analysis -------------------------------------------------------
# Skip rate by top artists
music_plays = df[df["content_type"] == "music"].copy()
artist_skip = (
    music_plays.groupby("master_metadata_album_artist_name")
    .agg(total=("skipped", "count"), skipped=("skipped", "sum"))
    .reset_index()
)
artist_skip["skipRate"] = (artist_skip["skipped"] / artist_skip["total"] * 100).round(1)
# Only artists with significant plays, sorted by total plays
artist_skip = artist_skip[artist_skip["total"] >= 20].nlargest(20, "total")
stats["skipByArtist"] = [
    {"name": r["master_metadata_album_artist_name"], "skipRate": float(r["skipRate"]), "plays": int(r["total"])}
    for _, r in artist_skip.iterrows()
]

# Skip rate over time (monthly)
monthly_skip = (
    df.groupby("month")
    .agg(total=("skipped", "count"), skipped=("skipped", "sum"))
    .reset_index()
)
monthly_skip["skipRate"] = (monthly_skip["skipped"] / monthly_skip["total"] * 100).round(1)
monthly_skip = monthly_skip.sort_values("month")
stats["skipRateOverTime"] = [
    {"month": str(r["month"]), "skipRate": float(r["skipRate"])}
    for _, r in monthly_skip.iterrows()
]

# ---- Reason breakdown ----------------------------------------------------
reason_start_counts = df["reason_start"].value_counts().to_dict()
reason_end_counts = df["reason_end"].value_counts().to_dict()
stats["reasonBreakdown"] = {
    "start": [{"reason": k, "count": int(v)} for k, v in reason_start_counts.items()],
    "end": [{"reason": k, "count": int(v)} for k, v in reason_end_counts.items()],
}

# ---- Shuffle over time (monthly %) ---------------------------------------
monthly_shuffle = (
    df.groupby("month")
    .agg(total=("shuffle", "count"), shuffled=("shuffle", "sum"))
    .reset_index()
)
monthly_shuffle["shuffleRate"] = (monthly_shuffle["shuffled"] / monthly_shuffle["total"] * 100).round(1)
monthly_shuffle = monthly_shuffle.sort_values("month")
stats["shuffleOverTime"] = [
    {"month": str(r["month"]), "shuffleRate": float(r["shuffleRate"])}
    for _, r in monthly_shuffle.iterrows()
]

# ---- Average listen duration per play ------------------------------------
stats["avgListenMinutes"] = round(float(df["ms_played"].mean() / 60_000), 2)

# ---- Platform breakdown --------------------------------------------------
platform_hours = df.groupby("platform")["hours"].sum().nlargest(10).reset_index()
platform_hours.columns = ["platform", "hours"]
stats["platformBreakdown"] = [
    {"platform": r["platform"], "hours": round(r["hours"], 1)}
    for _, r in platform_hours.iterrows()
]

# ---- Offline vs Online ---------------------------------------------------
offline_hours = float(df[df["offline"] == True]["hours"].sum())
online_hours = float(df[df["offline"] == False]["hours"].sum())
stats["offlineVsOnline"] = {
    "offline": round(offline_hours, 1),
    "online": round(online_hours, 1),
}

# ---- Country breakdown ---------------------------------------------------
country_hours = df.groupby("conn_country")["hours"].sum().nlargest(10).reset_index()
country_hours.columns = ["country", "hours"]
stats["countryBreakdown"] = [
    {"country": r["country"], "hours": round(r["hours"], 1)}
    for _, r in country_hours.iterrows()
]

# ---- Content type split (monthly) ----------------------------------------
ct_monthly = (
    df.groupby(["month", "content_type"])["hours"].sum().reset_index()
)
ct_monthly["month"] = ct_monthly["month"].astype(str)
ct_months = sorted(ct_monthly["month"].unique())
content_type_split = []
for m in ct_months:
    row = {"month": m}
    for ct in ["music", "podcast", "audiobook", "other"]:
        val = ct_monthly[(ct_monthly["month"] == m) & (ct_monthly["content_type"] == ct)]["hours"]
        row[ct] = round(float(val.iloc[0]), 2) if len(val) > 0 else 0
    content_type_split.append(row)
stats["contentTypeSplit"] = content_type_split

# ---- Top podcasts --------------------------------------------------------
podcasts = df[df["content_type"] == "podcast"]
if len(podcasts) > 0:
    top_pods = podcasts.groupby("episode_show_name")["hours"].sum().nlargest(10).reset_index()
    top_pods.columns = ["name", "hours"]
    stats["topPodcasts"] = [
        {"name": r["name"], "hours": round(r["hours"], 1)}
        for _, r in top_pods.iterrows()
    ]
else:
    stats["topPodcasts"] = []

# ---- New artist discovery per month --------------------------------------
music_sorted = music_df.sort_values("ts")
first_listen = music_sorted.drop_duplicates("master_metadata_album_artist_name", keep="first")
first_listen["month_str"] = first_listen["month"].astype(str)
discovery = first_listen.groupby("month_str").size().reset_index(name="newArtists")
discovery = discovery.sort_values("month_str")
stats["newArtistDiscovery"] = [
    {"month": r["month_str"], "newArtists": int(r["newArtists"])}
    for _, r in discovery.iterrows()
]

# ---------------------------------------------------------------------------
# 3. Write output
# ---------------------------------------------------------------------------
os.makedirs("public", exist_ok=True)
output_path = os.path.join("public", "stats.json")
with open(output_path, "w") as f:
    json.dump(stats, f)

file_size_mb = os.path.getsize(output_path) / (1024 * 1024)
print(f"Wrote {output_path} ({file_size_mb:.1f} MB)")
