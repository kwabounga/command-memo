import { writable } from "svelte/store";
import type { Update } from "@tauri-apps/plugin-updater";

export const updateInfo = writable<{ available: boolean; version: string | null; update: Update | null }>({
    available: false,
    version: null,
    update: null
});
