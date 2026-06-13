export interface Meeting {
  day: number;
  url: string;
  area: string;
  name: string;
  slug: string;
  time: string;
  group: string;
  notes: string;
  types: string[];
  region: string;
  address: string;
  updated: string;
  end_time: string;
  latitude: string;
  location: string;
  timezone: string;
  longitude: string;
  approximate: string;
  location_notes: string;
  conference_phone: string;
  conference_url?: string;
  conference_url_notes?: string;
  attendance_option: "in_person" | "online" | "hybrid";
  formatted_address: string;
  conference_phone_notes: string;
  // Pre-computed fields for performance
  _localTime?: string;
  _localEndTime?: string;
  _localHour?: number;
}

export type AttendanceType = "in_person" | "online" | "hybrid" | "all";

export type TimeRange = "all" | "morning" | "afternoon" | "evening";

export interface FilterState {
  day: number | null;
  timeRange: TimeRange;
  types: string[];
  attendance: AttendanceType;
  search: string;
  nearbyOnly: boolean;
}
