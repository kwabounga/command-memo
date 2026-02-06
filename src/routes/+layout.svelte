<script lang="ts">
    import {Styles} from '@sveltestrap/sveltestrap';
</script>

<Styles theme="dark"/>

<style>
    :root {
        --offset-main: 75px;
        --offset: 140px;
        --nb-col: 4;
    }

    :global(.main-wrapper) {
        background: transparent;
        /* background: #00000061;*/
        max-height: calc(100vh - var(--offset-main)) !important;
        overflow: hidden;
    }

    :global(.command-grid) {
        display: flex;
        flex-direction: column;
        flex-wrap: wrap;

        height: calc(100vh - var(--offset)); /* hauteur connue */
        gap: 0.5rem;
        align-content: flex-start;

        overflow: auto;
    }

    :global(.command-group) {
        width: calc(100% / var(--nb-col) - 0.5rem); /* 4 colonnes */
    }

    :global(.commands-list) {
        overflow-y: auto;
        max-height: 25rem;
    }
</style>
<slot />