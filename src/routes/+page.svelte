<script lang="ts">
    import IconSelect from "$lib/components/IconSelect.svelte";
    import hljs from 'highlight.js';

    console.log("PAGE SCRIPT LOADED");
    import {onMount} from "svelte";
    import {
        addCommand, deleteCommand, getCommands, updateCommand, updateCategorie, setCurrentWorkspace,
        getCurrentWorkspace, getTemplates, addTemplate,deleteTemplate, updateTemplate, exportAllData, importAllData, closeDb
    } from "$lib/db";


    import { save, open } from "@tauri-apps/plugin-dialog";
    import { writeTextFile, readTextFile } from "@tauri-apps/plugin-fs";
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
        Col,
        Tooltip,
        Icon,
        TabContent,
        TabPane, CardHeader, CardBody, Badge
    } from '@sveltestrap/sveltestrap';

    import {icons} from "$lib/icons";
    import {invoke} from "@tauri-apps/api/core";
    import { currentWorkspace, initWorkspace } from '$lib/stores/workspace';

    let appWindow:any;
    let searchInput: HTMLInputElement | null = null;

    let search = "";
    let commands: any[] = [];
    let templates: any[] = [];
    let grouped: any[] = [];
    let showAdd = false;

    // help modal
    let showHelpModal = false;

    // themes
    let currentTheme = 'atom-one-dark';
    const CODE_THEMES = [
        'atom-one-dark',
        'atom-one-light',
        'dark',
        'github',
        'github-dark',
        '1c-light',
        'a11y-dark',
        'a11y-light',
        'agate',
        'an-old-hope',
        'androidstudio',
        'arduino-light',
        'ascetic',
    ];
    // delete modale
    let showDeleteModal = false;
    let commandToDelete: CmdItem|null = null;

    let itemToEdit:CmdItem|null = null;
    let showEditModal = false;

    let autoStartEnabled: boolean = false;
    let userIcons: Set<string> = new Set();
    let allIcons = [...icons, ...userIcons];

    let workspace:Workspace|null|undefined = $currentWorkspace;

    let icon: string = 'bash';

    let addType = null;

    let formData:Command = {
        name: "",
        description: "",
        command: "",
        icon,
        workspace_id:null

    };
    let formDataTemplate:Template = {
        name: "",
        description: "",
        content: "",
        params: [],
        icon,
        type:"sql",
        workspace_id:null
    };
    import { initIconDir } from "$lib/iconResolver";
    import CommandForm from "$lib/components/CommandForm.svelte";
    import BaseModal from "$lib/components/BaseModal.svelte";
    import CategoryHeader from "$lib/components/CategoryHeader.svelte";
    import WorkspaceDropdown from "$lib/components/WorkspaceDropdown.svelte";
    import TemplateForm from "$lib/components/TemplateForm.svelte";
    import type {Command, Template, TemplateParams, CmdItem, Workspace} from "$lib/types";

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
    async function updateWorkspace(ws:Workspace) {
        console.log('updateWorkspace', ws);
        await setCurrentWorkspace(ws?.id??null);


        await refresh();
    }
    /**
     * focus input element
     * @param _input
     */
    function focusInput(_input: HTMLInputElement | null, andSelect = false) {
        if (!_input) return;

        _input.focus();
        if(andSelect){
            _input.select();
        }
    }

    /**
     * reload data from database
     */
    async function refresh() {

        const cws = await getCurrentWorkspace();
        currentWorkspace.set(cws);
        workspace = $currentWorkspace
        console.log(workspace,workspace?.id);

        commands = await getCommands(search, workspace?.id ?? null);
        templates = await getTemplates(search, workspace?.id ?? null);
        commands = commands.map((c)=>{
            c.type = "command"
            return c
        })
        grouped = [...commands, ...templates].reduce((acc, cmd:CmdItem) => {
            const key = cmd.icon || "default";
            acc[key] ||= [];
            acc[key].push(cmd);
            return acc;
        }, {});
        console.log(grouped);
        if( grouped.length === 0 ) {
            showHelpModal = true;
        }
        focusInput(searchInput);
    }

    /**
     * add template to database
     */
    async function addT() {
        if (!formDataTemplate.name || !formDataTemplate.content) return;
        console.log(formDataTemplate.name, formDataTemplate.description, formDataTemplate.content, formDataTemplate.icon, formDataTemplate.params , workspace?.id ?? null);
        await addTemplate(formDataTemplate.name, formDataTemplate.description, formDataTemplate.content, formDataTemplate.icon, formDataTemplate.params , workspace?.id ?? null);

        toggleAdd();
        await refresh();
    }

    /**
     * add command to database
     */
    async function add() {
        if (!formData.name || !formData.command) return;
        await addCommand(formData.name, formData.description, formData.command, formData.icon, workspace?.id ?? null);
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
        //e.stopPropagation();
        // Escape → close
        if (e.key === "Escape") {
            e.preventDefault();
            if(showAdd){
               showAdd = false;
               console.log('ici?')
               focusInput(searchInput, true);
            }else{
                appWindow?.hide();
            }
        }

        if(e.ctrlKey && e.key === "f"){
            e.preventDefault();
            focusInput(searchInput, true);
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
        if (noModifiersUsed(e) && (e.code === "KeyH" || e.code === "Tab")) {
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
    function toggleAdd(forceHide:boolean = false) {
        if(forceHide){
            showAdd = false;
            return;
        }
        showAdd = !showAdd;

        // reset new command /template object
        if (showAdd) {
            formData = {
                name: "",
                description: "",
                command: "",
                icon,
                workspace_id: null
            };

            formDataTemplate = {
                name: "",
                description: "",
                content: "",
                params: [],
                icon,
                type:"sql",
                workspace_id: null
            }
            focusInput(document.querySelector('#cmd-name-input'));
        }
    }

    /**
     * open delete modale
     * @param command
     */
    function openDeleteModal(command: CmdItem) {
        commandToDelete = command;
        showDeleteModal = true;
    }

    function openEditModal(item:CmdItem) {
        itemToEdit = structuredClone(item); // éviter mutation directe
        showEditModal = true;
    }
    function closeEditModal() {
        showEditModal = false;
        itemToEdit = null;
    }
    /**
     * close delete modale
     */
    function closeDeleteModal() {
        showDeleteModal = false;
        commandToDelete = null;
    }

    async function updateItemHandler() {

        if (!itemToEdit) return;

        if (itemToEdit.type === "command") {
            await updateCommand(itemToEdit);
        } else {
            await updateTemplate(itemToEdit);
        }

        await refresh();

        closeEditModal();
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
        if(commandToDelete.type === "command") {
            await deleteCommand(commandToDelete?.id??0);
        }else{
            await deleteTemplate(commandToDelete.id??0);
        }

        await refresh();
        closeDeleteModal();
    }


    let categoryToModifyOld:string = "";
    let categoryToModifyNew:string = "";
    let categoryToModifyWorkspace:any|null = null;
    let modifyCategoryModalOpen:boolean = false;

    function closeModifyCategoryModal(){
        categoryToModifyOld = "";
        categoryToModifyNew = ""
        categoryToModifyWorkspace = null
        modifyCategoryModalOpen = false;
    }

    function showModifyCategoryModal(cat:string){
        categoryToModifyOld = cat;
        categoryToModifyNew = categoryToModifyOld;
        categoryToModifyWorkspace = structuredClone(workspace);
        modifyCategoryModalOpen = true;
    }
    async function confirmModifyCategoryModal(){
        console.log('categoryToModifyWorkspace', categoryToModifyWorkspace)
        await updateCategorie(categoryToModifyOld, categoryToModifyNew, categoryToModifyWorkspace?.id??null);
        await refresh();
        closeModifyCategoryModal()
    }

    let templateToCopy:any = null;
    let templateContentPreview:string = "";
    let showCopyTemplateModal = false;

    let paramValues:any = {};
    async function openCopyTemplateModal(tpl: Template) {
        console.log(tpl)
        templateToCopy = tpl;
        paramValues = {};

        for (const p of tpl.params) {
            paramValues[p.placeholder] = "";
        }

        updateCopyTemplatePreview();

        showCopyTemplateModal = true;
    }
    function highLightTemplate(tpl:Template, code:string){
        // console.log('tpl?.type',tpl,tpl?.type)
        let language:string = (tpl?.type && tpl?.type !== '' )? tpl?.type : 'sql';
        return hljs.highlight(code, {language}).value;
    }
    function updateCopyTemplatePreview(){
        let code = resolveTemplate(templateToCopy?.content,
            paramValues);
        templateContentPreview =  highLightTemplate(templateToCopy,code);
    }
    function resolveTemplate(content:string, values:any) {

        let result = content;

        for (const key in values) {
            const regex = new RegExp(`{{${key}}}`, "g");
            const value = (!values[key] || values[key] === "") ?  `${key}` : values[key];
            result = result.replace(regex, value);

        }

        return result;
    }
    async function confirmTemplateCopy() {

        if (!templateToCopy) return;

        const finalText = resolveTemplate(
            templateToCopy.content,
            paramValues
        );

        await navigator.clipboard.writeText(finalText);

        showCopyTemplateModal = false;
    }
    /**
     * entry point
     */
    onMount( async () => {
        console.log("🟢 Svelte mounted");
        appWindow = getCurrentWindow();
        const list_icons = await invoke<string[]>("list_user_icons");
        userIcons = new Set(list_icons);

        allIcons = [ ...userIcons, ...icons];
        icon= allIcons[0] || 'bash';
        currentTheme = localStorage.getItem("current_theme")??currentTheme;
        // workspace
        await initWorkspace();
        // !workspace

         // get user icons Dir path
        await initIconDir();
        await refresh();

        // keyboard event handler
        window.addEventListener("keydown", handleKeydown);
        // window.addEventListener("keyup", handleKeyup);

        // // focus initial
        searchInput = document.querySelector("#search-input");
        focusInput(searchInput, true);

        // autostart ?
        autoStartEnabled = await isEnabled();

        return () => {
            window.removeEventListener("keydown", handleKeydown);
            // unlisten();
        };
    });
    async function exportDatabase() {

        const data = await exportAllData();

        const path = await save({
            filters: [{
                name: "JSON",
                extensions: ["json"]
            }],
            defaultPath: "commands-backup.json"
        });

        if (!path) return;

        await writeTextFile(
            path,
            JSON.stringify(data, null, 2)
        );

        console.log("Export saved to", path);
    }
    async function saveCurrentDatabaseThenImport() {
        // console.log('étape 1: export');
        // await exportDatabase();
        console.log('étape 2: import');
        await importDatabase();
        console.log('fin');
    }
    async function importDatabase() {
        await closeDb();

        const file = await open({
            filters: [{ name: "JSON", extensions: ["json"] }]
        });

        if (!file) return;

        const content = await readTextFile(file as string);

        const json = JSON.parse(content);

        await importAllData(json);

        await refresh();

    }
    let darkTheme:boolean = true;
</script>


<!-- container -->
<Container fluid="true" class="main-wrapper">
    {#if showAdd}
        <Row class="add-part mb-4 gx-2">
            <Col xs="12" md="6" lg="9">
                <TabContent data-bs-theme="dark" class="add-tabs">
                    <TabPane tabId="commands" tab="➕ Commande" active>
                        <Card class="p-3 add-card" theme="dark">
                            <CommandForm
                                    bind:data={formData}
                                    {allIcons}
                                    {userIcons}
                                    submitLabel="Ajouter"
                                    onSubmit={add}
                            />
                        </Card>
                    </TabPane>
                    <TabPane tabId="templates" tab="➕ Template">
                        <Card class="p-3 add-card" theme="dark">
                            <TemplateForm
                                    bind:data={formDataTemplate}
                                    {allIcons}
                                    {userIcons}
                                    submitLabel="Ajouter"
                                    onSubmit={addT}
                            />
                        </Card>
                    </TabPane>
                </TabContent>

            </Col>
            <Col xs="12" md="6" lg="3">
                <Card class="p-3 mb-2 workspace-card" theme="dark">
                    <CardBody>
                        <InputGroup bsSize="sm" class="">
                            <Input type="checkbox"
                                   bind:checked={autoStartEnabled}
                                   on:change={() => toggleAutoStart(autoStartEnabled)}
                            />
                            <span class="text-light">Lancer au démarrage</span>
                        </InputGroup>
                    </CardBody>

                </Card>
                <Card class="p-3 workspace-card" theme="dark">
                    <CardHeader>
                        Environnement
                    </CardHeader>
                    <CardBody>
                        <WorkspaceDropdown
                                selectedWorkspace={workspace}
                                onChange={updateWorkspace}
                                canCreate={true}
                        />
                    </CardBody>

                </Card>
                <Card class="p-3 mt-2 data-card" theme="dark">
                    <CardHeader>
                        Importer/Exporter
                    </CardHeader>
                    <CardBody class="flex-auto">
                        <Button class="flex-grow-1" color="primary" on:click={exportDatabase}>
                            Export JSON
                        </Button>
                        <Button class="flex-grow-1" color="warning" on:click={saveCurrentDatabaseThenImport}>
                            Import JSON
                        </Button>
                    </CardBody>

                </Card>
                <Card class="p-3 mt-2 data-card" theme="dark">
                    <CardHeader>
                        Theme du code
                    </CardHeader>
                    <CardBody class="flex-auto">
                        <select class="input-group-select flex-grow-1" bind:value={currentTheme} on:change={()=>{localStorage.setItem("current_theme", currentTheme)}}>
                            {#each CODE_THEMES as t }
                                <option value={t}>{t}</option>
                            {/each}
                        </select>
                    </CardBody>

                </Card>
            </Col>
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
                           bind:value={search}
                           on:input={refresh}/>
        </InputGroup>
    </div>

    <div class="command-grid">
        {#each Object.entries(grouped) as [groupedIcon, cmds]}
            <div class="command-group">

                <CategoryHeader currentIcon={groupedIcon} currentWorkspaceId={workspace?.id ?? null} userIconsSet={userIcons} onClick={showModifyCategoryModal}/>

                <ListGroup class="commands-list">

                    {#each cmds as c}
                        <ListGroupItem tag="li" bsSize="sm" class="p-0">
                            <ButtonGroup bsSize="sm" class="w-100">

                                    {#if c.type === 'command'}
                                        <Button color="dark"
                                                block="true"
                                                bsSize="sm"
                                                on:click={() => copy(c.command)}
                                                id="btn-cmd-{c.id}"
                                                class="cmd-btn"
                                        ><Badge pill={true} color="secondary" title="Command"> > </Badge>
                                            <strong>{c.name}</strong>
                                        </Button>
                                    {:else}
                                        <Button color="dark"
                                                block="true"
                                                bsSize="sm"
                                                on:click={() => openCopyTemplateModal(c)}
                                                id="btn-cmd-{c.id}"
                                                class="cmd-btn"
                                        ><Badge pill={true} color="primary" title="Template"> $ </Badge>
                                        <strong>{c.name}</strong>
                                        </Button>
                                    {/if}
                                <Button color="danger" bsSize="sm" on:click={() => openDeleteModal(c)} id="btn-cmd-delete-{c.id}">
                                    ✕
                                </Button>
                                <Button color="dark" bsSize="sm" on:click={() => openEditModal(c)} id="btn-cmd-modify-{c.id}">
                                    <Icon name="pencil-fill" />
                                </Button>
                                <Tooltip
                                        animation
                                        content="supprimer"
                                        delay={0}
                                        id="tooltip-btn-cmd-delete-{c.id}"
                                        placement="right"
                                        target="btn-cmd-delete-{c.id}"
                                        theme="dark"
                                />
                                <Tooltip
                                        animation
                                        content="modifier"
                                        delay={0}
                                        id="tooltip-btn-cmd-modify-{c.id}"
                                        placement="right"
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
            Supprimer {(commandToDelete.type === 'command')?'la commande':'le template'} :
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
<BaseModal open={showEditModal} onClose={closeEditModal} title="Modification">

    {#if itemToEdit}

        {#if itemToEdit.type === "command"}

            <CommandForm
                    bind:data={itemToEdit}
                    {allIcons}
                    {userIcons}
                    submitLabel="Modifier"
                    onSubmit={updateItemHandler}
            />

        {:else }

            <TemplateForm
                    bind:data={itemToEdit}
                    {allIcons}
                    {userIcons}
                    submitLabel="Modifier"
                    onSubmit={updateItemHandler}
            />

        {/if}

    {/if}

    <Button color="secondary" on:click={closeEditModal}>
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
        <WorkspaceDropdown
            selectedWorkspace={categoryToModifyWorkspace}
            onChange={(ws)=>{categoryToModifyWorkspace = ws}}
            canCreate={false}
        ></WorkspaceDropdown>
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

<!-- copy template Modal-->
<BaseModal fullscreen={true}
        open={showCopyTemplateModal}
        title={templateToCopy?.name}
        onClose={() => showCopyTemplateModal=false}
>
    {#if templateToCopy}
        <h6>Description</h6>
        <p>{templateToCopy?.description}</p>
        <hr>
        <h6>Prévisualisation</h6>
        <div class="theme-{currentTheme}">
          <pre><code class="code-preview hljs dark language-{templateToCopy?.type??'sql'}">{@html templateContentPreview}</code></pre>
        </div>
        <hr>
        <h6>Parametres disponibles</h6>
        {#each templateToCopy.params as p}
            <div class="mb-2">
                <InputGroup bsSize="sm" id="tpl-{templateToCopy.id}-param-{p.id}">
                    <label class="input-group-text">
                        {p.name}
                    </label>

                    <Input

                            type={p.type}
                            placeholder={p.placeholder}
                            bind:value={paramValues[p.placeholder]}
                            on:input={()=>{updateCopyTemplatePreview()}}
                    />
                </InputGroup>
                <Tooltip
                    animation
                    content="{p.description}"
                    delay={0}
                    id="tooltip-tpl-{templateToCopy.id}-param-{p.id}"
                    placement="bottom"
                    target="tpl-{templateToCopy.id}-param-{p.id}"
                    theme="dark"
            />
            </div>

        {/each}

    {/if}
    <hr>
    <Button color="success" on:click={confirmTemplateCopy}>
        Copier
    </Button>

    <Button color="secondary" on:click={() => showCopyTemplateModal=false}>
        Annuler
    </Button>

</BaseModal>
<!-- !copy template Modal-->