<script>
    import {Modal, ModalBody, ModalFooter, ModalHeader} from "@sveltestrap/sveltestrap";

    export let open = false;
    export let title = "";
    export let onClose = () => {};
</script>

<Modal isOpen={open} toggle={onClose} centered>
    <ModalHeader toggle={onClose}>
        {title}
    </ModalHeader>

    <ModalBody>
        <slot />
    </ModalBody>

    <ModalFooter>
        <slot name="footer" />
    </ModalFooter>
</Modal>

<!--Usage-->
<!--
<BaseModal open={showDeleteModal} title="Confirmer">
    <p>Supprimer {command.name} ?</p>

    <Button slot="footer" on:click={confirmDelete}>
        Supprimer
    </Button>
</BaseModal>
-->