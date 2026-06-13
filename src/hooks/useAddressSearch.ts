import { useState, useCallback, useRef } from "react";
import { getMapboxKey } from "@/config";

export interface AddressSuggestion {
  displayName: string;
  latitude: number;
  longitude: number;
  placeId: string;
}

interface AddressSearchState {
  query: string;
  suggestions: AddressSuggestion[];
  isLoading: boolean;
  selectedLocation: { latitude: number; longitude: number } | null;
}

export function useAddressSearch() {
  const [state, setState] = useState<AddressSearchState>({
    query: "",
    suggestions: [],
    isLoading: false,
    selectedLocation: null,
  });

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const searchAddress = useCallback(async (query: string) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (!query.trim() || query.length < 3) {
      setState((prev) => ({ ...prev, query, suggestions: [], isLoading: false }));
      return;
    }

    setState((prev) => ({ ...prev, query, isLoading: true }));

    // Debounce the API call
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      abortControllerRef.current = new AbortController();

      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${getMapboxKey()}&limit=5`,
          {
            signal: abortControllerRef.current.signal,
          }
        );

        if (!response.ok) throw new Error("Search failed");

        const data = await response.json();

        const suggestions: AddressSuggestion[] = data.features.map((item: {
          place_name: string;
          center: [number, number];
          id: string;
        }) => ({
          displayName: item.place_name,
          latitude: item.center[1],
          longitude: item.center[0],
          placeId: item.id,
        }));

        setState((prev) => ({ ...prev, suggestions, isLoading: false }));
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setState((prev) => ({ ...prev, suggestions: [], isLoading: false }));
        }
      }
    }, 300);
  }, []);

  const selectLocation = useCallback((suggestion: AddressSuggestion) => {
    setState((prev) => ({
      ...prev,
      query: suggestion.displayName,
      suggestions: [],
      selectedLocation: {
        latitude: suggestion.latitude,
        longitude: suggestion.longitude,
      },
    }));
  }, []);

  const clearLocation = useCallback(() => {
    setState({
      query: "",
      suggestions: [],
      isLoading: false,
      selectedLocation: null,
    });
  }, []);

  return {
    query: state.query,
    suggestions: state.suggestions,
    isLoading: state.isLoading,
    selectedLocation: state.selectedLocation,
    searchAddress,
    selectLocation,
    clearLocation,
  };
}
