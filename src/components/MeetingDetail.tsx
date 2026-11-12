import { useState } from "react";
import { Meeting } from "@/types/meeting";
import {
  DAY_NAMES,
  getGoogleMapsUrl,
  getTypeLabel,
  getVisibleTypes,
  ATTENDANCE_LABELS,
} from "@/utils/meetingUtils";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Check,
  Clock,
  ExternalLink,
  Globe,
  Link2,
  MapPin,
  Navigation,
  Phone,
  Users,
  Video,
} from "lucide-react";

interface MeetingDetailProps {
  meeting: Meeting;
  onBack: () => void;
}

export function MeetingDetail({ meeting, onBack }: MeetingDetailProps) {
  const [copied, setCopied] = useState(false);

  const localTime = meeting._localTime || meeting.time;
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

  const hasOnlineOption =
    meeting.attendance_option === "online" || meeting.attendance_option === "hybrid";
  const hasInPersonOption =
    meeting.attendance_option === "in_person" || meeting.attendance_option === "hybrid";
  const mapsUrl = hasInPersonOption ? getGoogleMapsUrl(meeting) : null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be denied by the browser; the link is still
      // right there in the address bar for the visitor to copy by hand.
    }
  };

  return (
    <div className="container py-6 max-w-2xl">
      <Button variant="ghost" size="sm" onClick={onBack} className="mb-4 -ml-2 gap-1.5">
        <ArrowLeft className="h-4 w-4" />
        Back to meetings
      </Button>

      <article className="bg-card rounded-lg border border-border p-5 @[480px]:p-6 shadow-meeting-card animate-fade-in space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <h1 className="font-sans text-xl @[480px]:text-2xl font-bold text-foreground leading-tight">
            {meeting.name}
          </h1>
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

        {/* Badges */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${attendanceBgClass}`}
          >
            <AttendanceIcon className="h-3 w-3" />
            {ATTENDANCE_LABELS[meeting.attendance_option]}
          </span>
          {getVisibleTypes(meeting.types).map((type) => (
            <span
              key={type}
              className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-meeting-type-bg text-meeting-type-text"
            >
              {getTypeLabel(type)}
            </span>
          ))}
        </div>

        {/* In-person location */}
        {hasInPersonOption && (meeting.location || meeting.formatted_address) && (
          <div className="flex items-start gap-2 text-sm border-t border-border pt-4">
            <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
            <div className="flex flex-col text-muted-foreground">
              {meeting.location && (
                <span className="text-foreground font-medium">{meeting.location}</span>
              )}
              {meeting.formatted_address && <span>{meeting.formatted_address}</span>}
              {meeting.location_notes && <span>{meeting.location_notes}</span>}
              {meeting.approximate === "yes" && (
                <span className="italic">Address is approximate</span>
              )}
            </div>
          </div>
        )}

        {/* Online joining details */}
        {hasOnlineOption && (meeting.conference_url || meeting.conference_phone) && (
          <div className="flex items-start gap-2 text-sm border-t border-border pt-4">
            <Video className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
            <div className="flex flex-col text-muted-foreground">
              {meeting.conference_url_notes && <span>{meeting.conference_url_notes}</span>}
              {meeting.conference_phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  {meeting.conference_phone}
                </span>
              )}
              {meeting.conference_phone_notes && <span>{meeting.conference_phone_notes}</span>}
            </div>
          </div>
        )}

        {/* Area / region / group */}
        {(meeting.area || meeting.region || meeting.group) && (
          <div className="text-sm text-muted-foreground border-t border-border pt-4">
            {meeting.group && <div className="text-foreground font-medium">{meeting.group}</div>}
            <div>
              {meeting.area && <span>{meeting.area}</span>}
              {meeting.area && meeting.region && <span> · </span>}
              {meeting.region && <span>{meeting.region}</span>}
            </div>
          </div>
        )}

        {/* Notes */}
        {meeting.notes && (
          <p className="text-sm text-muted-foreground border-t border-border pt-4 whitespace-pre-line">
            {meeting.notes}
          </p>
        )}

        {/* Action links */}
        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
          {hasOnlineOption && meeting.conference_url && (
            <a
              href={meeting.conference_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
            >
              <Video className="h-4 w-4" />
              Join Online
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
            >
              <Navigation className="h-4 w-4" />
              Directions
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
          {meeting.url && (
            <a
              href={meeting.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              More Info
            </a>
          )}
          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors ml-auto"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Link2 className="h-4 w-4" />
                Copy Link
              </>
            )}
          </button>
        </div>
      </article>
    </div>
  );
}
