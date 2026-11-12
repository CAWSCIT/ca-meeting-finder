import { DisplayLocation } from "@/types/meeting";

let apiUrl = "https://caws-api.azurewebsites.net/api/v1/meetings-tsml";
let mapboxKey: string | null = null;
let defaultView: "today" | "all" = "today";
let displayLocation: DisplayLocation = "area";

export function initConfig(dataset: DOMStringMap) {
  if (dataset.url) apiUrl = dataset.url;
  if (dataset.mapsApi) mapboxKey = dataset.mapsApi;
  if (dataset.view === "all") defaultView = "all";
  if (dataset.displayLocation === "city") displayLocation = "city";
}

export const getApiUrl = () => apiUrl;
export const getMapboxKey = () => mapboxKey; // null = no key provided
export const getDefaultView = () => defaultView;
export const getDisplayLocation = () => displayLocation;
