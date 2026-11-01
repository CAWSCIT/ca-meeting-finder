import { useState, useEffect, useMemo, useDeferredValue } from "react";
import Fuse from "fuse.js";
import { Meeting, FilterState } from "@/types/meeting";
import {
  filterMeetingsOptimized,
  sortMeetingsRolling,
  getTypeGroups,
  precomputeLocalTimes,
} from "@/utils/meetingUtils";
import { getApiUrl } from "@/config";

export function useMeetings() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>(() => {
    const today = new Date().getDay();
    const savedNearbyOnly = localStorage.getItem("nearbyOnly");
    return {
      day: today,
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
        // Pre-compute local times once for all meetings
        const processedData = precomputeLocalTimes(data);
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
        { name: "formatted_address", weight: 1 },
        { name: "area", weight: 1 },
        { name: "region", weight: 0.8 },
      ],
      threshold: 0.4,
      ignoreLocation: true,
      minMatchCharLength: 2,
    });
  }, [meetings]);

  // Everything except the type filter. The type dropdown is built from this so
  // it only offers types that still have meetings under the other filters,
  // while staying unaffected by the type selection itself.
  const meetingsBeforeTypeFilter = useMemo(() => {
    let result = meetings;

    // Apply fuzzy search first if there's a search term
    if (deferredFilters.search.trim().length >= 2) {
      const searchResults = fuse.search(deferredFilters.search.trim());
      result = searchResults.map((r) => r.item);
    }

    // Apply optimized filters using pre-computed hours
    return filterMeetingsOptimized(result, { ...deferredFilters, types: [] });
  }, [meetings, deferredFilters, fuse]);

  const availableTypeGroups = useMemo(
    () => getTypeGroups(meetingsBeforeTypeFilter, deferredFilters.types),
    [meetingsBeforeTypeFilter, deferredFilters.types]
  );

  const filteredMeetings = useMemo(() => {
    const filtered = filterMeetingsOptimized(
      meetingsBeforeTypeFilter,
      deferredFilters
    );
    return sortMeetingsRolling(filtered);
  }, [meetingsBeforeTypeFilter, deferredFilters]);

  const updateFilters = (newFilters: Partial<FilterState>) => {
    if (newFilters.nearbyOnly !== undefined) {
      localStorage.setItem("nearbyOnly", String(newFilters.nearbyOnly));
    }
    setFilters((prev) => ({ ...prev, ...newFilters }));
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
