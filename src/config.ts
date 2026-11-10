let apiUrl = "https://caws-api.azurewebsites.net/api/v1/meetings-tsml";
let mapboxKey: string | null = null;
let defaultView: "today" | "all" = "today";

export function initConfig(dataset: DOMStringMap) {
  if (dataset.url) apiUrl = dataset.url;
  if (dataset.mapsApi) mapboxKey = dataset.mapsApi;
  if (dataset.view === "all") defaultView = "all";
}

export const getApiUrl = () => apiUrl;
export const getMapboxKey = () => mapboxKey; // null = no key provided
export const getDefaultView = () => defaultView;
