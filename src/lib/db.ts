let db: any = null;

async function getDb() {
    if (db) return db;

    if (!(window as any).__TAURI_INTERNALS__) {
        throw new Error("Tauri runtime not available");
    }

    const Database = (await import("@tauri-apps/plugin-sql")).default;
    db = await Database.load("sqlite:commands.db");
    return db;
}

export async function getCommands(search = "") {
    const database = await getDb();

    return database.select(
        "SELECT * FROM commands WHERE name LIKE ? OR description LIKE ? OR icon LIKE ? ORDER BY name",
        [`%${search}%`, `%${search}%`, `%${search}%`]
    );
}

export async function addCommand(name: string, description: string, command: string, icon: string) {
    const database = await getDb();

    await database.execute(
        "INSERT INTO commands (name, description, command, icon) VALUES (?, ?, ?, ?)",
        [name, description, command, icon]
    );
}

export async function deleteCommand(id: number) {
    const database = await getDb();
    await database.execute("DELETE FROM commands WHERE id = ?", [id]);
}
