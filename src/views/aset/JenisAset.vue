<script setup>
import { useJenisAsetStore } from '@/stores/jenisAset';
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
const jenisAsetStore = useJenisAsetStore();
const { jenisAsetList, isLoading } = storeToRefs(jenisAsetStore);

const dialog = ref(false);
const deleteDialog = ref(false);
const jenisAset = ref({});
const submitted = ref(false);
const dt = ref();
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

const kelompokOptions = ref(['Sarana', 'Prasarana']);

onMounted(() => {
    jenisAsetStore.fetchJenisAset();
});

// --- Export Functions ---
const exportItems = ref([
    { label: 'CSV', icon: 'pi pi-file', command: () => dt.value.exportCSV() },
    { label: 'CSV', icon: 'pi pi-file-excel', command: exportExcel },
    { label: 'PDF', icon: 'pi pi-file-pdf', command: exportPDF }
]);

function exportExcel() {
    const data = jenisAsetList.value;
    exportToCsv(data, 'data-jenis-aset.csv');
}

function exportPDF() {
    const doc = new jsPDF();
    const tableHead = [['Nama Jenis', 'Kelompok', 'Deskripsi']];
    const tableBody = jenisAsetList.value.map((item) => [item.nama_jenis, item.kelompok, item.deskripsi]);
    autoTable(doc, { head: tableHead, body: tableBody });
    doc.save('data-jenis-aset.pdf');
}

// --- CRUD Functions ---
function openNew() {
    jenisAset.value = {};
    submitted.value = false;
    dialog.value = true;
}

function hideDialog() {
    dialog.value = false;
    submitted.value = false;
}

async function saveData() {
    submitted.value = true;
    if (!jenisAset.value.nama_jenis?.trim() || !jenisAset.value.kelompok) {
        return;
    }

    try {
        const payload = {
            nama_jenis: jenisAset.value.nama_jenis,
            deskripsi: jenisAset.value.deskripsi,
            kelompok: jenisAset.value.kelompok
        };
        if (jenisAset.value.id) {
            await jenisAsetStore.updateJenisAset(jenisAset.value.id, payload);
            toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Data Diperbarui', life: 3000 });
        } else {
            await jenisAsetStore.createJenisAset(payload);
            toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Data Baru Dibuat', life: 3000 });
        }
        dialog.value = false;
        jenisAset.value = {};
    } catch (error) {
        const errorMessage = error.response?.data?.error || 'Terjadi kesalahan saat menyimpan';
        toast.add({ severity: 'error', summary: 'Gagal', detail: errorMessage, life: 4000 });
    }
}

function editData(data) {
    jenisAset.value = { ...data };
    dialog.value = true;
}

function confirmDelete(data) {
    jenisAset.value = data;
    deleteDialog.value = true;
}

async function deleteData() {
    try {
        await jenisAsetStore.deleteJenisAset(jenisAset.value.id);
        deleteDialog.value = false;
        jenisAset.value = {};
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
                    <Button label="Tambah Jenis Aset" icon="pi pi-plus" severity="secondary" class="mr-2" @click="openNew" />
                </template>
                <template #end>
                    <SplitButton label="Export" icon="pi pi-upload" :model="exportItems" severity="secondary"></SplitButton>
                </template>
            </Toolbar>

            <DataTable
                ref="dt"
                :value="jenisAsetList"
                :loading="isLoading"
                dataKey="id"
                :paginator="true"
                :rows="10"
                :filters="filters"
                export-filename="data-jenis-aset"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                :rowsPerPageOptions="[5, 10, 25]"
                currentPageReportTemplate="Menampilkan {first} sampai {last} dari {totalRecords} data"
            >
                <template #header>
                    <div class="flex flex-wrap gap-2 items-center justify-between">
                        <h4 class="m-0">Manajemen Jenis Aset</h4>
                        <IconField>
                            <InputIcon> <i class="pi pi-search" /> </InputIcon>
                            <InputText v-model="filters['global'].value" placeholder="Cari..." />
                        </IconField>
                    </div>
                </template>

                <Column field="nama_jenis" header="Nama Jenis" sortable style="min-width: 16rem"></Column>
                <Column field="kelompok" header="Kelompok" sortable style="min-width: 10rem"></Column>
                <Column field="deskripsi" header="Deskripsi" sortable style="min-width: 20rem"></Column>
                <Column :exportable="false" style="min-width: 12rem" header="Aksi">
                    <template #body="slotProps">
                        <Button icon="pi pi-pencil" outlined rounded class="mr-2" @click="editData(slotProps.data)" v-tooltip.top="'Edit Data'" />
                        <Button icon="pi pi-trash" outlined rounded severity="danger" @click="confirmDelete(slotProps.data)" v-tooltip.top="'Hapus Data'" />
                    </template>
                </Column>
            </DataTable>
        </div>

        <Dialog v-model:visible="dialog" :style="{ width: '450px' }" header="Detail Jenis Aset" :modal="true">
            <div class="flex flex-col gap-6">
                <div>
                    <label for="nama_jenis" class="block font-bold mb-3">Nama Jenis</label>
                    <InputText id="nama_jenis" v-model.trim="jenisAset.nama_jenis" required="true" autofocus :invalid="submitted && !jenisAset.nama_jenis" fluid />
                    <small v-if="submitted && !jenisAset.nama_jenis" class="text-red-500">Nama Jenis harus diisi.</small>
                </div>
                <div>
                    <label for="kelompok" class="block font-bold mb-3">Kelompok</label>
                    <Dropdown id="kelompok" v-model="jenisAset.kelompok" :options="kelompokOptions" placeholder="Pilih Kelompok" :invalid="submitted && !jenisAset.kelompok" fluid />
                    <small v-if="submitted && !jenisAset.kelompok" class="text-red-500">Kelompok harus dipilih.</small>
                </div>
                <div>
                    <label for="deskripsi" class="block font-bold mb-3">Deskripsi</label>
                    <Textarea id="deskripsi" v-model.trim="jenisAset.deskripsi" rows="3" fluid />
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
                <span v-if="jenisAset"
                    >Apakah Anda yakin ingin menghapus <b>{{ jenisAset.nama_jenis }}</b
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
