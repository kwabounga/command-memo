<script lang="ts">
    import {Styles} from '@sveltestrap/sveltestrap';

    // import 'highlight.js/styles/atom-one-dark.css';
    // import 'highlight.js/styles/atom-one-light.css';
    // import 'highlight.js/styles/dark.css';
    // import 'highlight.js/styles/cybertopia-saturated.css';
    // import 'highlight.js/styles/github.css';
    // import 'highlight.js/styles/github-dark.css';

    import '$lib/styles/highlight.css';
    import '$lib/styles/global.css';

</script>

<Styles theme="dark"/>

<slot />