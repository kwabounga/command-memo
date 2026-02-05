import Database from "@tauri-apps/plugin-sql";

export const db = await Database.load("sqlite:commands.db");

export async function getCommands(search = "") {
    return db.select(
        "SELECT * FROM commands WHERE name LIKE ? OR description LIKE ? OR icon LIKE ? ORDER BY name",
        [`%${search}%`, `%${search}%`, `%${search}%`]
    );

}

export async function addCommand(name: string, description: string, command: string, icon: string) {
    await db.execute(
        "INSERT INTO commands (name, description, command, icon) VALUES (?, ?, ?, ?)",
        [name, description, command, icon]
    );
}

export async function deleteCommand(id: number) {
    await db.execute("DELETE FROM commands WHERE id = ?", [id]);
}
