import { useMeetings } from "@/hooks/useMeetings";
import { useGeolocation, calculateDistance } from "@/hooks/useGeolocation";
import { useAddressSearch } from "@/hooks/useAddressSearch";
import { useSelectedMeetingSlug } from "@/hooks/useSelectedMeetingSlug";
import { FilterBar } from "@/components/FilterBar";
import { MeetingList } from "@/components/MeetingList";
import { MeetingDetail } from "@/components/MeetingDetail";
import { LoadingScreen } from "@/components/LoadingScreen";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMemo, useState, useEffect } from "react";
import { Meeting } from "@/types/meeting";
import { sortMeetingsRolling } from "@/utils/meetingUtils";

const NEARBY_RADIUS_KM = 100;

const Index = () => {
  const {
    meetings,
    allMeetings,
    isLoading,
    error,
    filters,
    updateFilters,
    availableTypeGroups,
  } = useMeetings();

  const geolocation = useGeolocation();
  const addressSearch = useAddressSearch();
  const { selectedSlug, selectMeeting, clearSelection } = useSelectedMeetingSlug();

  const selectedMeeting = useMemo(
    () => (selectedSlug ? allMeetings.find((m) => m.slug === selectedSlug) ?? null : null),
    [selectedSlug, allMeetings]
  );

  // A shared link can point at a meeting that no longer exists in the feed
  // (removed or renumbered) - once loading settles and it's still missing,
  // drop back to the list instead of showing the detail screen forever blank.
  useEffect(() => {
    if (!isLoading && selectedSlug && !selectedMeeting) {
      clearSelection();
    }
  }, [isLoading, selectedSlug, selectedMeeting, clearSelection]);

  // Loading progress simulation
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [showLoading, setShowLoading] = useState(true);

  useEffect(() => {
    if (isLoading) {
      setShowLoading(true);
      setLoadingProgress(0);
      
      // Simulate progress while loading - update very frequently
      const interval = setInterval(() => {
        setLoadingProgress((prev) => {
          if (prev >= 95) return prev; // Cap at 95% until actually done
          return prev + Math.random() * 3 + 1; // Small frequent increments
        });
      }, 50);

      return () => clearInterval(interval);
    } else {
      // Loading complete - animate to 100%
      setLoadingProgress(100);
      // Delay hiding to allow fade-out animation
      const timeout = setTimeout(() => {
        setShowLoading(false);
      }, 600);
      return () => clearTimeout(timeout);
    }
  }, [isLoading]);

  // Auto-request geolocation if nearbyOnly was restored from localStorage
  useEffect(() => {
    if (filters.nearbyOnly && !geolocation.hasLocation && !geolocation.loading && !geolocation.permissionDenied) {
      geolocation.requestLocation();
    }
  }, [filters.nearbyOnly, geolocation]);

  // Determine which location to use for filtering
  const filterLocation = useMemo(() => {
    if (addressSearch.selectedLocation) {
      return addressSearch.selectedLocation;
    }
    if (filters.nearbyOnly && geolocation.hasLocation) {
      return { latitude: geolocation.latitude!, longitude: geolocation.longitude! };
    }
    return null;
  }, [
    addressSearch.selectedLocation,
    filters.nearbyOnly,
    geolocation.hasLocation,
    geolocation.latitude,
    geolocation.longitude,
  ]);
  // Filter and sort by distance if location filtering is enabled
  const displayMeetings = useMemo(() => {
    if (!filterLocation) {
      return meetings;
    }

    const { latitude: userLat, longitude: userLon } = filterLocation;

    // Calculate distances and filter
    const meetingsWithDistance = meetings
      .map((meeting) => {
        const lat = parseFloat(meeting.latitude);
        const lon = parseFloat(meeting.longitude);
        if (isNaN(lat) || isNaN(lon)) return null;

        const distance = calculateDistance(userLat, userLon, lat, lon);
        return { meeting, distance };
      })
      .filter((item): item is { meeting: Meeting; distance: number } => 
        item !== null && item.distance <= NEARBY_RADIUS_KM
      );

    // Apply rolling sort to nearby meetings (instead of sorting by distance)
    const nearbyMeetings = meetingsWithDistance.map((item) => item.meeting);
    return sortMeetingsRolling(nearbyMeetings);
  }, [meetings, filterLocation]);

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="rounded-full bg-destructive/10 p-4 w-fit mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-xl font-semibold text-foreground mb-2">
            Unable to load meetings
          </h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try again
          </Button>
        </div>
      </div>
    );
  }

  const handleRequestLocation = () => {
    geolocation.requestLocation(() => {
      updateFilters({ nearbyOnly: true });
    });
  };

  return (
    <>
      <LoadingScreen progress={loadingProgress} isVisible={showLoading} />
      {/* @container makes descendants respond to THIS element's width (the embed's
          parent container) rather than the browser window. See MeetingList / FilterBar. */}
      <div className="@container min-h-screen bg-background">
      {selectedMeeting ? (
        <MeetingDetail meeting={selectedMeeting} onBack={clearSelection} />
      ) : (
        <>
          <FilterBar
            filters={filters}
            onFilterChange={updateFilters}
            availableTypeGroups={availableTypeGroups}
            totalCount={allMeetings.length}
            filteredCount={displayMeetings.length}
            hasLocation={geolocation.hasLocation}
            locationLoading={geolocation.loading}
            locationDenied={geolocation.permissionDenied}
            onRequestLocation={handleRequestLocation}
            addressQuery={addressSearch.query}
            addressSuggestions={addressSearch.suggestions}
            addressLoading={addressSearch.isLoading}
            hasSearchLocation={!!addressSearch.selectedLocation}
            onAddressSearch={addressSearch.searchAddress}
            onAddressSelect={addressSearch.selectLocation}
            onAddressClear={addressSearch.clearLocation}
          />

          <main className="container py-6">
            <MeetingList
              meetings={displayMeetings}
              isLoading={isLoading}
              onSelectMeeting={(meeting) => selectMeeting(meeting.slug)}
            />
          </main>
        </>
      )}
    </div>
    </>
  );
};

export default Index;
