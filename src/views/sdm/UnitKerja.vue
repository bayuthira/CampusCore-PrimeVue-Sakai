<script setup>
import { useUnitKerjaStore } from '@/stores/unitKerja';
import { FilterMatchMode } from '@primevue/core/api';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import autoTable from 'jspdf-autotable';
import { storeToRefs } from 'pinia';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';
import { exportToCsv } from '@/utils/exportCsv';

// --- Setup ---
const toast = useToast();
const store = useUnitKerjaStore();
const { list, isLoading } = storeToRefs(store); // 'list' akan digunakan untuk tabel dan dropdown induk

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

// --- Export Functions ---
const exportItems = ref([
    { label: 'CSV', icon: 'pi pi-file', command: () => dt.value.exportCSV() },
    { label: 'CSV', icon: 'pi pi-file-excel', command: exportExcel },
    { label: 'PDF', icon: 'pi pi-file-pdf', command: exportPDF }
]);

function exportExcel() {
    const data = list.value;
    exportToCsv(data, 'data-unit-kerja.csv');
}

function exportPDF() {
    const doc = new jsPDF();
    const tableHead = [['Kode Unit', 'Nama Unit', 'Status']];
    const tableBody = list.value.map((item) => [item.kode_unit, item.nama_unit, item.is_active ? 'Aktif' : 'Non-Aktif']);
    autoTable(doc, { head: tableHead, body: tableBody });
    doc.save('data-unit-kerja.pdf');
}

// --- CRUD Functions ---
function openNew() {
    data.value = { is_active: true }; // Default aktif
    submitted.value = false;
    dialog.value = true;
}

function editData(editData) {
    data.value = { ...editData };
    submitted.value = false;
    dialog.value = true;
}

function hideDialog() {
    dialog.value = false;
    submitted.value = false;
}

async function saveData() {
    submitted.value = true;
    if (!data.value.kode_unit?.trim() || !data.value.nama_unit?.trim()) {
        toast.add({ severity: 'warn', summary: 'Perhatian', detail: 'Kode Unit dan Nama Unit wajib diisi.', life: 3000 });
        return;
    }

    try {
        const payload = {
            ...data.value
        };

        if (data.value.id) {
            await store.update(data.value.id, payload);
            toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Data Unit Kerja Diperbarui', life: 3000 });
        } else {
            await store.create(payload);
            toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Unit Kerja Baru Dibuat', life: 3000 });
        }
        dialog.value = false;
        data.value = {};
    } catch (error) {
        const errorMessage = error.response?.data?.error || 'Terjadi kesalahan saat menyimpan';
        toast.add({ severity: 'error', summary: 'Gagal', detail: errorMessage, life: 4000 });
    }
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
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Data Unit Kerja Dihapus', life: 3000 });
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
                    <Button label="Tambah Unit Kerja" icon="pi pi-plus" severity="secondary" class="mr-2" @click="openNew" />
                </template>
                <template #end>
                    <SplitButton label="Export" icon="pi pi-upload" :model="exportItems" severity="secondary"></SplitButton>
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
                export-filename="data-unit-kerja"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                :rowsPerPageOptions="[5, 10, 25]"
                currentPageReportTemplate="Menampilkan {first} sampai {last} dari {totalRecords} unit kerja"
            >
                <template #header>
                    <div class="flex flex-wrap gap-2 items-center justify-between">
                        <h4 class="m-0">Manajemen Unit Kerja</h4>
                        <IconField>
                            <InputIcon> <i class="pi pi-search" /> </InputIcon>
                            <InputText v-model="filters['global'].value" placeholder="Cari..." />
                        </IconField>
                    </div>
                </template>

                <Column field="kode_unit" header="Kode Unit" sortable style="min-width: 12rem"></Column>
                <Column field="nama_unit" header="Nama Unit Kerja" sortable style="min-width: 16rem"></Column>
                <Column field="is_active" header="Status" sortable>
                    <template #body="slotProps">
                        <Tag :value="slotProps.data.is_active ? 'Aktif' : 'Non-Aktif'" :severity="slotProps.data.is_active ? 'success' : 'danger'" />
                    </template>
                </Column>
                <Column :exportable="false" style="min-width: 12rem" header="Aksi">
                    <template #body="slotProps">
                        <Button icon="pi pi-pencil" outlined rounded class="mr-2" @click="editData(slotProps.data)" v-tooltip.top="'Edit Unit Kerja'" />
                        <Button icon="pi pi-trash" outlined rounded severity="danger" @click="confirmDelete(slotProps.data)" v-tooltip.top="'Hapus Unit Kerja'" />
                    </template>
                </Column>
            </DataTable>
        </div>

        <Dialog v-model:visible="dialog" :style="{ width: '450px' }" header="Detail Unit Kerja" :modal="true">
            <div class="flex flex-col gap-6">
                <div>
                    <label for="kode_unit" class="block font-bold mb-3">Kode Unit *</label>
                    <InputText id="kode_unit" v-model.trim="data.kode_unit" required autofocus :invalid="submitted && !data.kode_unit" fluid />
                    <small v-if="submitted && !data.kode_unit" class="text-red-500">Kode Unit wajib diisi.</small>
                </div>
                <div>
                    <label for="nama_unit" class="block font-bold mb-3">Nama Unit *</label>
                    <InputText id="nama_unit" v-model.trim="data.nama_unit" required :invalid="submitted && !data.nama_unit" fluid />
                    <small v-if="submitted && !data.nama_unit" class="text-red-500">Nama Unit wajib diisi.</small>
                </div>
                <div>
                    <label for="induk_unit" class="block font-bold mb-3">Induk Unit (Opsional)</label>
                    <Dropdown id="induk_unit" v-model="data.induk_unit_id" :options="list" optionLabel="nama_unit" optionValue="id" placeholder="Pilih Induk Unit" fluid filter showClear />
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
                    >Apakah Anda yakin ingin menghapus <b>{{ data.nama_unit }}</b
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
