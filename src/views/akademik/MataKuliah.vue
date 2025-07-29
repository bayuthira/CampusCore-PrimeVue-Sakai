<script setup>
import { useMataKuliahStore } from '@/stores/matakuliah';
import { useProdiStore } from '@/stores/prodi';
import { FilterMatchMode } from '@primevue/core/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { storeToRefs } from 'pinia';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';
import * as XLSX from 'xlsx';

// --- Setup Store dan State ---
const toast = useToast();
const mataKuliahStore = useMataKuliahStore();
const prodiStore = useProdiStore();
const { mataKuliahList, isLoading } = storeToRefs(mataKuliahStore);
const { prodiList } = storeToRefs(prodiStore);
const mataKuliahDialog = ref(false);
const deleteMataKuliahDialog = ref(false);
const mataKuliah = ref({});
const submitted = ref(false);
const dt = ref();
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

onMounted(() => {
    mataKuliahStore.fetchMataKuliah();
    prodiStore.fetchProdi();
});

// --- Fungsi-fungsi Export ---
function exportCSV() {
    dt.value.exportCSV();
}
function exportExcel() {
    const data = mataKuliahList.value;
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'MataKuliah');
    XLSX.writeFile(workbook, 'data-matakuliah.xlsx');
}
function exportPDF() {
    const doc = new jsPDF();
    const tableHead = [['Kode', 'Nama Mata Kuliah', 'SKS', 'Semester', 'Program Studi']]; // Ditambah semester
    const tableBody = mataKuliahList.value.map((item) => [item.kode_mk, item.nama_mk, item.sks, item.semester_target, item.nama_prodi]);
    autoTable(doc, { head: tableHead, body: tableBody });
    doc.save('data-matakuliah.pdf');
}
const exportItems = ref([
    { label: 'CSV', icon: 'pi pi-file', command: exportCSV },
    { label: 'Excel', icon: 'pi pi-file-excel', command: exportExcel },
    { label: 'PDF', icon: 'pi pi-file-pdf', command: exportPDF }
]);

// --- Fungsi-fungsi CRUD ---
function openNew() {
    mataKuliah.value = {};
    submitted.value = false;
    mataKuliahDialog.value = true;
}

function hideDialog() {
    mataKuliahDialog.value = false;
    submitted.value = false;
}

async function saveMataKuliah() {
    submitted.value = true;
    // Validasi diperbarui dengan semester_target
    if (!mataKuliah.value.nama_mk?.trim() || !mataKuliah.value.kode_mk?.trim() || !mataKuliah.value.prodi_id || !mataKuliah.value.sks || !mataKuliah.value.semester_target) {
        return;
    }

    try {
        // Payload diperbarui dengan semester_target
        const payload = {
            kode_mk: mataKuliah.value.kode_mk,
            nama_mk: mataKuliah.value.nama_mk,
            sks: mataKuliah.value.sks,
            semester_target: mataKuliah.value.semester_target,
            prodi_id: mataKuliah.value.prodi_id.id || mataKuliah.value.prodi_id
        };

        if (mataKuliah.value.id) {
            // Update
            await mataKuliahStore.updateMataKuliah(mataKuliah.value.id, payload);
            toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Data Mata Kuliah Diperbarui', life: 3000 });
        } else {
            // Create
            await mataKuliahStore.createMataKuliah(payload);
            toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Mata Kuliah Baru Dibuat', life: 3000 });
        }
        mataKuliahDialog.value = false;
        mataKuliah.value = {};
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

function editMataKuliah(data) {
    mataKuliah.value = { ...data };
    mataKuliahDialog.value = true;
}

function confirmDeleteMataKuliah(data) {
    mataKuliah.value = data;
    deleteMataKuliahDialog.value = true;
}

async function deleteMataKuliah() {
    try {
        await mataKuliahStore.deleteMataKuliah(mataKuliah.value.id);
        deleteMataKuliahDialog.value = false;
        mataKuliah.value = {};
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Data Mata Kuliah Dihapus', life: 3000 });
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
                    <Button label="Tambah Mata Kuliah" icon="pi pi-plus" severity="secondary" class="mr-2" @click="openNew" />
                </template>
                <template #end>
                    <SplitButton label="Export" icon="pi pi-upload" :model="exportItems" severity="secondary"></SplitButton>
                </template>
            </Toolbar>

            <DataTable
                ref="dt"
                :value="mataKuliahList"
                :loading="isLoading"
                dataKey="id"
                :paginator="true"
                :rows="10"
                :filters="filters"
                export-filename="data-matakuliah"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                :rowsPerPageOptions="[5, 10, 25]"
                currentPageReportTemplate="Menampilkan {first} sampai {last} dari {totalRecords} mata kuliah"
            >
                <template #header>
                    <div class="flex flex-wrap gap-2 items-center justify-between">
                        <h4 class="m-0">Manajemen Mata Kuliah</h4>
                        <IconField>
                            <InputIcon>
                                <i class="pi pi-search" />
                            </InputIcon>
                            <InputText v-model="filters['global'].value" placeholder="Cari..." />
                        </IconField>
                    </div>
                </template>

                <Column field="kode_mk" header="Kode MK" sortable style="min-width: 12rem"></Column>
                <Column field="nama_mk" header="Nama Mata Kuliah" sortable style="min-width: 16rem"></Column>
                <Column field="sks" header="SKS" sortable style="min-width: 8rem"></Column>
                <Column field="semester_target" header="Semester" sortable style="min-width: 8rem"></Column> <Column field="nama_prodi" header="Program Studi" sortable style="min-width: 16rem"></Column>
                <Column :exportable="false" style="min-width: 12rem" header="Aksi">
                    <template #body="slotProps">
                        <Button icon="pi pi-pencil" outlined rounded class="mr-2" @click="editMataKuliah(slotProps.data)" v-tooltip.top="'Edit Data'" />
                        <Button icon="pi pi-trash" outlined rounded severity="danger" @click="confirmDeleteMataKuliah(slotProps.data)" v-tooltip.top="'Hapus Data'" />
                    </template>
                </Column>
            </DataTable>
        </div>

        <Dialog v-model:visible="mataKuliahDialog" :style="{ width: '450px' }" header="Detail Mata Kuliah" :modal="true">
            <div class="flex flex-col gap-6">
                <div>
                    <label for="kode_mk" class="block font-bold mb-3">Kode Mata Kuliah</label>
                    <InputText id="kode_mk" v-model.trim="mataKuliah.kode_mk" required="true" autofocus :invalid="submitted && !mataKuliah.kode_mk" fluid />
                    <small v-if="submitted && !mataKuliah.kode_mk" class="text-red-500">Kode MK harus diisi.</small>
                </div>
                <div>
                    <label for="nama_mk" class="block font-bold mb-3">Nama Mata Kuliah</label>
                    <InputText id="nama_mk" v-model.trim="mataKuliah.nama_mk" required="true" :invalid="submitted && !mataKuliah.nama_mk" fluid />
                    <small v-if="submitted && !mataKuliah.nama_mk" class="text-red-500">Nama MK harus diisi.</small>
                </div>
                <div>
                    <label for="sks" class="block font-bold mb-3">SKS</label>
                    <InputNumber id="sks" v-model="mataKuliah.sks" required="true" :invalid="submitted && !mataKuliah.sks" />
                    <small v-if="submitted && !mataKuliah.sks" class="text-red-500">SKS harus diisi.</small>
                </div>
                <div>
                    <label for="semester_target" class="block font-bold mb-3">Semester Target</label>
                    <InputNumber id="semester_target" v-model="mataKuliah.semester_target" required="true" :invalid="submitted && !mataKuliah.semester_target" />
                    <small v-if="submitted && !mataKuliah.semester_target" class="text-red-500">Semester harus diisi.</small>
                </div>
                <div>
                    <label for="prodi_id" class="block font-bold mb-3">Program Studi</label>
                    <Dropdown id="prodi_id" v-model="mataKuliah.prodi_id" :options="prodiList" optionLabel="nama_prodi" optionValue="id" placeholder="Pilih Program Studi" :invalid="submitted && !mataKuliah.prodi_id" fluid />
                    <small v-if="submitted && !mataKuliah.prodi_id" class="text-red-500">Program Studi harus dipilih.</small>
                </div>
            </div>
            <template #footer>
                <Button label="Batal" icon="pi pi-times" text @click="hideDialog" />
                <Button label="Simpan" icon="pi pi-check" @click="saveMataKuliah" />
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteMataKuliahDialog" :style="{ width: '450px' }" header="Confirm" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl" />
                <span v-if="mataKuliah"
                    >Apakah Anda yakin ingin menghapus <b>{{ mataKuliah.nama_mk }}</b
                    >?</span
                >
            </div>
            <template #footer>
                <Button label="Tidak" icon="pi pi-times" text @click="deleteMataKuliahDialog = false" />
                <Button label="Ya" icon="pi pi-check" @click="deleteMataKuliah" />
            </template>
        </Dialog>
    </div>
</template>
