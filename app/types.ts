export interface Overview {
  totalHours: number;
  totalPlays: number;
  uniqueArtists: number;
  uniqueTracks: number;
  uniqueAlbums: number;
  dateRange: { start: string; end: string };
  longestStreak: number;
}

export interface DailyListening {
  date: string;
  hours: number;
}

export interface MonthlyListening {
  month: string;
  hours: number;
}

export interface YearlyListening {
  year: number;
  hours: number;
}

export interface HourOfDay {
  hour: number;
  hours: number;
}

export interface DayOfWeek {
  day: string;
  hours: number;
}

export interface HeatmapCell {
  day: string;
  dayIndex: number;
  hour: number;
  hours: number;
}

export interface TopArtist {
  name: string;
  hours: number;
}

export interface TopTrack {
  name: string;
  artist: string;
  hours: number;
}

export interface TopAlbum {
  name: string;
  artist: string;
  hours: number;
}

export interface ArtistsOverTime {
  months: string[];
  artists: Record<string, number[]>;
}

export interface SkipByArtist {
  name: string;
  skipRate: number;
  plays: number;
}

export interface SkipRateOverTime {
  month: string;
  skipRate: number;
}

export interface ReasonBreakdown {
  start: { reason: string; count: number }[];
  end: { reason: string; count: number }[];
}

export interface ShuffleOverTime {
  month: string;
  shuffleRate: number;
}

export interface PlatformBreakdown {
  platform: string;
  hours: number;
}

export interface OfflineVsOnline {
  offline: number;
  online: number;
}

export interface CountryBreakdown {
  country: string;
  hours: number;
}

export interface ContentTypeSplit {
  month: string;
  music: number;
  podcast: number;
  audiobook: number;
  other: number;
}

export interface TopPodcast {
  name: string;
  hours: number;
}

export interface NewArtistDiscovery {
  month: string;
  newArtists: number;
}

export interface Stats {
  overview: Overview;
  dailyListening: DailyListening[];
  monthlyListening: MonthlyListening[];
  yearlyListening: YearlyListening[];
  hourOfDay: HourOfDay[];
  dayOfWeek: DayOfWeek[];
  heatmap: HeatmapCell[];
  topArtists: TopArtist[];
  topTracks: TopTrack[];
  topAlbums: TopAlbum[];
  artistsOverTime: ArtistsOverTime;
  skipByArtist: SkipByArtist[];
  skipRateOverTime: SkipRateOverTime[];
  reasonBreakdown: ReasonBreakdown;
  shuffleOverTime: ShuffleOverTime[];
  avgListenMinutes: number;
  platformBreakdown: PlatformBreakdown[];
  offlineVsOnline: OfflineVsOnline;
  countryBreakdown: CountryBreakdown[];
  contentTypeSplit: ContentTypeSplit[];
  topPodcasts: TopPodcast[];
  newArtistDiscovery: NewArtistDiscovery[];
}
