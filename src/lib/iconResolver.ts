import {convertFileSrc, invoke} from "@tauri-apps/api/core";

export let USER_ICON_DIR: string;

export async function initIconDir() {
    USER_ICON_DIR = await invoke("get_user_icon_dir");
}

export function resolveIconUrl(icon: string, userIcons: Set<string>) {

    const filename = icon.endsWith(".svg") ? icon : `${icon}.svg`;

    if (userIcons.has(filename)) {
        return convertFileSrc(`${USER_ICON_DIR}/${filename}`);
    }

    // fallback bundle
    return `/assets/svg/${filename}`;
}