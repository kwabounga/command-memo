let USER_ICON_DIR: string | null = null;
let convertFileSrcFn: ((path: string) => string) | null = null;

export async function initIconDir() {
    if (!(window as any).__TAURI_INTERNALS__) {
        console.warn("Not running inside Tauri");
        return;
    }

    const core = await import("@tauri-apps/api/core");

    convertFileSrcFn = core.convertFileSrc;
    USER_ICON_DIR = await core.invoke<string>("get_user_icon_dir");
}

export function resolveIconUrl(icon: string, userIcons: Set<string>) {
    const filename = icon.endsWith(".svg") ? icon : `${icon}.svg`;

    if (!USER_ICON_DIR) return `/assets/svg/${filename}.svg`;

    if (userIcons.has(filename) && USER_ICON_DIR && convertFileSrcFn) {
        return convertFileSrcFn(`${USER_ICON_DIR}/${filename}`);
    }

    // fallback bundle (vite asset)
    return `/assets/svg/${filename}`;
}
