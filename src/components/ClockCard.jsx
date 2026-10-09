import { useEffect, useState } from "react";
import { fetchWeather } from "../services/weatherService";
import { useSetting } from "../services/settingsService";
import { QUOTES } from "../lib/quotes";
import { dashCard } from "../lib/ui";

export default function ClockCard() {
  const [now, setNow] = useState(new Date());
  const [weather, setWeather] = useState(null);
  const [quote, setQuote] = useState(() =>
    Math.floor(Math.random() * QUOTES.length),
  );
  const place = useSetting("weatherPlace", null);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // A new quote every 3 minutes
  useEffect(() => {
    const t = setInterval(
      () => setQuote((i) => (i + 1) % QUOTES.length),
      3 * 60000,
    );
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    fetchWeather(place || undefined)
      .then(setWeather)
      .catch(() => setWeather(null));
  }, [place && place.name]);

  // "11:08 am", same format as the mockup
  const time = now
    .toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    .toLowerCase();

  // The mockup shows the quote without the author, so keep only the text before ' - '
  const quoteText = QUOTES[quote].split(" - ")[0];

  return (
    <div className={`${dashCard} grid min-w-0 grid-cols-[3fr_2fr]`}>
      <div className="flex min-w-0 flex-col items-center justify-center">
        <div className="text-[clamp(1.35rem,4.2vh,2.8rem)] font-medium leading-none">
          {time}
        </div>
        <div className="mt-[1vh] text-center text-[clamp(0.5rem,0.95vh,0.7rem)] text-white/80">
          {weather
            ? `${weather.text} | ${weather.temp} °C`
            : "Weather unavailable"}
        </div>
      </div>
      <div className="my-[2.2vh] flex min-w-0 items-center justify-center border-l border-white/30 px-[6%] text-center text-[clamp(0.6rem,1.2vh,0.85rem)] leading-snug">
        {quoteText}
      </div>
    </div>
  );
}
