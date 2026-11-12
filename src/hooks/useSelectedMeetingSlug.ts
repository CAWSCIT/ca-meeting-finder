import { useCallback, useEffect, useState } from "react";

/**
 * The URL hash key a selected meeting's slug is stored under:
 * `#camf-meeting=<slug>`. A hash (not a query param) because this widget
 * embeds into arbitrary host pages - it must never touch the host's own
 * query string or trigger a request to its server, and the prefix keeps it
 * out of the way of a host page that uses the hash for its own routing.
 */
const HASH_KEY = "camf-meeting";

function readSlugFromHash(): string | null {
  const hash = window.location.hash.replace(/^#/, "");
  if (!hash) return null;
  const slug = new URLSearchParams(hash).get(HASH_KEY);
  return slug || null;
}

/**
 * Keeps the selected meeting's slug in sync with the URL hash, so opening a
 * meeting is a shareable, reloadable link and never a page navigation.
 *
 * Reading goes through `hashchange`, which also covers the browser's
 * back/forward buttons - assigning `location.hash` (as `selectMeeting` does)
 * pushes a real history entry, so back from a meeting returns to the list for
 * free. Writes update state immediately rather than waiting on that event, so
 * a click feels instant rather than trailing a tick behind the URL.
 */
export function useSelectedMeetingSlug() {
  const [slug, setSlug] = useState<string | null>(() => readSlugFromHash());

  useEffect(() => {
    const onHashChange = () => setSlug(readSlugFromHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const selectMeeting = useCallback((meetingSlug: string) => {
    window.location.hash = `${HASH_KEY}=${encodeURIComponent(meetingSlug)}`;
    setSlug(meetingSlug);
  }, []);

  const clearSelection = useCallback(() => {
    // replaceState rather than clearing location.hash directly: it edits the
    // current entry in place instead of pushing a new one, so the browser's
    // own back button still means "wherever the visitor was before this
    // page" rather than a hash state we invented.
    if (window.location.hash) {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
    setSlug(null);
  }, []);

  return { selectedSlug: slug, selectMeeting, clearSelection };
}
