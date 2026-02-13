<script>
import {resolveIconUrl} from "$lib/iconResolver.ts";

import {Button, Icon, InputGroup} from "@sveltestrap/sveltestrap";
export let currentIcon = 'bash';
export let userIconsSet = null;
export let onClick = () => {};

</script>   

<InputGroup
        bsSize="sm"
        class="mb-2 bg-light rounded"
        color="success"
        style="width:100%"
>
    <span
            class="input-group-text p-0"
    ><img
          src="{resolveIconUrl(currentIcon, userIconsSet)}"
          width="40"
          height="40"
          class="p-2"/>
    </span>

    <span
          class="input-group-text flex-grow-1"
    >{currentIcon}</span>

    <Button color="dark"
            bsSize="sm"
            on:click={() => onClick(currentIcon)}
    >
        <Icon name="pencil-fill"/>
    </Button>
</InputGroup>

<!--Usage-->
<!--
<CategoryHeader currentIcon={groupedIcon} userIconsSet={userIcons} onClick={showModifyCategoryModal}/>
-->