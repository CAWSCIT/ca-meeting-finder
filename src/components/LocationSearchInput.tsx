import { useRef, useEffect } from "react";
import { MapPin, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { AddressSuggestion } from "@/hooks/useAddressSearch";
import { cn } from "@/lib/utils";

interface LocationSearchInputProps {
  query: string;
  suggestions: AddressSuggestion[];
  isLoading: boolean;
  hasSelectedLocation: boolean;
  onSearch: (query: string) => void;
  onSelect: (suggestion: AddressSuggestion) => void;
  onClear: () => void;
}

export function LocationSearchInput({
  query,
  suggestions,
  isLoading,
  hasSelectedLocation,
  onSearch,
  onSelect,
  onClear,
}: LocationSearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        // Clear suggestions without clearing the query
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative flex-1 min-w-[200px]">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search by address or city..."
          value={query}
          onChange={(e) => onSearch(e.target.value)}
          className={cn(
            "pl-9 pr-9 h-11 bg-background",
            hasSelectedLocation && "border-primary"
          )}
        />
        {(query || isLoading) && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            {query && !isLoading && (
              <button
                onClick={onClear}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Suggestions dropdown */}
      {suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg z-50 overflow-hidden"
        >
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.placeId}
              onClick={() => onSelect(suggestion)}
              className="w-full px-3 py-2.5 text-left hover:bg-secondary transition-colors flex items-start gap-2 border-b border-border last:border-0"
            >
              <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
              <span className="text-sm line-clamp-2">{suggestion.displayName}</span>
            </button>
          ))}
        </div>
      )}

      {/* Selected location indicator */}
      {hasSelectedLocation && (
        <div className="absolute -top-2 -right-2">
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px]">
            ✓
          </span>
        </div>
      )}
    </div>
  );
}
