<script setup>
import { useAbsensiStore } from '@/stores/absensi';
import { FilterMatchMode } from '@primevue/core/api';
import { storeToRefs } from 'pinia';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';

const toast = useToast();
const confirm = useConfirm();
const absensiStore = useAbsensiStore();
const { biometrikList, isLoading } = storeToRefs(absensiStore);

const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    status_audit_wajah: { value: null, matchMode: FilterMatchMode.EQUALS }
});

const statusOptions = ['Menunggu Audit', 'Valid', 'Ditolak', 'Belum Ada'];

// --- State Modal Peninjauan ---
const auditDialog = ref(false);
const selectedPegawai = ref(null);
const facePhotoUrl = ref(null);
const isPhotoLoading = ref(false);

onMounted(() => {
    absensiStore.fetchBiometrikStatus();
});

async function openAudit(pegawai) {
    selectedPegawai.value = pegawai;
    facePhotoUrl.value = null;
    auditDialog.value = true;
    isPhotoLoading.value = true;

    try {
        const url = await absensiStore.fetchFaceBlob(pegawai.pegawai_id);
        facePhotoUrl.value = url;
    } finally {
        isPhotoLoading.value = false;
    }
}

async function handleAudit(status) {
    try {
        await absensiStore.auditFace(selectedPegawai.value.pegawai_id, status);
        toast.add({ severity: 'success', summary: 'Berhasil', detail: `Status diperbarui menjadi ${status}`, life: 3000 });
        auditDialog.value = false;
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal memproses audit', life: 3000 });
    }
}

function confirmReset() {
    confirm.require({
        message: `Hapus foto referensi ${selectedPegawai.value.nama_pegawai}? Pegawai harus upload ulang.`,
        header: 'Konfirmasi Reset',
        icon: 'pi pi-exclamation-triangle',
        acceptClass: 'p-button-danger',
        accept: async () => {
            try {
                await absensiStore.deleteFace(selectedPegawai.value.pegawai_id);
                toast.add({ severity: 'info', summary: 'Berhasil', detail: 'Foto wajah dihapus', life: 3000 });
                auditDialog.value = false;
            } catch (e) {
                toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal menghapus', life: 3000 });
            }
        }
    });
}

function closeDialog() {
    if (facePhotoUrl.value) URL.revokeObjectURL(facePhotoUrl.value);
    auditDialog.value = false;
}

function getStatusSeverity(status) {
    switch (status) {
        case 'Valid': return 'success';
        case 'Menunggu Audit': return 'warn';
        case 'Ditolak': return 'danger';
        case 'Belum Ada': return 'secondary';
        default: return 'info';
    }
}
</script>

<template>
    <div class="card shadow-sm border-0">
        <div class="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <div>
                <h4 class="m-0 font-bold text-gray-800">Verifikasi Biometrik (Foto Wajah)</h4>
                <p class="text-sm text-gray-500 m-0">Validasi foto referensi pegawai untuk keperluan presensi.</p>
            </div>
            <div class="flex gap-2">
                <Button icon="pi pi-refresh" outlined severity="secondary" @click="absensiStore.fetchBiometrikStatus()"
                    :loading="isLoading" />
            </div>
        </div>

        <DataTable :value="biometrikList" :loading="isLoading" paginator :rows="10" v-model:filters="filters"
            filterDisplay="menu" stripedRows class="p-datatable-sm" :globalFilterFields="['nama_pegawai', 'nik']">

            <template #header>
                <div class="flex flex-wrap justify-between items-center gap-3">
                    <div class="flex gap-3">
                        <IconField>
                            <InputIcon><i class="pi pi-search" /></InputIcon>
                            <InputText v-model="filters['global'].value" placeholder="Cari NIK / Nama..." />
                        </IconField>
                        <Dropdown v-model="filters['status_audit_wajah'].value" :options="statusOptions"
                            placeholder="Filter Status" showClear />
                    </div>
                </div>
            </template>

            <Column field="nik" header="NIK" sortable class="font-mono text-xs"></Column>
            <Column field="nama_pegawai" header="Nama Pegawai" sortable class="font-bold"></Column>
            <Column field="status_audit_wajah" header="Status Audit" sortable>
                <template #body="slotProps">
                    <Tag :value="slotProps.data.status_audit_wajah"
                        :severity="getStatusSeverity(slotProps.data.status_audit_wajah)" />
                </template>
            </Column>

            <Column header="Tindakan" style="width: 150px" class="text-center">
                <template #body="slotProps">
                    <Button v-if="slotProps.data.foto_wajah_path" label="Tinjau" icon="pi pi-search-plus" size="small"
                        outlined severity="primary" @click="openAudit(slotProps.data)" />
                    <span v-else class="text-xs text-gray-400 italic">Menunggu Upload</span>
                </template>
            </Column>

            <template #empty>
                <div class="text-center p-8 text-gray-400">Data biometrik tidak ditemukan.</div>
            </template>
        </DataTable>
    </div>

    <!-- Modal Audit -->
    <Dialog v-model:visible="auditDialog" :header="`Peninjauan Wajah: ${selectedPegawai?.nama_pegawai}`"
        :style="{ width: '450px' }" modal @hide="closeDialog">

        <div class="flex flex-col items-center gap-6 py-4">
            <div v-if="isPhotoLoading" class="flex flex-col items-center py-10">
                <ProgressSpinner style="width: 50px; height: 50px" />
                <span class="text-slate-500 mt-3">Memuat foto referensi...</span>
            </div>

            <template v-else>
                <div class="w-64 h-64 rounded-xl overflow-hidden border-4 border-slate-100 shadow-xl bg-slate-50">
                    <img v-if="facePhotoUrl" :src="facePhotoUrl" class="w-full h-full object-cover" />
                    <div v-else class="flex flex-col items-center justify-center h-full text-gray-400">
                        <i class="pi pi-image text-4xl mb-2"></i>
                        <span>Foto tidak terbaca</span>
                    </div>
                </div>

                <div class="text-center px-2">
                    <p class="text-slate-600 text-sm m-0">Apakah foto ini sudah benar wajah asli dari <b>{{
                            selectedPegawai?.nama_pegawai }}</b>?</p>
                </div>

                <div class="flex flex-col w-full gap-3">
                    <div class="grid grid-cols-2 gap-3">
                        <Button label="Valid" icon="pi pi-check" severity="success" @click="handleAudit('Valid')" />
                        <Button label="Tolak" icon="pi pi-times" severity="warn" @click="handleAudit('Ditolak')" />
                    </div>
                    <Button label="Reset / Hapus Foto" icon="pi pi-trash" severity="danger" text
                        @click="confirmReset" />
                </div>
            </template>
        </div>

        <template #footer>
            <Button label="Tutup" icon="pi pi-times" text severity="secondary" @click="closeDialog" />
        </template>
    </Dialog>

    <ConfirmDialog />
</template>

<style scoped>
:deep(.p-datatable-header) {
    background: #fff;
    padding: 1rem 0;
}
</style>