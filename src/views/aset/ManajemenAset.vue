<script setup>
import { useAsetStore } from '@/stores/aset';
import { useJenisAsetStore } from '@/stores/jenisAset';
import { useLookupStore } from '@/stores/lookup';
import { FilterMatchMode } from '@primevue/core/api';
import { storeToRefs } from 'pinia';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';

// --- Setup ---
const toast = useToast();
const asetStore = useAsetStore();
const jenisAsetStore = useJenisAsetStore();
const lookupStore = useLookupStore();

const { asetList, isLoading } = storeToRefs(asetStore);
const { jenisAsetList } = storeToRefs(jenisAsetStore);
const { kondisiAset } = storeToRefs(lookupStore);

const dialog = ref(false);
const deleteDialog = ref(false);
const aset = ref({});
const submitted = ref(false);
const dt = ref();
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

onMounted(() => {
    asetStore.fetchAset();
    jenisAsetStore.fetchJenisAset();
    lookupStore.fetchKondisiAset();
});

function formatDate(date) {
    if (!date) return null;
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
}

// --- CRUD Functions ---
function openNew() {
    aset.value = {};
    submitted.value = false;
    dialog.value = true;
}

function hideDialog() {
    dialog.value = false;
    submitted.value = false;
}

async function saveData() {
    submitted.value = true;
    if (!aset.value.nama_aset?.trim() || !aset.value.kode_aset?.trim() || !aset.value.jenis_aset_id || !aset.value.kondisi) {
        return;
    }

    try {
        const payload = { ...aset.value, tanggal_pembelian: formatDate(aset.value.tanggal_pembelian) };
        // Pastikan jenis_aset_id adalah string, bukan objek
        if (typeof payload.jenis_aset_id === 'object' && payload.jenis_aset_id !== null) {
            payload.jenis_aset_id = payload.jenis_aset_id.id;
        }

        if (aset.value.id) {
            await asetStore.updateAset(aset.value.id, payload);
            toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Data Aset Diperbarui', life: 3000 });
        } else {
            await asetStore.createAset(payload);
            toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Aset Baru Dibuat', life: 3000 });
        }
        dialog.value = false;
        aset.value = {};
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

function editData(data) {
    aset.value = { ...data };
    dialog.value = true;
}

function confirmDelete(data) {
    aset.value = data;
    deleteDialog.value = true;
}

async function deleteData() {
    try {
        await asetStore.deleteAset(aset.value.id);
        deleteDialog.value = false;
        aset.value = {};
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Data Aset Dihapus', life: 3000 });
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
                    <Button label="Tambah Aset" icon="pi pi-plus" severity="secondary" class="mr-2" @click="openNew" />
                </template>
            </Toolbar>

            <DataTable
                ref="dt"
                :value="asetList"
                :loading="isLoading"
                dataKey="id"
                :paginator="true"
                :rows="10"
                :filters="filters"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                :rowsPerPageOptions="[5, 10, 25]"
                currentPageReportTemplate="Menampilkan {first} sampai {last} dari {totalRecords} aset"
            >
                <template #header>
                    <div class="flex flex-wrap gap-2 items-center justify-between">
                        <h4 class="m-0">Manajemen Aset</h4>
                        <IconField>
                            <InputIcon> <i class="pi pi-search" /> </InputIcon>
                            <InputText v-model="filters['global'].value" placeholder="Cari..." />
                        </IconField>
                    </div>
                </template>

                <Column field="kode_aset" header="Kode Aset" sortable style="min-width: 12rem"></Column>
                <Column field="nama_aset" header="Nama Aset" sortable style="min-width: 16rem"></Column>
                <Column field="nama_jenis" header="Jenis Aset" sortable style="min-width: 12rem"></Column>
                <Column field="kondisi" header="Kondisi" sortable style="min-width: 10rem"></Column>
                <Column field="tanggal_pembelian" header="Tgl. Pembelian" sortable style="min-width: 10rem"></Column>
                <Column :exportable="false" style="min-width: 12rem" header="Aksi">
                    <template #body="slotProps">
                        <Button icon="pi pi-pencil" outlined rounded class="mr-2" @click="editData(slotProps.data)" />
                        <Button icon="pi pi-trash" outlined rounded severity="danger" @click="confirmDelete(slotProps.data)" />
                    </template>
                </Column>
            </DataTable>
        </div>

        <Dialog v-model:visible="dialog" :style="{ width: '450px' }" header="Detail Aset" :modal="true">
            <div class="flex flex-col gap-6">
                <div>
                    <label for="kode_aset" class="block font-bold mb-3">Kode Aset</label>
                    <InputText id="kode_aset" v-model.trim="aset.kode_aset" required :invalid="submitted && !aset.kode_aset" fluid />
                </div>
                <div>
                    <label for="nama_aset" class="block font-bold mb-3">Nama Aset</label>
                    <InputText id="nama_aset" v-model.trim="aset.nama_aset" required :invalid="submitted && !aset.nama_aset" fluid />
                </div>
                <div>
                    <label for="jenis_aset_id" class="block font-bold mb-3">Jenis Aset</label>
                    <Dropdown id="jenis_aset_id" v-model="aset.jenis_aset_id" :options="jenisAsetList" optionLabel="nama_jenis" optionValue="id" placeholder="Pilih Jenis Aset" :invalid="submitted && !aset.jenis_aset_id" fluid />
                </div>
                <div>
                    <label for="kondisi" class="block font-bold mb-3">Kondisi</label>
                    <Dropdown id="kondisi" v-model="aset.kondisi" :options="kondisiAset" placeholder="Pilih Kondisi" :invalid="submitted && !aset.kondisi" fluid />
                </div>
                <div>
                    <label for="tanggal_pembelian" class="block font-bold mb-3">Tanggal Pembelian</label>
                    <Calendar id="tanggal_pembelian" v-model="aset.tanggal_pembelian" dateFormat="yy-mm-dd" />
                </div>
                <div>
                    <label for="deskripsi" class="block font-bold mb-3">Deskripsi</label>
                    <Textarea id="deskripsi" v-model.trim="aset.deskripsi" rows="3" fluid />
                </div>
            </div>
            <template #footer>
                <Button label="Batal" icon="pi pi-times" text @click="hideDialog" />
                <Button label="Simpan" icon="pi pi-check" @click="saveData" />
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteDialog" :style="{ width: '450px' }" header="Konfirmasi" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl" />
                <span v-if="aset"
                    >Apakah Anda yakin ingin menghapus <b>{{ aset.nama_aset }}</b
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
