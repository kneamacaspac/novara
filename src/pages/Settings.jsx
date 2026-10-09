import { useEffect, useState } from "react";
import { useSetting, setSetting } from "../services/settingsService";
import { findPlace } from "../services/weatherService";
import { exportBackup, importBackup } from "../services/backupService";
import { inputCls } from "../components/AddBookModal";

export default function Settings() {
  const name = useSetting("userName", "Reader");
  const goal = useSetting("weeklyGoalHours", 5);
  const place = useSetting("weatherPlace", null);
  const [city, setCity] = useState("");
  const [msg, setMsg] = useState("");
  const [usage, setUsage] = useState(null);
  const [persisted, setPersisted] = useState(null);

  useEffect(() => {
    if (navigator.storage && navigator.storage.estimate)
      navigator.storage.estimate().then(setUsage);
    if (navigator.storage && navigator.storage.persisted)
      navigator.storage.persisted().then(setPersisted);
  }, []);

  async function saveCity() {
    try {
      const p = await findPlace(city);
      if (!p) {
        setMsg("City not found.");
        return;
      }
      await setSetting("weatherPlace", p);
      localStorage.removeItem("novara-weather");
      setMsg(`Weather city set to ${p.name}.`);
    } catch (e) {
      setMsg("Could not reach the weather service.");
    }
  }

  async function restore(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (
      !confirm("This replaces everything in the app with the backup. Continue?")
    )
      return;
    try {
      await importBackup(file);
      setMsg("Backup restored. Reloading...");
      setTimeout(() => location.reload(), 800);
    } catch (err) {
      console.error(err);
      setMsg("That file could not be restored.");
    }
  }

  const mb = (n) => `${Math.round(n / 1048576)} MB`;
  const card = "glass space-y-3 p-5";

  return (
    <div className="mx-auto max-w-2xl space-y-5 p-8">
      <h1 className="text-3xl font-bold">Settings</h1>

      <section className={card}>
        <h2 className="font-semibold">Profile and goal</h2>
        <label className="block text-sm text-white/70">
          Your name
          <input
            key={name}
            defaultValue={name}
            onBlur={(e) =>
              setSetting("userName", e.target.value.trim() || "Reader")
            }
            className={`${inputCls} mt-1`}
          />
        </label>
        <label className="block text-sm text-white/70">
          Weekly reading goal (hours)
          <input
            key={goal}
            type="number"
            min="0"
            step="0.5"
            defaultValue={goal}
            onBlur={(e) =>
              setSetting("weeklyGoalHours", Number(e.target.value) || 0)
            }
            className={`${inputCls} mt-1`}
          />
        </label>
      </section>

      <section className={card}>
        <h2 className="font-semibold">Weather city</h2>
        <p className="text-sm text-white/60">
          Current: {place ? place.name : "Manila (default)"}
        </p>
        <div className="flex gap-2">
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Type a city name"
            className={inputCls}
          />
          <button onClick={saveCity} className="rounded-lg bg-accent px-4">
            Set
          </button>
        </div>
      </section>

      <section className={card}>
        <h2 className="font-semibold">Backup</h2>
        <p className="text-sm text-white/60">
          Your library lives only in this browser. Export a backup now and then,
          and always before clearing browser data.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={exportBackup}
            className="rounded-lg bg-accent px-4 py-2"
          >
            Export backup
          </button>
          <label className="cursor-pointer rounded-lg bg-panel2 px-4 py-2">
            Import backup
            <input
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={restore}
            />
          </label>
        </div>
      </section>

      <section className={card}>
        <h2 className="font-semibold">Storage</h2>
        <p className="text-sm text-white/60">
          {usage
            ? `Using ${mb(usage.usage)} of about ${mb(usage.quota)}.`
            : "Storage info not available."}
          {persisted !== null &&
            ` Protected from automatic cleanup: ${persisted ? "yes" : "not yet"}.`}
        </p>
      </section>

      {msg && <p className="text-sm text-accent">{msg}</p>}
    </div>
  );
}
