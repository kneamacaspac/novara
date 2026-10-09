import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";

export const setSetting = (key, value) => db.settings.put({ key, value });

export async function getSetting(key, fallback) {
  const row = await db.settings.get(key);
  return row ? row.value : fallback;
}

// In components: const goal = useSetting('weeklyGoalHours', 5);
export const useSetting = (key, fallback) =>
  useLiveQuery(() => getSetting(key, fallback), [key], fallback);
