<script setup>
import { useAbsensiStore } from '@/stores/absensi';
import { useAuthStore } from '@/stores/auth';
import { FilterMatchMode } from '@primevue/core/api';
import { storeToRefs } from 'pinia';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';

const toast = useToast();
const authStore = useAuthStore();
const absensiStore = useAbsensiStore();
const { biometrikList, isLoading } = storeToRefs(absensiStore);

// Perbaikan filter agar tidak memblokir data di awal
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    status_audit_wajah: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

const statusOptions = ['Menunggu Audit', 'Valid', 'Ditolak', 'Belum Ada'];

// --- State Modal ---
const auditDialog = ref(false);
const deleteFaceDialog = ref(false); // Dialog lokal untuk konfirmasi hapus
const selectedPegawai = ref(null);
const facePhotoUrl = ref(null);
const isPhotoLoading = ref(false);

onMounted(() => {
    absensiStore.fetchBiometrikStatus();
});

/**
 * Membuka modal audit dan mengambil foto (Mekanisme aman Blob)
 */
async function openAudit(pegawai) {
    selectedPegawai.value = pegawai;

    if (facePhotoUrl.value) URL.revokeObjectURL(facePhotoUrl.value);
    facePhotoUrl.value = null;

    auditDialog.value = true;
    isPhotoLoading.value = true;

    try {
        const url = await absensiStore.fetchFaceBlob(pegawai.pegawai_id);
        facePhotoUrl.value = url;
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Foto tidak dapat dimuat.', life: 3000 });
    } finally {
        isPhotoLoading.value = false;
    }
}

async function handleAudit(status) {
    try {
        await absensiStore.auditFace(selectedPegawai.value.pegawai_id, status);
        toast.add({ severity: 'success', summary: 'Berhasil', detail: `Status diperbarui: ${status}`, life: 3000 });
        auditDialog.value = false;
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Terjadi kesalahan sistem.', life: 3000 });
    }
}

/**
 * Mekanisme Hapus: Menggunakan Dialog lokal agar transisi lancar
 */
function confirmReset() {
    deleteFaceDialog.value = true;
}

async function executeDeleteFace() {
    try {
        await absensiStore.deleteFace(selectedPegawai.value.pegawai_id);
        toast.add({ severity: 'info', summary: 'Dihapus', detail: 'Foto wajah telah direset.', life: 3000 });
        deleteFaceDialog.value = false;
        auditDialog.value = false; // Tutup modal tinjauan setelah reset
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal menghapus.', life: 3000 });
    }
}

function closeDialog() {
    if (facePhotoUrl.value) URL.revokeObjectURL(facePhotoUrl.value);
    facePhotoUrl.value = null;
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
                <h4 class="m-0 font-bold text-gray-800">Verifikasi Biometrik Pegawai</h4>
                <p class="text-sm text-gray-500 m-0">Kelola validitas foto referensi wajah untuk presensi.</p>
            </div>
            <Button label="Refresh" icon="pi pi-refresh" outlined severity="secondary"
                @click="absensiStore.fetchBiometrikStatus()" :loading="isLoading" />
        </div>

        <DataTable :value="biometrikList" :loading="isLoading" paginator :rows="10" dataKey="pegawai_id"
            v-model:filters="filters" stripedRows class="p-datatable-sm" :globalFilterFields="['nama_pegawai', 'nik']">
            <template #header>
                <div class="flex flex-wrap justify-between items-center gap-3">
                    <div class="flex gap-3">
                        <IconField>
                            <InputIcon><i class="pi pi-search" /></InputIcon>
                            <InputText v-model="filters['global'].value" placeholder="Cari NIK / Nama..." />
                        </IconField>
                        <Dropdown v-model="filters['status_audit_wajah'].value" :options="statusOptions"
                            placeholder="Filter Status" showClear class="w-48" />
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

            <Column header="Aksi" style="width: 150px" class="text-center">
                <template #body="slotProps">
                    <Button v-if="slotProps.data.foto_wajah_path" label="Tinjau" icon="pi pi-camera" size="small"
                        outlined severity="primary" @click="openAudit(slotProps.data)" />
                    <span v-else class="text-xs text-gray-400 italic">Belum Ada Foto</span>
                </template>
            </Column>

            <template #empty>
                <div class="text-center p-8 text-gray-400">Tidak ada data biometrik ditemukan.</div>
            </template>
        </DataTable>
    </div>

    <!-- Modal Audit Wajah -->
    <Dialog v-model:visible="auditDialog" :header="`Peninjauan Wajah: ${selectedPegawai?.nama_pegawai}`"
        :style="{ width: '450px' }" modal @hide="closeDialog">

        <div class="flex flex-col items-center gap-6 py-4">
            <div v-if="isPhotoLoading" class="flex flex-col items-center py-10">
                <ProgressSpinner style="width: 50px; height: 50px" />
                <span class="text-slate-500 mt-3">Mengambil data foto...</span>
            </div>

            <template v-else>
                <div
                    class="w-64 h-64 rounded-xl overflow-hidden border-4 border-slate-100 shadow-xl bg-slate-50 flex items-center justify-center">
                    <img v-if="facePhotoUrl" :src="facePhotoUrl" class="w-full h-full object-cover" />
                    <div v-else class="text-center text-gray-400 p-4">
                        <i class="pi pi-image text-4xl mb-2"></i>
                        <div class="text-xs">Foto tidak terbaca atau rusak</div>
                    </div>
                </div>

                <div class="text-center px-2">
                    <p class="text-slate-600 text-sm m-0 leading-relaxed">Apakah foto ini sudah benar sesuai dengan
                        wajah asli dari <b>{{ selectedPegawai?.nama_pegawai }}</b>?</p>
                </div>

                <div class="flex flex-col w-full gap-3 mt-2">
                    <div class="grid grid-cols-2 gap-3">
                        <Button label="Valid" icon="pi pi-check" severity="success" @click="handleAudit('Valid')" />
                        <Button label="Tolak" icon="pi pi-times" severity="warn" @click="handleAudit('Ditolak')" />
                    </div>
                    <Button label="Hapus / Reset Foto" icon="pi pi-trash" severity="danger" text
                        @click="confirmReset" />
                </div>
            </template>
        </div>

        <template #footer>
            <Button label="Tutup" icon="pi pi-times" text severity="secondary" @click="closeDialog" />
        </template>
    </Dialog>

    <!-- Modal Konfirmasi Hapus Lokal (Solusi Bug) -->
    <Dialog v-model:visible="deleteFaceDialog" :style="{ width: '450px' }" header="Konfirmasi Reset" :modal="true">
        <div class="flex items-center gap-4">
            <i class="pi pi-exclamation-triangle text-3xl text-red-500" />
            <span v-if="selectedPegawai">Hapus foto wajah <b>{{ selectedPegawai.nama_pegawai }}</b>? Pegawai harus
                melakukan
                upload ulang.</span>
        </div>
        <template #footer>
            <Button label="Batal" icon="pi pi-times" text @click="deleteFaceDialog = false" />
            <Button label="Ya, Hapus" icon="pi pi-check" severity="danger" @click="executeDeleteFace" />
        </template>
    </Dialog>
</template>

<style scoped>
:deep(.p-datatable-header) {
    background: #fff;
    padding: 1rem 0;
}
</style>