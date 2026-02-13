# Spotify Listening Dashboard

A Next.js dashboard that visualizes your Spotify Extended Streaming History data. Includes charts for listening trends, top artists/tracks/albums, skip behavior, platform usage, content type breakdowns, and more.

## Prerequisites

- Node.js 18+
- Python 3.10+ with `pandas` and `numpy` installed

## Data Setup

1. Request your **Extended Streaming History** from Spotify (Account > Privacy > Request Data).
2. Place the downloaded folder at `../Spotify Extended Streaming History/` relative to this project, so the directory structure looks like:

```
parent_folder/
├── Spotify Extended Streaming History/
│   ├── Streaming_History_Audio_2020_0.json
│   ├── Streaming_History_Audio_2020-2021_1.json
│   ├── ...
│   └── Streaming_History_Video_2020-2025.json
└── spotify_history_analysis/   <-- this project
```

The preprocessing script expects all `Streaming_History_Audio_*.json` and `Streaming_History_Video_*.json` files in that folder.

## Usage

### 1. Preprocess the data

From this directory, run:

```bash
python preprocess.py
```

This reads all the streaming history JSON files, computes metrics, and writes the result to `public/stats.json`. The dashboard imports this file at build time.

### 2. Start the dashboard

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Metrics Included

- **Overview** -- total hours, plays, unique artists/tracks/albums, longest listening streak, average listen duration
- **Daily / Monthly / Yearly listening** -- time series and bar charts
- **Hour-of-day and day-of-week distributions** -- bar charts and a heatmap
- **Top artists, tracks, and albums** -- horizontal bar charts (top 20 each)
- **Top artists over time** -- stacked area chart (top 10 monthly)
- **Skip analysis** -- skip rate by artist and over time
- **Listening behavior** -- playback start/end reasons, shuffle usage trend
- **Platform and context** -- device breakdown, online vs offline, country
- **Content type** -- music vs podcasts vs audiobooks over time, top podcasts
- **New artist discovery** -- unique new artists per month

## Notes

- All timestamps are converted from UTC to **US/Eastern** during preprocessing. To change this, edit the `tz_convert` call in `preprocess.py`.
- To regenerate stats after receiving a new data export, re-run `python preprocess.py` and reload the page.
