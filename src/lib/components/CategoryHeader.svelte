<script>
import {resolveIconUrl} from "$lib/iconResolver";

import {Button, Icon, InputGroup, Tooltip} from "@sveltestrap/sveltestrap";
export let currentIcon = 'bash';
export let userIconsSet = null;
export let onClick = (arg) => {};
let hover = false;
let t_h_out = null;
</script>

<InputGroup
        size="sm"
        class="mb-2 bg-transparent rounded"
        style="width:100%"
>
    {#if hover}    <span
            class="input-group-text"
    >{currentIcon}</span>
        {:else }
        {/if}


    <span
            class="input-group-text p-0 flex-grow-1 flex-column bg-dark alpha border-0 disable"
            id="icon-cat-{currentIcon}"
            on:mouseover={() => {
                clearTimeout(t_h_out);
                hover = true;
            }}
            on:mouseout={() => {
                t_h_out = setTimeout(()=>{
                    hover = false;
                    }, 1000);

            }}
    ><img
          src="{resolveIconUrl(currentIcon, userIconsSet)}"
          width="40"
          height="40"
          class="p-2"/>
    </span>
<!--    <Tooltip-->
<!--            animation-->
<!--            content="{currentIcon}"-->
<!--            delay={0}-->
<!--            id="tooltip-cat-{currentIcon}"-->
<!--            placement="auto"-->
<!--            target="icon-cat-{currentIcon}"-->
<!--            theme="dark"-->
<!--    />-->

    {#if hover}
        <Button color="dark"
                size="sm"
                on:click={() => onClick(currentIcon)}
        >
            <Icon name="pencil-fill"/>
        </Button>
    {:else }
    {/if}

</InputGroup>

<!--Usage-->
<!--
<CategoryHeader currentIcon={groupedIcon} userIconsSet={userIcons} onClick={showModifyCategoryModal}/>
-->