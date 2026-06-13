import { memo } from "react";
import { Meeting } from "@/types/meeting";
import {
  DAY_NAMES,
  TYPE_LABELS,
  ATTENDANCE_LABELS,
} from "@/utils/meetingUtils";
import { MapPin, Clock, Globe, Video, Users, ExternalLink, Navigation } from "lucide-react";

interface MeetingCardProps {
  meeting: Meeting;
}

export const MeetingCard = memo(function MeetingCard({ meeting }: MeetingCardProps) {
  // Use pre-computed local times if available
  const localTime = meeting._localTime || "";
  const localEndTime = meeting._localEndTime || "";

  const AttendanceIcon =
    meeting.attendance_option === "online"
      ? Video
      : meeting.attendance_option === "hybrid"
      ? Globe
      : Users;

  const attendanceBgClass =
    meeting.attendance_option === "online"
      ? "bg-meeting-online-bg text-meeting-online-text"
      : meeting.attendance_option === "hybrid"
      ? "bg-meeting-hybrid-bg text-meeting-hybrid-text"
      : "bg-meeting-inperson-bg text-meeting-inperson-text";

  // Check if meeting has online option
  const hasOnlineOption =
    meeting.attendance_option === "online" || meeting.attendance_option === "hybrid";
  const conferenceUrl = (meeting as any).conference_url;

  // Check if meeting has in-person option
  const hasInPersonOption =
    meeting.attendance_option === "in_person" || meeting.attendance_option === "hybrid";

  // Build Google Maps URL
  const getGoogleMapsUrl = () => {
    if (meeting.latitude && meeting.longitude) {
      return `https://www.google.com/maps/search/?api=1&query=${meeting.latitude},${meeting.longitude}`;
    }
    if (meeting.formatted_address) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(meeting.formatted_address)}`;
    }
    return null;
  };

  const mapsUrl = hasInPersonOption ? getGoogleMapsUrl() : null;

  return (
    <article className="group bg-card rounded-lg border border-border p-4 shadow-meeting-card hover:shadow-meeting-card-hover transition-all duration-200 animate-fade-in">
      <div className="flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-sans font-semibold text-foreground leading-tight line-clamp-2">
            {meeting.name}
          </h3>
          <span className="shrink-0 text-xs font-medium px-2 py-1 rounded-md bg-secondary text-secondary-foreground">
            {DAY_NAMES[meeting.day]}
          </span>
        </div>

        {/* Time */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4 shrink-0" />
          <span className="font-medium text-foreground">{localTime}</span>
          {localEndTime && (
            <>
              <span>–</span>
              <span>{localEndTime}</span>
            </>
          )}
        </div>

        {/* Location */}
        {(meeting.location || meeting.formatted_address) && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="flex flex-col">
              {meeting.location && (
                <span className="text-foreground">{meeting.location}</span>
              )}
              <span className="line-clamp-1">{meeting.formatted_address}</span>
            </div>
          </div>
        )}

        {/* Region/Area */}
        <div className="text-xs text-muted-foreground">
          {meeting.area && <span>{meeting.area}</span>}
          {meeting.area && meeting.region && <span> · </span>}
          {meeting.region && <span>{meeting.region}</span>}
        </div>

        {/* Badges */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {/* Attendance badge */}
          <span
            className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${attendanceBgClass}`}
          >
            <AttendanceIcon className="h-3 w-3" />
            {ATTENDANCE_LABELS[meeting.attendance_option]}
          </span>

          {/* Type badges */}
          {(meeting.types || []).map((type) => (
            <span
              key={type}
              className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-meeting-type-bg text-meeting-type-text"
            >
              {TYPE_LABELS[type] || type}
            </span>
          ))}
        </div>

        {/* Action Links */}
        {(conferenceUrl || mapsUrl) && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
            {hasOnlineOption && conferenceUrl && (
              <a
                href={conferenceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Video className="h-3.5 w-3.5" />
                Join Online
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
            {mapsUrl && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
              >
                <Navigation className="h-3.5 w-3.5" />
                Directions
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        )}

        {/* Notes */}
        {meeting.notes && (
          <p className="text-xs text-muted-foreground border-t border-border pt-2 mt-1">
            {meeting.notes}
          </p>
        )}
      </div>
    </article>
  );
});
