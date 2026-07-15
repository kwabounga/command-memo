import { check, type Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { updateInfo } from "$lib/stores/updater";

export async function checkForUpdate() {
    let update: Update | null = null;
    try {
        update = await check();
    } catch (e) {
        console.warn("Update check failed:", e);
        return;
    }

    if (update) {
        updateInfo.set({ available: true, version: update.version, update });
    }
}

export async function applyUpdate(update: Update) {
    await update.downloadAndInstall();
    await relaunch();
}
