<script lang="ts">
    import IconSelect from "./IconSelect.svelte";
    import {Button, Input, Tooltip} from "@sveltestrap/sveltestrap";

    export let data = {
        name: "",
        description: "",
        command: "",
        icon: ""
    };

    export let allIcons: string[] = [];
    export let userIcons: Set<string>;

    export let onSubmit: () => void;
    export let submitLabel = "Ajouter";
</script>
<style>
    .command-form{
        display: contents;
    }

</style>
<div class="command-form">
    <Input id="name-input" name="name-input" placeholder="Nom" bind:value={data.name}
           class="mb-2"/>
    <Tooltip
            animation
            content="Un nom pour la commande"
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
            content="icon utilisé pour grouper les commandes entre elles"
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
            content="description détaillée de la commande & utilisation"
            delay={0}
            id="description-input-tooltip"
            placement="auto"
            target="description-input"
            theme="light"
    />
    <Input id="cmd-input"
           name="cmd-input"
           placeholder="Commande"
           bind:value={data.command}
           class="mb-2"/>
    <Tooltip
            animation
            content="la commande qui sera copié dans le clipboard"
            delay={0}
            id="cmd-input-tooltip"
            placement="auto"
            target="cmd-input"
            theme="light"
    />
    <Button block="true" on:click={onSubmit}  id="btn-input"
            class="mb-2"
            color="success"
    >{submitLabel}</Button>

    <Tooltip
            animation
            content="enregistrer la commande"
            delay={0}
            id="btn-input-tooltip"
            placement="auto"
            target="btn-input"
            theme="light"
    />
<!--    <input-->
<!--            class="form-control mb-2"-->
<!--            placeholder="Nom"-->
<!--            bind:value={data.name}-->
<!--    />-->

<!--    <IconSelect-->
<!--            bind:value={data.icon}-->
<!--            icons={allIcons}-->
<!--            {userIcons}-->
<!--    />-->

<!--    <input-->
<!--            class="form-control mb-2"-->
<!--            placeholder="Description"-->
<!--            bind:value={data.description}-->
<!--    />-->

<!--    <input-->
<!--            class="form-control mb-2"-->
<!--            placeholder="Commande"-->
<!--            bind:value={data.command}-->
<!--    />-->

<!--    <button class="btn btn-primary btn-sm" on:click={onSubmit}>-->
<!--        {submitLabel}-->
<!--    </button>-->

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
