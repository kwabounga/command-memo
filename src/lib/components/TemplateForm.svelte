<script lang="ts">
    import IconSelect from "./IconSelect.svelte";
    import {Button, Input, InputGroup, Tooltip} from "@sveltestrap/sveltestrap";
    import TemplateParamsManager from "./TemplateParamsManager.svelte";
    import {onMount} from "svelte";
    import {getWorkspaces} from "$lib/db";
    import {GLOBAL_WORKSPACE} from "$lib/stores/workspace";
    import WorkspaceDropdown from "$lib/components/WorkspaceDropdown.svelte";
    import type { Template } from "$lib/types";
    let params = [];
    export let data:Template = {
        name: "",
        description: "",
        content: "",
        icon: "",
        workspace_id: null,
        params: [],
        type: "",
    };

    export let allIcons: string[] = [];
    export let userIcons: Set<string>;

    export let onSubmit: () => void;
    export let submitLabel = "Ajouter";

    let workspace = null;
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
    const languages = ['sql', 'html', 'shell', 'bash', 'php'];
</script>

<style>
    .template-form{
        display: contents;
    }
</style>

<div class="template-form">
    <Input id="tpl-name-input{ data?.id ? `-${data.id}` : '' }" name="name-input{ data?.id ? `-${data.id}` : '' }" placeholder="Nom" bind:value={data.name}
           class="mb-2"/>
    <Tooltip
            animation
            content="Un nom pour le Template"
            delay={0}
            id="tpl-name-input-tooltip{ data?.id ? `-${data.id}` : '' }"
            placement="auto"
            target="tpl-name-input{ data?.id ? `-${data.id}` : '' }"
            theme="light"
    />
    <IconSelect
            bind:value={data.icon}
            icons={allIcons}
            {userIcons}
    />
    <InputGroup>
        <span class="input-group-text"
        >Environnement</span>
        <WorkspaceDropdown
                selectedWorkspace={workspace}
                onChange={workspaceChanged}
        />
    </InputGroup>
    <Tooltip
            animation
            content="icon utilisé pour grouper les Templates entre eux"
            delay={0}
            id="tpl-icon-selector-tooltip{ data?.id ? `-${data.id}` : '' }"
            placement="auto"
            target="tpl-icon-selector{ data?.id ? `-${data.id}` : '' }"
            theme="light"
    />
    <Tooltip
            animation
            content="Icon choisi"
            delay={0}
            id="tpl-icon-part-tooltip{ data?.id ? `-${data.id}` : '' }"
            placement="right"
            target="tpl-icon-part{ data?.id ? `-${data.id}` : '' }"
            theme="light"
    />
    <Input id="tpl-description-input{ data?.id ? `-${data.id}` : '' }"
           name="description-input{ data?.id ? `-${data.id}` : '' }"
           placeholder="Description"
           bind:value={data.description}
           class="mb-2"
            type="textarea"
    />
    <Tooltip
            animation
            content="description détaillée du Template & utilisation"
            delay={0}
            id="tpl-description-input-tooltip{ data?.id ? `-${data.id}` : '' }"
            placement="auto"
            target="tpl-description-input{ data?.id ? `-${data.id}` : '' }"
            theme="light"
    />
    <Input id="tpl-cmd-input{ data?.id ? `-${data.id}` : '' }"
           name="cmd-input{ data?.id ? `-${data.id}` : '' }"
           placeholder="Template"
           bind:value={data.content}
           class="mb-2"
           type="textarea"/>
    <Tooltip
            animation
            content="le Template qui sera alimenté et copié dans le clipboard"
            delay={0}
            id="tpl-cmd-input-tooltip{ data?.id ? `-${data.id}` : '' }"
            placement="auto"
            target="tpl-cmd-input{ data?.id ? `-${data.id}` : '' }"
            theme="light"
    />
    <TemplateParamsManager
            bind:params={data.params}
    />

    <InputGroup>
        <span class="input-group-text"
        >Language</span>
        <select class="input-group-select flex-grow-1 bg-light text-dark" bind:value={data.type}>
            {#each languages as l }
                <option value={l}>{l}</option>
            {/each}
        </select>
        <span class="input-group-text"></span>
    </InputGroup>
    <Button block="true" on:click={onSubmit}  id="tpl-btn-input{ data?.id ? `-${data.id}` : '' }"
            class="mb-2"
            color="success"
    >{submitLabel}</Button>

    <Tooltip
            animation
            content="enregistrer le Template"
            delay={0}
            id="tpl-btn-input-tooltip{ data?.id ? `-${data.id}` : '' }"
            placement="auto"
            target="tpl-btn-input{ data?.id ? `-${data.id}` : '' }"
            theme="light"
    />
</div>

<!--Usage-->
<!--
<TemplateForm
  bind:data={editTemplate}
  {allIcons}
  {userIcons}
  submitLabel="Modifier"
  onSubmit={updateTemplate}
/>

-->
