<script lang="ts">
    import { onMount } from "svelte";
    import {
        ButtonDropdown,
        DropdownToggle,
        DropdownMenu,
        DropdownItem, Input, Button
    } from "@sveltestrap/sveltestrap";

    import { getWorkspaces, addWorkspace } from "../db";

    export let selectedWorkspace = null;
    export let canCreate = false;
    export let onChange: ((ws:any)=>void) | undefined;

    let dropdownOpen = false;
    let workspaces = [];
    let newWorkspace = "";
    let showAdd = false;

    import { GLOBAL_WORKSPACE } from "../stores/workspace";

    function toggle() {
        dropdownOpen = !dropdownOpen;
    }

    onMount(async () => {
        //const dbWorkspaces = await getWorkspaces();

        workspaces = await getWorkspacesAndAddGlobal()
    });
    async function getWorkspacesAndAddGlobal() {
        const dbWorkspaces = await getWorkspaces();

        return [
            GLOBAL_WORKSPACE,
            ...dbWorkspaces
        ];
    }

    async function createWorkspace() {
        if (!newWorkspace.trim()) return;

        const ws = await addWorkspace(newWorkspace);

        selectWorkspace(ws);

        workspaces = await getWorkspacesAndAddGlobal();
        newWorkspace = "";
        showAdd = false;
    }

    function selectWorkspace(ws) {

        selectedWorkspace = ws;

        if (onChange) {
            onChange(ws);
        }

        dropdownOpen = false;
    }
</script>


<ButtonDropdown class="flex-grow-1 cmd-workspace"  isOpen={dropdownOpen} toggle={toggle}>

    <DropdownToggle caret color="warning" size="sm">
        {selectedWorkspace?.name ?? "Workspace"}
    </DropdownToggle>

    <DropdownMenu>

        {#each workspaces as ws}

            <DropdownItem
                    active={selectedWorkspace?.id === ws.id}
                    onclick={() => selectWorkspace(ws)}
            >
                {#if selectedWorkspace?.id === ws.id}
                    ✓
                {/if}

                {ws.name}
            </DropdownItem>

        {/each}
        {#if canCreate}
            <DropdownItem divider />

            <DropdownItem on:click={(e) => {e.preventDefault(); showAdd = !showAdd}}>
                ➕ Add workspace
            </DropdownItem>

            {#if showAdd}

                <div style="padding:10px; width:220px">

                    <Input
                            placeholder="Workspace name"
                            bind:value={newWorkspace}
                    />

                    <Button
                            size="sm"
                            color="primary"
                            style="margin-top:6px"
                            on:click={createWorkspace}
                    >
                        Create
                    </Button>

                </div>

            {/if}
        {/if}
    </DropdownMenu>

</ButtonDropdown>