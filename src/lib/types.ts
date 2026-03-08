export type Workspace = {
    id?:number,
    name: string,
    last_used: number,
}
export type Command = {
    id?: number,
    name: string,
    description: string,
    command: string,
    icon: string,
    workspace_id: number|null
}
export type Template = {
    id?: number,
    name: string,
    description: string,
    content: string,
    params: TemplateParams[],
    icon:string,
    workspace_id: number|null,
    type:string
}
export type TemplateParams = {
    id?: number,
    template_id: number,
    name: string,
    type: string,
    placeholder: string,
    description: string
}

export type CmdItem =
    | (Command & { type: "command" })
    | (Template & { type: "template" })