import { GLOBAL_WORKSPACE } from "$lib/stores/workspace";

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
    console.log('get commands')
    console.log(workspaceId);
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

    const ws = await database.execute(
        `
        INSERT INTO workspaces (name)
        VALUES (?)
        `,
        [name]
    );
    return setCurrentWorkspace(ws.id);
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
// la partie workspace 'courant'
// export async function getCurrentWorkspace() {
//     const database = await getDb();
//
//     const rows = await database.select(`
//         SELECT *
//         FROM workspaces
//         ORDER BY last_used DESC
//         LIMIT 1
//     `);
//
//     return rows[0] ?? null;
// }

export async function getCurrentWorkspace() {

    const database = await getDb();

    const rows = await database.select(`
    SELECT *
    FROM workspaces
    ORDER BY last_used DESC
    LIMIT 1
  `);
    console.log('current workspace rows', rows)
    if (!rows.length || rows[0].last_used === 0) {
        console.log('no WS founded fallback to default', GLOBAL_WORKSPACE)
        return GLOBAL_WORKSPACE;
    }
    console.log('WS founded :', rows[0])
    return rows[0];
}

// export async function setCurrentWorkspace(id: number) {
//     const database = await getDb();
//
//     await database.execute(
//         `
//         UPDATE workspaces
//         SET last_used = strftime('%s','now')
//         WHERE id = ?
//         `,
//         [id]
//     );
// }
export async function setCurrentWorkspace(id:number|null) {
    console.log('setCurrentWorkspace');
    console.log(id);
    const database = await getDb();

    if (id === null) {
        console.log('is null : reset last_used');
        await database.execute(`
      UPDATE workspaces
      SET last_used = 0
    `);
        return;
    }
    console.log('set last_used to ', id);
    await database.execute(
        `
    UPDATE workspaces
    SET last_used = strftime('%s','now')
    WHERE id = ?
    `,
        [id]
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
    content: string,
    icon: string,
    params: {type:string,description:string,placeHolder:string,name:string }[]=[],
    workspaceId = null
) {
    const database = await getDb();

    const template =  await database.execute(
        `
        INSERT INTO templates (name, description, content, icon, workspace_id)
        VALUES (?, ?, ?, ?, ?)
        `,
        [name, description, content, icon, workspaceId]
    );
    console.log('template', template);
    for (const param of params) {
        console.log('param', param);
        await addTemplateParam(template.lastInsertId, param.type, param.placeHolder, param.description, param.name)
    }
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
    type: string, // input type
    placeholder: string, // the variable
    description: string,  // description
    name: string  // name
) {
    const database = await getDb();

    await database.execute(
        `
        INSERT INTO template_params
        (template_id, type, placeholder, description, name)
        VALUES (?, ?, ?, ?, ?)
        `,
        [templateId, type, placeholder, description, name]
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