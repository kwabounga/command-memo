<script lang="ts">
    import {Styles} from '@sveltestrap/sveltestrap';
    import 'highlight.js/styles/github.css';
</script>

<Styles theme="dark"/>

<style>
    :root {
        --offset-main: 75px;
        --offset: 140px;
        --nb-col: 4;
    }
    :global(.bg-dark.alpha) {
        --bs-bg-opacity: 0.8;
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
    :global(.code-preview) {
        overflow-y: scroll;
        max-height: 25rem;
    }

    :global(.cmd-btn) {
        text-align: start!important;
    }
    :global(.template-form .cmd-workspace.btn-group>.btn),
    :global(.command-form .cmd-workspace.btn-group>.btn) {
        border-top-left-radius: 0;
        border-bottom-left-radius: 0;
    }

    :global(.add-tabs .nav.nav-tabs) {
        border: none;
        z-index: 55;
        position: relative;
    }

    :global(.workspace-card .card-header) {
        padding: var(--bs-card-cap-padding-y);
        font-weight: bolder;
        font-size: calc(var(--bs-body-font-size) * 1.5);
        font-family: var(--bs-body-font-family), sans-serif;
    }
    :global(.workspace-card .card-body) {
        display:flex;
        padding: 0;
    }
    :global(.data-card .card-body) {
        display:flex;
        padding: 0;
    }
    :global(.add-tabs .add-card) {
        border-top-left-radius: 0;
    }
    :global([data-bs-theme=dark] .add-tabs .nav-link) {
        color: white;
    }
    :global([data-bs-theme=light] .add-tabs .nav-link) {
        color: black;
    }
</style>
<slot />