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

// ---------------------------------------------------------------------------
// Spotify Account Data types
// ---------------------------------------------------------------------------

// Section 1: Playlist Insights
export interface PlaylistGrowth {
  month: string;
  tracks: number;
}

export interface PlaylistBySize {
  name: string;
  tracks: number;
}

export interface PlaylistDiversity {
  name: string;
  diversity: number;
  uniqueArtists: number;
  totalTracks: number;
}

export interface PlaylistInsights {
  totalPlaylists: number;
  totalTracks: number;
  avgPlaylistSize: number;
  largestPlaylist: { name: string; tracks: number };
  growthOverTime: PlaylistGrowth[];
  growthOverTimeAll: PlaylistGrowth[];
  growthOverTimeUserOnly: PlaylistGrowth[];
  topBySize: PlaylistBySize[];
  diversity: PlaylistDiversity[];
}

// Section 2: Search Behavior
export interface SearchOverTime {
  month: string;
  count: number;
}

export interface TopQuery {
  query: string;
  count: number;
}

export interface SearchHourOfDay {
  hour: number;
  count: number;
}

export interface SearchBehavior {
  totalSearches: number;
  uniqueQueries: number;
  avgSearchesPerDay: number;
  overTime: SearchOverTime[];
  topQueries: TopQuery[];
  hourOfDay: SearchHourOfDay[];
}

// Section 3: Wrapped 2024 Spotlight
export interface WrappedEra {
  peakMonth: string;
  peakMonthIndex: number;
  genre: string;
  mood: string;
  descriptor: string;
  color: string;
  tracks: string[];
}

export interface Wrapped2024 {
  totalHours: number;
  topPercentGlobally: number;
  mostListenedDay: string;
  mostListenedDayMinutes: number;
  distinctTracks: number;
  uniqueArtists: number;
  topTrackPlayCount: number;
  topTrackFirstPlayed: string;
  eras: WrappedEra[];
}

// Section 4: Library Health (cross-dataset)
export interface UnsavedFavorite {
  name: string;
  artist: string;
  hours: number;
}

export interface LibraryArtistConcentration {
  name: string;
  count: number;
}

export interface LibraryInteractionMonth {
  month: string;
  adds: number;
  removes: number;
  net: number;
}

export interface LibraryInteractionKind {
  kind: string;
  adds: number;
  removes: number;
  net: number;
}

export interface LibraryInteractionWindow {
  start: string | null;
  end: string | null;
}

export interface LibraryCollectionInteractionsMetrics {
  totalAdds: number;
  totalRemoves: number;
  netChange: number;
  activeMonths: number;
  interactionWindow: LibraryInteractionWindow;
  monthlyTrend: LibraryInteractionMonth[];
  kindBreakdown: LibraryInteractionKind[];
}

export interface LibraryCollectionInteractions {
  supportsUserOnly: boolean;
  all: LibraryCollectionInteractionsMetrics;
  userOnly: LibraryCollectionInteractionsMetrics;
}

export interface LibraryHealth {
  librarySize: number;
  utilizationRate: number;
  utilizedCount: number;
  unsavedFavorites: UnsavedFavorite[];
  forgottenSaves: number;
  forgottenSavesPct: number;
  artistConcentration: LibraryArtistConcentration[];
  collectionInteractions: LibraryCollectionInteractions;
}

// Section 5: Playlist x Streaming Overlap (cross-dataset)
export interface PlaylistStreamEntry {
  name: string;
  hours: number;
  totalTracks: number;
  streamedTracks: number;
}

export interface DeadPlaylist {
  name: string;
  totalTracks: number;
  streamedTracks: number;
}

export interface DiscoverWeeklyHitRate {
  playlistName: string;
  totalTracks: number;
  hitTracks: number;
  hitRate: number;
}

export interface PlaylistStreamOverlap {
  loyaltyScore: number;
  playlistHours: number;
  libraryLoyaltyScore: number;
  libraryStreamHours: number;
  libraryTotalTracks: number;
  libraryStreamedTracks: number;
  combinedLoyaltyScore: number;
  combinedStreamHours: number;
  mostPlayedPlaylists: PlaylistStreamEntry[];
  deadPlaylists: DeadPlaylist[];
  discoverWeeklyHitRate: DiscoverWeeklyHitRate | null;
}

// Section 6: Search-to-Listen Pipeline (cross-dataset)
export interface SearchObsession {
  name: string;
  hours: number;
  firstSearched: string;
}

export interface SearchListenPipeline {
  searchToObsession: SearchObsession[];
  impulsePct: number;
  impulseCount: number;
  avgGapMinutes: number;
}

// ---------------------------------------------------------------------------
// Spotify Technical Log Information types
// ---------------------------------------------------------------------------

// Section 1: Playlist Curation Behavior
export interface ChurnWeek {
  week: string;
  adds: number;
  removes: number;
}

export interface CurationHeatmapCell {
  day: string;
  dayIndex: number;
  hour: number;
  count: number;
}

export interface ImpulseAddBin {
  bin: string;
  count: number;
}

export interface AbandonedTrack {
  name: string;
  artist: string;
}

export interface PlaylistCurationMetrics {
  totalAdds: number;
  totalRemoves: number;
  addsPerWeek: number;
  removesPerWeek: number;
  churnOverTime: ChurnWeek[];
  curationHeatmap: CurationHeatmapCell[];
  regretCount: number;
  regretPct: number;
  impulseAddTiming: ImpulseAddBin[];
  abandonedCount: number;
  abandonedPct: number;
  abandonedExamples: AbandonedTrack[];
}

export interface PlaylistCuration {
  all: PlaylistCurationMetrics;
  userOnly: PlaylistCurationMetrics;
}

// Section 2: Playback Quality & Reliability
export interface BitrateEntry {
  bitrate: string;
  count: number;
}

export interface ErrorWeek {
  week: string;
  total: number;
  fatal: number;
}

export interface StutterWeek {
  week: string;
  count: number;
}

export interface DownloadWeek {
  week: string;
  downloads: number;
}

export interface PlaybackQuality {
  bitrateDistribution: BitrateEntry[];
  totalErrors: number;
  fatalErrors: number;
  errorOverTime: ErrorWeek[];
  totalStutters: number;
  stutterTimeline: StutterWeek[];
  errorToleranceRetryPct: number;
  errorToleranceRetries: number;
  errorToleranceSkips: number;
  downloadOverTime: DownloadWeek[];
}

// Section 3: Social Listening & Sharing
export interface SocialSession {
  start: string;
  end: string;
  durationMinutes: number;
}

export interface ShareDestination {
  destination: string;
  count: number;
}

export interface ShareMonth {
  month: string;
  count: number;
}

export interface ShareWorthyEntry {
  name: string;
  artist: string;
  priorPlays: number;
}

export interface SocialSharing {
  totalSocialSessions: number;
  avgSessionMinutes: number;
  longestSessionMinutes: number;
  totalSocialHours: number;
  sessions: SocialSession[];
  totalShares: number;
  shareDestinations: ShareDestination[];
  shareOverTime: ShareMonth[];
  shareWorthyThreshold: ShareWorthyEntry[];
}

// Section 4: Device & App Evolution
export interface VersionEvent {
  date: string;
  version: string;
}

export interface OsVersionEvent {
  date: string;
  os: string;
}

export interface DeviceInfo {
  model: string;
  firstSeen: string;
  lastSeen: string;
  eventCount: number;
}

export interface MultiDeviceWeek {
  week: string;
  deviceCount: number;
}

export interface SessionHour {
  hour: number;
  count: number;
}

export interface DeviceEvolution {
  appVersionTimeline: VersionEvent[];
  osVersionTimeline: OsVersionEvent[];
  deviceFingerprint: DeviceInfo[];
  multiDeviceWeekly: MultiDeviceWeek[];
  avgDevicesPerWeek: number;
  sessionHourOfDay: SessionHour[];
}

// Section 5: API & Latency Experience
export interface LatencyWeek {
  week: string;
  avg: number;
  p95: number;
}

export interface FeatureUsage {
  operation: string;
  count: number;
}

export interface EndpointEntry {
  endpoint: string;
  count: number;
}

export interface ApiErrorWeek {
  week: string;
  errorRate: number;
  total: number;
}

export interface ApiLatency {
  medianLatency: number;
  latencyOverTime: LatencyWeek[];
  featureFingerprint: FeatureUsage[];
  endpointBreakdown: EndpointEntry[];
  errorOverTime: ApiErrorWeek[];
}

// Section 6: Push Notification Engagement
export interface NotificationType {
  campaignId: string;
  count: number;
}

export interface PushNotifications {
  totalReceived: number;
  totalInteracted: number;
  engagementRate: number;
  notificationTypes: NotificationType[];
  notificationDrivenListening: number;
  notificationDrivenPct: number;
}

// ---------------------------------------------------------------------------
// Main Stats interface
// ---------------------------------------------------------------------------
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
  // Account Data sections
  playlistInsights: PlaylistInsights;
  searchBehavior: SearchBehavior;
  wrapped2024: Wrapped2024;
  libraryHealth: LibraryHealth;
  playlistStreamOverlap: PlaylistStreamOverlap;
  searchListenPipeline: SearchListenPipeline;
  // Technical Log Information sections
  playlistCuration: PlaylistCuration;
  playbackQuality: PlaybackQuality;
  socialSharing: SocialSharing;
  deviceEvolution: DeviceEvolution;
  apiLatency: ApiLatency;
  pushNotifications: PushNotifications;
}
