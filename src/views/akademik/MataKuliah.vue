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

const jenisOptions = ['Wajib', 'Pilihan'];

onMounted(() => {
    mataKuliahStore.fetchMataKuliah();
    prodiStore.fetchProdi();
});

// --- Fungsi Export ---
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
    const tableHead = [['Kode', 'Nama Mata Kuliah', 'Jenis', 'SKS', 'Sem.', 'Program Studi']];
    const tableBody = mataKuliahList.value.map((item) => [
        item.kode_mk,
        item.nama_mk,
        item.jenis_mk,
        item.sks,
        item.semester_target,
        item.nama_prodi
    ]);
    autoTable(doc, { head: tableHead, body: tableBody });
    doc.save('data-matakuliah.pdf');
}
const exportItems = ref([
    { label: 'CSV', icon: 'pi pi-file', command: exportCSV },
    { label: 'Excel', icon: 'pi pi-file-excel', command: exportExcel },
    { label: 'PDF', icon: 'pi pi-file-pdf', command: exportPDF }
]);

function openNew() {
    mataKuliah.value = {
        jenis_mk: 'Wajib',
        semester_target: 1,
        sks_tatap_muka: 0,
        sks_praktek: 0,
        sks_praktek_lapangan: 0,
        sks_simulasi: 0
    };
    submitted.value = false;
    mataKuliahDialog.value = true;
}

function hideDialog() {
    mataKuliahDialog.value = false;
    submitted.value = false;
}

async function saveMataKuliah() {
    submitted.value = true;
    if (!mataKuliah.value.nama_mk?.trim() || !mataKuliah.value.kode_mk?.trim() || !mataKuliah.value.prodi_id) {
        return;
    }

    try {
        const payload = { ...mataKuliah.value };
        payload.prodi_id = mataKuliah.value.prodi_id.id || mataKuliah.value.prodi_id;

        if (mataKuliah.value.id) {
            await mataKuliahStore.updateMataKuliah(mataKuliah.value.id, payload);
            toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Data Mata Kuliah Diperbarui', life: 3000 });
        } else {
            await mataKuliahStore.createMataKuliah(payload);
            toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Mata Kuliah Baru Berhasil Dibuat', life: 3000 });
        }
        mataKuliahDialog.value = false;
        mataKuliah.value = {};
    } catch (error) {
        const errorMessage = error.response?.data?.error || 'Terjadi kesalahan saat menyimpan';
        toast.add({ severity: 'error', summary: 'Gagal', detail: errorMessage, life: 4000 });
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
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Data Mata Kuliah Dihapus', life: 3000 });
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal menghapus data', life: 3000 });
    }
}
</script>

<template>
    <div>
        <div class="card shadow-sm border-0">
            <Toolbar class="mb-6">
                <template #start>
                    <Button label="Tambah Mata Kuliah" icon="pi pi-plus" severity="primary" class="mr-2"
                        @click="openNew" />
                </template>
                <template #end>
                    <SplitButton label="Ekspor Data" icon="pi pi-upload" :model="exportItems" severity="secondary">
                    </SplitButton>
                </template>
            </Toolbar>

            <DataTable ref="dt" :value="mataKuliahList" :loading="isLoading" dataKey="id" :paginator="true" :rows="10"
                :filters="filters" stripedRows class="p-datatable-sm">
                <template #header>
                    <div class="flex flex-wrap gap-2 items-center justify-between">
                        <h4 class="m-0 font-bold text-gray-700">Data Mata Kuliah</h4>
                        <IconField>
                            <InputIcon><i class="pi pi-search" /></InputIcon>
                            <InputText v-model="filters['global'].value" placeholder="Cari mata kuliah..." />
                        </IconField>
                    </div>
                </template>

                <Column field="kode_mk" header="Kode" sortable></Column>
                <Column field="nama_mk" header="Nama Mata Kuliah" sortable style="min-width: 14rem"></Column>
                <Column field="jenis_mk" header="Jenis" sortable>
                    <template #body="slotProps">
                        <Tag :value="slotProps.data.jenis_mk"
                            :severity="slotProps.data.jenis_mk === 'Wajib' ? 'info' : 'secondary'" />
                    </template>
                </Column>
                <Column field="sks" header="SKS Total" sortable></Column>
                <Column field="semester_target" header="Sem." sortable></Column>
                <Column field="nama_prodi" header="Program Studi" sortable></Column>

                <Column :exportable="false" header="Aksi" style="min-width: 8rem">
                    <template #body="slotProps">
                        <Button icon="pi pi-pencil" outlined rounded severity="info" class="mr-2"
                            @click="editMataKuliah(slotProps.data)" v-tooltip.top="'Ubah'" />
                        <Button icon="pi pi-trash" outlined rounded severity="danger"
                            @click="confirmDeleteMataKuliah(slotProps.data)" v-tooltip.top="'Hapus'" />
                    </template>
                </Column>
            </DataTable>
        </div>

        <!-- Modal Detail Mata Kuliah -->
        <Dialog v-model:visible="mataKuliahDialog" :style="{ width: '650px' }" header="Detail Mata Kuliah" :modal="true"
            class="p-fluid">
            <div class="flex flex-col gap-4 mt-2">
                <!-- Baris 1: Kode & Nama -->
                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-12 md:col-span-4 flex flex-col gap-2">
                        <label for="kode_mk" class="font-bold text-sm text-gray-600">Kode MK *</label>
                        <InputText id="kode_mk" v-model.trim="mataKuliah.kode_mk" required placeholder="KEP101"
                            :invalid="submitted && !mataKuliah.kode_mk" />
                    </div>
                    <div class="col-span-12 md:col-span-8 flex flex-col gap-2">
                        <label for="nama_mk" class="font-bold text-sm text-gray-600">Nama Mata Kuliah *</label>
                        <InputText id="nama_mk" v-model.trim="mataKuliah.nama_mk" required
                            placeholder="Nama mata kuliah lengkap" :invalid="submitted && !mataKuliah.nama_mk" />
                    </div>
                </div>

                <!-- Baris 2: Jenis & Semester -->
                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                        <label for="jenis" class="font-bold text-sm text-gray-600">Jenis MK</label>
                        <Dropdown id="jenis" v-model="mataKuliah.jenis_mk" :options="jenisOptions"
                            placeholder="Pilih Jenis" />
                    </div>
                    <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                        <label for="semester" class="font-bold text-sm text-gray-600">Semester Target</label>
                        <InputNumber id="semester" v-model="mataKuliah.semester_target" showButtons :min="1"
                            :max="14" />
                    </div>
                </div>

                <!-- Section SKS (Standard Neo Feeder) -->
                <div class="p-4 bg-gray-50 rounded-lg border border-gray-100 mt-2">
                    <div class="font-bold text-primary text-sm mb-3 border-b pb-2">Distribusi Bobot SKS</div>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div class="flex flex-col gap-2">
                            <label class="text-xs font-bold text-gray-500 uppercase">Tatap Muka</label>
                            <InputNumber v-model="mataKuliah.sks_tatap_muka" :min="0" :max="6" fluid />
                        </div>
                        <div class="flex flex-col gap-2">
                            <label class="text-xs font-bold text-gray-500 uppercase">Praktek</label>
                            <InputNumber v-model="mataKuliah.sks_praktek" :min="0" :max="6" fluid />
                        </div>
                        <div class="flex flex-col gap-2">
                            <label class="text-xs font-bold text-gray-500 uppercase">Lapangan</label>
                            <InputNumber v-model="mataKuliah.sks_praktek_lapangan" :min="0" :max="6" fluid />
                        </div>
                        <div class="flex flex-col gap-2">
                            <label class="text-xs font-bold text-gray-500 uppercase">Simulasi</label>
                            <InputNumber v-model="mataKuliah.sks_simulasi" :min="0" :max="6" fluid />
                        </div>
                    </div>
                    <small class="text-gray-400 mt-2 block italic text-[10px]">SKS Total akan dihitung otomatis oleh
                        sistem.</small>
                </div>

                <!-- Baris Terakhir: Prodi & Feeder -->
                <div class="grid grid-cols-12 gap-4 mt-2">
                    <div class="col-span-12 md:col-span-7 flex flex-col gap-2">
                        <label for="prodi_id" class="font-bold text-sm text-gray-600">Program Studi *</label>
                        <Dropdown id="prodi_id" v-model="mataKuliah.prodi_id" :options="prodiList"
                            optionLabel="nama_prodi" optionValue="id" placeholder="Pilih Program Studi" filter
                            :invalid="submitted && !mataKuliah.prodi_id" />
                    </div>
                    <div class="col-span-12 md:col-span-5 flex flex-col gap-2">
                        <label for="id_feeder" class="font-bold text-sm text-gray-600 text-xs">ID Matkul Feeder</label>
                        <InputText id="id_feeder" v-model.trim="mataKuliah.id_matkul_feeder" placeholder="Opsional" />
                    </div>
                </div>
            </div>
            <template #footer>
                <div class="flex justify-end gap-3 mt-4">
                    <Button label="Batal" icon="pi pi-times" text severity="success" @click="hideDialog" />
                    <Button label="Simpan Perubahan" icon="pi pi-check" severity="success" @click="saveMataKuliah" />
                </div>
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteMataKuliahDialog" :style="{ width: '450px' }" header="Konfirmasi" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle text-3xl text-red-500" />
                <span v-if="mataKuliah">Yakin ingin menghapus mata kuliah <b>{{ mataKuliah.nama_mk }}</b>?</span>
            </div>
            <template #footer>
                <Button label="Batal" icon="pi pi-times" text @click="deleteMataKuliahDialog = false" />
                <Button label="Ya, Hapus" icon="pi pi-check" severity="danger" @click="deleteMataKuliah" />
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
:deep(.p-dialog-footer) {
    padding: 0 1.5rem 1.5rem 1.5rem;
}
</style>