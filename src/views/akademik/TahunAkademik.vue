<script setup>
import { useTahunAkademikStore } from '@/stores/tahunAkademik';
import { FilterMatchMode } from '@primevue/core/api';
import { storeToRefs } from 'pinia';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';

// --- Setup ---
const toast = useToast();
const store = useTahunAkademikStore();
const { list, isLoading } = storeToRefs(store);

const dialog = ref(false);
const deleteDialog = ref(false);
const data = ref({});
const submitted = ref(false);
const dt = ref();
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

onMounted(() => {
    store.fetchAll();
});

// Helper untuk format tanggal
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
    data.value = { is_active: false };
    submitted.value = false;
    dialog.value = true;
}

function hideDialog() {
    dialog.value = false;
    submitted.value = false;
}

async function saveData() {
    submitted.value = true;
    if (!data.value.nama?.trim() || !data.value.tanggal_mulai || !data.value.tanggal_selesai || !data.value.krs_mulai || !data.value.krs_selesai) {
        return;
    }

    try {
        const payload = {
            ...data.value,
            tanggal_mulai: formatDate(data.value.tanggal_mulai),
            tanggal_selesai: formatDate(data.value.tanggal_selesai),
            krs_mulai: formatDate(data.value.krs_mulai),
            krs_selesai: formatDate(data.value.krs_selesai)
        };

        if (data.value.id) {
            await store.update(data.value.id, payload);
            toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Data Diperbarui', life: 3000 });
        } else {
            await store.create(payload);
            toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Data Baru Dibuat', life: 3000 });
        }
        dialog.value = false;
        data.value = {};
    } catch (error) {
        const errorMessage = error.response?.data?.error || 'Terjadi kesalahan saat menyimpan';
        toast.add({ severity: 'error', summary: 'Gagal', detail: errorMessage, life: 4000 });
    }
}

function editData(editData) {
    data.value = {
        ...editData,
        tanggal_mulai: new Date(editData.tanggal_mulai),
        tanggal_selesai: new Date(editData.tanggal_selesai),
        krs_mulai: new Date(editData.krs_mulai),
        krs_selesai: new Date(editData.krs_selesai)
    };
    dialog.value = true;
}

function confirmDelete(deleteData) {
    data.value = deleteData;
    deleteDialog.value = true;
}

async function deleteData() {
    try {
        await store.delete(data.value.id);
        deleteDialog.value = false;
        data.value = {};
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Data Dihapus', life: 3000 });
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
                    <Button label="Tambah Tahun Akademik" icon="pi pi-plus" severity="secondary" class="mr-2" @click="openNew" />
                </template>
            </Toolbar>

            <DataTable
                ref="dt"
                :value="list"
                :loading="isLoading"
                dataKey="id"
                :paginator="true"
                :rows="10"
                :filters="filters"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                :rowsPerPageOptions="[5, 10, 25]"
                currentPageReportTemplate="Menampilkan {first} sampai {last} dari {totalRecords} data"
            >
                <template #header>
                    <div class="flex flex-wrap gap-2 items-center justify-between">
                        <h4 class="m-0">Manajemen Tahun Akademik</h4>
                        <IconField>
                            <InputIcon> <i class="pi pi-search" /> </InputIcon>
                            <InputText v-model="filters['global'].value" placeholder="Cari..." />
                        </IconField>
                    </div>
                </template>

                <Column field="nama" header="Nama" sortable style="min-width: 16rem"></Column>
                <Column field="tanggal_mulai" header="Tanggal Mulai" sortable></Column>
                <Column field="tanggal_selesai" header="Tanggal Selesai" sortable></Column>
                <Column field="is_active" header="Status" sortable>
                    <template #body="slotProps">
                        <Tag :value="slotProps.data.is_active ? 'AKTIF' : 'NONAKTIF'" :severity="slotProps.data.is_active ? 'success' : 'danger'" />
                    </template>
                </Column>
                <Column :exportable="false" style="min-width: 12rem" header="Aksi">
                    <template #body="slotProps">
                        <Button icon="pi pi-pencil" outlined rounded class="mr-2" @click="editData(slotProps.data)" />
                        <Button icon="pi pi-trash" outlined rounded severity="danger" @click="confirmDelete(slotProps.data)" />
                    </template>
                </Column>
            </DataTable>
        </div>

        <Dialog v-model:visible="dialog" :style="{ width: '450px' }" header="Detail Tahun Akademik" :modal="true">
            <div class="flex flex-col gap-6">
                <div>
                    <label for="nama" class="block font-bold mb-3">Nama Tahun Akademik</label>
                    <InputText id="nama" v-model.trim="data.nama" required autofocus :invalid="submitted && !data.nama" fluid />
                </div>
                <div>
                    <label for="tanggal_mulai" class="block font-bold mb-3">Tanggal Mulai</label>
                    <Calendar id="tanggal_mulai" v-model="data.tanggal_mulai" dateFormat="yy-mm-dd" required :invalid="submitted && !data.tanggal_mulai" />
                </div>
                <div>
                    <label for="tanggal_selesai" class="block font-bold mb-3">Tanggal Selesai</label>
                    <Calendar id="tanggal_selesai" v-model="data.tanggal_selesai" dateFormat="yy-mm-dd" required :invalid="submitted && !data.tanggal_selesai" />
                </div>
                <div>
                    <label for="krs_mulai" class="block font-bold mb-3">KRS Mulai</label>
                    <Calendar id="krs_mulai" v-model="data.krs_mulai" dateFormat="yy-mm-dd" required :invalid="submitted && !data.krs_mulai" />
                </div>
                <div>
                    <label for="krs_selesai" class="block font-bold mb-3">KRS Selesai</label>
                    <Calendar id="krs_selesai" v-model="data.krs_selesai" dateFormat="yy-mm-dd" required :invalid="submitted && !data.krs_selesai" />
                </div>
                <div class="flex items-center">
                    <InputSwitch v-model="data.is_active" />
                    <label for="is_active" class="ml-2 font-bold">Aktif</label>
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
                <span v-if="data"
                    >Apakah Anda yakin ingin menghapus <b>{{ data.nama }}</b
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
