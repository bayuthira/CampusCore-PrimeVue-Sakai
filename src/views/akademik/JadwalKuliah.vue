<script setup>
import { useAuthStore } from '@/stores/auth';
import { useDosenStore } from '@/stores/dosen';
import { useJadwalKuliahStore } from '@/stores/jadwalKuliah';
import { useLookupStore } from '@/stores/lookup';
import { useMataKuliahStore } from '@/stores/matakuliah';
import { useProdiStore } from '@/stores/prodi';
import { useTahunAkademikStore } from '@/stores/tahunAkademik';
import { FilterMatchMode } from '@primevue/core/api';
import { storeToRefs } from 'pinia';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref, watch } from 'vue';

// Import untuk Export
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// --- Setup ---
const authStore = useAuthStore();
const toast = useToast();
const jadwalStore = useJadwalKuliahStore();
const prodiStore = useProdiStore();
const tahunAkademikStore = useTahunAkademikStore();
const matakuliahStore = useMataKuliahStore();
const dosenStore = useDosenStore();
const lookupStore = useLookupStore();
const deleteDialog = ref(false);
const isNew = computed(() => !jadwal.value.id);
const confirm = useConfirm();

const { list: jadwalList, isLoading } = storeToRefs(jadwalStore);
const { prodiList } = storeToRefs(prodiStore);
const { list: tahunAkademikList } = storeToRefs(tahunAkademikStore);
const { mataKuliahList } = storeToRefs(matakuliahStore);
const { dosenList } = storeToRefs(dosenStore);
const { peranDosen } = storeToRefs(lookupStore);
const plotDialog = ref(false);
const jadwalUntukPlot = ref({});
const ruanganTersedia = ref([]);

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
            // Konversi ke UTC sebelum dikirim
            jam_mulai: jadwal.value.jam_mulai.toISOString(),
            jam_selesai: jadwal.value.jam_selesai.toISOString(),
            // Format tanggal perulangan jika ada
            tanggal_akhir_perulangan: jadwal.value.tanggal_akhir_perulangan ? formatDate(jadwal.value.tanggal_akhir_perulangan) : undefined,
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

    // Konversi string "HH:MM:SS" dari backend menjadi objek Date untuk komponen Calendar
    if (data.jam_mulai) {
        const [h, m] = data.jam_mulai.split(':');
        const dateObj = new Date();
        dateObj.setHours(h, m, 0, 0);
        jadwal.value.jam_mulai = dateObj;
    }
    if (data.jam_selesai) {
        const [h, m] = data.jam_selesai.split(':');
        const dateObj = new Date();
        dateObj.setHours(h, m, 0, 0);
        jadwal.value.jam_selesai = dateObj;
    }

    // Konversi tanggal lain jika ada
    if (data.tanggal_akhir_perulangan) {
        jadwal.value.tanggal_akhir_perulangan = new Date(data.tanggal_akhir_perulangan);
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

async function openPlotDialog(data) {
    jadwalUntukPlot.value = {
        jadwal_kuliah_id: data.id,
        nama_mk: data.nama_mk,
        ruangan_id: null
    };

    try {
        ruanganTersedia.value = await jadwalStore.fetchRuanganTersedia(data.id);
        if (ruanganTersedia.value.length === 0) {
            toast.add({ severity: 'info', summary: 'Informasi', detail: 'Tidak ada ruangan yang tersedia untuk jadwal ini.', life: 4000 });
        } else {
            plotDialog.value = true;
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Tidak dapat memuat daftar ruangan tersedia.', life: 3000 });
    }
}

async function savePlot() {
    if (!jadwalUntukPlot.value.ruangan_id) {
        toast.add({ severity: 'warn', summary: 'Perhatian', detail: 'Anda harus memilih ruangan.', life: 3000 });
        return;
    }

    try {
        const payload = {
            jadwal_kuliah_id: jadwalUntukPlot.value.jadwal_kuliah_id,
            ruangan_id: jadwalUntukPlot.value.ruangan_id
        };
        await jadwalStore.plotRuangan(payload);
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Ruangan berhasil di-plot ke jadwal.', life: 3000 });
        plotDialog.value = false;
    } catch (error) {
        const errorMessage = error.response?.data?.error || 'Gagal menyimpan plot ruangan.';
        toast.add({ severity: 'error', summary: 'Gagal', detail: errorMessage, life: 4000 });
    }
}

function confirmUnplot(data) {
    confirm.require({
        message: `Apakah Anda yakin ingin menghapus plot ruangan dari jadwal ${data.nama_mk} kelas ${data.kelas}?`,
        header: 'Konfirmasi Unplot Ruangan',
        icon: 'pi pi-exclamation-triangle',
        acceptClass: 'p-button-danger',
        accept: async () => {
            try {
                await jadwalStore.unplotRuangan(data.id);
                toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Plot ruangan telah dihapus.', life: 3000 });
            } catch (error) {
                toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal menghapus plot ruangan.', life: 3000 });
            }
        }
    });
}

// Fungsi untuk format tanggal YYYY-MM-DD
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

// Fungsi untuk menampilkan waktu lokal HH:mm dari string UTC
function formatTime(isoString) {
    if (!isoString) return '';
    // new Date() akan otomatis mengonversi string UTC ke zona waktu lokal browser
    const date = new Date(isoString);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}
</script>

<template>
    <div class="card">
        <Toolbar class="mb-4">
            <template #start>
                <Button label="Tambah Jadwal" icon="pi pi-plus" severity="secondary" @click="openNew" v-if="authStore.userData?.roles.includes('SUPER_ADMIN') || authStore.userData?.roles.includes('STAF_AKADEMIK')" />
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

        <DataTable
            ref="dt"
            :value="jadwalList"
            :loading="isLoading"
            :filters="filters"
            :global-filter-fields="['nama_mk', 'kode_mk', 'kelas', 'hari', 'nama_prodi', 'nama_ruangan', 'dosen_pengampu_searchable']"
            export-filename="jadwal-kuliah"
            responsiveLayout="scroll"
        >
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
                <template #body="slotProps"> {{ formatTime(slotProps.data.jam_mulai) }} - {{ formatTime(slotProps.data.jam_selesai) }} </template>
            </Column>
            <Column field="nama_ruangan" header="Ruangan" sortable>
                <template #body="slotProps">
                    <span>{{ slotProps.data.nama_ruangan || '-' }}</span>
                </template>
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
                    <Button v-if="authStore.userData?.roles.includes('STAF_BAUM')" icon="pi pi-map-marker" outlined rounded severity="secondary" class="mr-2" @click="openPlotDialog(slotProps.data)" v-tooltip.top="'Plot Ruangan'" />
                    <Button
                        v-if="slotProps.data.ruangan_id && authStore.userData?.roles.includes('STAF_BAUM')"
                        icon="pi pi-times-circle"
                        outlined
                        rounded
                        severity="danger"
                        class="mr-2"
                        @click="confirmUnplot(slotProps.data)"
                        v-tooltip.top="'Unplot Ruangan'"
                    />
                    <Button
                        v-if="authStore.userData?.roles.includes('SUPER_ADMIN') || authStore.userData?.roles.includes('STAF_AKADEMIK')"
                        icon="pi pi-pencil"
                        outlined
                        rounded
                        class="mr-2"
                        @click="editData(slotProps.data)"
                        v-tooltip.top="'Edit Jadwal'"
                    />
                    <Button
                        v-if="authStore.userData?.roles.includes('SUPER_ADMIN') || authStore.userData?.roles.includes('STAF_AKADEMIK')"
                        icon="pi pi-trash"
                        outlined
                        rounded
                        severity="danger"
                        @click="confirmDelete(slotProps.data)"
                        v-tooltip.top="'Hapus Jadwal'"
                    />
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
        <Dialog v-model:visible="plotDialog" :style="{ width: '450px' }" :header="`Plot Ruangan untuk: ${jadwalUntukPlot.nama_mk}`" :modal="true">
            <div class="field">
                <label for="ruangan_plot" class="block font-bold mb-3">Ruangan Tersedia</label>
                <Dropdown id="ruangan_plot" v-model="jadwalUntukPlot.ruangan_id" :options="ruanganTersedia" optionLabel="nama_ruangan" optionValue="id" placeholder="Pilih ruangan yang tersedia" fluid filter />
            </div>
            <template #footer>
                <Button label="Batal" text @click="plotDialog.value = false" />
                <Button label="Simpan" @click="savePlot" />
            </template>
        </Dialog>
    </div>
</template>
