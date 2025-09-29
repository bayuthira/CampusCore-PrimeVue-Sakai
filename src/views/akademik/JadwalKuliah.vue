<script setup>
import { useDosenStore } from '@/stores/dosen';
import { useJadwalKuliahStore } from '@/stores/jadwalKuliah';
import { useLookupStore } from '@/stores/lookup';
import { useMataKuliahStore } from '@/stores/matakuliah';
import { useProdiStore } from '@/stores/prodi';
import { useTahunAkademikStore } from '@/stores/tahunAkademik';
import { FilterMatchMode } from '@primevue/core/api';
import { storeToRefs } from 'pinia';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref, watch } from 'vue';

// Import untuk Export
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// --- Setup ---
const toast = useToast();
const jadwalStore = useJadwalKuliahStore();
const prodiStore = useProdiStore();
const tahunAkademikStore = useTahunAkademikStore();
const matakuliahStore = useMataKuliahStore();
const dosenStore = useDosenStore();
const lookupStore = useLookupStore();
const deleteDialog = ref(false);
const isNew = computed(() => !jadwal.value.id);

const { list: jadwalList, isLoading } = storeToRefs(jadwalStore);
const { prodiList } = storeToRefs(prodiStore);
const { list: tahunAkademikList } = storeToRefs(tahunAkademikStore);
const { mataKuliahList } = storeToRefs(matakuliahStore);
const { dosenList } = storeToRefs(dosenStore);
const { peranDosen } = storeToRefs(lookupStore);

const dialog = ref(false);
const jadwal = ref({});
const submitted = ref(false); // Untuk validasi
const filterProdi = ref(null);
const filterTahunAkademik = ref(null);

const hariOptions = ref(['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']);

// State untuk Search dan Export
const dt = ref();
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

onMounted(() => {
    prodiStore.fetchProdi();
    tahunAkademikStore.fetchAll();
    lookupStore.fetchPeranDosen();
    dosenStore.fetchDosen();
    matakuliahStore.fetchMataKuliah();
    jadwalStore.fetchAll();
});

// --- Fungsi Export ---
const exportItems = ref([
    { label: 'CSV', icon: 'pi pi-file', command: () => dt.value.exportCSV() },
    { label: 'Excel', icon: 'pi pi-file-excel', command: exportExcel },
    { label: 'PDF', icon: 'pi pi-file-pdf', command: exportPDF }
]);

function exportExcel() {
    const data = jadwalList.value;
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Jadwal Kuliah');
    XLSX.writeFile(workbook, 'jadwal-kuliah.xlsx');
}

function exportPDF() {
    const doc = new jsPDF();
    const tableHead = [['Mata Kuliah', 'Kelas', 'Hari', 'Jam', 'Prodi']];
    const tableBody = jadwalList.value.map((item) => [item.nama_mk, item.kelas, item.hari, `${item.jam_mulai} - ${item.jam_selesai}`, item.nama_prodi]);
    autoTable(doc, { head: tableHead, body: tableBody });
    doc.save('jadwal-kuliah.pdf');
}

// --- Fungsi-fungsi Form ---
function openNew() {
    jadwal.value = {
        dosen_pengampu: [{ dosen_id: null, peran: null }]
    };
    submitted.value = false;
    dialog.value = true;
}

function addDosenPengampu() {
    jadwal.value.dosen_pengampu.push({ dosen_id: null, peran: null });
}

function removeDosenPengampu(index) {
    jadwal.value.dosen_pengampu.splice(index, 1);
}

async function saveData() {
    submitted.value = true;
    if (!jadwal.value.matakuliah_id || !jadwal.value.tahun_akademik_id || !jadwal.value.hari || !jadwal.value.jam_mulai || !jadwal.value.jam_selesai || !jadwal.value.kelas?.trim()) {
        toast.add({ severity: 'warn', summary: 'Perhatian', detail: 'Semua field wajib diisi', life: 3000 });
        return;
    }

    try {
        const payload = {
            ...jadwal.value,
            jam_mulai: jadwal.value.jam_mulai.toTimeString().substring(0, 5),
            jam_selesai: jadwal.value.jam_selesai.toTimeString().substring(0, 5),
            dosen_pengampu: jadwal.value.dosen_pengampu.map((d) => ({
                dosen_id: d.dosen_id.id || d.dosen_id,
                peran: d.peran
            }))
        };

        if (isNew.value) {
            await jadwalStore.create(payload);
            toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Jadwal kuliah berhasil dibuat', life: 3000 });
        } else {
            await jadwalStore.update(jadwal.value.id, payload);
            toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Jadwal kuliah berhasil diperbarui', life: 3000 });
        }

        dialog.value = false;
    } catch (error) {
        const errorMessage = error.response?.data?.error || 'Gagal menyimpan jadwal';
        toast.add({ severity: 'error', summary: 'Gagal', detail: errorMessage, life: 4000 });
    }
}

function applyFilter() {
    const filters = {};
    if (filterProdi.value) filters.prodi_id = filterProdi.value;
    if (filterTahunAkademik.value) filters.tahun_akademik_id = filterTahunAkademik.value;
    jadwalStore.fetchAll(filters);
}

watch([filterProdi, filterTahunAkademik], applyFilter);
function editData(data) {
    jadwal.value = { ...data };

    // Konversi string jam dari backend menjadi objek Date untuk komponen Calendar
    if (data.jam_mulai) {
        const [h, m] = data.jam_mulai.split(':');
        jadwal.value.jam_mulai = new Date();
        jadwal.value.jam_mulai.setHours(h, m, 0);
    }
    if (data.jam_selesai) {
        const [h, m] = data.jam_selesai.split(':');
        jadwal.value.jam_selesai = new Date();
        jadwal.value.jam_selesai.setHours(h, m, 0);
    }

    dialog.value = true;
}

function confirmDelete(data) {
    jadwal.value = data;
    deleteDialog.value = true;
}

async function deleteData() {
    try {
        await jadwalStore.delete(jadwal.value.id);
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Jadwal telah dihapus', life: 3000 });
        deleteDialog.value = false;
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal menghapus jadwal', life: 3000 });
    }
}
</script>

<template>
    <div class="card">
        <Toolbar class="mb-4">
            <template #start>
                <Button label="Tambah Jadwal" icon="pi pi-plus" severity="secondary" @click="openNew" />
            </template>
            <template #end>
                <SplitButton label="Export" icon="pi pi-upload" :model="exportItems" severity="secondary"></SplitButton>
            </template>
        </Toolbar>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
                <label for="filterProdi" class="font-bold block mb-2">Filter Program Studi</label>
                <Dropdown v-model="filterProdi" :options="prodiList" optionLabel="nama_prodi" optionValue="id" placeholder="Semua Prodi" showClear fluid />
            </div>
            <div>
                <label for="filterTahun" class="font-bold block mb-2">Filter Tahun Akademik</label>
                <Dropdown v-model="filterTahunAkademik" :options="tahunAkademikList" optionLabel="nama" optionValue="id" placeholder="Semua Tahun" showClear fluid />
            </div>
        </div>

        <DataTable ref="dt" :value="jadwalList" :loading="isLoading" :filters="filters" export-filename="jadwal-kuliah" responsiveLayout="scroll">
            <template #header>
                <div class="flex flex-wrap gap-2 items-center justify-between">
                    <h4 class="m-0">Daftar Jadwal Kuliah</h4>
                    <IconField>
                        <InputIcon> <i class="pi pi-search" /> </InputIcon>
                        <InputText v-model="filters['global'].value" placeholder="Cari..." />
                    </IconField>
                </div>
            </template>

            <Column field="nama_mk" header="Mata Kuliah" sortable></Column>
            <Column field="kelas" header="Kelas" sortable></Column>
            <Column field="hari" header="Hari" sortable></Column>
            <Column header="Jam">
                <template #body="slotProps"> {{ slotProps.data.jam_mulai.substring(0, 5) }} - {{ slotProps.data.jam_selesai.substring(0, 5) }} </template>
            </Column>
            <Column field="nama_prodi" header="Program Studi" sortable></Column>
            <Column header="Dosen Pengampu">
                <template #body="slotProps">
                    <ul class="list-none p-0 m-0">
                        <li v-for="dosen in slotProps.data.dosen_pengampu" :key="dosen.dosen_id">
                            <Tag v-if="dosen.peran === 'Koordinator'" severity="info" class="mr-1"></Tag>
                            {{ dosen.nama_dosen }} ({{ dosen.peran }})
                        </li>
                    </ul>
                </template>
            </Column>
            <Column :exportable="false" header="Aksi">
                <template #body="slotProps">
                    <Button icon="pi pi-pencil" outlined rounded class="mr-2" @click="editData(slotProps.data)" />
                    <Button icon="pi pi-trash" outlined rounded severity="danger" @click="confirmDelete(slotProps.data)" />
                </template>
            </Column>
        </DataTable>
        <Dialog v-model:visible="dialog" :header="isNew ? 'Tambah Jadwal Kuliah' : 'Edit Jadwal Kuliah'" :modal="true" :style="{ width: '50vw' }"></Dialog>

        <Dialog v-model:visible="dialog" header="Tambah Jadwal Kuliah" :modal="true" :style="{ width: '50vw' }">
            <div class="flex flex-col gap-6">
                <div>
                    <label class="block font-bold mb-3">Tahun Akademik</label>
                    <Dropdown v-model="jadwal.tahun_akademik_id" :options="tahunAkademikList" optionLabel="nama" optionValue="id" placeholder="Pilih Tahun Akademik" :invalid="submitted && !jadwal.tahun_akademik_id" fluid />
                </div>
                <div>
                    <label class="block font-bold mb-3">Mata Kuliah</label>
                    <Dropdown v-model="jadwal.matakuliah_id" :options="mataKuliahList" optionLabel="nama_mk" optionValue="id" placeholder="Pilih Mata Kuliah" :invalid="submitted && !jadwal.matakuliah_id" fluid filter />
                </div>
                <div>
                    <label class="block font-bold mb-3">Kelas</label>
                    <InputText v-model="jadwal.kelas" :invalid="submitted && !jadwal.kelas" fluid />
                </div>
                <div>
                    <label class="block font-bold mb-3">Hari</label>
                    <Dropdown v-model="jadwal.hari" :options="hariOptions" placeholder="Pilih Hari" :invalid="submitted && !jadwal.hari" fluid />
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block font-bold mb-3">Jam Mulai</label>
                        <Calendar v-model="jadwal.jam_mulai" timeOnly :invalid="submitted && !jadwal.jam_mulai" />
                    </div>
                    <div>
                        <label class="block font-bold mb-3">Jam Selesai</label>
                        <Calendar v-model="jadwal.jam_selesai" timeOnly :invalid="submitted && !jadwal.jam_selesai" />
                    </div>
                </div>
                <div>
                    <label class="block font-bold mb-3">Dosen Pengampu</label>
                    <div v-for="(dosen, index) in jadwal.dosen_pengampu" :key="index" class="grid grid-cols-12 gap-2 mb-2">
                        <div class="col-span-6">
                            <Dropdown v-model="dosen.dosen_id" :options="dosenList" optionLabel="nama_dosen" optionValue="id" placeholder="Pilih Dosen" fluid filter />
                        </div>
                        <div class="col-span-5">
                            <Dropdown v-model="dosen.peran" :options="peranDosen" placeholder="Peran" fluid />
                        </div>
                        <div class="col-span-1 flex items-center">
                            <Button v-if="jadwal.dosen_pengampu.length > 1" icon="pi pi-trash" severity="danger" text @click="removeDosenPengampu(index)" />
                        </div>
                    </div>
                    <Button label="Tambah Dosen" icon="pi pi-plus" severity="secondary" text @click="addDosenPengampu" class="mt-2" />
                </div>
            </div>
            <template #footer>
                <Button label="Batal" text @click="dialog = false" />
                <Button label="Simpan" @click="saveData" />
            </template>
        </Dialog>
        <Dialog v-model:visible="deleteDialog" header="Konfirmasi Hapus" :modal="true" :style="{ width: '450px' }">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl" />
                <span
                    >Apakah Anda yakin ingin menghapus jadwal <b>{{ jadwal.nama_mk }}</b> kelas <b>{{ jadwal.kelas }}</b
                    >?</span
                >
            </div>
            <template #footer>
                <Button label="Batal" text @click="deleteDialog = false" />
                <Button label="Ya, Hapus" @click="deleteData" />
            </template>
        </Dialog>
    </div>
</template>
