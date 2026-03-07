import { writable } from "svelte/store";
import { getCurrentWorkspace } from "../db";

export const currentWorkspace = writable<any>(null);
export const GLOBAL_WORKSPACE = {
    id: null,
    name: "🌐 Global"
};
export async function initWorkspace() {
    const ws = await getCurrentWorkspace();
    currentWorkspace.set(ws);
}