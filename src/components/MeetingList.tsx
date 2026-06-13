import { useState, useEffect, useRef, useCallback } from "react";
import { Meeting } from "@/types/meeting";
import { MeetingCard } from "./MeetingCard";
import { Calendar, Loader2 } from "lucide-react";

interface MeetingListProps {
  meetings: Meeting[];
  isLoading: boolean;
}

const ITEMS_PER_PAGE = 21;

export function MeetingList({ meetings, isLoading }: MeetingListProps) {
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);
  const loaderRef = useRef<HTMLDivElement>(null);

  // Reset display count when meetings change (filters applied)
  useEffect(() => {
    setDisplayCount(ITEMS_PER_PAGE);
  }, [meetings]);

  const displayedMeetings = meetings.slice(0, displayCount);
  const hasMore = displayCount < meetings.length;

  const loadMore = useCallback(() => {
    if (hasMore) {
      setDisplayCount((prev) => Math.min(prev + ITEMS_PER_PAGE, meetings.length));
    }
  }, [hasMore, meetings.length]);

  // Intersection observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    );

    const currentLoader = loaderRef.current;
    if (currentLoader) {
      observer.observe(currentLoader);
    }

    return () => {
      if (currentLoader) {
        observer.unobserve(currentLoader);
      }
    };
  }, [hasMore, isLoading, loadMore]);

  if (isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="bg-card rounded-lg border border-border p-4 space-y-3 animate-pulse-subtle"
          >
            <div className="flex justify-between">
              <div className="h-5 bg-muted rounded w-3/4" />
              <div className="h-5 bg-muted rounded w-16" />
            </div>
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-4 bg-muted rounded w-2/3" />
            <div className="h-3 bg-muted rounded w-1/2" />
            <div className="flex gap-2 pt-2">
              <div className="h-5 bg-muted rounded-full w-16" />
              <div className="h-5 bg-muted rounded-full w-12" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (meetings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Calendar className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1">
          No meetings found
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Try adjusting your filters or search terms to find more meetings.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {displayedMeetings.map((meeting) => (
          <MeetingCard key={meeting.slug} meeting={meeting} />
        ))}
      </div>

      {/* Loader / Load more trigger */}
      <div ref={loaderRef} className="flex justify-center py-4">
        {hasMore ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading more meetings...</span>
          </div>
        ) : (
          meetings.length > ITEMS_PER_PAGE && (
            <p className="text-sm text-muted-foreground">
              Showing all {meetings.length.toLocaleString()} meetings
            </p>
          )
        )}
      </div>
    </div>
  );
}
