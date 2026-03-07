<script lang="ts">
    import IconSelect from "./IconSelect.svelte";
    import {Button, Input, Tooltip} from "@sveltestrap/sveltestrap";
    import TemplateParamsManager from "./TemplateParamsManager.svelte";

    let params = [];
    export let data = {
        name: "",
        description: "",
        content: "",
        icon: "",
        workspace_id: null,
        params: [],
    };

    export let allIcons: string[] = [];
    export let userIcons: Set<string>;

    export let onSubmit: () => void;
    export let submitLabel = "Ajouter";
</script>
<style>
    .template-form{
        display: contents;
    }

</style>
<div class="template-form">
    <Input id="name-input" name="name-input" placeholder="Nom" bind:value={data.name}
           class="mb-2"/>
    <Tooltip
            animation
            content="Un nom pour la Template"
            delay={0}
            id="name-input-tooltip"
            placement="auto"
            target="name-input"
            theme="light"
    />
    <IconSelect
            bind:value={data.icon}
            icons={allIcons}
            {userIcons}
    />
    <Tooltip
            animation
            content="icon utilisé pour grouper les Templates entre elles"
            delay={0}
            id="icon-selector-tooltip"
            placement="auto"
            target="icon-selector"
            theme="light"
    />
    <Tooltip
            animation
            content="Icon choisi"
            delay={0}
            id="icon-part-tooltip"
            placement="right"
            target="icon-part"
            theme="light"
    />
    <Input id="description-input"
           name="description-input"
           placeholder="Description"
           bind:value={data.description}
           class="mb-2"
            type="textarea"
    />
    <Tooltip
            animation
            content="description détaillée du Template & utilisation"
            delay={0}
            id="description-input-tooltip"
            placement="auto"
            target="description-input"
            theme="light"
    />
    <Input id="cmd-input"
           name="cmd-input"
           placeholder="Template"
           bind:value={data.content}
           class="mb-2"
           type="textarea"/>
    <Tooltip
            animation
            content="le Template qui sera alimenté et copié dans le clipboard"
            delay={0}
            id="cmd-input-tooltip"
            placement="auto"
            target="cmd-input"
            theme="light"
    />
    <TemplateParamsManager
            bind:params={data.params}
    />
    <Button block="true" on:click={onSubmit}  id="btn-input"
            class="mb-2"
            color="success"
    >{submitLabel}</Button>

    <Tooltip
            animation
            content="enregistrer le Template"
            delay={0}
            id="btn-input-tooltip"
            placement="auto"
            target="btn-input"
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
