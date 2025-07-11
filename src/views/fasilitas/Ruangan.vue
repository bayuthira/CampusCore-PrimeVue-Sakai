<script setup>
import { useRuanganStore } from '@/stores/ruangan';
import { FilterMatchMode } from '@primevue/core/api';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import autoTable from 'jspdf-autotable';
import { storeToRefs } from 'pinia';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';
import * as XLSX from 'xlsx';

// --- Setup ---
const toast = useToast();
const ruanganStore = useRuanganStore();
const { ruanganList, isLoading } = storeToRefs(ruanganStore);

const ruanganDialog = ref(false);
const deleteRuanganDialog = ref(false);
const ruangan = ref({});
const submitted = ref(false);
const dt = ref();
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

onMounted(() => {
    ruanganStore.fetchRuangan();
});

// --- Export Functions ---
const exportItems = ref([
    { label: 'CSV', icon: 'pi pi-file', command: () => dt.value.exportCSV() },
    { label: 'Excel', icon: 'pi pi-file-excel', command: exportExcel },
    { label: 'PDF', icon: 'pi pi-file-pdf', command: exportPDF }
]);

function exportExcel() {
    const data = ruanganList.value;
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Ruangan');
    XLSX.writeFile(workbook, 'data-ruangan.xlsx');
}

function exportPDF() {
    const doc = new jsPDF();
    const tableHead = [['Kode Ruangan', 'Nama Ruangan', 'Kapasitas']];
    const tableBody = ruanganList.value.map((item) => [item.kode_ruangan, item.nama_ruangan, item.kapasitas]);
    autoTable(doc, { head: tableHead, body: tableBody });
    doc.save('data-ruangan.pdf');
}

// --- CRUD Functions ---
function openNew() {
    ruangan.value = {};
    submitted.value = false;
    ruanganDialog.value = true;
}

function hideDialog() {
    ruanganDialog.value = false;
    submitted.value = false;
}

async function saveRuangan() {
    submitted.value = true;
    if (!ruangan.value.nama_ruangan?.trim() || !ruangan.value.kode_ruangan?.trim() || !ruangan.value.kapasitas) {
        return;
    }

    try {
        const payload = {
            kode_ruangan: ruangan.value.kode_ruangan,
            nama_ruangan: ruangan.value.nama_ruangan,
            kapasitas: ruangan.value.kapasitas
        };
        if (ruangan.value.id) {
            await ruanganStore.updateRuangan(ruangan.value.id, payload);
            toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Data Ruangan Diperbarui', life: 3000 });
        } else {
            await ruanganStore.createRuangan(payload);
            toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Ruangan Baru Dibuat', life: 3000 });
        }
        ruanganDialog.value = false;
        ruangan.value = {};
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

function editRuangan(data) {
    ruangan.value = { ...data };
    ruanganDialog.value = true;
}

function confirmDeleteRuangan(data) {
    ruangan.value = data;
    deleteRuanganDialog.value = true;
}

async function deleteRuangan() {
    try {
        await ruanganStore.deleteRuangan(ruangan.value.id);
        deleteRuanganDialog.value = false;
        ruangan.value = {};
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Data Ruangan Dihapus', life: 3000 });
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
                    <Button label="Tambah Ruangan" icon="pi pi-plus" severity="secondary" class="mr-2" @click="openNew" />
                </template>
                <template #end>
                    <SplitButton label="Export" icon="pi pi-upload" :model="exportItems" severity="secondary"></SplitButton>
                </template>
            </Toolbar>

            <DataTable
                ref="dt"
                :value="ruanganList"
                :loading="isLoading"
                dataKey="id"
                :paginator="true"
                :rows="10"
                :filters="filters"
                export-filename="data-ruangan"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                :rowsPerPageOptions="[5, 10, 25]"
                currentPageReportTemplate="Menampilkan {first} sampai {last} dari {totalRecords} ruangan"
            >
                <template #header>
                    <div class="flex flex-wrap gap-2 items-center justify-between">
                        <h4 class="m-0">Manajemen Ruangan</h4>
                        <IconField>
                            <InputIcon> <i class="pi pi-search" /> </InputIcon>
                            <InputText v-model="filters['global'].value" placeholder="Cari..." />
                        </IconField>
                    </div>
                </template>

                <Column field="kode_ruangan" header="Kode Ruangan" sortable style="min-width: 12rem"></Column>
                <Column field="nama_ruangan" header="Nama Ruangan" sortable style="min-width: 16rem"></Column>
                <Column field="kapasitas" header="Kapasitas" sortable style="min-width: 8rem"></Column>
                <Column :exportable="false" style="min-width: 12rem" header="Aksi">
                    <template #body="slotProps">
                        <Button icon="pi pi-pencil" outlined rounded class="mr-2" @click="editRuangan(slotProps.data)" />
                        <Button icon="pi pi-trash" outlined rounded severity="danger" @click="confirmDeleteRuangan(slotProps.data)" />
                    </template>
                </Column>
            </DataTable>
        </div>

        <Dialog v-model:visible="ruanganDialog" :style="{ width: '450px' }" header="Detail Ruangan" :modal="true">
            <div class="flex flex-col gap-6">
                <div>
                    <label for="kode_ruangan" class="block font-bold mb-3">Kode Ruangan</label>
                    <InputText id="kode_ruangan" v-model.trim="ruangan.kode_ruangan" required="true" autofocus :invalid="submitted && !ruangan.kode_ruangan" fluid />
                    <small v-if="submitted && !ruangan.kode_ruangan" class="text-red-500">Kode Ruangan harus diisi.</small>
                </div>
                <div>
                    <label for="nama_ruangan" class="block font-bold mb-3">Nama Ruangan</label>
                    <InputText id="nama_ruangan" v-model.trim="ruangan.nama_ruangan" required="true" :invalid="submitted && !ruangan.nama_ruangan" fluid />
                    <small v-if="submitted && !ruangan.nama_ruangan" class="text-red-500">Nama Ruangan harus diisi.</small>
                </div>
                <div>
                    <label for="kapasitas" class="block font-bold mb-3">Kapasitas</label>
                    <InputNumber id="kapasitas" v-model="ruangan.kapasitas" required="true" :invalid="submitted && !ruangan.kapasitas" />
                    <small v-if="submitted && !ruangan.kapasitas" class="text-red-500">Kapasitas harus diisi.</small>
                </div>
            </div>
            <template #footer>
                <Button label="Batal" icon="pi pi-times" text @click="hideDialog" />
                <Button label="Simpan" icon="pi pi-check" @click="saveRuangan" />
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteRuanganDialog" :style="{ width: '450px' }" header="Konfirmasi" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl" />
                <span v-if="ruangan"
                    >Apakah Anda yakin ingin menghapus <b>{{ ruangan.nama_ruangan }}</b
                    >?</span
                >
            </div>
            <template #footer>
                <Button label="Tidak" icon="pi pi-times" text @click="deleteRuanganDialog = false" />
                <Button label="Ya" icon="pi pi-check" @click="deleteRuangan" />
            </template>
        </Dialog>
    </div>
</template>
