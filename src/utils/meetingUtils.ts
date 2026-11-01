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

export const TYPE_LABELS: Record<string, string> = {
  O: "Open",
  C: "Closed",
  B: "Big Book",
  D: "Discussion",
  S: "Speaker",
  ST: "Step",
  TR: "Tradition",
  M: "Men",
  W: "Women",
  Y: "Young People",
  BE: "Beginner",
  LIT: "Literature",
  G: "Gay",
  L: "Lesbian",
  X: "Wheelchair",
  H: "Handicapped",
  ASL: "ASL",
  SP: "Speaker",
  AL: "Alternating",
  TC: "Location Temporarily Closed",
  ONL: "Online Only",
};

export const ATTENDANCE_LABELS: Record<string, string> = {
  in_person: "In Person",
  online: "Online",
  hybrid: "Hybrid",
  all: "All Formats",
};

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

export function getAllTypes(meetings: Meeting[]): string[] {
  const typesSet = new Set<string>();
  meetings.forEach((meeting) => {
    if (meeting.types && Array.isArray(meeting.types)) {
      meeting.types.forEach((type) => typesSet.add(type));
    }
  });
  return Array.from(typesSet).sort();
}

/**
 * Pre-compute local times for all meetings to avoid repeated timezone conversions.
 * Call this once after fetching data.
 */
export function precomputeLocalTimes(meetings: Meeting[]): Meeting[] {
  return meetings.map((meeting) => {
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
