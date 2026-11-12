import { getTypesForLanguage } from "@code4recovery/spec";
import { toZonedTime, format as formatTz } from "date-fns-tz";
import { Meeting, FilterState, TimeRange } from "@/types/meeting";

// Cache for timezone conversions to avoid repeated calculations
const timeConversionCache = new Map<string, { time: string; date: Date; hour: number }>();

export const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export const DAY_SHORT_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * Meeting type codes carried in the feed that mean nothing to a visitor.
 * Hidden from the type dropdown and from the badges on a meeting card.
 */
const IGNORED_TYPES = new Set([
  "0",
  "CG",
  "CH",
  "PA",
  "RT",
  "S/P",
  "S&T",
  "S&TR",
]);

/**
 * Labels for codes the TSML UI spec does not define: site-specific conventions
 * and feed misspellings. Several codes are synonyms that intentionally share a
 * label (HOS/H&I, Q/QP, OO/On/"Online Zoom", CIG/CIGAR).
 *
 * Spread *after* the spec in TYPE_LABELS, so these win. None of them collides
 * with a spec code today; the ordering keeps them intact if the spec later
 * adopts one of these codes for something else.
 */
const CUSTOM_TYPE_LABELS: Record<string, string> = {
  ASBI: "As Bill Sees It", // misspelling of the spec's ABSI, seen in the feed
  CIG: "Cigar",
  CIGAR: "Cigar",
  F2F: "In Person",
  "H&I": "Hospitals and Institutions",
  HH: "Handicap Accessible",
  HOS: "Hospitals and Institutions",
  HYB: "Hybrid",
  On: "Online",
  ONL: "Online Only",
  "Online Zoom": "Online",
  OO: "Online",
  Q: "Quiet Peace",
  QP: "Quiet Peace",
  SPONSORSHIP: "Sponsorship",
  TOP: "Topic",
  TOPIC: "Topic Meeting",
};

/**
 * English meeting type labels: the TSML UI spec
 * (https://github.com/code4recovery/spec) for the 87 standard codes, with the
 * custom labels above layered on top.
 */
export const TYPE_LABELS: Record<string, string> = {
  ...getTypesForLanguage("en"),
  ...CUSTOM_TYPE_LABELS,
};

/** Drop the codes that should never be shown to a visitor. */
export function getVisibleTypes(types: string[] | null | undefined): string[] {
  return (types || []).filter((type) => !IGNORED_TYPES.has(type));
}

/** Label for a meeting type code, falling back to the raw code. */
export function getTypeLabel(type: string): string {
  return TYPE_LABELS[type] || type;
}

export const ATTENDANCE_LABELS: Record<string, string> = {
  in_person: "In Person",
  online: "Online",
  hybrid: "Hybrid",
  all: "All Formats",
};

/** A Google Maps search link for a meeting's venue, or null if it has none. */
export function getGoogleMapsUrl(meeting: Meeting): string | null {
  if (meeting.latitude && meeting.longitude) {
    return `https://www.google.com/maps/search/?api=1&query=${meeting.latitude},${meeting.longitude}`;
  }
  if (meeting.formatted_address) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(meeting.formatted_address)}`;
  }
  return null;
}

/** Shown instead of a city when a meeting has nowhere to be. */
export const ONLINE_LOCATION_LABEL = "Online meeting";

/**
 * Countries the feed's Google-style `formatted_address` ends with. The feed
 * only reaches a few dozen today; the extras cost nothing and keep the parser
 * working as the listings spread.
 */
const ADDRESS_COUNTRIES = new Set([
  "argentina",
  "australia",
  "austria",
  "bahamas",
  "barbados",
  "belgië",
  "belgique",
  "belgium",
  "bermuda",
  "brazil",
  "ca",
  "canada",
  "chile",
  "colombia",
  "costa rica",
  "czechia",
  "denmark",
  "deutschland",
  "egypt",
  "españa",
  "finland",
  "france",
  "germany",
  "ghana",
  "greece",
  "hong kong",
  "hungary",
  "iceland",
  "india",
  "indonesia",
  "ireland",
  "israel",
  "italy",
  "jamaica",
  "japan",
  "kenya",
  "malta",
  "mexico",
  "morocco",
  "nederland",
  "netherlands",
  "new zealand",
  "nigeria",
  "norway",
  "panama",
  "peru",
  "philippines",
  "poland",
  "portugal",
  "puerto rico",
  "russia",
  "saint james barbados",
  "singapore",
  "south africa",
  "south korea",
  "spain",
  "sweden",
  "switzerland",
  "thailand",
  "trinidad and tobago",
  "turkey",
  "uae",
  "uk",
  "united arab emirates",
  "united kingdom",
  "united states",
  "united states of america",
  "usa",
]);

/**
 * Spelled-out states, provinces and home nations. Only dropped when a street
 * and a locality still sit in front of them, because several are also city
 * names ("Québec, Québec" is a real address).
 */
const ADDRESS_REGIONS = new Set([
  "alberta",
  "british columbia",
  "england",
  "manitoba",
  "new brunswick",
  "newfoundland and labrador",
  "northern ireland",
  "northwest territories",
  "nova scotia",
  "nunavut",
  "ontario",
  "prince edward island",
  "quebec",
  "québec",
  "saskatchewan",
  "scotland",
  "wales",
  "yukon",
]);

/** State/province codes, which are never a city name on their own. */
const ADDRESS_REGION_CODES = new Set([
  // United States
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DC", "DE", "FL", "GA", "HI",
  "IA", "ID", "IL", "IN", "KS", "KY", "LA", "MA", "MD", "ME", "MI", "MN",
  "MO", "MS", "MT", "NC", "ND", "NE", "NH", "NJ", "NM", "NV", "NY", "OH",
  "OK", "OR", "PA", "PR", "RI", "SC", "SD", "TN", "TX", "UT", "VA", "VT",
  "WA", "WI", "WV", "WY",
  // Canada
  "AB", "BC", "MB", "NB", "NL", "NS", "NT", "NU", "ON", "PE", "QC", "SK", "YT",
  // Australia
  "ACT", "NSW", "QLD", "SA", "TAS", "VIC",
]);

/** Whole address parts that are a postal code, or a region code plus one. */
const POSTAL_PART_PATTERNS = [
  /^\d{3,6}(?:-\d{3,4})?$/, // 85004, 1509, 1070-373
  /^[A-Za-z]{2}\s+\d{5}(?:-\d{4})?$/, // AZ 85004
  /^[A-Za-z]{1,2}\d[A-Za-z\d]?\s*\d[A-Za-z]{2}$/, // BN2 1ED (UK)
  /^[A-Za-z]\d{2}\s?[A-Za-z\d]{3,4}$/, // X91 RDW7 (Ireland, sometimes a digit short)
  // V1A 3C8 and BC V1A 3C8 (Canada), sometimes cut to the first half
  /^(?:[A-Za-z]{2}\s+)?[A-Za-z]\d[A-Za-z](?:\s?\d[A-Za-z]\d)?$/,
];

/** Postal codes glued to the front of the city, as in "147 30 Tumba". */
const POSTAL_PREFIX = /^(?:\d{4}\s?[A-Za-z]{2}|\d{3}\s\d{2}|\d{4}-\d{3}|\d{4,6})\s+/;

/** Postal codes (and region codes) trailing the city, as in "London W11 2AY". */
const POSTAL_SUFFIXES = [
  /\s+[A-Za-z]{1,2}\d[A-Za-z\d]?\s*\d[A-Za-z]{2}$/, // London W11 2AY
  /\s+[A-Za-z]{2,3}\s+\d{4}$/, // Darlinghurst NSW 2010
  /\s+[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d$/, // Kelowna V1Y 6H5
  /\s+\d{4,6}(?:-\d{4})?$/, // Chiang Mai 50300
  // A bare UK outcode: "Glasgow G31". A trailing number on its own is left
  // alone, because Irish addresses postfix the city with its postal district
  // ("Dublin 12") and some place names simply end in one ("Skidegate 1").
  /\s+[A-Za-z]{1,2}\d{1,2}[A-Za-z]?$/,
];

const isPostalPart = (part: string) =>
  POSTAL_PART_PATTERNS.some((pattern) => pattern.test(part));

const isCountyPart = (part: string) => /^(?:co\.|county)\s/i.test(part);

/**
 * An address that peels down to a single part naming a street gave us no
 * locality at all ("Overtoun Rd, United Kingdom"). Only the abbreviated forms
 * are listed: real cities end in the spelled-out words ("Federal Way").
 */
const isStreetOnly = (part: string) =>
  /\s(?:ave|blvd|cres|dr|hwy|ln|rd|st|ter)\.?$/i.test(part);

/** Parts that can never be the city, however short the address is. */
const isNeverCity = (part: string) =>
  ADDRESS_COUNTRIES.has(part.toLowerCase()) ||
  ADDRESS_REGION_CODES.has(part.toUpperCase()) ||
  isPostalPart(part);

const cityCache = new Map<string, string | null>();

/**
 * Pull the city out of a Google-style formatted address by peeling country,
 * region and postal code off the end: "1124 N 3rd St, Phoenix, AZ 85004, USA"
 * gives "Phoenix", "Om en bij 1, 2512 XK Den Haag, Nederland" gives
 * "Den Haag". Returns null when nothing city-shaped is left - an online-only
 * listing ("Online"), or an address that never named a town.
 */
export function parseCity(formattedAddress: string | null | undefined): string | null {
  const address = (formattedAddress || "").trim();
  // Online-only listings carry a literal "Online" in place of an address.
  if (!address || /^online$/i.test(address)) return null;

  const cached = cityCache.get(address);
  if (cached !== undefined) return cached;

  // A handful of listings separate with " - " instead of commas.
  const parts = (address.includes(",") ? address.split(",") : address.split(" - "))
    .map((part) => part.trim())
    .filter(Boolean);

  // A spelled-out region or county only yields the city if one is still left
  // in front of it, so it needs a street *and* a locality behind it - and only
  // the first of each comes off, because "Québec, Québec" names a city inside
  // a province of the same name.
  let regionDropped = false;
  let countyDropped = false;

  while (parts.length > 1) {
    const last = parts[parts.length - 1];
    const isRegion = !regionDropped && ADDRESS_REGIONS.has(last.toLowerCase());
    const isCounty = !countyDropped && isCountyPart(last);
    const droppableWithRoom = parts.length > 2 && (isRegion || isCounty);

    if (!isNeverCity(last) && !droppableWithRoom) break;
    if (isRegion) regionDropped = true;
    if (isCounty) countyDropped = true;
    parts.pop();
  }

  const streetOnly = parts.length === 1 && isStreetOnly(parts[0]);

  let city = (parts[parts.length - 1] || "").replace(POSTAL_PREFIX, "");
  // Repeat until nothing more comes off: a few listings carry two postcodes
  // in a row ("London E1 5NG E1 5NW").
  for (let pass = 0; pass < POSTAL_SUFFIXES.length; pass++) {
    const stripped = POSTAL_SUFFIXES.reduce(
      (value, pattern) => value.replace(pattern, ""),
      city
    );
    if (stripped === city) break;
    city = stripped;
  }
  city = city.trim();

  // Whatever is left may still be the country or region itself, as in the
  // bare "Portugal" or "Wales, UK" some listings carry. A region name does
  // stand once its own region has already come off the end, which is how
  // "Québec, Québec" keeps the city.
  const result =
    !city ||
    streetOnly ||
    ADDRESS_COUNTRIES.has(city.toLowerCase()) ||
    (!regionDropped && ADDRESS_REGIONS.has(city.toLowerCase())) ||
    isNeverCity(city)
      ? null
      : city;

  cityCache.set(address, result);
  return result;
}

/**
 * The city line for a meeting card: the town the meeting sits in, or a note
 * that it's online when there is no venue to point at. Falls back to the C.A.
 * area when the feed's address never names a city, and to nothing at all when
 * even that is missing.
 */
export function getCityLabel(meeting: Meeting): string {
  // An online-only meeting isn't held in any town, even when the feed leaves a
  // vestigial "Long Beach, CA, USA" behind in the address.
  if (meeting.attendance_option === "online") return ONLINE_LOCATION_LABEL;

  const city = meeting._city ?? parseCity(meeting.formatted_address);
  return city || meeting.area || "";
}

export const TIME_RANGES: { value: TimeRange; label: string; range: string }[] = [
  { value: "all", label: "Any Time", range: "" },
  { value: "morning", label: "Morning", range: "6am - 12pm" },
  { value: "afternoon", label: "Afternoon", range: "12pm - 5pm" },
  { value: "evening", label: "Evening", range: "5pm - 12am" },
];

/**
 * Deprecated IANA zone IDs ("backward" links) that still show up in the meeting
 * feed. Newer mobile tzdata builds ship without those links, so handing one to
 * Intl throws `RangeError: Invalid time zone: PST8PDT`. Map them to canonical
 * zones before any Intl call.
 *
 * The fixed-offset abbreviations (EST, MST, CET, ...) are mapped to the region
 * the feed almost certainly means rather than to a literal fixed offset, so
 * they follow daylight saving like the rest of the listings.
 */
const LEGACY_TIMEZONES: Record<string, string> = {
  // Fixed-offset abbreviations
  CET: "Europe/Paris",
  CST6CDT: "America/Chicago",
  EET: "Europe/Athens",
  EST: "America/New_York",
  EST5EDT: "America/New_York",
  GMT: "UTC",
  "GMT+0": "UTC",
  "GMT-0": "UTC",
  GMT0: "UTC",
  Greenwich: "UTC",
  HST: "Pacific/Honolulu",
  MET: "Europe/Paris",
  MST: "America/Phoenix",
  MST7MDT: "America/Denver",
  PST8PDT: "America/Los_Angeles",
  UCT: "UTC",
  Universal: "UTC",
  WET: "Europe/Lisbon",
  Zulu: "UTC",
  // United States
  "US/Alaska": "America/Anchorage",
  "US/Aleutian": "America/Adak",
  "US/Arizona": "America/Phoenix",
  "US/Central": "America/Chicago",
  "US/East-Indiana": "America/Indiana/Indianapolis",
  "US/Eastern": "America/New_York",
  "US/Hawaii": "Pacific/Honolulu",
  "US/Indiana-Starke": "America/Indiana/Knox",
  "US/Michigan": "America/Detroit",
  "US/Mountain": "America/Denver",
  "US/Pacific": "America/Los_Angeles",
  "US/Pacific-New": "America/Los_Angeles",
  "US/Samoa": "Pacific/Pago_Pago",
  Navajo: "America/Denver",
  "America/Indianapolis": "America/Indiana/Indianapolis",
  "America/Fort_Wayne": "America/Indiana/Indianapolis",
  "America/Knox_IN": "America/Indiana/Knox",
  "America/Louisville": "America/Kentucky/Louisville",
  // Canada
  "Canada/Atlantic": "America/Halifax",
  "Canada/Central": "America/Winnipeg",
  "Canada/Eastern": "America/Toronto",
  "Canada/Mountain": "America/Edmonton",
  "Canada/Newfoundland": "America/St_Johns",
  "Canada/Pacific": "America/Vancouver",
  "Canada/Saskatchewan": "America/Regina",
  "Canada/Yukon": "America/Whitehorse",
  "America/Montreal": "America/Toronto",
  // Latin America
  "Brazil/Acre": "America/Rio_Branco",
  "Brazil/DeNoronha": "America/Noronha",
  "Brazil/East": "America/Sao_Paulo",
  "Brazil/West": "America/Manaus",
  "Chile/Continental": "America/Santiago",
  "Chile/EasterIsland": "Pacific/Easter",
  Cuba: "America/Havana",
  Jamaica: "America/Jamaica",
  "Mexico/BajaNorte": "America/Tijuana",
  "Mexico/BajaSur": "America/Mazatlan",
  "Mexico/General": "America/Mexico_City",
  "America/Buenos_Aires": "America/Argentina/Buenos_Aires",
  "America/Godthab": "America/Nuuk",
  // Europe
  Eire: "Europe/Dublin",
  GB: "Europe/London",
  "GB-Eire": "Europe/London",
  Iceland: "Atlantic/Reykjavik",
  Poland: "Europe/Warsaw",
  Portugal: "Europe/Lisbon",
  Turkey: "Europe/Istanbul",
  "W-SU": "Europe/Moscow",
  "Europe/Kiev": "Europe/Kyiv",
  "Europe/Belfast": "Europe/London",
  "Atlantic/Faeroe": "Atlantic/Faroe",
  // Africa & Middle East
  Egypt: "Africa/Cairo",
  Iran: "Asia/Tehran",
  Israel: "Asia/Jerusalem",
  Libya: "Africa/Tripoli",
  "Africa/Asmera": "Africa/Asmara",
  "Asia/Tel_Aviv": "Asia/Jerusalem",
  "Asia/Istanbul": "Europe/Istanbul",
  // Asia & Pacific
  Hongkong: "Asia/Hong_Kong",
  Japan: "Asia/Tokyo",
  Kwajalein: "Pacific/Kwajalein",
  NZ: "Pacific/Auckland",
  "NZ-CHAT": "Pacific/Chatham",
  PRC: "Asia/Shanghai",
  ROC: "Asia/Taipei",
  ROK: "Asia/Seoul",
  Singapore: "Asia/Singapore",
  "Asia/Calcutta": "Asia/Kolkata",
  "Asia/Chongqing": "Asia/Shanghai",
  "Asia/Chungking": "Asia/Shanghai",
  "Asia/Dacca": "Asia/Dhaka",
  "Asia/Harbin": "Asia/Shanghai",
  "Asia/Katmandu": "Asia/Kathmandu",
  "Asia/Macao": "Asia/Macau",
  "Asia/Rangoon": "Asia/Yangon",
  "Asia/Saigon": "Asia/Ho_Chi_Minh",
  "Asia/Ulan_Bator": "Asia/Ulaanbaatar",
  "Pacific/Ponape": "Pacific/Pohnpei",
  "Pacific/Samoa": "Pacific/Pago_Pago",
  "Pacific/Truk": "Pacific/Chuuk",
  // Australia
  "Australia/ACT": "Australia/Sydney",
  "Australia/Canberra": "Australia/Sydney",
  "Australia/LHI": "Australia/Lord_Howe",
  "Australia/NSW": "Australia/Sydney",
  "Australia/North": "Australia/Darwin",
  "Australia/Queensland": "Australia/Brisbane",
  "Australia/South": "Australia/Adelaide",
  "Australia/Tasmania": "Australia/Hobart",
  "Australia/Victoria": "Australia/Melbourne",
  "Australia/West": "Australia/Perth",
};

// Last resort when even the device's own zone can't be read.
const FALLBACK_TIMEZONE = "UTC";

let cachedUserTimezone: string | null = null;

export function getUserTimezone(): string {
  if (cachedUserTimezone) return cachedUserTimezone;
  try {
    cachedUserTimezone =
      Intl.DateTimeFormat().resolvedOptions().timeZone || FALLBACK_TIMEZONE;
  } catch {
    cachedUserTimezone = FALLBACK_TIMEZONE;
  }
  return cachedUserTimezone;
}

function isSupportedTimezone(timezone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

const resolvedTimezoneCache = new Map<string, string>();

/**
 * Resolve a feed timezone to one this device's Intl implementation accepts.
 * Unknown zones fall back to the user's own zone (times then read as the feed
 * sent them) so a single bad value can never break the whole meeting list.
 */
export function resolveTimezone(timezone: string | null | undefined): string {
  const raw = (timezone || "").trim();
  if (!raw) return getUserTimezone();

  const cached = resolvedTimezoneCache.get(raw);
  if (cached) return cached;

  // Prefer the canonical name when we know one: every device accepts those,
  // while the legacy alias may be missing from a trimmed tzdata build.
  const canonical = LEGACY_TIMEZONES[raw];
  const candidates = canonical ? [canonical, raw] : [raw];

  let resolved = candidates.find(isSupportedTimezone);
  if (!resolved) {
    resolved = getUserTimezone();
    console.warn(
      `Unsupported meeting timezone "${raw}" - falling back to ${resolved}`
    );
  }

  resolvedTimezoneCache.set(raw, resolved);
  return resolved;
}

export function convertToLocalTime(
  time: string,
  meetingTimezone: string
): { time: string; date: Date; hour: number } {
  // Check cache first
  const cacheKey = `${time}-${meetingTimezone}`;
  const cached = timeConversionCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const userTimezone = getUserTimezone();
  const timezone = resolveTimezone(meetingTimezone);

  // Create a date object for today with the meeting time in the meeting's timezone
  const today = new Date();
  const [hours, minutes] = time.split(":").map(Number);
  
  // Create a date string in the meeting's timezone
  const meetingDate = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    hours,
    minutes
  );
  
  // Get the meeting time as if it were in the meeting's timezone
  const meetingTimeInTz = formatTz(meetingDate, "yyyy-MM-dd'T'HH:mm:ss", {
    timeZone: timezone,
  });
  
  // Parse this as a date in the meeting's timezone
  const utcDate = new Date(meetingTimeInTz + getTimezoneOffset(timezone, meetingDate));
  
  // Convert to user's local timezone
  const localDate = toZonedTime(utcDate, userTimezone);
  
  const result = {
    time: formatTz(localDate, "h:mm a", { timeZone: userTimezone }),
    date: localDate,
    hour: localDate.getHours(),
  };

  // Cache the result
  timeConversionCache.set(cacheKey, result);
  
  return result;
}

function getTimezoneOffset(timezone: string, date: Date): string {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    timeZoneName: "longOffset",
  });
  const parts = formatter.formatToParts(date);
  const offsetPart = parts.find((p) => p.type === "timeZoneName");
  if (offsetPart && offsetPart.value) {
    const match = offsetPart.value.match(/GMT([+-]\d{2}):?(\d{2})?/);
    if (match) {
      const hours = match[1];
      const minutes = match[2] || "00";
      return `${hours}:${minutes}`;
    }
  }
  return "+00:00";
}

export function getLocalHour(time: string, meetingTimezone: string): number {
  const { hour } = convertToLocalTime(time, meetingTimezone);
  return hour;
}

export function isInTimeRange(hour: number, range: TimeRange): boolean {
  switch (range) {
    case "morning":
      return hour >= 6 && hour < 12;
    case "afternoon":
      return hour >= 12 && hour < 17;
    case "evening":
      return hour >= 17 || hour < 6;
    case "all":
    default:
      return true;
  }
}

export function filterMeetings(meetings: Meeting[], filters: FilterState): Meeting[] {
  return meetings.filter((meeting) => {
    // Filter by day
    if (filters.day !== null && meeting.day !== filters.day) {
      return false;
    }

    // Filter by time range
    if (filters.timeRange !== "all") {
      const hour = getLocalHour(meeting.time, meeting.timezone);
      if (!isInTimeRange(hour, filters.timeRange)) {
        return false;
      }
    }

    // Filter by types
    if (filters.types.length > 0) {
      const meetingTypes = meeting.types || [];
      const hasMatchingType = filters.types.some((type) =>
        meetingTypes.includes(type)
      );
      if (!hasMatchingType) {
        return false;
      }
    }

    // Filter by attendance
    if (filters.attendance !== "all" && meeting.attendance_option !== filters.attendance) {
      return false;
    }

    return true;
  });
}

export function sortMeetingsByTime(meetings: Meeting[]): Meeting[] {
  return [...meetings].sort((a, b) => {
    // First sort by day
    if (a.day !== b.day) {
      return a.day - b.day;
    }
    
    // Then sort by time
    const [aHours, aMinutes] = a.time.split(":").map(Number);
    const [bHours, bMinutes] = b.time.split(":").map(Number);
    
    if (aHours !== bHours) {
      return aHours - bHours;
    }
    
    return aMinutes - bMinutes;
  });
}

/**
 * Sorts meetings in a "rolling schedule" order starting from the current day and hour.
 * Meetings happening soonest appear first, wrapping around the week.
 */
export function sortMeetingsRolling(meetings: Meeting[]): Meeting[] {
  const now = new Date();
  const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday
  const currentHour = now.getHours();
  const currentMinutes = now.getMinutes();
  const MINUTES_IN_WEEK = 7 * 24 * 60;

  return [...meetings].sort((a, b) => {
    const aMinutesUntil = getMinutesUntilMeeting(a, currentDay, currentHour, currentMinutes, MINUTES_IN_WEEK);
    const bMinutesUntil = getMinutesUntilMeeting(b, currentDay, currentHour, currentMinutes, MINUTES_IN_WEEK);
    return aMinutesUntil - bMinutesUntil;
  });
}

function getMinutesUntilMeeting(
  meeting: Meeting,
  currentDay: number,
  currentHour: number,
  currentMinutes: number,
  MINUTES_IN_WEEK: number
): number {
  // Get the meeting time in user's local timezone
  const { date: localDate } = convertToLocalTime(meeting.time, meeting.timezone);
  const meetingHour = localDate.getHours();
  const meetingMinute = localDate.getMinutes();
  
  // Calculate days until meeting (0-6, wrapping around)
  let daysUntil = meeting.day - currentDay;
  if (daysUntil < 0) {
    daysUntil += 7;
  }
  
  // Calculate total minutes until meeting
  const meetingTotalMinutes = daysUntil * 24 * 60 + meetingHour * 60 + meetingMinute;
  const currentTotalMinutes = currentHour * 60 + currentMinutes;
  
  let minutesUntil = meetingTotalMinutes - currentTotalMinutes;
  
  // If the meeting is earlier today (already passed), wrap to next week
  if (minutesUntil < 0) {
    minutesUntil += MINUTES_IN_WEEK;
  }
  
  return minutesUntil;
}

/**
 * One row in the type filter: a label plus every code that maps to it. Synonym
 * codes (Q/QP, OO/On/"Online Zoom", HOS/H&I) collapse into a single row, so
 * selecting it filters on all of them.
 */
export interface TypeGroup {
  label: string;
  codes: string[];
}

/**
 * Build the type filter rows from the meetings given, so a type with nothing
 * behind it is never offered.
 *
 * `alwaysInclude` keeps codes listed even when nothing matches them - pass the
 * user's current selection, otherwise a type they already picked would vanish
 * from the dropdown and leave them no way to untick it.
 */
export function getTypeGroups(
  meetings: Meeting[],
  alwaysInclude: string[] = []
): TypeGroup[] {
  const codesByLabel = new Map<string, Set<string>>();

  const addCode = (type: string) => {
    const label = getTypeLabel(type);
    const codes = codesByLabel.get(label) ?? new Set<string>();
    codes.add(type);
    codesByLabel.set(label, codes);
  };

  meetings.forEach((meeting) => {
    if (meeting.types && Array.isArray(meeting.types)) {
      getVisibleTypes(meeting.types).forEach(addCode);
    }
  });

  getVisibleTypes(alwaysInclude).forEach(addCode);

  // Sort by the label the user actually reads, not by the underlying code.
  return Array.from(codesByLabel.entries())
    .map(([label, codes]) => ({ label, codes: Array.from(codes).sort() }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

/**
 * Pre-compute the derived fields every meeting needs - local times, so the
 * timezone conversions aren't repeated per render, and the city, so the search
 * index can match on it. Call this once after fetching data.
 */
export function prepareMeetings(meetings: Meeting[]): Meeting[] {
  return meetings.map((meeting) => {
    const city = parseCity(meeting.formatted_address) || "";

    try {
      const { time: localTime, hour } = convertToLocalTime(meeting.time, meeting.timezone);
      const localEndTime = meeting.end_time
        ? convertToLocalTime(meeting.end_time, meeting.timezone).time
        : undefined;

      return {
        ...meeting,
        _localTime: localTime,
        _localEndTime: localEndTime,
        _localHour: hour,
        _city: city,
      };
    } catch (err) {
      // Never let one unconvertible meeting take down the whole list: fall back
      // to the raw feed time instead of throwing.
      console.warn(`Could not convert time for meeting "${meeting.name}"`, err);
      const [hours] = (meeting.time || "").split(":").map(Number);

      return {
        ...meeting,
        _localTime: meeting.time,
        _localEndTime: meeting.end_time || undefined,
        _localHour: Number.isFinite(hours) ? hours : 0,
        _city: city,
      };
    }
  });
}

/**
 * Filter meetings using pre-computed local hours for better performance.
 */
export function filterMeetingsOptimized(meetings: Meeting[], filters: FilterState): Meeting[] {
  return meetings.filter((meeting) => {
    // Filter by day
    if (filters.day !== null && meeting.day !== filters.day) {
      return false;
    }

    // Filter by time range using pre-computed hour
    if (filters.timeRange !== "all") {
      const hour = meeting._localHour ?? getLocalHour(meeting.time, meeting.timezone);
      if (!isInTimeRange(hour, filters.timeRange)) {
        return false;
      }
    }

    // Filter by types
    if (filters.types.length > 0) {
      const meetingTypes = meeting.types || [];
      const hasMatchingType = filters.types.some((type) =>
        meetingTypes.includes(type)
      );
      if (!hasMatchingType) {
        return false;
      }
    }

    // Filter by attendance
    if (filters.attendance !== "all" && meeting.attendance_option !== filters.attendance) {
      return false;
    }

    return true;
  });
}
