import { exportDB, importInto } from "dexie-export-import";
import { db } from "../db";
import { dayKey } from "../lib/dates";

export async function exportBackup() {
  const blob = await exportDB(db);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `novara-backup-${dayKey()}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

export async function importBackup(file) {
  await importInto(db, file, {
    overwriteValues: true,
    clearTablesBeforeImport: true,
  });
}
