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

/////////////////////////////
// COMMANDS
/////////////////////////////

export async function getCommands(search = "", workspaceId = null) {
    const database = await getDb();

    return database.select(
        `
        SELECT * FROM commands
        WHERE (workspace_id = ? OR workspace_id IS NULL)
        AND (name LIKE ? OR description LIKE ? OR icon LIKE ?)
        ORDER BY name
        `,
        [workspaceId, `%${search}%`, `%${search}%`, `%${search}%`]
    );
}

export async function addCommand(
    name: string,
    description: string,
    command: string,
    icon: string,
    workspaceId = null
) {
    const database = await getDb();

    await database.execute(
        `
        INSERT INTO commands (name, description, command, icon, workspace_id)
        VALUES (?, ?, ?, ?, ?)
        `,
        [name, description, command, icon, workspaceId]
    );
}

export async function deleteCommand(id: number) {
    const database = await getDb();
    await database.execute("DELETE FROM commands WHERE id = ?", [id]);
}

export async function updateCommand(cmd: {
    id: number;
    name: string;
    command: string;
    description: string;
    icon: string;
    workspace_id: number|null;
}) {
    const database = await getDb();

    await database.execute(
        `
        UPDATE commands
        SET name = ?, description = ?, "command" = ?, icon = ?, workspace_id = ?
        WHERE id = ?
        `,
        [
            cmd.name,
            cmd.description,
            cmd.command,
            cmd.icon,
            cmd.workspace_id,
            cmd.id
        ]
    );
}

export async function updateCategorie(oldIcon: string, newIcon: string) {
    const database = await getDb();

    await database.execute(
        `
        UPDATE commands
        SET icon = ?
        WHERE icon = ?
        `,
        [newIcon, oldIcon]
    );
}

/////////////////////////////
// WORKSPACES
/////////////////////////////

export async function getWorkspaces() {
    const database = await getDb();

    return database.select(
        `SELECT * FROM workspaces ORDER BY id`
    );
}

export async function addWorkspace(name: string) {
    const database = await getDb();

    await database.execute(
        `
        INSERT INTO workspaces (name)
        VALUES (?)
        `,
        [name]
    );
}

export async function deleteWorkspace(id: number) {
    const database = await getDb();

    await database.execute(
        `DELETE FROM workspaces WHERE id = ?`,
        [id]
    );
}

export async function updateWorkspace(id: number, name: string) {
    const database = await getDb();

    await database.execute(
        `
        UPDATE workspaces
        SET name = ?
        WHERE id = ?
        `,
        [name, id]
    );
}

/////////////////////////////
// TEMPLATES
/////////////////////////////

export async function getTemplates(workspaceId = null) {
    const database = await getDb();

    return database.select(
        `
        SELECT * FROM templates
        WHERE workspace_id = ? OR workspace_id IS NULL
        ORDER BY name
        `,
        [workspaceId]
    );
}

export async function addTemplate(
    name: string,
    description: string,
    body: string,
    icon: string,
    workspaceId = 0
) {
    const database = await getDb();

    await database.execute(
        `
        INSERT INTO templates (name, description, body, icon, workspace_id)
        VALUES (?, ?, ?, ?, ?)
        `,
        [name, description, body, icon, workspaceId]
    );
}

export async function updateTemplate(template: {
    id: number;
    name: string;
    description: string;
    body: string;
    icon: string;
    workspace_id: number;
}) {
    const database = await getDb();

    await database.execute(
        `
        UPDATE templates
        SET name = ?, description = ?, body = ?, icon = ?, workspace_id = ?
        WHERE id = ?
        `,
        [
            template.name,
            template.description,
            template.body,
            template.icon,
            template.workspace_id,
            template.id
        ]
    );
}

export async function deleteTemplate(id: number) {
    const database = await getDb();

    await database.execute(
        `DELETE FROM templates WHERE id = ?`,
        [id]
    );
}

/////////////////////////////
// TEMPLATE PARAMS
/////////////////////////////

export async function getTemplateParams(templateId: number) {
    const database = await getDb();

    return database.select(
        `
        SELECT * FROM template_params
        WHERE template_id = ?
        ORDER BY id
        `,
        [templateId]
    );
}

export async function addTemplateParam(
    templateId: number,
    type: string,
    placeholder: string,
    description: string
) {
    const database = await getDb();

    await database.execute(
        `
        INSERT INTO template_params
        (template_id, type, placeholder, description)
        VALUES (?, ?, ?, ?)
        `,
        [templateId, type, placeholder, description]
    );
}

export async function deleteTemplateParam(id: number) {
    const database = await getDb();

    await database.execute(
        `
        DELETE FROM template_params
        WHERE id = ?
        `,
        [id]
    );
}

export async function updateTemplateParam(param: {
    id: number;
    type: string;
    placeholder: string;
    description: string;
}) {
    const database = await getDb();

    await database.execute(
        `
        UPDATE template_params
        SET type = ?, placeholder = ?, description = ?
        WHERE id = ?
        `,
        [
            param.type,
            param.placeholder,
            param.description,
            param.id
        ]
    );
}