<script lang="ts">
    import {Input, InputGroup} from "@sveltestrap/sveltestrap";

    export let value: string;
    export let icons: string[] = [];
    export let userIcons: Set<string>;
    export let label = "Icône";

    import { resolveIconUrl } from "$lib/iconResolver";
</script>

<InputGroup bsSize="sm" class="mb-2">
    <span
            class="input-group-text"
            id="icon-part"><img
            src="{resolveIconUrl(value, userIcons)}"
            width="20"
            height="20"/>
    </span>
    <Input
            id="icon-selector"
            type="select"
           bsSize="sm"
           bind:value
           aria-label="Username"
           aria-describedby="icon-part">
        <option value="">— {label} —</option>
        {#each icons as i}
            <option value={i}>{i}</option>
        {/each}
    </Input>
</InputGroup>

<!--Usage-->
<!--
<IconSelect
  bind:value={icon}
  icons={allIcons}
  {userIcons}
/>
-->