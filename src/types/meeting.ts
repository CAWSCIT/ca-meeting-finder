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
  // Not every feed sends a single `formatted_address` - some (e.g. ca.org's
  // production feed) give the city, state, country and postal code as their
  // own fields instead and never send formatted_address at all. prepareMeetings
  // normalizes either shape into formatted_address + _city, but these raw
  // fields are declared so that normalization can read them.
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  // Pre-computed fields for performance
  _localTime?: string;
  _localEndTime?: string;
  _localHour?: number;
  /** The meeting's city: its own `city` field, or one parsed out of the address. "" when neither names a town. */
  _city?: string;
}

export type AttendanceType = "in_person" | "online" | "hybrid" | "all";

/** Which place a meeting card names: its C.A. area, or the city it's held in. */
export type DisplayLocation = "area" | "city";

export type TimeRange = "all" | "morning" | "afternoon" | "evening";

export interface FilterState {
  day: number | null;
  timeRange: TimeRange;
  types: string[];
  attendance: AttendanceType;
  search: string;
  nearbyOnly: boolean;
}
