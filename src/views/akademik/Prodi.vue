<script setup>
// --- LOGIKA: Diubah dari ProductService ke prodiStore ---
import { useProdiStore } from '@/stores/prodi';
import { FilterMatchMode } from '@primevue/core/api'; // <-- DITAMBAHKAN: Untuk filter
import { storeToRefs } from 'pinia';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';

// Setup Store, State, dan Toast
const toast = useToast();
const prodiStore = useProdiStore();
const { prodiList, isLoading } = storeToRefs(prodiStore);

// State lokal untuk dialog dan form
const prodiDialog = ref(false);
const deleteProdiDialog = ref(false);
const prodi = ref({});
const submitted = ref(false);

// --- DITAMBAHKAN: State untuk Search dan Export ---
const dt = ref(); // Untuk referensi ke komponen DataTable
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

// Mengambil data saat komponen dimuat
onMounted(() => {
    prodiStore.fetchProdi();
});

// --- DITAMBAHKAN: Fungsi untuk Export ---
function exportCSV() {
    dt.value.exportCSV();
}

// --- FUNGSI CRUD (TIDAK BERUBAH) ---

function openNew() {
    prodi.value = {};
    submitted.value = false;
    prodiDialog.value = true;
}

function hideDialog() {
    prodiDialog.value = false;
    submitted.value = false;
}

async function saveProdi() {
    submitted.value = true;

    if (!prodi.value.nama_prodi?.trim() || !prodi.value.kode_prodi?.trim()) {
        return;
    }

    try {
        if (prodi.value.id) {
            await prodiStore.updateProdi(prodi.value.id, {
                kode_prodi: prodi.value.kode_prodi,
                nama_prodi: prodi.value.nama_prodi
            });
            toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Data Prodi Diperbarui', life: 3000 });
        } else {
            await prodiStore.createProdi({
                kode_prodi: prodi.value.kode_prodi,
                nama_prodi: prodi.value.nama_prodi
            });
            toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Prodi Baru Dibuat', life: 3000 });
        }
        prodiDialog.value = false;
        prodi.value = {};
    } catch (error) {
        // --- PERBAIKAN DI SINI ---
        // Ambil pesan error spesifik dari backend, jika tidak ada, gunakan pesan default.
        const errorMessage = error.response?.data?.error || 'Terjadi kesalahan saat menyimpan';

        toast.add({
            severity: 'error',
            summary: 'Gagal',
            detail: errorMessage, // Gunakan pesan dari backend
            life: 4000 // Durasi sedikit lebih lama agar bisa dibaca
        });
    }
}

function editProdi(data) {
    prodi.value = { ...data };
    prodiDialog.value = true;
}

function confirmDeleteProdi(data) {
    prodi.value = data;
    deleteProdiDialog.value = true;
}

async function deleteProdi() {
    try {
        await prodiStore.deleteProdi(prodi.value.id);
        deleteProdiDialog.value = false;
        prodi.value = {};
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Data Prodi Dihapus', life: 3000 });
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Terjadi kesalahan saat menghapus', life: 3000 });
    }
}
</script>

<template>
    <div>
        <div class="card">
            <Toolbar class="mb-6">
                <template #start>
                    <Button label="Tambah Prodi" icon="pi pi-plus" severity="secondary" class="mr-2" @click="openNew" />
                </template>
                <template #end>
                    <Button label="Export" icon="pi pi-upload" severity="secondary" @click="exportCSV($event)" />
                </template>
            </Toolbar>

            <DataTable
                ref="dt"
                :value="prodiList"
                :loading="isLoading"
                dataKey="id"
                :paginator="true"
                :rows="10"
                :filters="filters"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                :rowsPerPageOptions="[5, 10, 25]"
                currentPageReportTemplate="Menampilkan {first} sampai {last} dari {totalRecords} prodi"
            >
                <template #header>
                    <div class="flex flex-wrap gap-2 items-center justify-between">
                        <h4 class="m-0">Manajemen Program Studi</h4>
                        <IconField>
                            <InputIcon>
                                <i class="pi pi-search" />
                            </InputIcon>
                            <InputText v-model="filters['global'].value" placeholder="Cari..." />
                        </IconField>
                    </div>
                </template>

                <Column field="kode_prodi" header="Kode Prodi" sortable style="min-width: 12rem"></Column>
                <Column field="nama_prodi" header="Nama Program Studi" sortable style="min-width: 16rem"></Column>
                <Column :exportable="false" style="min-width: 12rem" header="Aksi">
                    <template #body="slotProps">
                        <Button icon="pi pi-pencil" outlined rounded class="mr-2" @click="editProdi(slotProps.data)" />
                        <Button icon="pi pi-trash" outlined rounded severity="danger" @click="confirmDeleteProdi(slotProps.data)" />
                    </template>
                </Column>
            </DataTable>
        </div>

        <Dialog v-model:visible="prodiDialog" :style="{ width: '450px' }" header="Detail Program Studi" :modal="true">
            <div class="flex flex-col gap-6">
                <div>
                    <label for="kode_prodi" class="block font-bold mb-3">Kode Prodi</label>
                    <InputText id="kode_prodi" v-model.trim="prodi.kode_prodi" required="true" autofocus :invalid="submitted && !prodi.kode_prodi" fluid />
                    <small v-if="submitted && !prodi.kode_prodi" class="text-red-500">Kode Prodi harus diisi.</small>
                </div>
                <div>
                    <label for="nama_prodi" class="block font-bold mb-3">Nama Prodi</label>
                    <InputText id="nama_prodi" v-model.trim="prodi.nama_prodi" required="true" :invalid="submitted && !prodi.nama_prodi" fluid />
                    <small v-if="submitted && !prodi.nama_prodi" class="text-red-500">Nama Prodi harus diisi.</small>
                </div>
            </div>

            <template #footer>
                <Button label="Batal" icon="pi pi-times" text @click="hideDialog" />
                <Button label="Simpan" icon="pi pi-check" @click="saveProdi" />
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteProdiDialog" :style="{ width: '450px' }" header="Confirm" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl" />
                <span v-if="prodi"
                    >Apakah Anda yakin ingin menghapus <b>{{ prodi.nama_prodi }}</b
                    >?</span
                >
            </div>
            <template #footer>
                <Button label="Tidak" icon="pi pi-times" text @click="deleteProdiDialog = false" />
                <Button label="Ya" icon="pi pi-check" @click="deleteProdi" />
            </template>
        </Dialog>
    </div>
</template>
