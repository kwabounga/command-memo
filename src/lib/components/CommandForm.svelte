<script lang="ts">
    import IconSelect from "./IconSelect.svelte";
    import {Button, Input, InputGroup, Tooltip} from "@sveltestrap/sveltestrap";

    import { onMount } from "svelte";

    import WorkspaceDropdown from "./WorkspaceDropdown.svelte";
    import { getWorkspaces } from "../db";
    import {  GLOBAL_WORKSPACE } from "../stores/workspace";
    import type {CmdItem, Command, Workspace} from "$lib/types";

    export let data:Command = {
        name: "",
        description: "",
        command: "",
        icon: "",
        workspace_id: null
    };

    export let allIcons: string[] = [];
    export let userIcons: Set<string>;

    export let onSubmit: () => void;
    export let submitLabel = "Ajouter";

    let workspace:Workspace|null = null;
    let workspaces = [];


    onMount(async () => {

        const dbWorkspaces = await getWorkspaces();

        workspaces = [GLOBAL_WORKSPACE, ...dbWorkspaces];

        workspace = workspaces.find(
            w => w.id === data.workspace_id
        ) ?? GLOBAL_WORKSPACE;
    });
    function workspaceChanged(ws) {

        workspace = ws;

        data.workspace_id = ws?.id ?? null;
    }
</script>
<style>
    .command-form{
        display: contents;
    }

</style>
<div class="command-form">
    <Input id="cmd-name-input{ data?.id ? `-${data.id}` : '' }" name="name-input{ data?.id ? `-${data.id}` : '' }" placeholder="Nom" bind:value={data.name}
           class="mb-2"/>
    <Tooltip
            animation
            content="Un nom pour la commande"
            delay={0}
            id="cmd-name-input-tooltip{ data?.id ? `-${data.id}` : '' }"
            placement="auto"
            target="cmd-name-input{ data?.id ? `-${data.id}` : '' }"
            theme="light"
    />
    <IconSelect
            bind:value={data.icon}
            icons={allIcons}
            {userIcons}
    />
    <InputGroup  class="mb-2">
        <span class="input-group-text"
        >Environnement</span>
        <WorkspaceDropdown
                selectedWorkspace={workspace}
                onChange={workspaceChanged}
        />
    </InputGroup>
    <Tooltip
            animation
            content="icon utilisé pour grouper les commandes entre elles"
            delay={0}
            id="cmd-icon-selector-tooltip{ data?.id ? `-${data.id}` : '' }"
            placement="auto"
            target="cmd-icon-selector"
            theme="light"
    />
    <Tooltip
            animation
            content="Icon choisi"
            delay={0}
            id="cmd-icon-part-tooltip{ data?.id ? `-${data.id}` : '' }"
            placement="right"
            target="cmd-icon-part{ data?.id ? `-${data.id}` : '' }"
            theme="light"
    />
    <Input id="cmd-description-input{ data?.id ? `-${data.id}` : '' }"
           name="description-input{ data?.id ? `-${data.id}` : '' }"
           placeholder="Description"
           bind:value={data.description}
           class="mb-2"
            type="textarea"
    />
    <Tooltip
            animation
            content="description détaillée de la commande & utilisation"
            delay={0}
            id="cmd-description-input-tooltip{ data?.id ? `-${data.id}` : '' }"
            placement="auto"
            target="cmd-description-input{ data?.id ? `-${data.id}` : '' }"
            theme="light"
    />
    <Input id="cmd-cmd-input{ data?.id ? `-${data.id}` : '' }"
           name="cmd-input{ data?.id ? `-${data.id}` : '' }"
           placeholder="Commande"
           bind:value={data.command}
           class="mb-2"
           type="textarea"/>
    <Tooltip
            animation
            content="la commande qui sera copié dans le clipboard"
            delay={0}
            id="cmd-cmd-input-tooltip{ data?.id ? `-${data.id}` : '' }"
            placement="auto"
            target="cmd-cmd-input{ data?.id ? `-${data.id}` : '' }"
            theme="light"
    />
    <Button block="true" on:click={onSubmit}  id="cmd-btn-input{ data?.id ? `-${data.id}` : '' }"
            class="mb-2"
            color="success"
    >{submitLabel}</Button>

    <Tooltip
            animation
            content="enregistrer la commande"
            delay={0}
            id="cmd-btn-input-tooltip{ data?.id ? `-${data.id}` : '' }"
            placement="auto"
            target="cmd-btn-input{ data?.id ? `-${data.id}` : '' }"
            theme="light"
    />
</div>

<!--Usage-->
<!--
<CommandForm
  bind:data={editCommand}
  {allIcons}
  {userIcons}
  submitLabel="Modifier"
  onSubmit={updateCommand}
/>

-->
