<script lang="ts">
    import {
        ButtonDropdown,
        DropdownToggle,
        DropdownMenu,
        DropdownItem,
        Input,
        Button, InputGroup
    } from "@sveltestrap/sveltestrap";

    export let params = [];
    export let onChange = undefined;
    export let id = 'tpl-parameters';

    let dropdownOpen = false;
    let editingIndex = null;

    let newParam = {
        type: "",
        name: "",
        description: "",
        placeholder: ""
    }

    function toggle() {
        dropdownOpen = !dropdownOpen;
    }

    function notify() {
        if (onChange) onChange(params);
    }

    function addParam() {

        if (!newParam.description.trim()) return;

        params = [...params, { ...newParam }];

        newParam = {
            type: "",
            name: "",
            description: "",
            placeholder: ""
        };

        notify();
    }

    function editParam(index) {

        editingIndex = index;

        newParam = { ...params[index] };
    }

    function saveEdit() {

        params[editingIndex] = { ...newParam };

        params = [...params];

        editingIndex = null;

        newParam = {
            type: "",
            name: "",
            description: "",
            placeholder: ""
        };

        notify();
    }

    function deleteParam(index) {

        params.splice(index, 1);

        params = [...params];

        notify();
    }
</script>

<ButtonDropdown id="{id}" isOpen={dropdownOpen} toggle={toggle} class="mb-2">

    <DropdownToggle caret size="sm" color="info">
        Params ({params.length})
    </DropdownToggle>

    <DropdownMenu style="padding:10px; min-width:280px">

        {#each params as p, i}

            <div class="d-flex justify-content-between align-items-center mb-1">

        <span title={p.description}>
          {p.name}
        </span>

                <div>

                    <Button size="sm" color="link" onclick={() => editParam(i)}>
                        ✏
                    </Button>

                    <Button size="sm" color="link" onclick={() => deleteParam(i)}>
                        �
                    </Button>

                </div>

            </div>

        {/each}

        <DropdownItem divider />
        <div class="mt-2">

            <Input
                    placeholder="Nom"
                    bind:value={newParam.name}
                    class="mb-1"
            />
            <Input
                    placeholder="Description"
                    bind:value={newParam.description}
                    class="mb-1"
            />

            <Input
                    placeholder="type de champs"
                    bind:value={newParam.type}
                    class="mb-1"
            />

            <Input
                    placeholder="clé / placeHolder"
                    bind:value={newParam.placeholder}
                    class="mb-2"
            />

            {#if editingIndex !== null}

                <Button size="sm" color="primary" onclick={saveEdit}>
                    Save
                </Button>

            {:else}

                <Button size="sm" color="success" onclick={addParam}>
                    Add
                </Button>

            {/if}

        </div>

    </DropdownMenu>

</ButtonDropdown>