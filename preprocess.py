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

# ===========================================================================
# 3. Spotify Account Data metrics
# ===========================================================================
ACCOUNT_DIR = "../Spotify Account Data/"

# ---------------------------------------------------------------------------
# 3a. Playlist Insights
# ---------------------------------------------------------------------------
print("Computing playlist insights …")
playlist_files = sorted(
    glob.glob(os.path.join(ACCOUNT_DIR, "Playlist*.json"))
)

all_playlists = []  # list of (name, items_list)
for pf in playlist_files:
    with open(pf, "r") as fh:
        data = json.load(fh)
    # Normal playlist files have a "playlists" key
    if "playlists" in data:
        for pl in data["playlists"]:
            items = pl.get("items", [])
            all_playlists.append((pl["name"], items))
    # PlaylistInABottle has capsule keys – skip for playlist stats

total_playlists = len(all_playlists)
total_playlist_tracks = sum(len(items) for _, items in all_playlists)
avg_playlist_size = round(total_playlist_tracks / max(total_playlists, 1), 1)
largest_playlist = max(all_playlists, key=lambda x: len(x[1]), default=("", []))

# Playlist growth over time (tracks added per month)
added_dates = []
for _, items in all_playlists:
    for item in items:
        ad = item.get("addedDate")
        if ad:
            added_dates.append(ad[:7])  # "YYYY-MM"

playlist_growth_counter: dict[str, int] = defaultdict(int)
for ym in added_dates:
    playlist_growth_counter[ym] += 1
playlist_growth = [
    {"month": m, "tracks": playlist_growth_counter[m]}
    for m in sorted(playlist_growth_counter.keys())
]

# Top playlists by size
playlists_by_size = sorted(all_playlists, key=lambda x: len(x[1]), reverse=True)[:15]
top_playlists_by_size = [
    {"name": name, "tracks": len(items)} for name, items in playlists_by_size
]

# Playlist diversity score (unique artists / total tracks)
playlist_diversity = []
for name, items in all_playlists:
    if len(items) < 5:
        continue  # skip tiny playlists
    artists_in_pl = set()
    for item in items:
        tr = item.get("track")
        if tr and tr.get("artistName"):
            artists_in_pl.add(tr["artistName"])
    diversity = round(len(artists_in_pl) / len(items), 3) if items else 0
    playlist_diversity.append({
        "name": name,
        "diversity": diversity,
        "uniqueArtists": len(artists_in_pl),
        "totalTracks": len(items),
    })
playlist_diversity.sort(key=lambda x: x["diversity"], reverse=True)

stats["playlistInsights"] = {
    "totalPlaylists": total_playlists,
    "totalTracks": total_playlist_tracks,
    "avgPlaylistSize": avg_playlist_size,
    "largestPlaylist": {"name": largest_playlist[0], "tracks": len(largest_playlist[1])},
    "growthOverTime": playlist_growth,
    "topBySize": top_playlists_by_size,
    "diversity": playlist_diversity[:20],  # top 20 most diverse
}
print(f"  {total_playlists} playlists, {total_playlist_tracks} total tracks")

# ---------------------------------------------------------------------------
# 3b. Search Behavior
# ---------------------------------------------------------------------------
print("Computing search behavior …")
search_path = os.path.join(ACCOUNT_DIR, "SearchQueries.json")
with open(search_path, "r") as fh:
    search_data = json.load(fh)

# Parse timestamps and filter to meaningful searches (those with interactions)
search_records = []
for s in search_data:
    query = s.get("searchQuery", "").strip()
    uris = s.get("searchInteractionURIs", [])
    raw_time = s.get("searchTime", "")
    platform = s.get("platform", "")
    # Parse timestamp – remove [UTC] suffix
    ts_str = raw_time.replace("[UTC]", "").strip()
    try:
        ts = pd.to_datetime(ts_str, utc=True)
    except Exception:
        continue
    search_records.append({
        "query": query,
        "ts": ts,
        "platform": platform,
        "hasInteraction": len(uris) > 0 and any(u for u in uris),
        "uris": uris,
    })

search_df = pd.DataFrame(search_records)
if len(search_df) > 0:
    search_df["ts"] = pd.to_datetime(search_df["ts"], utc=True)
    search_df["ts"] = search_df["ts"].dt.tz_convert("US/Eastern")
    search_df["month"] = search_df["ts"].dt.to_period("M").astype(str)
    search_df["hour_of_day"] = search_df["ts"].dt.hour
    search_df["date"] = search_df["ts"].dt.date

    # Only meaningful searches (with interactions)
    meaningful = search_df[search_df["hasInteraction"]].copy()

    total_searches = len(meaningful)
    unique_queries = int(meaningful["query"].nunique())
    date_range_days = (meaningful["date"].max() - meaningful["date"].min()).days + 1
    avg_searches_per_day = round(total_searches / max(date_range_days, 1), 1)

    # Search activity over time (monthly)
    search_monthly = meaningful.groupby("month").size().reset_index(name="count")
    search_monthly = search_monthly.sort_values("month")
    search_over_time = [
        {"month": r["month"], "count": int(r["count"])}
        for _, r in search_monthly.iterrows()
    ]

    # Top search queries
    query_counts = meaningful["query"].str.lower().value_counts().head(20)
    top_queries = [
        {"query": q, "count": int(c)} for q, c in query_counts.items()
    ]

    # Search hour-of-day distribution
    search_hod = meaningful.groupby("hour_of_day").size()
    search_hour_dist = [
        {"hour": int(h), "count": int(search_hod.get(h, 0))} for h in range(24)
    ]

    stats["searchBehavior"] = {
        "totalSearches": total_searches,
        "uniqueQueries": unique_queries,
        "avgSearchesPerDay": avg_searches_per_day,
        "overTime": search_over_time,
        "topQueries": top_queries,
        "hourOfDay": search_hour_dist,
    }
    print(f"  {total_searches} meaningful searches, {unique_queries} unique queries")
else:
    stats["searchBehavior"] = {
        "totalSearches": 0, "uniqueQueries": 0, "avgSearchesPerDay": 0,
        "overTime": [], "topQueries": [], "hourOfDay": [],
    }

# ---------------------------------------------------------------------------
# 3c. Wrapped 2024 Spotlight
# ---------------------------------------------------------------------------
print("Computing Wrapped 2024 spotlight …")
wrapped_path = os.path.join(ACCOUNT_DIR, "Wrapped2024.json")
with open(wrapped_path, "r") as fh:
    wrapped = json.load(fh)

yearly_metrics = wrapped.get("yearlyMetrics", {})
top_artists_w = wrapped.get("topArtists", {})
top_tracks_w = wrapped.get("topTracks", {})
music_evolution = wrapped.get("musicEvolution", {})

total_2024_hours = round(yearly_metrics.get("totalMsListened", 0) / 3_600_000, 1)
top_percent = round(100 - yearly_metrics.get("percentGreaterThanWorldwideUsers", 0), 1)
most_listened_day = yearly_metrics.get("mostListenedDay", "")
most_listened_day_mins = round(yearly_metrics.get("mostListenedDayMinutes", 0), 1)
distinct_tracks = top_tracks_w.get("distinctTracksPlayed", 0)
top_track_play_count = top_tracks_w.get("topTrackPlayCount", 0)
top_track_first_played = top_tracks_w.get("topTrackFirstPlayedDate", "")
num_unique_artists_2024 = top_artists_w.get("numUniqueArtists", 0)

# Build eras
MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
               "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
eras = []
for era in music_evolution.get("eras", []):
    peak_month_idx = era.get("peakMonth", 0)
    peak_month_name = MONTH_NAMES[peak_month_idx] if 0 <= peak_month_idx < 12 else str(peak_month_idx)
    tracks = [t.get("trackName", "") for t in era.get("tracks", [])]
    eras.append({
        "peakMonth": peak_month_name,
        "peakMonthIndex": peak_month_idx,
        "genre": era.get("genre", ""),
        "mood": era.get("mood", ""),
        "descriptor": era.get("descriptor", ""),
        "color": era.get("color", ""),
        "tracks": tracks,
    })

stats["wrapped2024"] = {
    "totalHours": total_2024_hours,
    "topPercentGlobally": top_percent,
    "mostListenedDay": most_listened_day,
    "mostListenedDayMinutes": most_listened_day_mins,
    "distinctTracks": distinct_tracks,
    "uniqueArtists": num_unique_artists_2024,
    "topTrackPlayCount": top_track_play_count,
    "topTrackFirstPlayed": top_track_first_played,
    "eras": eras,
}
print(f"  2024: {total_2024_hours} hours, top {top_percent}% globally, {len(eras)} eras")

# ---------------------------------------------------------------------------
# 3d. Library Health (cross-dataset)
# ---------------------------------------------------------------------------
print("Computing library health …")
library_path = os.path.join(ACCOUNT_DIR, "YourLibrary.json")
with open(library_path, "r") as fh:
    library_data = json.load(fh)

library_tracks = library_data.get("tracks", [])
library_uris = set(t.get("uri") for t in library_tracks if t.get("uri"))
library_size = len(library_tracks)

# Set of all URIs ever streamed
streamed_uris = set(df["spotify_track_uri"].dropna().unique())

# Library utilization: how many saved tracks appear in streaming history
utilized_uris = library_uris & streamed_uris
utilization_rate = round(len(utilized_uris) / max(library_size, 1) * 100, 1)

# "Unsaved Favorites": top played tracks NOT in library
music_with_uri = df[(df["content_type"] == "music") & df["spotify_track_uri"].notna()].copy()
track_hours = (
    music_with_uri.groupby(["spotify_track_uri", "master_metadata_track_name", "master_metadata_album_artist_name"])
    ["hours"].sum().reset_index()
)
track_hours.columns = ["uri", "name", "artist", "hours"]
unsaved = track_hours[~track_hours["uri"].isin(library_uris)].nlargest(10, "hours")
unsaved_favorites = [
    {"name": r["name"], "artist": r["artist"], "hours": round(r["hours"], 1)}
    for _, r in unsaved.iterrows()
]

# "Forgotten Saves": library tracks not played in last 12 months
last_date = df["ts"].max()
twelve_months_ago = last_date - pd.DateOffset(months=12)
recent_uris = set(
    df[df["ts"] >= twelve_months_ago]["spotify_track_uri"].dropna().unique()
)
forgotten_count = len(library_uris - recent_uris)
forgotten_pct = round(forgotten_count / max(library_size, 1) * 100, 1)

# Library artist concentration
lib_artist_counts: dict[str, int] = defaultdict(int)
for t in library_tracks:
    artist = t.get("artist", "Unknown")
    if artist:
        lib_artist_counts[artist] += 1
top_lib_artists = sorted(lib_artist_counts.items(), key=lambda x: x[1], reverse=True)[:10]
library_artist_concentration = [
    {"name": a, "count": c} for a, c in top_lib_artists
]

stats["libraryHealth"] = {
    "librarySize": library_size,
    "utilizationRate": utilization_rate,
    "utilizedCount": len(utilized_uris),
    "unsavedFavorites": unsaved_favorites,
    "forgottenSaves": forgotten_count,
    "forgottenSavesPct": forgotten_pct,
    "artistConcentration": library_artist_concentration,
}
print(f"  Library: {library_size} tracks, {utilization_rate}% utilized, {forgotten_count} forgotten")

# ---------------------------------------------------------------------------
# 3e. Playlist x Streaming Overlap (cross-dataset)
# ---------------------------------------------------------------------------
print("Computing playlist-stream overlap …")

# Build a map: playlist_name -> set of track URIs
playlist_uri_map: dict[str, set] = {}
for name, items in all_playlists:
    uris_in_pl = set()
    for item in items:
        tr = item.get("track")
        if tr and tr.get("trackUri"):
            uris_in_pl.add(tr["trackUri"])
    playlist_uri_map[name] = uris_in_pl

# All playlist URIs combined
all_playlist_uris = set()
for uri_set in playlist_uri_map.values():
    all_playlist_uris.update(uri_set)

# Total streaming hours from playlist tracks
playlist_stream_hours = float(
    music_with_uri[music_with_uri["spotify_track_uri"].isin(all_playlist_uris)]["hours"].sum()
)
total_stream_hours = float(music_with_uri["hours"].sum())
playlist_loyalty_score = round(playlist_stream_hours / max(total_stream_hours, 1) * 100, 1)

# Most-played playlists (by streaming hours)
playlist_hours_list = []
for name, uri_set in playlist_uri_map.items():
    if len(uri_set) == 0:
        continue
    hrs = float(music_with_uri[music_with_uri["spotify_track_uri"].isin(uri_set)]["hours"].sum())
    streamed_count = int(music_with_uri[music_with_uri["spotify_track_uri"].isin(uri_set)]["spotify_track_uri"].nunique())
    playlist_hours_list.append({
        "name": name,
        "hours": round(hrs, 1),
        "totalTracks": len(uri_set),
        "streamedTracks": streamed_count,
    })
playlist_hours_list.sort(key=lambda x: x["hours"], reverse=True)

# Dead playlists: < 10% of tracks ever streamed
dead_playlists = []
for entry in playlist_hours_list:
    if entry["totalTracks"] >= 5:
        stream_rate = entry["streamedTracks"] / entry["totalTracks"]
        if stream_rate < 0.10:
            dead_playlists.append({
                "name": entry["name"],
                "totalTracks": entry["totalTracks"],
                "streamedTracks": entry["streamedTracks"],
            })

# Discover Weekly Hit Rate
dw_name = None
for name in playlist_uri_map:
    if "discover weekly" in name.lower():
        dw_name = name
        break

dw_hit_rate = None
if dw_name:
    dw_uris = playlist_uri_map[dw_name]
    # Count how many DW tracks were played 3+ times in streaming history
    dw_play_counts = (
        music_with_uri[music_with_uri["spotify_track_uri"].isin(dw_uris)]
        .groupby("spotify_track_uri").size()
    )
    dw_hits = int((dw_play_counts >= 3).sum())
    dw_total = len(dw_uris)
    dw_hit_rate = {
        "playlistName": dw_name,
        "totalTracks": dw_total,
        "hitTracks": dw_hits,
        "hitRate": round(dw_hits / max(dw_total, 1) * 100, 1),
    }

stats["playlistStreamOverlap"] = {
    "loyaltyScore": playlist_loyalty_score,
    "playlistHours": playlist_stream_hours,
    "mostPlayedPlaylists": playlist_hours_list[:15],
    "deadPlaylists": dead_playlists[:10],
    "discoverWeeklyHitRate": dw_hit_rate,
}
print(f"  Playlist loyalty: {playlist_loyalty_score}%, DW hit rate: {dw_hit_rate}")

# ---------------------------------------------------------------------------
# 3f. Search-to-Listen Pipeline (cross-dataset)
# ---------------------------------------------------------------------------
print("Computing search-to-listen pipeline …")

if len(search_df) > 0 and "meaningful" in dir() and len(meaningful) > 0:
    # Extract artist names from search queries (best effort: match against
    # known streaming artists)
    known_artists = set(
        df["master_metadata_album_artist_name"].dropna().str.lower().unique()
    )

    # For each meaningful search, try to match query to an artist
    search_artist_matches = []
    for _, row in meaningful.iterrows():
        q = row["query"].lower().strip()
        if q in known_artists:
            search_artist_matches.append({
                "artist": q,
                "search_ts": row["ts"],
            })

    # "Search to Obsession": artists searched for → total hours listened after search
    if search_artist_matches:
        search_match_df = pd.DataFrame(search_artist_matches)
        # Get first search date per artist
        first_search = search_match_df.groupby("artist")["search_ts"].min().reset_index()
        first_search.columns = ["artist_lower", "first_search_ts"]

        # Join with streaming data to get post-search hours
        music_lower = music_with_uri.copy()
        music_lower["artist_lower"] = music_lower["master_metadata_album_artist_name"].str.lower()

        search_obsession = []
        for _, sr in first_search.iterrows():
            artist_l = sr["artist_lower"]
            search_ts = sr["first_search_ts"]
            post_search = music_lower[
                (music_lower["artist_lower"] == artist_l) &
                (music_lower["ts"] >= search_ts)
            ]
            hours_after = float(post_search["hours"].sum())
            # Get display name (proper case) from streaming data
            display_names = music_lower[music_lower["artist_lower"] == artist_l]["master_metadata_album_artist_name"].dropna()
            display_name = display_names.iloc[0] if len(display_names) > 0 else artist_l
            search_obsession.append({
                "name": display_name,
                "hours": round(hours_after, 1),
                "firstSearched": str(search_ts.date()),
            })
        search_obsession.sort(key=lambda x: x["hours"], reverse=True)

        # "Impulse Listener": searches followed by a stream within 5 minutes
        impulse_count = 0
        for _, row in meaningful.iterrows():
            q = row["query"].lower().strip()
            search_ts = row["ts"]
            five_min_later = search_ts + pd.Timedelta(minutes=5)
            # Check if there's a stream of the same artist within 5 min
            nearby_streams = music_lower[
                (music_lower["artist_lower"] == q) &
                (music_lower["ts"] >= search_ts) &
                (music_lower["ts"] <= five_min_later)
            ]
            if len(nearby_streams) > 0:
                impulse_count += 1

        impulse_pct = round(impulse_count / max(len(meaningful), 1) * 100, 1)

        # Average search-to-first-listen gap (for matched artists)
        gaps = []
        for _, sr in first_search.iterrows():
            artist_l = sr["artist_lower"]
            search_ts = sr["first_search_ts"]
            first_listen_after = music_lower[
                (music_lower["artist_lower"] == artist_l) &
                (music_lower["ts"] >= search_ts)
            ]["ts"].min()
            if pd.notna(first_listen_after):
                gap_minutes = (first_listen_after - search_ts).total_seconds() / 60
                if gap_minutes >= 0:
                    gaps.append(gap_minutes)
        avg_gap_minutes = round(np.mean(gaps), 1) if gaps else 0

        stats["searchListenPipeline"] = {
            "searchToObsession": search_obsession[:10],
            "impulsePct": impulse_pct,
            "impulseCount": impulse_count,
            "avgGapMinutes": avg_gap_minutes,
        }
        print(f"  {len(search_obsession)} artist matches, {impulse_pct}% impulse, avg gap {avg_gap_minutes} min")
    else:
        stats["searchListenPipeline"] = {
            "searchToObsession": [], "impulsePct": 0, "impulseCount": 0, "avgGapMinutes": 0,
        }
else:
    stats["searchListenPipeline"] = {
        "searchToObsession": [], "impulsePct": 0, "impulseCount": 0, "avgGapMinutes": 0,
    }

# ---------------------------------------------------------------------------
# 4. Write output
# ---------------------------------------------------------------------------
os.makedirs("public", exist_ok=True)
output_path = os.path.join("public", "stats.json")
with open(output_path, "w") as f:
    json.dump(stats, f)

file_size_mb = os.path.getsize(output_path) / (1024 * 1024)
print(f"Wrote {output_path} ({file_size_mb:.1f} MB)")
