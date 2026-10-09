const CACHE_KEY = "novara-weather";
const DEFAULT_PLACE = { name: "Manila", lat: 14.5995, lon: 120.9842 };

function describe(code) {
  if (code === 0) return "Clear";
  if (code === 1) return "Mostly clear";
  if (code === 2) return "Partly cloudy";
  if (code === 3) return "Mostly cloudy";
  if (code === 45 || code === 48) return "Foggy";
  if (code >= 51 && code <= 57) return "Drizzle";
  if (code >= 61 && code <= 67) return "Rain";
  if (code >= 80 && code <= 82) return "Rain showers";
  if (code >= 95) return "Thunderstorm";
  return "Cloudy";
}

export async function fetchWeather(place = DEFAULT_PLACE) {
  // Reuse the last result for 30 minutes so we do not call the API on every visit
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
    if (
      cached &&
      cached.place === place.name &&
      Date.now() - cached.at < 30 * 60000
    )
      return cached.data;
  } catch (e) {
    // ignore a broken cache
  }
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${place.lat}&longitude=${place.lon}&current=temperature_2m,weather_code`;
  const json = await (await fetch(url)).json();
  const data = {
    temp: Math.round(json.current.temperature_2m),
    text: describe(json.current.weather_code),
  };
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ place: place.name, at: Date.now(), data }),
    );
  } catch (e) {
    // storage full or blocked; fine
  }
  return data;
}

// Turns a city name into coordinates (used by Settings)
export async function findPlace(name) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1`;
  const json = await (await fetch(url)).json();
  const hit = json.results && json.results[0];
  return hit ? { name: hit.name, lat: hit.latitude, lon: hit.longitude } : null;
}
