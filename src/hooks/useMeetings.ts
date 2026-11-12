import { useState, useEffect, useMemo, useDeferredValue } from "react";
import Fuse from "fuse.js";
import { Meeting, FilterState } from "@/types/meeting";
import {
  filterMeetingsOptimized,
  sortMeetingsRolling,
  getTypeGroups,
  prepareMeetings,
} from "@/utils/meetingUtils";
import { getApiUrl, getDefaultView } from "@/config";

/** Below this, a search term is too short to be worth matching on. */
const MIN_SEARCH_LENGTH = 2;

export function useMeetings() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>(() => {
    const today = new Date().getDay();
    const savedNearbyOnly = localStorage.getItem("nearbyOnly");
    return {
      day: getDefaultView() === "all" ? null : today,
      timeRange: "all",
      types: [],
      attendance: "all",
      search: "",
      nearbyOnly: savedNearbyOnly === "true",
    };
  });

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(getApiUrl());
        
        if (!response.ok) {
          throw new Error(`Failed to fetch meetings: ${response.status}`);
        }
        
        const data: Meeting[] = await response.json();
        // Pre-compute local times and cities once for all meetings
        const processedData = prepareMeetings(data);
        setMeetings(processedData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load meetings");
        console.error("Error fetching meetings:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMeetings();
  }, []);

  // Use deferred value for smoother filtering during typing
  const deferredFilters = useDeferredValue(filters);

  const fuse = useMemo(() => {
    return new Fuse(meetings, {
      keys: [
        { name: "name", weight: 2 },
        { name: "location", weight: 1.5 },
        // The city parsed out of the address, so "Edson" ranks Edson's
        // meetings first instead of burying them under fuzzy matches on the
        // long address string.
        { name: "_city", weight: 1.5 },
        { name: "formatted_address", weight: 1 },
        { name: "area", weight: 1 },
        { name: "region", weight: 0.8 },
      ],
      // Fuzzy-matching a short query against long address strings matches
      // almost anything: at 0.4 "Edson" pulled 1052 of 3456 meetings and
      // "Tumba" 385 of them, against 3 and 1 literal matches. At 0.15 both
      // return exactly their literal matches, and typos are still forgiven
      // ("seranity" finds all 66 Serenity meetings, which 0.1 misses).
      threshold: 0.15,
      ignoreLocation: true,
      minMatchCharLength: 2,
    });
  }, [meetings]);

  // Everything except the type filter. The type dropdown is built from this so
  // it only offers types that still have meetings under the other filters,
  // while staying unaffected by the type selection itself.
  const searchTerm = deferredFilters.search.trim();
  const isSearching = searchTerm.length >= MIN_SEARCH_LENGTH;

  const meetingsBeforeTypeFilter = useMemo(() => {
    let result = meetings;

    // Apply fuzzy search first if there's a search term
    if (isSearching) {
      const searchResults = fuse.search(searchTerm);
      result = searchResults.map((r) => r.item);
    }

    // Apply optimized filters using pre-computed hours
    return filterMeetingsOptimized(result, { ...deferredFilters, types: [] });
  }, [meetings, deferredFilters, fuse, isSearching, searchTerm]);

  const availableTypeGroups = useMemo(
    () => getTypeGroups(meetingsBeforeTypeFilter, deferredFilters.types),
    [meetingsBeforeTypeFilter, deferredFilters.types]
  );

  const filteredMeetings = useMemo(() => {
    const filtered = filterMeetingsOptimized(
      meetingsBeforeTypeFilter,
      deferredFilters
    );

    // A search arrives already ordered by how well each meeting matches.
    // Re-sorting it by what starts soonest buries the exact hits: typing
    // "Edson" put every loosely-matching meeting happening today above the
    // three meetings actually held in Edson.
    if (isSearching) return filtered;

    return sortMeetingsRolling(filtered);
  }, [meetingsBeforeTypeFilter, deferredFilters, isSearching]);

  const updateFilters = (newFilters: Partial<FilterState>) => {
    if (newFilters.nearbyOnly !== undefined) {
      localStorage.setItem("nearbyOnly", String(newFilters.nearbyOnly));
    }

    setFilters((prev) => {
      const next = { ...prev, ...newFilters };

      // A search is a whole-week lookup: the city someone types may hold no
      // meeting today, and an empty list reads as "no meetings here" rather
      // than "none today". Widen the day filter as the search begins - the
      // dropdown then shows "All Days", so the change is visible and they can
      // narrow it back down.
      const startsSearch =
        prev.search.trim().length < MIN_SEARCH_LENGTH &&
        next.search.trim().length >= MIN_SEARCH_LENGTH;
      if (startsSearch && newFilters.day === undefined) {
        next.day = null;
      }

      return next;
    });
  };

  return {
    meetings: filteredMeetings,
    allMeetings: meetings,
    isLoading,
    error,
    filters,
    updateFilters,
    availableTypeGroups,
  };
}
