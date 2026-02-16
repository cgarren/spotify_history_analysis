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

# Playlist growth from technical logs (long history, supports user-only toggle)
techlog_playlist_growth_all = []
techlog_playlist_growth_user = []
techlog_dir_for_playlist_insights = "../Spotify Technical Log Information/"
added_to_playlist_files = sorted(
    glob.glob(os.path.join(techlog_dir_for_playlist_insights, "AddedToPlaylist_*.json"))
)
if not added_to_playlist_files:
    single_adds = os.path.join(techlog_dir_for_playlist_insights, "AddedToPlaylist.json")
    if os.path.exists(single_adds):
        added_to_playlist_files = [single_adds]

if added_to_playlist_files:
    add_frames = []
    for fp in added_to_playlist_files:
        with open(fp, "r") as fh:
            add_data = json.load(fh)
        if isinstance(add_data, list) and len(add_data) > 0:
            add_frames.append(pd.DataFrame(add_data))

    if add_frames:
        tech_adds_df = pd.concat(add_frames, ignore_index=True)
        if "timestamp_utc" in tech_adds_df.columns:
            tech_adds_df["ts"] = pd.to_datetime(
                tech_adds_df["timestamp_utc"], format="ISO8601", utc=True, errors="coerce"
            )
            tech_adds_df = tech_adds_df[tech_adds_df["ts"].notna()].copy()

            if "message_item_uri_kind" in tech_adds_df.columns:
                tech_adds_df = tech_adds_df[
                    tech_adds_df["message_item_uri_kind"].eq("track")
                ].copy()

            if len(tech_adds_df) > 0:
                tech_adds_df["month"] = tech_adds_df["ts"].dt.to_period("M").astype(str)
                all_growth = tech_adds_df.groupby("month").size()
                techlog_playlist_growth_all = [
                    {"month": m, "tracks": int(all_growth[m])}
                    for m in sorted(all_growth.index)
                ]

                if "message_client_platform" in tech_adds_df.columns:
                    user_adds_df = tech_adds_df[tech_adds_df["message_client_platform"].notna()].copy()
                else:
                    user_adds_df = tech_adds_df.iloc[0:0].copy()

                if len(user_adds_df) > 0:
                    user_growth = user_adds_df.groupby("month").size()
                    techlog_playlist_growth_user = [
                        {"month": m, "tracks": int(user_growth[m])}
                        for m in sorted(user_growth.index)
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
    "growthOverTimeAll": techlog_playlist_growth_all,
    "growthOverTimeUserOnly": techlog_playlist_growth_user,
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
# Deduplicate by (title, artist) so singles and album versions count as one
music_with_uri = df[(df["content_type"] == "music") & df["spotify_track_uri"].notna()].copy()
track_hours = (
    music_with_uri.groupby(["spotify_track_uri", "master_metadata_track_name", "master_metadata_album_artist_name"])
    ["hours"].sum().reset_index()
)
track_hours.columns = ["uri", "name", "artist", "hours"]

# Build a set of (lowercase title, lowercase artist) from library for fuzzy matching
library_title_artist = set()
for t in library_tracks:
    lib_name = (t.get("track") or "").strip().lower()
    lib_artist = (t.get("artist") or "").strip().lower()
    if lib_name and lib_artist:
        library_title_artist.add((lib_name, lib_artist))

# Exclude tracks that match library by URI *or* by title+artist
unsaved_by_uri = track_hours[~track_hours["uri"].isin(library_uris)].copy()
unsaved_by_uri["_key"] = list(zip(
    unsaved_by_uri["name"].str.strip().str.lower(),
    unsaved_by_uri["artist"].str.strip().str.lower(),
))
unsaved_filtered = unsaved_by_uri[~unsaved_by_uri["_key"].isin(library_title_artist)].copy()

# Aggregate hours by (title, artist) to merge singles/album versions
unsaved_deduped = (
    unsaved_filtered.groupby(["name", "artist"])["hours"]
    .sum()
    .reset_index()
    .nlargest(10, "hours")
)
unsaved_favorites = [
    {"name": r["name"], "artist": r["artist"], "hours": round(r["hours"], 1)}
    for _, r in unsaved_deduped.iterrows()
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

# -----------------------------------------------------------------------
# Library interactions from technical logs (AddedToCollection/RemovedToCollection)
# Primary scope: message_set == "collection"
# Secondary context: other sets (e.g., listenlater)
# -----------------------------------------------------------------------
def detect_uri_kind(uri: str) -> str:
    if not isinstance(uri, str) or not uri:
        return "other"
    if uri.startswith("spotify:track:"):
        return "track"
    if uri.startswith("spotify:album:"):
        return "album"
    if uri.startswith("spotify:artist:"):
        return "artist"
    if uri.startswith("spotify:episode:"):
        return "episode"
    if uri.startswith("spotify:show:"):
        return "show"
    return "other"


def empty_collection_interaction_metrics() -> dict:
    return {
        "totalAdds": 0,
        "totalRemoves": 0,
        "netChange": 0,
        "activeMonths": 0,
        "interactionWindow": {"start": None, "end": None},
        "monthlyTrend": [],
        "kindBreakdown": [],
    }


def compute_collection_interaction_metrics(events_df: pd.DataFrame) -> dict:
    if len(events_df) == 0:
        return empty_collection_interaction_metrics()

    adds = events_df[events_df["eventType"] == "add"]
    removes = events_df[events_df["eventType"] == "remove"]
    total_adds = int(len(adds))
    total_removes = int(len(removes))

    monthly_adds = adds.groupby("month").size().reset_index(name="adds") if len(adds) > 0 else pd.DataFrame(columns=["month", "adds"])
    monthly_removes = removes.groupby("month").size().reset_index(name="removes") if len(removes) > 0 else pd.DataFrame(columns=["month", "removes"])
    monthly = pd.merge(monthly_adds, monthly_removes, on="month", how="outer").fillna(0)
    monthly = monthly.sort_values("month")
    monthly_trend = [
        {
            "month": r["month"],
            "adds": int(r["adds"]),
            "removes": int(r["removes"]),
            "net": int(r["adds"] - r["removes"]),
        }
        for _, r in monthly.iterrows()
    ]

    kind_adds = adds.groupby("uriKind").size().reset_index(name="adds") if len(adds) > 0 else pd.DataFrame(columns=["uriKind", "adds"])
    kind_removes = removes.groupby("uriKind").size().reset_index(name="removes") if len(removes) > 0 else pd.DataFrame(columns=["uriKind", "removes"])
    kind = pd.merge(kind_adds, kind_removes, on="uriKind", how="outer").fillna(0)
    kind = kind.sort_values(["adds", "removes"], ascending=False)
    kind_breakdown = [
        {
            "kind": r["uriKind"],
            "adds": int(r["adds"]),
            "removes": int(r["removes"]),
            "net": int(r["adds"] - r["removes"]),
        }
        for _, r in kind.iterrows()
    ]

    return {
        "totalAdds": total_adds,
        "totalRemoves": total_removes,
        "netChange": int(total_adds - total_removes),
        "activeMonths": int(monthly["month"].nunique()) if len(monthly) > 0 else 0,
        "interactionWindow": {
            "start": str(events_df["ts"].min().date()) if len(events_df) > 0 else None,
            "end": str(events_df["ts"].max().date()) if len(events_df) > 0 else None,
        },
        "monthlyTrend": monthly_trend,
        "kindBreakdown": kind_breakdown,
    }


def load_collection_log(filename: str) -> pd.DataFrame:
    fp = os.path.join(TECHLOG_DIR if "TECHLOG_DIR" in globals() else "../Spotify Technical Log Information/", filename)
    if not os.path.exists(fp):
        return pd.DataFrame()
    with open(fp, "r") as fh:
        payload = json.load(fh)
    if isinstance(payload, list) and len(payload) > 0:
        return pd.DataFrame(payload)
    return pd.DataFrame()


def prepare_collection_events(raw_df: pd.DataFrame, event_type: str) -> pd.DataFrame:
    if len(raw_df) == 0 or "timestamp_utc" not in raw_df.columns:
        return pd.DataFrame(columns=["ts", "month", "set", "uriKind", "eventType", "isUserOnly"])

    out = raw_df.copy()
    out["ts"] = pd.to_datetime(out["timestamp_utc"], format="ISO8601", utc=True, errors="coerce")
    out = out[out["ts"].notna()].copy()
    if len(out) == 0:
        return pd.DataFrame(columns=["ts", "month", "set", "uriKind", "eventType", "isUserOnly"])

    out["ts"] = out["ts"].dt.tz_convert("US/Eastern")
    out["month"] = out["ts"].dt.to_period("M").astype(str)
    out["set"] = out.get("message_set", "unknown").fillna("unknown").astype(str)
    out["uriKind"] = out.get("message_item_uri", "").fillna("").astype(str).apply(detect_uri_kind)
    out["eventType"] = event_type
    if "message_client_platform" in out.columns:
        out["isUserOnly"] = out["message_client_platform"].notna()
    else:
        out["isUserOnly"] = False

    return out[["ts", "month", "set", "uriKind", "eventType", "isUserOnly"]]


added_collection_raw = load_collection_log("AddedToCollection.json")
removed_collection_raw = load_collection_log("RemovedFromCollection.json")

added_collection_events = prepare_collection_events(added_collection_raw, "add")
removed_collection_events = prepare_collection_events(removed_collection_raw, "remove")
collection_events_all_sets = pd.concat([added_collection_events, removed_collection_events], ignore_index=True)

collection_only_events = collection_events_all_sets[
    collection_events_all_sets["set"].str.lower() == "collection"
].copy() if len(collection_events_all_sets) > 0 else pd.DataFrame(columns=["ts", "month", "set", "uriKind", "eventType", "isUserOnly"])

supports_user_only = (
    ("message_client_platform" in added_collection_raw.columns and added_collection_raw["message_client_platform"].notna().any())
    or ("message_client_platform" in removed_collection_raw.columns and removed_collection_raw["message_client_platform"].notna().any())
)

collection_all_metrics = compute_collection_interaction_metrics(collection_only_events)
collection_user_metrics = (
    compute_collection_interaction_metrics(collection_only_events[collection_only_events["isUserOnly"]])
    if supports_user_only else empty_collection_interaction_metrics()
)

stats["libraryHealth"] = {
    "librarySize": library_size,
    "utilizationRate": utilization_rate,
    "utilizedCount": len(utilized_uris),
    "unsavedFavorites": unsaved_favorites,
    "forgottenSaves": forgotten_count,
    "forgottenSavesPct": forgotten_pct,
    "artistConcentration": library_artist_concentration,
    "collectionInteractions": {
        "supportsUserOnly": bool(supports_user_only),
        "all": collection_all_metrics,
        "userOnly": collection_user_metrics,
    },
}
print(
    f"  Library: {library_size} tracks, {utilization_rate}% utilized, {forgotten_count} forgotten | "
    f"collection interactions: +{collection_all_metrics['totalAdds']} / -{collection_all_metrics['totalRemoves']}"
)

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

# ===========================================================================
# 4. Spotify Technical Log Information metrics
# ===========================================================================
TECHLOG_DIR = "../Spotify Technical Log Information/"

# Helper: load and concatenate numbered JSON files
def load_numbered_json(prefix: str, directory: str = TECHLOG_DIR) -> pd.DataFrame:
    """Load files like AddedToPlaylist_0.json, AddedToPlaylist_1.json, …"""
    pattern = os.path.join(directory, f"{prefix}_*.json")
    files = sorted(glob.glob(pattern))
    if not files:
        # Try single file (no number suffix)
        single = os.path.join(directory, f"{prefix}.json")
        if os.path.exists(single):
            files = [single]
    frames = []
    for fp in files:
        with open(fp, "r") as fh:
            data = json.load(fh)
        if isinstance(data, list) and len(data) > 0:
            frames.append(pd.DataFrame(data))
    if frames:
        return pd.concat(frames, ignore_index=True)
    return pd.DataFrame()

def load_single_json(filename: str, directory: str = TECHLOG_DIR) -> pd.DataFrame:
    """Load a single JSON array file."""
    fp = os.path.join(directory, filename)
    if not os.path.exists(fp):
        return pd.DataFrame()
    with open(fp, "r") as fh:
        data = json.load(fh)
    if isinstance(data, list) and len(data) > 0:
        return pd.DataFrame(data)
    return pd.DataFrame()

DOW_NAMES_FULL = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

# ---------------------------------------------------------------------------
# 4a. Playlist Curation Behavior
# ---------------------------------------------------------------------------
print("Computing playlist curation behavior …")

def compute_curation_stats(added_tracks, removed_tracks, streaming_df):
    """Compute all playlist curation metrics for a given set of adds/removes."""
    total_adds = len(added_tracks)
    total_removes = len(removed_tracks)

    # Date range for velocity
    all_dates = pd.concat([added_tracks["ts"], removed_tracks["ts"]]) if total_adds + total_removes > 0 else pd.Series(dtype="datetime64[ns, US/Eastern]")
    if len(all_dates) > 0:
        date_range_weeks = max((all_dates.max() - all_dates.min()).days / 7, 1)
    else:
        date_range_weeks = 1
    adds_per_week = round(total_adds / date_range_weeks, 1)
    removes_per_week = round(total_removes / date_range_weeks, 1)

    # --- Playlist Churn Over Time (adds vs removes per week) ---
    if total_adds > 0:
        adds_weekly = added_tracks.groupby("week").size().reset_index(name="adds")
    else:
        adds_weekly = pd.DataFrame(columns=["week", "adds"])
    if total_removes > 0:
        removes_weekly = removed_tracks.groupby("week").size().reset_index(name="removes")
    else:
        removes_weekly = pd.DataFrame(columns=["week", "removes"])
    churn_df = pd.merge(adds_weekly, removes_weekly, on="week", how="outer").fillna(0)
    churn_df = churn_df.sort_values("week")
    churn_over_time = [
        {"week": r["week"], "adds": int(r["adds"]), "removes": int(r["removes"])}
        for _, r in churn_df.iterrows()
    ]

    # --- Curation Hour Heatmap ---
    parts = []
    if total_adds > 0:
        parts.append(added_tracks[["hour_of_day", "day_of_week"]])
    if total_removes > 0:
        parts.append(removed_tracks[["hour_of_day", "day_of_week"]])
    curation_heatmap_data = []
    if parts:
        curation_events = pd.concat(parts)
        curation_heatmap_group = curation_events.groupby(["day_of_week", "hour_of_day"]).size()
    else:
        curation_heatmap_group = pd.Series(dtype=int)
    for d in range(7):
        for h in range(24):
            curation_heatmap_data.append({
                "day": DOW_NAMES_FULL[d],
                "dayIndex": d,
                "hour": h,
                "count": int(curation_heatmap_group.get((d, h), 0)),
            })

    # --- Playlist Regret Score (removed within 7 days of adding) ---
    regret_count = 0
    regret_pct = 0.0
    if (total_adds > 0 and total_removes > 0
            and "message_item_uri" in added_tracks.columns
            and "message_item_uri" in removed_tracks.columns):
        add_lookup = added_tracks[["message_item_uri", "message_playlist_uri", "ts"]].copy()
        add_lookup.columns = ["track_uri", "playlist_uri", "add_ts"]
        rem_lookup = removed_tracks[["message_item_uri", "message_playlist_uri", "ts"]].copy()
        rem_lookup.columns = ["track_uri", "playlist_uri", "rem_ts"]

        regret_merged = pd.merge(add_lookup, rem_lookup, on=["track_uri", "playlist_uri"])
        regret_merged["gap_days"] = (regret_merged["rem_ts"] - regret_merged["add_ts"]).dt.total_seconds() / 86400
        regret_merged = regret_merged[regret_merged["gap_days"] >= 0]
        regret_merged = regret_merged.sort_values("gap_days").drop_duplicates(
            subset=["track_uri", "playlist_uri", "add_ts"], keep="first"
        )
        regrets = regret_merged[regret_merged["gap_days"] <= 7]
        regret_count = len(regrets)
        regret_pct = round(regret_count / max(total_adds, 1) * 100, 1)

    # --- Impulse Add Timing (time from first stream to playlist add) ---
    impulse_bins = {"< 1 hour": 0, "< 1 day": 0, "< 1 week": 0, "< 1 month": 0, "1+ months": 0}
    if total_adds > 0 and "message_item_uri" in added_tracks.columns:
        stream_first = (
            streaming_df[streaming_df["spotify_track_uri"].notna()]
            .groupby("spotify_track_uri")["ts"]
            .min()
            .reset_index()
        )
        stream_first.columns = ["track_uri", "first_stream_ts"]

        add_with_stream = pd.merge(
            added_tracks[["message_item_uri", "ts"]].rename(columns={"message_item_uri": "track_uri", "ts": "add_ts"}),
            stream_first,
            on="track_uri",
            how="inner",
        )
        add_with_stream["gap_hours"] = (
            (add_with_stream["add_ts"] - add_with_stream["first_stream_ts"]).dt.total_seconds() / 3600
        )
        positive_gaps = add_with_stream[add_with_stream["gap_hours"] >= 0]["gap_hours"]
        for gap in positive_gaps:
            if gap < 1:
                impulse_bins["< 1 hour"] += 1
            elif gap < 24:
                impulse_bins["< 1 day"] += 1
            elif gap < 168:
                impulse_bins["< 1 week"] += 1
            elif gap < 730:
                impulse_bins["< 1 month"] += 1
            else:
                impulse_bins["1+ months"] += 1
    impulse_add_timing = [{"bin": k, "count": v} for k, v in impulse_bins.items()]

    # --- Abandoned Adds (added to playlist, never streamed again) ---
    abandoned_count = 0
    abandoned_pct = 0.0
    abandoned_tracks_list = []
    if total_adds > 0 and "message_item_uri" in added_tracks.columns:
        add_records = added_tracks[["message_item_uri", "ts"]].rename(
            columns={"message_item_uri": "track_uri", "ts": "add_ts"}
        )
        stream_events = streaming_df[streaming_df["spotify_track_uri"].notna()][["spotify_track_uri", "ts"]].copy()
        stream_events.columns = ["track_uri", "stream_ts"]

        add_latest = add_records.groupby("track_uri")["add_ts"].max().reset_index()
        stream_latest = stream_events.groupby("track_uri")["stream_ts"].max().reset_index()

        abandon_check = pd.merge(add_latest, stream_latest, on="track_uri", how="left")
        abandon_check["abandoned"] = (
            abandon_check["stream_ts"].isna() |
            (abandon_check["stream_ts"] < abandon_check["add_ts"])
        )
        abandoned_count = int(abandon_check["abandoned"].sum())
        total_unique_adds = len(abandon_check)
        abandoned_pct = round(abandoned_count / max(total_unique_adds, 1) * 100, 1)

        abandoned_uris = set(abandon_check[abandon_check["abandoned"]]["track_uri"].head(50))
        named_tracks = streaming_df[streaming_df["spotify_track_uri"].isin(abandoned_uris)].drop_duplicates("spotify_track_uri")[
            ["spotify_track_uri", "master_metadata_track_name", "master_metadata_album_artist_name"]
        ]
        for _, row in named_tracks.head(10).iterrows():
            name = row.get("master_metadata_track_name", "Unknown")
            artist = row.get("master_metadata_album_artist_name", "Unknown")
            if pd.notna(name) and pd.notna(artist):
                abandoned_tracks_list.append({"name": name, "artist": artist})

    return {
        "totalAdds": total_adds,
        "totalRemoves": total_removes,
        "addsPerWeek": adds_per_week,
        "removesPerWeek": removes_per_week,
        "churnOverTime": churn_over_time,
        "curationHeatmap": curation_heatmap_data,
        "regretCount": regret_count,
        "regretPct": regret_pct,
        "impulseAddTiming": impulse_add_timing,
        "abandonedCount": abandoned_count,
        "abandonedPct": abandoned_pct,
        "abandonedExamples": abandoned_tracks_list,
    }


EMPTY_CURATION = {
    "totalAdds": 0, "totalRemoves": 0, "addsPerWeek": 0, "removesPerWeek": 0,
    "churnOverTime": [], "curationHeatmap": [], "regretCount": 0, "regretPct": 0,
    "impulseAddTiming": [], "abandonedCount": 0, "abandonedPct": 0, "abandonedExamples": [],
}

added_df = load_numbered_json("AddedToPlaylist")
removed_df = load_numbered_json("RemovedFromPlaylist")

if len(added_df) > 0 and len(removed_df) > 0:
    # Parse timestamps
    added_df["ts"] = pd.to_datetime(added_df["timestamp_utc"], format="ISO8601", utc=True).dt.tz_convert("US/Eastern")
    removed_df["ts"] = pd.to_datetime(removed_df["timestamp_utc"], format="ISO8601", utc=True).dt.tz_convert("US/Eastern")

    added_df["date"] = added_df["ts"].dt.date
    removed_df["date"] = removed_df["ts"].dt.date
    added_df["week"] = added_df["ts"].dt.to_period("W").astype(str)
    removed_df["week"] = removed_df["ts"].dt.to_period("W").astype(str)
    added_df["hour_of_day"] = added_df["ts"].dt.hour
    added_df["day_of_week"] = added_df["ts"].dt.dayofweek
    removed_df["hour_of_day"] = removed_df["ts"].dt.hour
    removed_df["day_of_week"] = removed_df["ts"].dt.dayofweek

    # Filter to track items only
    added_tracks = added_df[added_df.get("message_item_uri_kind", pd.Series(dtype=str)).eq("track")].copy()
    removed_tracks = removed_df[removed_df.get("message_item_uri_kind", pd.Series(dtype=str)).eq("track")].copy()

    # Compute stats for ALL activity
    all_stats = compute_curation_stats(added_tracks, removed_tracks, df)
    print(f"  ALL: {all_stats['totalAdds']:,} adds, {all_stats['totalRemoves']:,} removes, {all_stats['regretCount']} regrets, {all_stats['abandonedCount']} abandoned")

    # Compute stats for USER-ONLY activity (message_client_platform is not null)
    user_added = added_tracks[added_tracks["message_client_platform"].notna()].copy() if "message_client_platform" in added_tracks.columns else added_tracks.iloc[0:0].copy()
    user_removed = removed_tracks[removed_tracks["message_client_platform"].notna()].copy() if "message_client_platform" in removed_tracks.columns else removed_tracks.iloc[0:0].copy()
    user_stats = compute_curation_stats(user_added, user_removed, df)
    print(f"  USER: {user_stats['totalAdds']:,} adds, {user_stats['totalRemoves']:,} removes, {user_stats['regretCount']} regrets, {user_stats['abandonedCount']} abandoned")

    stats["playlistCuration"] = {
        "all": all_stats,
        "userOnly": user_stats,
    }
else:
    stats["playlistCuration"] = {
        "all": EMPTY_CURATION,
        "userOnly": EMPTY_CURATION,
    }

# ---------------------------------------------------------------------------
# 4b. Playback Quality & Reliability
# ---------------------------------------------------------------------------
print("Computing playback quality metrics …")

errors_df = load_single_json("PlaybackError_Hourly.json")
stutter_df = load_single_json("Stutter_Hourly.json")
download_df = load_single_json("Download_Hourly.json")

# Audio Quality Profile (bitrate distribution from downloads)
bitrate_distribution = []
if len(download_df) > 0 and "message_bitrate" in download_df.columns:
    bitrate_counts = download_df["message_bitrate"].value_counts().reset_index()
    bitrate_counts.columns = ["bitrate", "count"]
    bitrate_distribution = [
        {"bitrate": f"{int(r['bitrate'] / 1000)}kbps", "count": int(r["count"])}
        for _, r in bitrate_counts.iterrows()
        if pd.notna(r["bitrate"]) and r["bitrate"] > 0
    ]

# Playback Error Rate Over Time
error_over_time = []
total_errors = 0
fatal_errors = 0
if len(errors_df) > 0:
    errors_df["ts"] = pd.to_datetime(errors_df["timestamp_utc"], format="ISO8601", utc=True).dt.tz_convert("US/Eastern")
    errors_df["week"] = errors_df["ts"].dt.to_period("W").astype(str)
    total_errors = len(errors_df)
    fatal_errors = int(errors_df["message_fatal"].sum()) if "message_fatal" in errors_df.columns else 0

    weekly_errors = errors_df.groupby("week").agg(
        total=("message_fatal", "count"),
        fatal=("message_fatal", "sum"),
    ).reset_index()
    weekly_errors = weekly_errors.sort_values("week")
    error_over_time = [
        {"week": r["week"], "total": int(r["total"]), "fatal": int(r["fatal"])}
        for _, r in weekly_errors.iterrows()
    ]

# Stutter Timeline
stutter_timeline = []
total_stutters = 0
if len(stutter_df) > 0:
    stutter_df["ts"] = pd.to_datetime(stutter_df["timestamp_utc"], format="ISO8601", utc=True).dt.tz_convert("US/Eastern")
    stutter_df["week"] = stutter_df["ts"].dt.to_period("W").astype(str)
    total_stutters = len(stutter_df)
    weekly_stutters = stutter_df.groupby("week").size().reset_index(name="count")
    weekly_stutters = weekly_stutters.sort_values("week")
    stutter_timeline = [
        {"week": r["week"], "count": int(r["count"])}
        for _, r in weekly_stutters.iterrows()
    ]

# Error Tolerance (cross-ref: after playback error, did user retry or skip?)
error_tolerance_retry = 0
error_tolerance_skip = 0
if len(errors_df) > 0 and "message_track_id" in errors_df.columns:
    for _, err_row in errors_df.iterrows():
        err_track = err_row.get("message_track_id")
        err_ts = err_row["ts"]
        if not err_track or pd.isna(err_ts):
            continue
        # Look for next stream within 10 minutes in extended history
        window_end = err_ts + pd.Timedelta(minutes=10)
        next_streams = df[(df["ts"] >= err_ts) & (df["ts"] <= window_end)].head(3)
        if len(next_streams) > 0:
            # Check if any of the next streams is the same track (retry)
            next_uris = set(next_streams["spotify_track_uri"].dropna())
            if err_track in next_uris:
                error_tolerance_retry += 1
            else:
                error_tolerance_skip += 1
        else:
            error_tolerance_skip += 1
error_tolerance_total = error_tolerance_retry + error_tolerance_skip
error_tolerance_retry_pct = round(
    error_tolerance_retry / max(error_tolerance_total, 1) * 100, 1
)

# Download vs Stream: use offline field from extended streaming history (already computed)
# We'll provide download counts over time from the download log
download_over_time = []
if len(download_df) > 0:
    download_df["ts"] = pd.to_datetime(download_df["timestamp_utc"], format="ISO8601", utc=True).dt.tz_convert("US/Eastern")
    download_df["week"] = download_df["ts"].dt.to_period("W").astype(str)
    dl_weekly = download_df.groupby("week").size().reset_index(name="downloads")
    dl_weekly = dl_weekly.sort_values("week")
    download_over_time = [
        {"week": r["week"], "downloads": int(r["downloads"])}
        for _, r in dl_weekly.iterrows()
    ]

stats["playbackQuality"] = {
    "bitrateDistribution": bitrate_distribution,
    "totalErrors": total_errors,
    "fatalErrors": fatal_errors,
    "errorOverTime": error_over_time,
    "totalStutters": total_stutters,
    "stutterTimeline": stutter_timeline,
    "errorToleranceRetryPct": error_tolerance_retry_pct,
    "errorToleranceRetries": error_tolerance_retry,
    "errorToleranceSkips": error_tolerance_skip,
    "downloadOverTime": download_over_time,
}
print(f"  {total_errors} errors ({fatal_errors} fatal), {total_stutters} stutters, retry rate {error_tolerance_retry_pct}%")

# ---------------------------------------------------------------------------
# 4c. Social Listening & Sharing
# ---------------------------------------------------------------------------
print("Computing social & sharing metrics …")

social_created_df = load_single_json("SocialConnectSessionCreated.json")
social_ended_df = load_single_json("SocialConnectSessionEnded.json")
share_df = load_single_json("Share.json")

# Social session stats
social_sessions = []
total_social_sessions = 0
avg_session_minutes = 0
longest_session_minutes = 0
total_social_hours = 0

if len(social_created_df) > 0 and len(social_ended_df) > 0:
    social_created_df["ts"] = pd.to_datetime(social_created_df["timestamp_utc"], format="ISO8601", utc=True).dt.tz_convert("US/Eastern")
    social_ended_df["ts"] = pd.to_datetime(social_ended_df["timestamp_utc"], format="ISO8601", utc=True).dt.tz_convert("US/Eastern")

    # Match sessions by session_id
    if "message_session_id" in social_created_df.columns and "message_session_id" in social_ended_df.columns:
        created_by_id = social_created_df.groupby("message_session_id")["ts"].min().reset_index()
        created_by_id.columns = ["session_id", "start_ts"]
        ended_by_id = social_ended_df.groupby("message_session_id")["ts"].max().reset_index()
        ended_by_id.columns = ["session_id", "end_ts"]

        sessions_merged = pd.merge(created_by_id, ended_by_id, on="session_id", how="inner")
        sessions_merged["duration_minutes"] = (
            (sessions_merged["end_ts"] - sessions_merged["start_ts"]).dt.total_seconds() / 60
        )
        # Filter valid sessions (positive duration, < 24 hours)
        valid_sessions = sessions_merged[
            (sessions_merged["duration_minutes"] > 0) &
            (sessions_merged["duration_minutes"] < 1440)
        ]
        total_social_sessions = len(valid_sessions)
        if total_social_sessions > 0:
            avg_session_minutes = round(float(valid_sessions["duration_minutes"].mean()), 1)
            longest_session_minutes = round(float(valid_sessions["duration_minutes"].max()), 1)
            total_social_hours = round(float(valid_sessions["duration_minutes"].sum() / 60), 1)
            social_sessions = [
                {
                    "start": str(r["start_ts"]),
                    "end": str(r["end_ts"]),
                    "durationMinutes": round(r["duration_minutes"], 1),
                }
                for _, r in valid_sessions.sort_values("start_ts").iterrows()
            ]

# Share analysis
share_destinations = []
share_worthy_threshold = []
share_over_time = []
total_shares = 0

if len(share_df) > 0:
    share_df["ts"] = pd.to_datetime(share_df["timestamp_utc"], format="ISO8601", utc=True).dt.tz_convert("US/Eastern")
    total_shares = len(share_df)

    # Share destinations
    if "message_destination_id" in share_df.columns:
        dest_counts = share_df["message_destination_id"].value_counts().reset_index()
        dest_counts.columns = ["destination", "count"]
        share_destinations = [
            {"destination": str(r["destination"]), "count": int(r["count"])}
            for _, r in dest_counts.iterrows()
        ]

    # Share activity over time (monthly)
    share_df["month"] = share_df["ts"].dt.to_period("M").astype(str)
    share_monthly = share_df.groupby("month").size().reset_index(name="count")
    share_monthly = share_monthly.sort_values("month")
    share_over_time = [
        {"month": r["month"], "count": int(r["count"])}
        for _, r in share_monthly.iterrows()
    ]

    # Share-Worthy Threshold (how many times did you listen before sharing?)
    if "message_entity_uri" in share_df.columns:
        for _, share_row in share_df.iterrows():
            entity_uri = share_row.get("message_entity_uri", "")
            share_ts = share_row["ts"]
            if not entity_uri or "track" not in str(entity_uri):
                continue
            # Count prior streams of this track
            prior_plays = len(df[
                (df["spotify_track_uri"] == entity_uri) &
                (df["ts"] < share_ts)
            ])
            # Get track name
            track_info = df[df["spotify_track_uri"] == entity_uri].head(1)
            track_name = "Unknown"
            artist_name = "Unknown"
            if len(track_info) > 0:
                track_name = track_info.iloc[0].get("master_metadata_track_name", "Unknown") or "Unknown"
                artist_name = track_info.iloc[0].get("master_metadata_album_artist_name", "Unknown") or "Unknown"
            share_worthy_threshold.append({
                "name": track_name,
                "artist": artist_name,
                "priorPlays": prior_plays,
            })

stats["socialSharing"] = {
    "totalSocialSessions": total_social_sessions,
    "avgSessionMinutes": avg_session_minutes,
    "longestSessionMinutes": longest_session_minutes,
    "totalSocialHours": total_social_hours,
    "sessions": social_sessions,
    "totalShares": total_shares,
    "shareDestinations": share_destinations,
    "shareOverTime": share_over_time,
    "shareWorthyThreshold": share_worthy_threshold,
}
print(f"  {total_social_sessions} social sessions, {total_shares} shares")

# ---------------------------------------------------------------------------
# 4d. Device & App Evolution
# ---------------------------------------------------------------------------
print("Computing device & app evolution …")

# Collect context fields from multiple technical log files
device_sources = []
for src_name in ["RawCoreStream_Hourly", "Download_Hourly", "PlaybackError_Hourly", "Stutter_Hourly"]:
    src_df = load_single_json(f"{src_name}.json")
    if len(src_df) > 0:
        needed_cols = ["timestamp_utc", "context_application_version", "context_device_model",
                       "context_device_type", "context_os_name", "context_os_version"]
        available = [c for c in needed_cols if c in src_df.columns]
        if "timestamp_utc" in available:
            device_sources.append(src_df[available])

if device_sources:
    device_df = pd.concat(device_sources, ignore_index=True)
    device_df["ts"] = pd.to_datetime(device_df["timestamp_utc"], format="ISO8601", utc=True).dt.tz_convert("US/Eastern")
    device_df["date"] = device_df["ts"].dt.date

    # App Version Timeline
    app_version_timeline = []
    if "context_application_version" in device_df.columns:
        version_events = device_df[device_df["context_application_version"].notna()].copy()
        version_by_date = version_events.sort_values("ts").drop_duplicates("context_application_version", keep="first")
        app_version_timeline = [
            {"date": str(r["date"]), "version": r["context_application_version"]}
            for _, r in version_by_date.iterrows()
        ]

    # OS Version History
    os_version_timeline = []
    if "context_os_version" in device_df.columns and "context_os_name" in device_df.columns:
        os_events = device_df[device_df["context_os_version"].notna()].copy()
        os_events["os_label"] = os_events["context_os_name"].fillna("") + " " + os_events["context_os_version"].fillna("")
        os_by_date = os_events.sort_values("ts").drop_duplicates("os_label", keep="first")
        os_version_timeline = [
            {"date": str(r["date"]), "os": r["os_label"].strip()}
            for _, r in os_by_date.iterrows()
        ]

    # Device Fingerprint (all devices seen with first/last dates)
    device_fingerprint = []
    if "context_device_model" in device_df.columns:
        device_groups = device_df[device_df["context_device_model"].notna()].groupby("context_device_model")["ts"]
        for model, ts_series in device_groups:
            device_fingerprint.append({
                "model": str(model),
                "firstSeen": str(ts_series.min().date()),
                "lastSeen": str(ts_series.max().date()),
                "eventCount": len(ts_series),
            })
        device_fingerprint.sort(key=lambda x: x["eventCount"], reverse=True)

    # Multi-Device Juggler Score (distinct devices per week)
    multi_device_weekly = []
    if "context_device_model" in device_df.columns:
        device_df["week"] = device_df["ts"].dt.to_period("W").astype(str)
        weekly_devices = device_df[device_df["context_device_model"].notna()].groupby("week")["context_device_model"].nunique().reset_index()
        weekly_devices.columns = ["week", "deviceCount"]
        weekly_devices = weekly_devices.sort_values("week")
        multi_device_weekly = [
            {"week": r["week"], "deviceCount": int(r["deviceCount"])}
            for _, r in weekly_devices.iterrows()
        ]
    avg_devices_per_week = round(
        np.mean([d["deviceCount"] for d in multi_device_weekly]), 1
    ) if multi_device_weekly else 0

    # Auth session patterns (hour-of-day from RawCoreStream as proxy for "when you open Spotify")
    auth_hour_dist = []
    raw_stream_df = load_single_json("RawCoreStream_Hourly.json")
    if len(raw_stream_df) > 0:
        raw_stream_df["ts"] = pd.to_datetime(raw_stream_df["timestamp_utc"], format="ISO8601", utc=True).dt.tz_convert("US/Eastern")
        raw_stream_df["hour_of_day"] = raw_stream_df["ts"].dt.hour
        session_hod = raw_stream_df.groupby("hour_of_day").size()
        auth_hour_dist = [
            {"hour": int(h), "count": int(session_hod.get(h, 0))} for h in range(24)
        ]

    stats["deviceEvolution"] = {
        "appVersionTimeline": app_version_timeline,
        "osVersionTimeline": os_version_timeline,
        "deviceFingerprint": device_fingerprint,
        "multiDeviceWeekly": multi_device_weekly,
        "avgDevicesPerWeek": avg_devices_per_week,
        "sessionHourOfDay": auth_hour_dist,
    }
    print(f"  {len(app_version_timeline)} app versions, {len(device_fingerprint)} devices")
else:
    stats["deviceEvolution"] = {
        "appVersionTimeline": [], "osVersionTimeline": [],
        "deviceFingerprint": [], "multiDeviceWeekly": [],
        "avgDevicesPerWeek": 0, "sessionHourOfDay": [],
    }

# ---------------------------------------------------------------------------
# 4e. API & Latency Experience
# ---------------------------------------------------------------------------
print("Computing API & latency metrics …")

bassline_df = load_numbered_json("BasslineRequests")
auth_api_df = load_single_json("AuthHTTPReqWebapi.json")

# Latency stats from BasslineRequests
api_median_latency = 0
latency_over_time = []
feature_fingerprint = []
if len(bassline_df) > 0 and "message_ms_latency" in bassline_df.columns:
    bassline_df["ts"] = pd.to_datetime(bassline_df["timestamp_utc"], format="ISO8601", utc=True).dt.tz_convert("US/Eastern")
    bassline_df["date"] = bassline_df["ts"].dt.date
    bassline_df["week"] = bassline_df["ts"].dt.to_period("W").astype(str)

    valid_latency = bassline_df[bassline_df["message_ms_latency"] >= 0]["message_ms_latency"]
    api_median_latency = round(float(valid_latency.median()), 1) if len(valid_latency) > 0 else 0

    # Latency over time (weekly avg + P95)
    weekly_latency = bassline_df[bassline_df["message_ms_latency"] >= 0].groupby("week")["message_ms_latency"].agg(
        avg="mean", p95=lambda x: np.percentile(x, 95)
    ).reset_index()
    weekly_latency = weekly_latency.sort_values("week")
    latency_over_time = [
        {"week": r["week"], "avg": round(r["avg"], 1), "p95": round(r["p95"], 1)}
        for _, r in weekly_latency.iterrows()
    ]

    # Feature usage fingerprint (top operation names)
    if "message_operation_name" in bassline_df.columns:
        op_counts = bassline_df["message_operation_name"].value_counts().head(20).reset_index()
        op_counts.columns = ["operation", "count"]
        feature_fingerprint = [
            {"operation": r["operation"], "count": int(r["count"])}
            for _, r in op_counts.iterrows()
        ]

# API endpoint breakdown from AuthHTTPReqWebapi
endpoint_breakdown = []
api_error_over_time = []
if len(auth_api_df) > 0:
    auth_api_df["ts"] = pd.to_datetime(auth_api_df["timestamp_utc"], format="ISO8601", utc=True).dt.tz_convert("US/Eastern")
    auth_api_df["week"] = auth_api_df["ts"].dt.to_period("W").astype(str)

    if "message_uri" in auth_api_df.columns:
        # Group endpoints by first two path segments
        def categorize_endpoint(uri: str) -> str:
            parts = str(uri).strip("/").split("/")
            if len(parts) >= 3:
                return "/" + "/".join(parts[:3])
            return "/" + "/".join(parts)

        auth_api_df["endpoint_category"] = auth_api_df["message_uri"].apply(categorize_endpoint)
        cat_counts = auth_api_df["endpoint_category"].value_counts().head(15).reset_index()
        cat_counts.columns = ["endpoint", "count"]
        endpoint_breakdown = [
            {"endpoint": r["endpoint"], "count": int(r["count"])}
            for _, r in cat_counts.iterrows()
        ]

    # Error rate over time
    if "message_status_code" in auth_api_df.columns:
        auth_api_df["is_error"] = auth_api_df["message_status_code"].astype(str).str.startswith(("4", "5"))
        weekly_api = auth_api_df.groupby("week").agg(
            total=("is_error", "count"),
            errors=("is_error", "sum"),
        ).reset_index()
        weekly_api["errorRate"] = (weekly_api["errors"] / weekly_api["total"] * 100).round(1)
        weekly_api = weekly_api.sort_values("week")
        api_error_over_time = [
            {"week": r["week"], "errorRate": float(r["errorRate"]), "total": int(r["total"])}
            for _, r in weekly_api.iterrows()
        ]

stats["apiLatency"] = {
    "medianLatency": api_median_latency,
    "latencyOverTime": latency_over_time,
    "featureFingerprint": feature_fingerprint,
    "endpointBreakdown": endpoint_breakdown,
    "errorOverTime": api_error_over_time,
}
print(f"  Median latency: {api_median_latency}ms, {len(feature_fingerprint)} operations, {len(endpoint_breakdown)} endpoints")

# ---------------------------------------------------------------------------
# 4f. Push Notification Engagement
# ---------------------------------------------------------------------------
print("Computing push notification metrics …")

notif_received_df = load_single_json("PushNotificationsReceivedV1.json")
notif_interaction_df = load_single_json("PushNotificationInteractionV1.json")

total_received = 0
total_interacted = 0
engagement_rate = 0
notification_types = []
notification_driven_listening = 0

if len(notif_received_df) > 0:
    notif_received_df["ts"] = pd.to_datetime(notif_received_df["timestamp_utc"], format="ISO8601", utc=True).dt.tz_convert("US/Eastern")
    total_received = len(notif_received_df)

    # Campaign breakdown
    if "message_campaign_id" in notif_received_df.columns:
        campaign_counts = notif_received_df["message_campaign_id"].value_counts().head(10).reset_index()
        campaign_counts.columns = ["campaignId", "count"]
        notification_types = [
            {"campaignId": str(r["campaignId"]), "count": int(r["count"])}
            for _, r in campaign_counts.iterrows()
        ]

if len(notif_interaction_df) > 0:
    notif_interaction_df["ts"] = pd.to_datetime(notif_interaction_df["timestamp_utc"], format="ISO8601", utc=True).dt.tz_convert("US/Eastern")
    total_interacted = len(notif_interaction_df)

engagement_rate = round(total_interacted / max(total_received, 1) * 100, 1)

# Notification-Driven Listening: notification followed by stream within 30 min
if len(notif_received_df) > 0:
    for _, notif_row in notif_received_df.iterrows():
        notif_ts = notif_row["ts"]
        window_end = notif_ts + pd.Timedelta(minutes=30)
        has_stream = len(df[(df["ts"] >= notif_ts) & (df["ts"] <= window_end)]) > 0
        if has_stream:
            notification_driven_listening += 1

notification_driven_pct = round(notification_driven_listening / max(total_received, 1) * 100, 1)

stats["pushNotifications"] = {
    "totalReceived": total_received,
    "totalInteracted": total_interacted,
    "engagementRate": engagement_rate,
    "notificationTypes": notification_types,
    "notificationDrivenListening": notification_driven_listening,
    "notificationDrivenPct": notification_driven_pct,
}
print(f"  {total_received} received, {total_interacted} interacted ({engagement_rate}%), {notification_driven_listening} drove listening")

# ---------------------------------------------------------------------------
# 5. Write output
# ---------------------------------------------------------------------------
os.makedirs("public", exist_ok=True)
output_path = os.path.join("public", "stats.json")
with open(output_path, "w") as f:
    json.dump(stats, f)

file_size_mb = os.path.getsize(output_path) / (1024 * 1024)
print(f"Wrote {output_path} ({file_size_mb:.1f} MB)")
