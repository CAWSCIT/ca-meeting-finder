let apiUrl = "https://caws-api.azurewebsites.net/api/v1/meetings-tsml";
let mapboxKey: string | null = null;

export function initConfig(dataset: DOMStringMap) {
  if (dataset.url) apiUrl = dataset.url;
  if (dataset.mapsApi) mapboxKey = dataset.mapsApi;
}

export const getApiUrl = () => apiUrl;
export const getMapboxKey = () => mapboxKey; // null = no key provided
