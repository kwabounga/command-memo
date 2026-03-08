import { GLOBAL_WORKSPACE } from "$lib/stores/workspace";
import type {Command, Template, TemplateParams, CmdItem, Workspace} from "$lib/types";
let db: any = null;


async function getDb() {
    if (db) return db;

    if (!(window as any).__TAURI_INTERNALS__) {
        throw new Error("Tauri runtime not available");
    }

    const Database = (await import("@tauri-apps/plugin-sql")).default;
    db = await Database.load("sqlite:commands.db");

    await db.execute("PRAGMA journal_mode=WAL");
    await db.execute("PRAGMA synchronous=NORMAL");

    return db;
}

/////////////////////////////
// COMMANDS
/////////////////////////////

export async function getCommands(search = "", workspaceId:number|null = null) {

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
    workspaceId:number|null|undefined = null
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

export async function updateCommand(cmd: Command) {

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

export async function updateCategorie(oldIcon: string, newIcon: string, workspaceId: number|null) {

    const database = await getDb();
    await database.execute(
        `
        UPDATE commands
        SET icon = ?, workspace_id = ?
        WHERE icon = ?
        `,
        [newIcon, workspaceId, oldIcon]
    );
    await database.execute(
        `
        UPDATE templates
        SET icon = ?, workspace_id = ?
        WHERE icon = ?
        `,
        [newIcon, workspaceId, oldIcon]
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

export async function setCurrentWorkspace(id:number|null) {

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

export async function getTemplates(search = "", workspaceId:number|null = null) {

    const database = await getDb();
    const rows = await database.select(
        `
        SELECT
            t.*,
            p.id as param_id,
            p.type as param_type,
            p.placeholder,
            p.description as param_description,
            p.name as param_name
        FROM templates t
        LEFT JOIN template_params p
        ON p.template_id = t.id
        WHERE (t.workspace_id = ? OR t.workspace_id IS NULL)
        AND (t.name LIKE ? OR t.description LIKE ? OR t.icon LIKE ?)
        ORDER BY t.name, p.id
        `,
        [workspaceId, `%${search}%`, `%${search}%`, `%${search}%`]
    );

    const templatesMap = new Map();

    for (const row of rows) {

        if (!templatesMap.has(row.id)) {

            templatesMap.set(row.id, {
                id: row.id,
                name: row.name,
                description: row.description,
                content: row.content,
                icon: row.icon,
                workspace_id: row.workspace_id,
                type: row.type,
                params: []
            });

        }

        if (row.param_id) {

            templatesMap.get(row.id).params.push({
                id: row.param_id,
                type: row.param_type,
                placeholder: row.placeholder,
                description: row.param_description,
                name: row.param_name
            });

        }

    }

    return [...templatesMap.values()];
}
export async function addTemplate(
    name:string,
    description:string,
    content:string,
    icon:string,
    params:TemplateParams[] = [],
    workspaceId:number|null = null,
    type:string = "sql"
) {

    const database = await getDb();
    const result = await database.execute(
        `
        INSERT INTO templates (name, description, content, icon, workspace_id, type)
        VALUES (?, ?, ?, ?, ?, ?)
        `,
        [name, description, content, icon, workspaceId, type]
    );

    const templateId = result.lastInsertId;

    for (const param of params) {

        await database.execute(
            `
            INSERT INTO template_params
            (template_id, type, placeholder, description, name)
            VALUES (?, ?, ?, ?, ?)
            `,
            [
                templateId,
                param.type,
                param.placeholder,
                param.description,
                param.name
            ]
        );

    }

    return templateId;
}
export async function updateTemplate(template:Template) {

    const database = await getDb();
    await database.execute(
        `
        UPDATE templates
        SET name = ?, description = ?, content = ?, icon = ?, workspace_id = ?, type = ?
        WHERE id = ?
        `,
        [
            template.name,
            template.description,
            template.content,
            template.icon,
            template.workspace_id,
            template.type,
            template.id
        ]
    );

    const existingParams = await database.select(
        `SELECT id FROM template_params WHERE template_id = ?`,
        [template.id]
    );

    const existingIds = existingParams.map((p:TemplateParams) => p.id);

    const incomingIds = template.params
        .filter((p:TemplateParams) => p.id)
        .map((p:TemplateParams) => p.id);

    // DELETE removed params
    for (const id of existingIds) {

        if (!incomingIds.includes(id)) {

            await database.execute(
                `DELETE FROM template_params WHERE id = ?`,
                [id]
            );

        }

    }

    // UPSERT params
    for (const param of template.params) {

        if (param.id) {

            await database.execute(
                `
                UPDATE template_params
                SET type=?, placeholder=?, description=?, name=?
                WHERE id=?
                `,
                [
                    param.type,
                    param.placeholder,
                    param.description,
                    param.name,
                    param.id
                ]
            );

        } else {

            await database.execute(
                `
                INSERT INTO template_params
                (template_id, type, placeholder, description, name)
                VALUES (?, ?, ?, ?, ?)
                `,
                [
                    template.id,
                    param.type,
                    param.placeholder,
                    param.description,
                    param.name
                ]
            );

        }

    }

}
export async function deleteTemplate(id: number) {
    const database = await getDb();
    await database.execute(
        `
            DELETE FROM template_params
            WHERE template_id = ?
        `,
        [id]
    );
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

export async function exportAllData() {

    const database = await getDb();
    const commands = await database.select(`
        SELECT * FROM commands
    `);

    const templates = await database.select(`
        SELECT * FROM templates
    `);

    const templateParams = await database.select(`
        SELECT * FROM template_params
    `);

    const workspaces = await database.select(`
        SELECT * FROM workspaces
    `);

    return {
        version: 1,
        exported_at: new Date().toISOString(),
        data: {
            commands,
            templates,
            template_params: templateParams,
            workspaces
        }
    };
}

export async function resetDatabase() {

    const database = await getDb();

    await database.execute(`DELETE FROM template_params`);
    await database.execute(`DELETE FROM templates`);
    await database.execute(`DELETE FROM commands`);
    await database.execute(`DELETE FROM workspaces`);

}

export async function closeDb() {
    if (db) {
        await db.close();
        db = null;
    }
}
export async function importAllData(jsonData: any) {

    const database = await getDb();

    if (!jsonData?.data) {
        throw new Error("Invalid import file");
    }

    const { commands, templates, template_params, workspaces } = jsonData.data;

    console.log("Import started");

    try {

        await database.execute("BEGIN");

        /////////////////////////////
        // CLEAN
        /////////////////////////////

        await database.execute("DELETE FROM template_params");
        await database.execute("DELETE FROM templates");
        await database.execute("DELETE FROM commands");
        await database.execute("DELETE FROM workspaces");

        /////////////////////////////
        // WORKSPACES
        /////////////////////////////

        for (const ws of workspaces) {

            await database.execute(
                `INSERT INTO workspaces (id,name,last_used)
                 VALUES (?,?,?)`,
                [ws.id, ws.name, ws.last_used ?? 0]
            );

        }

        /////////////////////////////
        // COMMANDS
        /////////////////////////////

        for (const cmd of commands) {

            await database.execute(
                `INSERT INTO commands
                (id,name,description,command,icon,workspace_id)
                VALUES (?,?,?,?,?,?)`,
                [
                    cmd.id,
                    cmd.name,
                    cmd.description,
                    cmd.command,
                    cmd.icon,
                    cmd.workspace_id
                ]
            );

        }

        /////////////////////////////
        // TEMPLATES
        /////////////////////////////

        for (const tpl of templates) {

            await database.execute(
                `INSERT INTO templates
                (id,name,description,content,icon,workspace_id,type)
                VALUES (?,?,?,?,?,?,?)`,
                [
                    tpl.id,
                    tpl.name,
                    tpl.description,
                    tpl.content,
                    tpl.icon,
                    tpl.workspace_id,
                    tpl.type ?? "sql"
                ]
            );

        }

        /////////////////////////////
        // TEMPLATE PARAMS
        /////////////////////////////

        for (const param of template_params) {

            await database.execute(
                `INSERT INTO template_params
                (id,template_id,name,type,placeholder,description)
                VALUES (?,?,?,?,?,?)`,
                [
                    param.id,
                    param.template_id,
                    param.name,
                    param.type,
                    param.placeholder,
                    param.description
                ]
            );

        }

        await database.execute("COMMIT");

        console.log("Import success");

    } catch (err) {

        console.error("Import failed:", err);

        await database.execute("ROLLBACK");

        throw err;

    }

}