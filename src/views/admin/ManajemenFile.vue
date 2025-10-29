<script setup>
import { useDokumenStore } from '@/stores/dokumen';
import { FilterMatchMode } from '@primevue/core/api';
import { storeToRefs } from 'pinia';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';

// --- Setup ---
const toast = useToast();
const dokumenStore = useDokumenStore();
const { allList: dokumenList, isLoading } = storeToRefs(dokumenStore); // Ambil 'allList'

const deleteDialog = ref(false);
const dataToDelete = ref({});
const isFileLoading = ref(false);
const dt = ref();
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

onMounted(() => {
    dokumenStore.fetchAllGlobal(); // Panggil fungsi global
});

function formatDateTime(value) {
    if (!value) return '';

    // value = "2025-10-28 07:04:00.191229 +00:00:00"

    // 1. Ubah string menjadi format yang bisa dibaca JavaScript
    // Ganti spasi pertama dengan 'T'
    // Ganti spasi kedua (sebelum timezone) menjadi string kosong
    // Hapus ':00' terakhir dari timezone
    const parsableString = value.replace(' ', 'T').replace(' +', '+').replace('+00:00:00', '+00:00');

    // Sekarang stringnya menjadi "2025-10-28T07:04:00.191229+00:00"

    const date = new Date(parsableString);

    if (isNaN(date)) {
        return 'Tanggal Error'; // Fallback jika parsing gagal
    }

    return date.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
}

// --- Fungsi Aksi ---
async function viewDokumen(path) {
    if (!path) return;
    isFileLoading.value = true;
    try {
        const blob = await dokumenStore.viewFile(path);
        const fileURL = URL.createObjectURL(blob);
        window.open(fileURL, '_blank');
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: error.message, life: 3000 });
    } finally {
        isFileLoading.value = false;
    }
}

function confirmDelete(data) {
    dataToDelete.value = data;
    deleteDialog.value = true;
}

async function deleteData() {
    try {
        await dokumenStore.delete(dataToDelete.value.id);
        await dokumenStore.fetchAllGlobal(); // Refresh data global
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Dokumen Dihapus', life: 3000 });
        deleteDialog.value = false;
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal menghapus dokumen', life: 3000 });
    }
}
</script>

<template>
    <div>
        <div class="card">
            <DataTable
                ref="dt"
                :value="dokumenList"
                :loading="isLoading"
                dataKey="id"
                :paginator="true"
                :rows="10"
                :filters="filters"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                :rowsPerPageOptions="[5, 10, 25]"
                currentPageReportTemplate="Menampilkan {first} sampai {last} dari {totalRecords} dokumen"
            >
                <template #header>
                    <div class="flex flex-wrap gap-2 items-center justify-between">
                        <h4 class="m-0">Manajemen File (Semua Dokumen SDM)</h4>
                        <IconField>
                            <InputIcon> <i class="pi pi-search" /> </InputIcon>
                            <InputText v-model="filters['global'].value" placeholder="Cari..." />
                        </IconField>
                    </div>
                </template>

                <Column field="nama_pegawai" header="Pegawai" sortable></Column>
                <Column field="nama_file_asli" header="Nama File" sortable></Column>
                <Column field="kategori" header="Kategori" sortable></Column>
                <Column field="entity_type" header="Tipe Entitas" sortable></Column>
                <Column field="created_at" header="Tanggal Upload" sortable>
                    <template #body="slotProps">
                        {{ formatDateTime(slotProps.data.created_at) }}
                    </template>
                </Column>
                <Column field="nama_uploader" header="Diupload Oleh" sortable></Column>
                <Column :exportable="false" style="min-width: 10rem" header="Aksi">
                    <template #body="slotProps">
                        <Button icon="pi pi-eye" text rounded severity="info" @click="viewDokumen(slotProps.data.path_file)" :loading="isFileLoading" v-tooltip.top="'Lihat Dokumen'" />
                        <Button icon="pi pi-trash" text rounded severity="danger" @click="confirmDelete(slotProps.data)" v-tooltip.top="'Hapus Dokumen'" />
                    </template>
                </Column>
            </DataTable>
        </div>

        <Dialog v-model:visible="deleteDialog" :style="{ width: '450px' }" header="Konfirmasi" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl" />
                <span v-if="dataToDelete"
                    >Apakah Anda yakin ingin menghapus file <b>{{ dataToDelete.nama_file_asli }}</b
                    >?</span
                >
            </div>
            <template #footer>
                <Button label="Tidak" icon="pi pi-times" text @click="deleteDialog = false" />
                <Button label="Ya" icon="pi pi-check" @click="deleteData" />
            </template>
        </Dialog>
    </div>
</template>
