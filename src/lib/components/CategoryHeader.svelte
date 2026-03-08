<script>
import {resolveIconUrl} from "$lib/iconResolver";

import {Button, Icon, InputGroup, Tooltip} from "@sveltestrap/sveltestrap";
export let currentIcon = 'bash';
export let currentWorkspaceId = null;
export let userIconsSet = null;
export let onClick = (currentIcon, currentWorkspaceId) => {};
let hover = false;
let t_h_out = null;
</script>

<InputGroup
        size="sm"
        class="mb-1 bg-transparent rounded"
        style="width:100%"
>
    {#if hover}    <span
            class="input-group-text"
    >{currentIcon}</span>
    {/if}


    <span class="input-group-text p-0 flex-grow-1 flex-column bg-dark alpha border-0 disable"
          tabindex="0"
          id="icon-cat-{currentIcon}"
          on:mouseout={() => {
                t_h_out = setTimeout(()=>{
                    hover = false;
                    }, 1000);

            }}
          on:blur={()=>{}}
          on:focus={()=>{}}
          on:mouseover={() => {
                clearTimeout(t_h_out);
                hover = true;
            }}
          role="button"
    ><img
          src="{resolveIconUrl(currentIcon, userIconsSet)}"
          width="40"
          height="40"
          class="p-2"
          alt="{currentIcon}"
    />
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
                on:click={() => onClick(currentIcon,currentWorkspaceId)}
        >
            <Icon name="pencil-fill"/>
        </Button>
    {/if}

</InputGroup>

<!--Usage-->
<!--
<CategoryHeader currentIcon={groupedIcon} userIconsSet={userIcons} onClick={showModifyCategoryModal}/>
-->