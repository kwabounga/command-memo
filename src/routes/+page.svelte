<script lang="ts">
    import IconSelect from "$lib/components/IconSelect.svelte";

    console.log("PAGE SCRIPT LOADED");
    import {onMount} from "svelte";
    import {addCommand, deleteCommand, getCommands, updateCommand, updateCategorie} from "$lib/db";
    import {writeText} from "@tauri-apps/plugin-clipboard-manager";
    import {getCurrentWindow} from "@tauri-apps/api/window";
    import { enable, disable, isEnabled,  } from "@tauri-apps/plugin-autostart";
    import {
        Button,
        ButtonGroup,
        Card,
        Container,
        Input,
        InputGroup,
        ListGroup,
        ListGroupItem,
        Modal,
        ModalBody,
        ModalFooter,
        ModalHeader,
        Row,
        Tooltip,
        Icon
    } from '@sveltestrap/sveltestrap';

    import {icons} from "$lib/icons";
    import {resolveIconUrl} from "$lib/iconResolver";
    import {invoke} from "@tauri-apps/api/core";

    let appWindow;
    let searchInput: HTMLInputElement | null = null;
    // let nameInput: HTMLInputElement | null = null;

    let search = "";
    // let name = "";
    // let description = "";
    // let command = "";
    let commands: any[] = [];
    let grouped: any[] = [];
    let showAdd = false;

    // help modal
    let showHelpModal = false;

    // delete modale
    let showDeleteModal = false;
    let commandToDelete: { id: number; name: string } | null = null;

    // modify modal
    let showModifyModal = false;
    let commandToModify: { id: number; name: string; command: string; description: string; icon: string } | null = null;

    let autoStartEnabled: boolean = false;
    let userIcons: Set<string> = new Set();
    let allIcons = [...icons, ...userIcons];


    let icon: string = 'bash';

    let formData = {
        name: "",
        description: "",
        command: "",
        icon
    };

    import { initIconDir } from "$lib/iconResolver";
    import CommandForm from "$lib/components/CommandForm.svelte";
    import BaseModal from "$lib/components/BaseModal.svelte";
    import CategoryHeader from "$lib/components/CategoryHeader.svelte";
    /* helper explanation */
    const helpCommands: any = [
        {
            description: "Affiche / masque l'aide",
            keys: ["h", "space", "tab"]
        },
        {
            description: "Affiche / masque l'ajout de commandes",
            keys: ["+", "="]
        },
        {
            description: "Masque la fenêtre de l'application",
            keys: ["echap"]
        },
        {
            description: "scrolling horizontal ( beaucoup de commandes)",
            keys: ["Alt + mouse-scroll"]
        },
    ]

    /**
     * focus input element
     * @param _input
     */
    function focusInput(_input: HTMLInputElement | null) {
        if (!_input) return;

        requestAnimationFrame(() => {
            _input.focus();
            _input.select();
            console.log("🔎 focus", _input.name || _input.id);
        });
    }

    /**
     * reload data from database
     */
    async function refresh() {
        commands = await getCommands(search);

        grouped = commands.reduce((acc, cmd) => {
            const key = cmd.icon || "default";
            acc[key] ||= [];
            acc[key].push(cmd);
            return acc;
        }, {});

        if( commands.length === 0 ) {
            showHelpModal = true;
        }
    }

    /**
     * add command to database
     */
    async function add() {
        if (!formData.name || !formData.command) return;
        await addCommand(formData.name, formData.description, formData.command, formData.icon);
        // name = description = command = "";
        toggleAdd();
        await refresh();
    }

    /**
     * copy command to clipboard
     * @param cmd
     */
    async function copy(cmd: string) {
        await writeText(cmd);
        await appWindow?.hide();
    }

    /**
     * verify if no modifier are pressed
     * @param e
     */
    function noModifiersUsed(e: KeyboardEvent) {
        return !e.ctrlKey && !e.shiftKey && !e.altKey;
    }

    /**
     * global handler to catch keyboard events
     * @param e
     */
    function handleKeydown(e: KeyboardEvent) {

        // Escape → close
        if (e.key === "Escape") {
            e.preventDefault();
            appWindow?.hide();
        }

        // pour éviter de toogle si l'on tape + dans l'input
        const target = e.target as HTMLElement;
        if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA") {
            return;
        }
        // + → toggle add panel
        if (e.key === "+" || e.key === "=") {
            // (= correspond souvent à + sans shift)
            e.preventDefault();
            toggleAdd();
        }
        // h / space / tab → toggle help
        if (noModifiersUsed(e) && (e.code === "KeyH" || e.code === "Space" || e.code === "Tab")) {
            e.preventDefault();
            toggleHelp();
        }
    }

    /**
     * show / hide help modal
     */
    function toggleHelp() {
        showHelpModal = !showHelpModal;
    }

    /**
     * close help modal
     */
    function closeHelpModal() {
        showHelpModal = false;
    }

    /**
     * show / hide add Command Block
     */
    function toggleAdd() {
        showAdd = !showAdd;
        if (showAdd) {
            formData = {
                name: "",
                description: "",
                command: "",
                icon
            };

            // focusInput(nameInput);
        }
    }

    /**
     * open delete modale
     * @param command
     */
    function openDeleteModal(command: { id: number; name: string }) {
        commandToDelete = command;
        showDeleteModal = true;
    }
    /**
     * open delete modale
     * @param command
     */
    function openModifyModal(command: { id: number; name: string; command: string; description: string; icon: string }) {
        commandToModify = command;
        showModifyModal = true;
    }

    /**
     * close delete modale
     */
    function closeDeleteModal() {
        showDeleteModal = false;
        commandToDelete = null;
    }

    /**
     * close delete modale
     */
    function closeModifyModal () {
        showModifyModal = false;
        commandToModify = null;
    }

    /**
     * confirm delete action and close Modal
     */
    async function updateCommandHandler() {
        if (!commandToModify) return;

        await updateCommand(commandToModify);
        await refresh();

        closeModifyModal();
    }
    /**
     * toogle autostart
     */
    async function toggleAutoStart(enabled: boolean) {
        if(enabled) {
            await enable();
        }else{
            await disable();
        }
    }
    /**
     * confirm delete action and close Modal
     */
    async function confirmDelete() {
        if (!commandToDelete) return;

        await deleteCommand(commandToDelete.id);
        await refresh();

        closeDeleteModal();
    }
    let categoryToModifyOld:string = "";
    let categoryToModifyNew:string = "";
    let modifyCategoryModalOpen:boolean = false;
    function closeModifyCategoryModal(){
        categoryToModifyOld = "";
        categoryToModifyNew = ""
        modifyCategoryModalOpen = false;
    }

    function showModifyCategoryModal(cat:string){
        categoryToModifyOld = cat;
        modifyCategoryModalOpen = true;
    }
    async function confirmModifyCategoryModal(){
        await updateCategorie(categoryToModifyOld, categoryToModifyNew);
        await refresh();
        closeModifyCategoryModal()
    }
    /*    seed ( dev only )
    async function seedDatabase() {
        const icons = [
            'nim',
            'nix',
            'nodejs',
            'nodejs_1',
            'nodejs_alt',
            'nodemon',
            'npm',
            'npm_alt',
            'nrwl',
            'nuget',
            'nunjucks',
            'nuxt',
            'ocaml',
            'opa',
            'opam',
            'pascal',
            'pawn',
            'pdf',
            'percy',
            'perl',
            'php',
            'php_elephant',
            'pipeline',
            'postcss',
            'posthtml',
            'powerpoint',
            'powershell',
            'prettier',
            'prisma',
            'processing',
            'processing_light',
            'prolog',
            'protractor',
            'pug',
            'puppet',
            'purescript',
            'python',
            'qsharp',
            'quasar',
            'r',
            'racket',
            'raml',
            'razor',
            'react',
            'react_ts',
            'readme',
            'reason',
            'red',
            'replit',
            'rescript',
            'restql',
            'riot',
        ];

        console.log("🌱 Seeding database…");

        for (const icon of icons) {
            const count = Math.floor(Math.random() * 50) + 1;

            for (let i = 1; i <= count; i++) {
                await addCommand(
                    `${icon} command ${i}`,
                    `Description ${i} pour ${icon}`,
                    `${icon} --do-something-${i}`,
                    icon // 👈 colonne icon
                );
            }
        }

        await refresh();
        console.log("✅ Seed terminé");
    }
*/

    /*  delete all ( dev only )
    async function deleteAll() {
        if (!confirm("⚠️ Supprimer TOUTES les commandes ?")) return;

        console.log("🧨 Deleting all commands…");

        const all = await getCommands("");
        for (const c of all) {
            await deleteCommand(c.id);
        }

        await refresh();
        console.log("✅ Database cleared");
    }
*/

    /**
     * entry point
     */
    onMount(async () => {
        console.log("🟢 Svelte mounted");
        appWindow = getCurrentWindow();
        const list_icons = await invoke<string[]>("list_user_icons");
        userIcons = new Set(list_icons);

        allIcons = [ ...userIcons, ...icons];
        icon= allIcons[0] || 'bash';

         // get user icons Dir path
        await initIconDir();
        await refresh();
        // keyboard event handler
        window.addEventListener("keydown", handleKeydown);
        // focus initial
        focusInput(searchInput);
        // 🔥 focus à chaque affichage de la fenêtre
        const unlisten = await appWindow?.listen("tauri://focus", () => {
            focusInput(searchInput);
        });
        // autostart ?
        autoStartEnabled = await isEnabled();

        return () => {
            window.removeEventListener("keydown", handleKeydown);
            unlisten();
        };
    });
</script>


<!-- container -->
<Container fluid="true" class="main-wrapper">
    {#if showAdd}
        <Row noGutters="true" class="add-part mb-2">
<!--                 Seed Db (dev Only)-->
<!--            <Button color="warning" bsSize="sm" on:click={seedDatabase}>-->
<!--                🌱 Seed DB (DEV)-->
<!--            </Button>-->
<!--                 Delete All (dev Only)-->
<!--            <Button color="danger" bsSize="sm" on:click={deleteAll}>-->
<!--                🧨 Delete ALL (DEV)-->
<!--            </Button>-->
            <InputGroup bsSize="sm" class="mb-2">
                <Input type="checkbox"
                       bind:checked={autoStartEnabled}
                       on:change={() => toggleAutoStart(autoStartEnabled)}
                />
                <span class="text-light">Lancer au démarrage</span>
            </InputGroup>
            <Card class="p-3" theme="light">
                <CommandForm
                    bind:data={formData}
                    {allIcons}
                    {userIcons}
                    submitLabel="Ajouter"
                    onSubmit={add}
                />
            </Card>
        </Row>
    {/if}
    <div class="search mb-4">
        <InputGroup bsSize="sm" class="mb-2">
                    <span
                            class="input-group-text"
                            id="icon-part"><img
                            src="/app-icon.svg"
                            width="20"
                            height="20"/>
                    </span>
                    <Input id="search-input"
                           name="search-input"
                           placeholder="Recherche"
                           innerRef={searchInput}
                           bind:value={search}
                           on:input={refresh}/>
        </InputGroup>
    </div>

    <div class="command-grid">
        {#each Object.entries(grouped) as [groupedIcon, cmds]}
            <div class="command-group">
<!--                <InputGroup bsSize="sm" class="mb-2 bg-dark-subtle  bg-gradient rounded" style="width:100%">-->
<!--                    <span-->
<!--                            class="input-group-text p-0"-->
<!--                    ><img src="{resolveIconUrl(groupedIcon, userIcons)}"-->
<!--                          width="40"-->
<!--                          height="40"-->
<!--                          class="p-2"/>-->
<!--                    </span>-->

<!--                    <span  class="input-group-text flex-grow-1"-->
<!--                    >{groupedIcon}-->
<!--                    </span>-->
<!--                    <Button color="dark"-->
<!--                            bsSize="sm"-->
<!--                            on:click={() => showModifyCategoryModal(groupedIcon)}-->
<!--                            >-->
<!--                        <Icon name="pencil-fill" />-->
<!--                    </Button>-->
<!--                </InputGroup>-->
                <CategoryHeader currentIcon={groupedIcon} userIconsSet={userIcons} onClick={showModifyCategoryModal}/>
<!--                <h5 class="bg-dark-subtle  bg-gradient rounded">-->
<!--                    <img src="{resolveIconUrl(groupedIcon, userIcons)}"-->
<!--                         width="40"-->
<!--                         height="40"-->
<!--                         class="p-2"/>-->
<!--                    {groupedIcon}-->
<!--                </h5>-->
                <ListGroup class="commands-list">

                    {#each cmds as c}
                        <ListGroupItem tag="li" bsSize="sm" class="p-0">
                            <ButtonGroup bsSize="sm" class="w-100">
                                <Button color="dark"
                                        block="true"
                                        bsSize="sm"
                                        on:click={() => copy(c.command)}
                                        id="btn-cmd-{c.id}">
                                    <strong>{c.name}</strong>
                                </Button>
                                <Button color="danger" bsSize="sm" on:click={() => openDeleteModal(c)} id="btn-cmd-delete-{c.id}">
                                    ✕
                                </Button>
                                <Button color="dark" bsSize="sm" on:click={() => openModifyModal(c)} id="btn-cmd-modify-{c.id}">
                                    <Icon name="pencil-fill" />
                                </Button>
                                <Tooltip
                                        animation
                                        content="supprimer"
                                        delay={0}
                                        id="tooltip-btn-cmd-delete-{c.id}"
                                        placement="auto"
                                        target="btn-cmd-delete-{c.id}"
                                        theme="dark"
                                />
                                <Tooltip
                                        animation
                                        content="modifier"
                                        delay={0}
                                        id="tooltip-btn-cmd-modify-{c.id}"
                                        placement="auto"
                                        target="btn-cmd-modify-{c.id}"
                                        theme="dark"
                                />
                                <Tooltip
                                        animation
                                        content="{c.description}"
                                        delay={0}
                                        id="tooltip-cmd-{c.id}"
                                        isOpen={false}
                                        placement="top"
                                        target="btn-cmd-{c.id}"/>
                            </ButtonGroup>
                        </ListGroupItem>
                    {/each}
                </ListGroup>

            </div>
        {/each}
    </div>

</Container>
<!-- !container -->

<!--delete Modal-->
<BaseModal open={showDeleteModal} onClose={closeDeleteModal} title="Confirmer">
    {#if commandToDelete}
        <p>
            Supprimer la commande :
            <strong>{commandToDelete.name}</strong> ?
        </p>
    {/if}
    <div class="wrapper" slot="footer">
        <Button color="warning" on:click={closeDeleteModal}>
            Annuler
        </Button>

        <Button color="danger" on:click={confirmDelete}>
            Supprimer
        </Button>
    </div>
</BaseModal>
<!-- !delete Modal-->

<!-- Modify Modal-->
<BaseModal open={showModifyModal} onClose={closeModifyModal} title="Modification">
    {#if commandToModify}
        <CommandForm
                bind:data={commandToModify}
                {allIcons}
                {userIcons}
                submitLabel="Modifier"
                onSubmit={updateCommandHandler}
        />
    {/if}

    <Button color="secondary" on:click={closeModifyModal}>
        Annuler
    </Button>
</BaseModal>
<!-- !Modify Modal-->

<!-- Modify Category Modal-->
<BaseModal open={modifyCategoryModalOpen} onClose={closeModifyCategoryModal} title="Modification">
    {#if categoryToModifyOld}
        <p>
            Modifier la categorie :
            <strong>{categoryToModifyOld}</strong> ?
        </p>
        <IconSelect
                bind:value={categoryToModifyNew}
                icons={allIcons}
                {userIcons}
        />
    {/if}

    <div class="wrapper" slot="footer">
        <Button color="secondary" on:click={closeModifyCategoryModal}>
            Annuler
        </Button>

        <Button color="warning" on:click={confirmModifyCategoryModal}>
            Modifier
        </Button>
    </div>
</BaseModal>
<!-- !Modify Category Modal-->

<!--help Modal-->
<Modal isOpen={showHelpModal} toggle={closeHelpModal} centered>
    <ModalHeader toggle={closeHelpModal}>
        Aide
    </ModalHeader>
    <ModalBody>
        <table class="table">
            <thead>
            <tr>
                <th scope="col">Raccourci</th>
                <th scope="col">Description</th>
            </tr>
            </thead>
            <tbody>
            {#each helpCommands as hCmd}
                <tr>
                    <td>{hCmd.keys.map(k => `'${k}'`).join(' / ')}</td>
                    <td>{hCmd.description}</td>
                </tr>
            {/each}

            </tbody>
        </table>
    </ModalBody>
</Modal>
<!-- !help Modal-->
