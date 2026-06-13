import { FilterState, TimeRange, AttendanceType } from "@/types/meeting";
import {
  DAY_SHORT_NAMES,
  TIME_RANGES,
  ATTENDANCE_LABELS,
  TYPE_LABELS,
} from "@/utils/meetingUtils";
import { Search, X, ChevronDown, MapPin, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { LocationSearchInput } from "@/components/LocationSearchInput";
import { AddressSuggestion } from "@/hooks/useAddressSearch";
import { getMapboxKey } from "@/config";

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
  availableTypes: string[];
  totalCount: number;
  filteredCount: number;
  // Geolocation props
  hasLocation: boolean;
  locationLoading: boolean;
  locationDenied: boolean;
  onRequestLocation: () => void;
  // Address search props
  addressQuery: string;
  addressSuggestions: AddressSuggestion[];
  addressLoading: boolean;
  hasSearchLocation: boolean;
  onAddressSearch: (query: string) => void;
  onAddressSelect: (suggestion: AddressSuggestion) => void;
  onAddressClear: () => void;
}

export function FilterBar({
  filters,
  onFilterChange,
  availableTypes,
  totalCount,
  filteredCount,
  hasLocation,
  locationLoading,
  locationDenied,
  onRequestLocation,
  addressQuery,
  addressSuggestions,
  addressLoading,
  hasSearchLocation,
  onAddressSearch,
  onAddressSelect,
  onAddressClear,
}: FilterBarProps) {
  const hasActiveFilters =
    filters.day !== null ||
    filters.timeRange !== "all" ||
    filters.types.length > 0 ||
    filters.attendance !== "all" ||
    filters.search.length > 0 ||
    filters.nearbyOnly;

  const clearFilters = () => {
    onFilterChange({
      day: null,
      timeRange: "all",
      types: [],
      attendance: "all",
      search: "",
      nearbyOnly: false,
    });
  };

  const toggleType = (type: string) => {
    const newTypes = filters.types.includes(type)
      ? filters.types.filter((t) => t !== type)
      : [...filters.types, type];
    onFilterChange({ types: newTypes });
  };

  const handleNearbyClick = () => {
    if (locationDenied) return;

    if (!hasLocation && !locationLoading) {
      onRequestLocation();
    } else if (hasLocation) {
      onFilterChange({ nearbyOnly: !filters.nearbyOnly });
    }
  };

  const getNearbyButtonLabel = () => {
    if (locationLoading) return "Locating...";
    if (filters.nearbyOnly) return "Within 100km";
    return "Nearby";
  };

  const getNearbyTooltip = () => {
    if (locationDenied) return "Location access was denied. Please enable it in your browser settings.";
    if (!hasLocation && !locationLoading) return "Click to enable location and find meetings within 100km";
    if (hasLocation && !filters.nearbyOnly) return "Show meetings within 100km of your location";
    return "Showing meetings within 100km";
  };

  return (
    <div className="bg-card border-b border-border sticky top-0 z-10">
      <div className="container py-4 space-y-4">
        {/* Search row */}
        <div className="flex flex-col @[640px]:flex-row gap-3">
          {/* Text Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search meetings by name, location, or area..."
              value={filters.search}
              onChange={(e) => onFilterChange({ search: e.target.value })}
              className="pl-9 pr-9 h-11 bg-background"
            />
            {filters.search && (
              <button
                onClick={() => onFilterChange({ search: "" })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Location Search */}
          {getMapboxKey() !== null && (
            <LocationSearchInput
              query={addressQuery}
              suggestions={addressSuggestions}
              isLoading={addressLoading}
              hasSelectedLocation={hasSearchLocation}
              onSearch={onAddressSearch}
              onSelect={onAddressSelect}
              onClear={onAddressClear}
            />
          )}
        </div>

        {/* Filter row */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Nearby filter */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={filters.nearbyOnly ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "h-9 gap-2",
                    locationDenied && "opacity-50 cursor-not-allowed"
                  )}
                  onClick={handleNearbyClick}
                  disabled={locationDenied}
                >
                  {locationLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <MapPin className="h-4 w-4" />
                  )}
                  {getNearbyButtonLabel()}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{getNearbyTooltip()}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Day filter */}
          <Select
            value={filters.day?.toString() ?? "all"}
            onValueChange={(value) =>
              onFilterChange({ day: value === "all" ? null : parseInt(value) })
            }
          >
            <SelectTrigger className="w-[130px] h-9 bg-background">
              <SelectValue placeholder="Day" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Days</SelectItem>
              {DAY_SHORT_NAMES.map((day, index) => (
                <SelectItem key={index} value={index.toString()}>
                  {day}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Time range filter */}
          <Select
            value={filters.timeRange}
            onValueChange={(value) =>
              onFilterChange({ timeRange: value as TimeRange })
            }
          >
            <SelectTrigger className="w-[140px] h-9 bg-background">
              <SelectValue placeholder="Time" />
            </SelectTrigger>
            <SelectContent>
              {TIME_RANGES.map((range) => (
                <SelectItem key={range.value} value={range.value}>
                  <div className="flex flex-col">
                    <span>{range.label}</span>
                    {range.range && (
                      <span className="text-xs text-muted-foreground">
                        {range.range}
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Attendance filter */}
          <Select
            value={filters.attendance}
            onValueChange={(value) =>
              onFilterChange({ attendance: value as AttendanceType })
            }
          >
            <SelectTrigger className="w-[140px] h-9 bg-background">
              <SelectValue placeholder="Format" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ATTENDANCE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Types filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="h-9 px-3 bg-background justify-between min-w-[120px]"
              >
                <span>
                  {filters.types.length > 0
                    ? `${filters.types.length} type${filters.types.length > 1 ? "s" : ""}`
                    : "Meeting Type"}
                </span>
                <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3" align="start">
              <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
                {availableTypes.map((type) => (
                  <label
                    key={type}
                    className="flex items-center gap-2 py-1 px-1 rounded hover:bg-secondary cursor-pointer"
                  >
                    <Checkbox
                      checked={filters.types.includes(type)}
                      onCheckedChange={() => toggleType(type)}
                    />
                    <span className="text-sm">
                      {TYPE_LABELS[type] || type}
                    </span>
                  </label>
                ))}
              </div>
              {filters.types.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => onFilterChange({ types: [] })}
                >
                  Clear types
                </Button>
              )}
            </PopoverContent>
          </Popover>

          {/* Results count & clear */}
          <div className="flex-1 flex items-center justify-end gap-3">
            <span className="text-sm text-muted-foreground">
              {filteredCount.toLocaleString()} of {totalCount.toLocaleString()} meetings
            </span>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-8 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3 mr-1" />
                Clear all
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
