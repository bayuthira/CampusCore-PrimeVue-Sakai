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

// Ekspor
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// --- Setup ---
const authStore = useAuthStore();
const toast = useToast();
const confirm = useConfirm();
const jadwalStore = useJadwalKuliahStore();
const prodiStore = useProdiStore();
const tahunAkademikStore = useTahunAkademikStore();
const matakuliahStore = useMataKuliahStore();
const dosenStore = useDosenStore();
const lookupStore = useLookupStore();

const { list: jadwalList, isLoading } = storeToRefs(jadwalStore);
const { prodiList } = storeToRefs(prodiStore);
const { list: tahunAkademikList } = storeToRefs(tahunAkademikStore);
const { mataKuliahList } = storeToRefs(matakuliahStore);
const { dosenList } = storeToRefs(dosenStore);
const { peranDosen } = storeToRefs(lookupStore);

const dialog = ref(false);
const deleteDialog = ref(false);
const plotDialog = ref(false);
const jadwal = ref({});
const submitted = ref(false);
const isNew = computed(() => !jadwal.value.id);

const filterProdi = ref(null);
const filterTahunAkademik = ref(null);
const ruanganTersedia = ref([]);
const jadwalUntukPlot = ref({});

const hariOptions = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

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

// --- Fungsi Ekspor ---
const exportItems = [
    { label: 'CSV', icon: 'pi pi-file', command: () => dt.value.exportCSV() },
    { label: 'Excel', icon: 'pi pi-file-excel', command: exportExcel },
    { label: 'PDF', icon: 'pi pi-file-pdf', command: exportPDF }
];

function exportExcel() {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(jadwalList.value);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Jadwal Kuliah');
    XLSX.writeFile(workbook, 'data-jadwal-kuliah.xlsx');
}

function exportPDF() {
    const doc = new jsPDF();
    const tableHead = [['MK', 'Kelas', 'Hari', 'Jam', 'Prodi', 'Dosen']];
    const tableBody = jadwalList.value.map((j) => [j.nama_mk, j.kelas, j.hari, `${j.jam_mulai} - ${j.jam_selesai}`, j.nama_prodi, j.dosen_pengampu_searchable]);
    autoTable(doc, { head: tableHead, body: tableBody });
    doc.save('data-jadwal-kuliah.pdf');
}

// --- Fungsi Form ---
function openNew() {
    jadwal.value = {
        hari: 'Senin',
        kelas: '',
        dosen_pengampu: [{ dosen_id: null, peran: 'Koordinator', sks_substansi_total: 0, rencana_tatap_muka: 16 }]
    };
    submitted.value = false;
    dialog.value = true;
}

function addDosen() {
    jadwal.value.dosen_pengampu.push({ dosen_id: null, peran: 'Anggota', sks_substansi_total: 0, rencana_tatap_muka: 16 });
}

function removeDosen(index) {
    jadwal.value.dosen_pengampu.splice(index, 1);
}

function formatTimeToOffset(date) {
    if (!date) return null;
    const d = new Date(date);
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    const tzOffset = -d.getTimezoneOffset();
    const sign = tzOffset >= 0 ? '+' : '-';
    const offH = String(Math.floor(Math.abs(tzOffset) / 60)).padStart(2, '0');
    const offM = String(Math.abs(tzOffset) % 60).padStart(2, '0');
    return `${h}:${m}${sign}${offH}:${offM}`;
}

async function saveData() {
    submitted.value = true;
    if (!jadwal.value.matakuliah_id || !jadwal.value.tahun_akademik_id || !jadwal.value.kelas?.trim() || !jadwal.value.jam_mulai || !jadwal.value.jam_selesai) {
        toast.add({ severity: 'warn', summary: 'Perhatian', detail: 'Harap lengkapi semua field wajib (*)', life: 3000 });
        return;
    }

    try {
        const payload = {
            ...jadwal.value,
            jam_mulai: formatTimeToOffset(jadwal.value.jam_mulai),
            jam_selesai: formatTimeToOffset(jadwal.value.jam_selesai),
            dosen_pengampu: jadwal.value.dosen_pengampu.map(d => ({
                ...d,
                dosen_id: d.dosen_id?.id || d.dosen_id
            }))
        };

        if (isNew.value) {
            await jadwalStore.create(payload);
            toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Jadwal Kuliah berhasil dibuat', life: 3000 });
        } else {
            await jadwalStore.update(jadwal.value.id, payload);
            toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Jadwal Kuliah berhasil diperbarui', life: 3000 });
        }
        dialog.value = false;
    } catch (e) {
        const errMsg = e.response?.data?.error || 'Gagal menyimpan data';
        toast.add({ severity: 'error', summary: 'Gagal', detail: errMsg, life: 4000 });
    }
}

function editData(row) {
    const parseTime = (timeStr) => {
        if (!timeStr) return null;
        const [h, m] = timeStr.substring(0, 5).split(':');
        const d = new Date();
        d.setHours(parseInt(h), parseInt(m), 0);
        return d;
    };

    jadwal.value = {
        ...row,
        jam_mulai: parseTime(row.jam_mulai),
        jam_selesai: parseTime(row.jam_selesai),
        dosen_pengampu: (row.dosen_pengampu || []).map(d => ({ ...d }))
    };
    dialog.value = true;
}

function applyFilter() {
    const params = {};
    if (filterProdi.value) params.prodi_id = filterProdi.value;
    if (filterTahunAkademik.value) params.tahun_akademik_id = filterTahunAkademik.value;
    jadwalStore.fetchAll(params);
}

watch([filterProdi, filterTahunAkademik], applyFilter);

async function openPlotDialog(row) {
    jadwalUntukPlot.value = { jadwal_kuliah_id: row.id, nama_mk: row.nama_mk, ruangan_id: null };
    try {
        ruanganTersedia.value = await jadwalStore.fetchRuanganTersedia(row.id);
        plotDialog.value = true;
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal memuat ruangan', life: 3000 });
    }
}

async function savePlot() {
    if (!jadwalUntukPlot.value.ruangan_id) return;
    try {
        await jadwalStore.plotRuangan(jadwalUntukPlot.value);
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Ruangan berhasil diplot', life: 3000 });
        plotDialog.value = false;
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal memplot ruangan', life: 3000 });
    }
}

function confirmUnplot(row) {
    confirm.require({
        message: `Hapus plot ruangan dari kelas ${row.nama_mk} (${row.kelas})?`,
        header: 'Konfirmasi Unplot',
        icon: 'pi pi-exclamation-triangle',
        acceptClass: 'p-button-danger',
        accept: async () => {
            try {
                await jadwalStore.unplotRuangan(row.id);
                toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Plot ruangan dihapus', life: 3000 });
            } catch (error) {
                toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal unplot', life: 3000 });
            }
        }
    });
}

function confirmDelete(row) {
    jadwal.value = row;
    deleteDialog.value = true;
}

async function deleteData() {
    try {
        await jadwalStore.delete(jadwal.value.id);
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Jadwal dihapus', life: 3000 });
        deleteDialog.value = false;
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal menghapus jadwal', life: 3000 });
    }
}
</script>

<template>
    <div class="card shadow-sm border-0">
        <Toolbar class="mb-6">
            <template #start>
                <Button label="Tambah Jadwal" icon="pi pi-plus" severity="primary" class="mr-2" @click="openNew"
                    v-if="authStore.userData?.roles.some(r => ['SUPER_ADMIN', 'STAF_AKADEMIK'].includes(r))" />
            </template>
            <template #end>
                <SplitButton label="Ekspor Data" icon="pi pi-download" :model="exportItems" severity="secondary" />
            </template>
        </Toolbar>

        <!-- Filter Area -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg border">
            <div class="flex flex-col gap-2">
                <label class="font-bold text-sm text-gray-600">Filter Program Studi</label>
                <Dropdown v-model="filterProdi" :options="prodiList" optionLabel="nama_prodi" optionValue="id"
                    placeholder="Semua Prodi" showClear fluid />
            </div>
            <div class="flex flex-col gap-2">
                <label class="font-bold text-sm text-gray-600">Filter Tahun Akademik</label>
                <Dropdown v-model="filterTahunAkademik" :options="tahunAkademikList" optionLabel="nama" optionValue="id"
                    placeholder="Semua Tahun" showClear fluid />
            </div>
        </div>

        <DataTable ref="dt" :value="jadwalList" :loading="isLoading" dataKey="id" :paginator="true" :rows="10"
            :filters="filters" stripedRows class="p-datatable-sm">
            <template #header>
                <div class="flex flex-wrap gap-2 items-center justify-between">
                    <h4 class="m-0 font-bold text-gray-700">Daftar Jadwal Kuliah</h4>
                    <IconField>
                        <InputIcon><i class="pi pi-search" /></InputIcon>
                        <InputText v-model="filters['global'].value" placeholder="Cari jadwal..." />
                    </IconField>
                </div>
            </template>

            <Column field="nama_mk" header="Mata Kuliah" sortable>
                <template #body="slotProps">
                    <div class="font-bold text-primary">{{ slotProps.data.nama_mk }}</div>
                    <small class="text-gray-500">{{ slotProps.data.kode_mk }} | SKS: {{ slotProps.data.sks }}</small>
                </template>
            </Column>
            <Column field="kelas" header="Kelas" sortable class="text-center"></Column>
            <Column field="hari" header="Hari" sortable></Column>
            <Column header="Waktu">
                <template #body="slotProps">
                    {{ slotProps.data.jam_mulai?.substring(0, 5) }} - {{ slotProps.data.jam_selesai?.substring(0, 5) }}
                </template>
            </Column>
            <Column field="nama_ruangan" header="Ruangan" sortable>
                <template #body="slotProps">{{ slotProps.data.nama_ruangan || '-' }}</template>
            </Column>
            <Column field="nama_prodi" header="Program Studi" sortable></Column>
            <Column header="Dosen Pengampu">
                <template #body="slotProps">
                    <ul class="list-none p-0 m-0">
                        <li v-for="d in slotProps.data.dosen_pengampu" :key="d.dosen_id" class="text-xs mb-1">
                            <i v-if="d.peran === 'Koordinator'" class="pi pi-star-fill text-yellow-500 mr-1"
                                v-tooltip="'Koordinator'"></i>
                            {{ d.nama_dosen }} <span class="text-gray-400">({{ d.sks_substansi_total }} SKS)</span>
                        </li>
                    </ul>
                </template>
            </Column>

            <Column :exportable="false" header="Aksi" style="min-width: 12rem">
                <template #body="slotProps">
                    <div class="flex gap-2">
                        <Button v-if="authStore.userData?.roles.some(r => ['SUPER_ADMIN', 'STAF_BAUM'].includes(r))"
                            icon="pi pi-map-marker" outlined rounded severity="info"
                            @click="openPlotDialog(slotProps.data)" v-tooltip.top="'Plot Ruangan'" />
                        <Button
                            v-if="slotProps.data.ruangan_id && authStore.userData?.roles.some(r => ['SUPER_ADMIN', 'STAF_BAUM'].includes(r))"
                            icon="pi pi-times-circle" outlined rounded severity="danger"
                            @click="confirmUnplot(slotProps.data)" v-tooltip.top="'Unplot'" />
                        <Button v-if="authStore.userData?.roles.some(r => ['SUPER_ADMIN', 'STAF_AKADEMIK'].includes(r))"
                            icon="pi pi-pencil" outlined rounded severity="success" @click="editData(slotProps.data)"
                            v-tooltip.top="'Ubah'" />
                        <Button v-if="authStore.userData?.roles.some(r => ['SUPER_ADMIN', 'STAF_AKADEMIK'].includes(r))"
                            icon="pi pi-trash" outlined rounded severity="danger" @click="confirmDelete(slotProps.data)"
                            v-tooltip.top="'Hapus'" />
                    </div>
                </template>
            </Column>
        </DataTable>

        <!-- Modal Detail Jadwal -->
        <Dialog v-model:visible="dialog" :style="{ width: '750px' }" header="Detail Jadwal Perkuliahan" :modal="true"
            class="p-fluid">
            <div class="flex flex-col gap-5 mt-2">
                <!-- Row 1: Tahun Akademik & Mata Kuliah -->
                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                        <label class="font-bold text-sm text-gray-600">Tahun Akademik *</label>
                        <Dropdown v-model="jadwal.tahun_akademik_id" :options="tahunAkademikList" optionLabel="nama"
                            optionValue="id" placeholder="Pilih Semester"
                            :invalid="submitted && !jadwal.tahun_akademik_id" />
                    </div>
                    <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                        <label class="font-bold text-sm text-gray-600">Mata Kuliah *</label>
                        <Dropdown v-model="jadwal.matakuliah_id" :options="mataKuliahList" optionLabel="nama_mk"
                            optionValue="id" placeholder="Cari Mata Kuliah" filter
                            :filterFields="['kode_mk', 'nama_mk']" :invalid="submitted && !jadwal.matakuliah_id">
                            <template #option="slotProps">
                                <div class="flex flex-col gap-1">
                                    <div class="font-bold text-sm text-gray-800">{{ slotProps.option.kode_mk }} - {{
                                        slotProps.option.nama_mk }}</div>
                                    <small class="text-gray-500">Bobot: {{ slotProps.option.sks }} SKS</small>
                                </div>
                            </template>
                        </Dropdown>
                    </div>
                </div>

                <!-- Row 2: Nama Kelas & Hari -->
                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-12 md:col-span-4 flex flex-col gap-2">
                        <label class="font-bold text-sm text-gray-600">Nama Kelas *</label>
                        <InputText v-model.trim="jadwal.kelas" placeholder="Contoh: 01 atau A"
                            :invalid="submitted && !jadwal.kelas" />
                    </div>
                    <div class="col-span-12 md:col-span-8 flex flex-col gap-2">
                        <label class="font-bold text-sm text-gray-600">Hari *</label>
                        <Dropdown v-model="jadwal.hari" :options="hariOptions" placeholder="Senin"
                            :invalid="submitted && !jadwal.hari" />
                    </div>
                </div>

                <!-- Row 3: Jam Mulai & Jam Selesai -->
                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                        <label class="font-bold text-sm text-gray-600">Jam Mulai *</label>
                        <DatePicker v-model="jadwal.jam_mulai" timeOnly :invalid="submitted && !jadwal.jam_mulai"
                            placeholder="--:--" />
                    </div>
                    <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                        <label class="font-bold text-sm text-gray-600">Jam Selesai *</label>
                        <DatePicker v-model="jadwal.jam_selesai" timeOnly :invalid="submitted && !jadwal.jam_selesai"
                            placeholder="--:--" />
                    </div>
                </div>

                <!-- Bagian Dosen Pengampu (Team Teaching) -->
                <div class="mt-2">
                    <div class="flex justify-between items-center border-b border-gray-200 pb-2 mb-4">
                        <span class="font-bold text-success text-base">Dosen Pengampu (Team Teaching)</span>
                        <Button label="Tambah Dosen" icon="pi pi-plus" size="small" text severity="success"
                            @click="addDosen" class="font-bold" />
                    </div>

                    <div v-for="(d, index) in jadwal.dosen_pengampu" :key="index"
                        class="p-4 bg-gray-50 rounded-lg border border-gray-200 mb-4 relative shadow-sm">
                        <Button icon="pi pi-times" severity="danger" text rounded size="small"
                            class="absolute top-1 right-1" @click="removeDosen(index)"
                            v-if="jadwal.dosen_pengampu.length > 1" />

                        <div class="grid grid-cols-12 gap-4">
                            <div class="col-span-12 md:col-span-7 flex flex-col gap-2">
                                <label class="text-xs font-bold text-gray-500">Nama Dosen *</label>
                                <Dropdown v-model="d.dosen_id" :options="dosenList" optionLabel="nama_dosen"
                                    optionValue="id" placeholder="Pilih Dosen" filter fluid />
                            </div>
                            <div class="col-span-12 md:col-span-5 flex flex-col gap-2">
                                <label class="text-xs font-bold text-gray-500">Peran *</label>
                                <Dropdown v-model="d.peran" :options="['Koordinator', 'Anggota']"
                                    placeholder="Pilih Peran" fluid />
                            </div>

                            <!-- PERBAIKAN: SKS Substansi mendukung desimal -->
                            <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                                <label class="text-xs font-bold text-gray-500">SKS Substansi</label>
                                <InputNumber v-model="d.sks_substansi_total" :min="0" :max="9" :minFractionDigits="1"
                                    :maxFractionDigits="2" showButtons buttonLayout="horizontal" fluid />
                            </div>
                            <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                                <label class="text-xs font-bold text-gray-500">Rencana Tatap Muka</label>
                                <InputNumber v-model="d.rencana_tatap_muka" :min="0" :max="32" showButtons
                                    buttonLayout="horizontal" fluid />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <template #footer>
                <div class="flex justify-end gap-3 mt-4">
                    <Button label="Batal" icon="pi pi-times" text severity="success" @click="dialog = false"
                        class="font-bold" />
                    <Button label="Simpan Perubahan" icon="pi pi-check" severity="success" @click="saveData"
                        class="font-bold" />
                </div>
            </template>
        </Dialog>

        <!-- Plot Ruangan -->
        <Dialog v-model:visible="plotDialog" :style="{ width: '450px' }"
            :header="`Plot Ruangan: ${jadwalUntukPlot.nama_mk}`" :modal="true">
            <div class="flex flex-col gap-4 p-fluid">
                <label class="font-bold text-gray-600">Pilih Ruangan Tersedia</label>
                <Dropdown v-model="jadwalUntukPlot.ruangan_id" :options="ruanganTersedia" optionLabel="nama_ruangan"
                    optionValue="id" placeholder="Cari ruangan..." filter />
                <small class="text-gray-400 italic">Daftar ini hanya menampilkan ruangan yang tidak bentrok pada jam
                    tersebut.</small>
            </div>
            <template #footer>
                <Button label="Batal" icon="pi pi-times" text severity="success" @click="plotDialog = false" />
                <Button label="Simpan Plot" icon="pi pi-check" severity="success" @click="savePlot" />
            </template>
        </Dialog>

        <!-- Konfirmasi Hapus -->
        <Dialog v-model:visible="deleteDialog" :style="{ width: '450px' }" header="Konfirmasi" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle text-3xl text-red-500" />
                <span v-if="jadwal">Yakin ingin menghapus jadwal <b>{{ jadwal.nama_mk }}</b> kelas <b>{{ jadwal.kelas
                        }}</b>?</span>
            </div>
            <template #footer>
                <Button label="Batal" icon="pi pi-times" text @click="deleteDialog = false" />
                <Button label="Ya, Hapus" icon="pi pi-check" severity="danger" @click="deleteData" />
            </template>
        </Dialog>

        <ConfirmDialog />
    </div>
</template>

<style scoped>
:deep(.p-dialog-footer) {
    padding: 0 1.5rem 1.5rem 1.5rem;
}

:deep(.p-inputnumber-input) {
    text-align: center;
}
</style>