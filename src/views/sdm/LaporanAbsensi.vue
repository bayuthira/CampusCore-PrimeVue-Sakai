<script setup>
import apiClient from '@/services/api'; // Menggunakan config API terpusat
import { useAbsensiReportStore } from '@/stores/absensiReport';
import { usePegawaiStore } from '@/stores/pegawai';
import { FilterMatchMode } from '@primevue/core/api';
import { storeToRefs } from 'pinia';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref, watch } from 'vue';

const toast = useToast();
const reportStore = useAbsensiReportStore();
const pegawaiStore = usePegawaiStore();

const { reportData, summary, isLoading } = storeToRefs(reportStore);
const { list: pegawaiList } = storeToRefs(pegawaiStore);

const activeTab = ref(0); // 0: Harian, 1: Bulanan
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

// --- Params Harian ---
const selectedDate = ref(new Date());

// --- Params Bulanan ---
const selectedPegawai = ref(null);
const selectedMonth = ref(new Date().getMonth() + 1);
const selectedYear = ref(new Date().getFullYear());

// --- Modal Foto & Lokasi ---
const photoDialog = ref(false);
const isPhotoLoading = ref(false);
const activePhotos = ref({
    in: null,
    out: null,
    nama: '',
    tanggal: '',
    lat_in: null,
    lng_in: null,
    lat_out: null,
    lng_out: null
});

const bulanOptions = [
    { label: 'Januari', value: 1 }, { label: 'Februari', value: 2 }, { label: 'Maret', value: 3 },
    { label: 'April', value: 4 }, { label: 'Mei', value: 5 }, { label: 'Juni', value: 6 },
    { label: 'Juli', value: 7 }, { label: 'Agustus', value: 8 }, { label: 'September', value: 9 },
    { label: 'Oktober', value: 10 }, { label: 'November', value: 11 }, { label: 'Desember', value: 12 }
];

// Computed untuk mendapatkan nama pegawai yang dipilih pada mode bulanan
const selectedPegawaiName = computed(() => {
    if (!selectedPegawai.value) return '';
    const p = pegawaiList.value.find(x => x.id === selectedPegawai.value);
    return p ? p.nama_lengkap : '';
});

onMounted(() => {
    pegawaiStore.fetchAll();
    loadData();
});

function formatDateParam(date) {
    if (!date) return null;
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

async function loadData() {
    if (activeTab.value === 0) {
        await reportStore.fetchLaporanHarian(formatDateParam(selectedDate.value));
    } else {
        // Jika di tab bulanan dan belum pilih pegawai, kosongkan tabel
        if (!selectedPegawai.value) {
            reportStore.$patch({ reportData: [], summary: null });
            return;
        }
        await reportStore.fetchLaporanBulanan({
            pegawai_id: selectedPegawai.value,
            bulan: selectedMonth.value,
            tahun: selectedYear.value
        });
    }
}

// Watch perubahan tab atau filter harian
watch([activeTab, selectedDate], () => {
    loadData();
});

function formatTime(isoString) {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function getStatusSeverity(ket) {
    if (!ket) return 'info';
    const k = ket.toLowerCase();
    if (k.includes('terlambat') || k.includes('pulang cepat')) return 'warn';
    if (k.includes('sakit') || k.includes('cuti') || k.includes('ijin')) return 'info';
    if (k.includes('alpa') || k.includes('tidak absen')) return 'danger';
    if (k.includes('tepat waktu') || k.includes('lembur') || k === 'hadir') return 'success';
    return 'secondary';
}

// --- Fungsi Pengambilan Foto Aman (Bearer Token) ---
async function fetchSecureImage(path) {
    if (!path) return null;
    try {
        const cleanPath = path.replace(/^\/?uploads\//, '');
        const response = await apiClient.get(`files/${cleanPath}`, {
            responseType: 'blob'
        });
        return URL.createObjectURL(response.data);
    } catch (e) {
        console.error('Gagal memuat foto absensi:', e);
        return null;
    }
}

async function viewPhotos(data) {
    revokePhotoUrls();
    activePhotos.value = {
        in: null,
        out: null,
        nama: data.nama_pegawai || selectedPegawaiName.value,
        tanggal: data.tanggal,
        lat_in: data.latitude_in,
        lng_in: data.longitude_in,
        lat_out: data.latitude_out,
        lng_out: data.longitude_out
    };

    photoDialog.value = true;
    isPhotoLoading.value = true;

    try {
        const [urlIn, urlOut] = await Promise.all([
            fetchSecureImage(data.foto_absensi_path_in),
            fetchSecureImage(data.foto_absensi_path_out)
        ]);
        activePhotos.value.in = urlIn;
        activePhotos.value.out = urlOut;
    } finally {
        isPhotoLoading.value = false;
    }
}

function revokePhotoUrls() {
    if (activePhotos.value.in) URL.revokeObjectURL(activePhotos.value.in);
    if (activePhotos.value.out) URL.revokeObjectURL(activePhotos.value.out);
}

function closePhotoDialog() {
    photoDialog.value = false;
    revokePhotoUrls();
}

function getMapUrl(lat, lng) {
    if (!lat || !lng || lat === 0) return null;
    return `https://www.google.com/maps?q=${lat},${lng}&output=embed`;
}

// Helper untuk format menit ke Jam:Menit
function formatMinutes(minutes) {
    if (!minutes || minutes === 0) return '0 menit';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h} jam ${m} menit` : `${m} menit`;
}

/**
 * Memformat string keterangan agar lebih rapi menggunakan data numerik jika tersedia.
 * Memastikan status "Alpa" atau "Keterangan Khusus" tidak hilang.
 */
function getFullKeterangan(data) {
    let parts = [];

    // 1. Cek Keterlambatan (Numeric - Biasa ada di laporan bulanan)
    if (data.terlambat_menit > 0) {
        let t = `Terlambat: ${formatMinutes(data.terlambat_menit)}`;
        if (data.terlambat_toleransi_menit > 0) {
            t += ` (Toleransi: ${formatMinutes(data.terlambat_toleransi_menit)})`;
        }
        parts.push(t);
    }

    // 2. Cek Lembur (Numeric)
    if (data.lembur_menit > 0) {
        parts.push(`Lembur: ${formatMinutes(data.lembur_menit)}`);
    }

    // 3. Jika ada hasil dari kalkulasi numerik di atas, gabungkan dan kembalikan
    if (parts.length > 0) return parts.join(', ');

    // 4. Jika tidak ada data numerik (Laporan Harian), gunakan keterangan dari backend
    if (data.keterangan) return data.keterangan;

    // 5. Fallback jika data absensi kosong (Alpa)
    if (!data.clock_in && !data.clock_out) return 'Tidak Absen (Alpa)';
    if (!data.clock_in) return 'Tidak Absen Masuk';
    if (!data.clock_out) return 'Tidak Absen Pulang';

    return 'Hadir';
}

</script>

<template>
    <div class="card border-0 shadow-sm">
        <div class="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <div>
                <h3 class="text-2xl font-bold m-0 text-slate-800">Laporan Kehadiran Karyawan</h3>
                <p class="text-slate-500 m-0">Analisis keterlambatan, lembur, dan kedisiplinan</p>
            </div>
            <div class="flex gap-2">
                <SelectButton v-model="activeTab" :options="[{ label: 'Harian', value: 0 }, { label: 'Bulanan', value: 1 }]"
                    optionLabel="label" optionValue="value" />
            </div>
        </div>

        <!-- Filter Area -->
        <div class="p-4 bg-slate-50 rounded-xl border border-slate-100 mb-6 shadow-inner">
            <div v-if="activeTab === 0" class="flex flex-wrap items-end gap-4">
                <div class="flex flex-col gap-2">
                    <label class="font-bold text-sm text-slate-600">Pilih Tanggal</label>
                    <DatePicker v-model="selectedDate" dateFormat="yy-mm-dd" showIcon fluid class="w-48" />
                </div>
                <Button label="Refresh" icon="pi pi-refresh" text @click="loadData" />
            </div>

            <div v-else class="flex flex-wrap items-end gap-4">
                <div class="flex flex-col gap-2 flex-grow max-w-xs">
                    <label class="font-bold text-sm text-slate-600">Pilih Pegawai</label>
                    <Dropdown v-model="selectedPegawai" :options="pegawaiList" optionLabel="nama_lengkap"
                        optionValue="id" placeholder="Cari Pegawai..." filter fluid />
                </div>
                <div class="flex flex-col gap-2">
                    <label class="font-bold text-sm text-slate-600">Bulan</label>
                    <Dropdown v-model="selectedMonth" :options="bulanOptions" optionLabel="label" optionValue="value"
                        fluid class="w-40" />
                </div>
                <div class="flex flex-col gap-2">
                    <label class="font-bold text-sm text-slate-600">Tahun</label>
                    <InputNumber v-model="selectedYear" :useGrouping="false" fluid class="w-24" />
                </div>
                <Button label="Tampilkan Laporan" icon="pi pi-search" @click="loadData" :disabled="!selectedPegawai" />
            </div>
        </div>

        <!-- Dashboard Summary (Hanya Bulanan) -->
        <div v-if="activeTab === 1 && summary" class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div class="bg-white p-4 rounded-xl border-l-4 border-red-500 shadow-sm flex items-center gap-4">
                <div class="p-3 bg-red-50 rounded-lg text-red-500">
                    <i class="pi pi-clock text-xl"></i>
                </div>
                <div>
                    <div class="text-xs text-slate-500 uppercase font-bold">Total Terlambat</div>
                    <div class="text-lg font-bold text-slate-800">{{ formatMinutes(summary.total_terlambat_menit) }}
                    </div>
                </div>
            </div>
            <div class="bg-white p-4 rounded-xl border-l-4 border-orange-500 shadow-sm flex items-center gap-4">
                <div class="p-3 bg-orange-50 rounded-lg text-orange-500">
                    <i class="pi pi-info-circle text-xl"></i>
                </div>
                <div>
                    <div class="text-xs text-slate-500 uppercase font-bold">Setelah Toleransi</div>
                    <div class="text-lg font-bold text-slate-800">{{
                        formatMinutes(summary.total_terlambat_toleransi_menit) }}</div>
                </div>
            </div>
            <div class="bg-white p-4 rounded-xl border-l-4 border-green-500 shadow-sm flex items-center gap-4">
                <div class="p-3 bg-green-50 rounded-lg text-green-500">
                    <i class="pi pi-bolt text-xl"></i>
                </div>
                <div>
                    <div class="text-xs text-slate-500 uppercase font-bold">Total Lembur</div>
                    <div class="text-lg font-bold text-slate-800">{{ formatMinutes(summary.total_lembur_menit) }}</div>
                </div>
            </div>
        </div>

        <!-- Data Table -->
        <DataTable :value="reportData" :loading="isLoading" paginator :rows="31" v-model:filters="filters"
            :globalFilterFields="['nama_pegawai', 'tanggal', 'keterangan']" responsiveLayout="scroll"
            class="p-datatable-sm overflow-hidden rounded-lg border border-slate-200" stripedRows>
            <template #header>
                <div class="flex justify-between items-center">
                    <div class="flex items-center gap-2">
                        <i class="pi pi-list text-primary"></i>
                        <span v-if="activeTab === 1 && selectedPegawaiName" class="text-lg font-bold text-primary">
                            Rincian Kehadiran: {{ selectedPegawaiName }}
                        </span>
                        <span v-else class="text-lg font-bold">Data Kehadiran</span>
                    </div>
                    <IconField>
                        <InputIcon><i class="pi pi-search" /></InputIcon>
                        <InputText v-model="filters['global'].value" placeholder="Cari di tabel..." />
                    </IconField>
                </div>
            </template>
            <template #empty>
                <div class="text-center p-8 text-slate-400">
                    <template v-if="activeTab === 1 && !selectedPegawai">
                        <i class="pi pi-user text-4xl mb-3 block text-primary/40"></i>
                        <span>Silakan pilih karyawan terlebih dahulu.</span>
                    </template>
                    <template v-else>
                        <i class="pi pi-calendar-times text-4xl mb-3 block"></i>
                        <span>Data tidak ditemukan.</span>
                    </template>
                </div>
            </template>

            <Column v-if="activeTab === 0" field="nama_pegawai" header="Nama Pegawai" sortable class="font-bold">
            </Column>
            <Column v-else field="tanggal" header="Tanggal" sortable></Column>

            <Column header="Masuk" style="width: 100px">
                <template #body="slotProps">
                    <span class="font-mono text-blue-600 font-bold">{{ formatTime(slotProps.data.clock_in) }}</span>
                </template>
            </Column>

            <Column header="Pulang" style="width: 100px">
                <template #body="slotProps">
                    <span class="font-mono text-orange-600 font-bold">{{ formatTime(slotProps.data.clock_out) }}</span>
                </template>
            </Column>

            <Column field="keterangan" header="Status & Analisis">
                <template #body="slotProps">
                    <div class="flex flex-col gap-1">
                        <!-- Menggunakan getFullKeterangan untuk nilai dan severity warna -->
                        <Tag :value="getFullKeterangan(slotProps.data)"
                            :severity="getStatusSeverity(getFullKeterangan(slotProps.data))" class="w-fit" />
                    </div>
                </template>
            </Column>

            <Column header="Bukti" style="width: 80px">
                <template #body="slotProps">
                    <Button v-if="slotProps.data.foto_absensi_path_in || slotProps.data.foto_absensi_path_out"
                        icon="pi pi-map-marker" severity="info" rounded text v-tooltip.top="'Lihat Foto & Lokasi'"
                        @click="viewPhotos(slotProps.data)" />
                </template>
            </Column>
        </DataTable>
    </div>

    <!-- Modal Penampil Foto & Peta -->
    <Dialog v-model:visible="photoDialog" :header="`Bukti Absensi`" :style="{ width: '850px' }" modal
        @hide="closePhotoDialog">
        <div v-if="photoDialog">
            <div class="text-slate-500 mb-4 font-bold flex items-center">
                <i class="pi pi-calendar mr-2"></i>Tanggal: {{ activePhotos.tanggal }}
                <ProgressSpinner v-if="isPhotoLoading" style="width: 20px; height: 20px; margin-left: 1rem"
                    strokeWidth="8" />
            </div>

            <div class="grid grid-cols-12 gap-4">
                <!-- Bagian Masuk -->
                <div class="col-span-12 md:col-span-6 border-r pr-2 border-slate-200">
                    <div class="flex flex-col gap-3">
                        <span class="font-bold text-blue-700 text-sm flex items-center">
                            <i class="pi pi-sign-in mr-2"></i>ABSEN MASUK
                        </span>

                        <div
                            class="w-full aspect-[4/3] bg-slate-100 rounded-lg overflow-hidden border border-slate-200 shadow-sm relative flex items-center justify-center">
                            <img v-if="activePhotos.in" :src="activePhotos.in" class="w-full h-full object-cover" />
                            <div v-else-if="isPhotoLoading" class="flex flex-col items-center">
                                <ProgressSpinner style="width: 30px; height: 30px" />
                            </div>
                            <div v-else class="flex flex-col items-center text-slate-400 italic">
                                <i class="pi pi-image text-3xl mb-2"></i>
                                <span class="text-xs">Tidak tersedia</span>
                            </div>
                        </div>

                        <div
                            class="w-full h-48 bg-slate-50 rounded-lg overflow-hidden border border-slate-200 shadow-sm mt-1">
                            <iframe v-if="activePhotos.lat_in" width="100%" height="100%" frameborder="0"
                                style="border:0" :src="getMapUrl(activePhotos.lat_in, activePhotos.lng_in)"
                                allowfullscreen>
                            </iframe>
                        </div>
                    </div>
                </div>

                <!-- Bagian Pulang -->
                <div class="col-span-12 md:col-span-6 pl-2">
                    <div class="flex flex-col gap-3">
                        <span class="font-bold text-orange-700 text-sm flex items-center">
                            <i class="pi pi-sign-out mr-2"></i>ABSEN PULANG
                        </span>

                        <div
                            class="w-full aspect-[4/3] bg-slate-100 rounded-lg overflow-hidden border border-slate-200 shadow-sm relative flex items-center justify-center">
                            <img v-if="activePhotos.out" :src="activePhotos.out" class="w-full h-full object-cover" />
                            <div v-else-if="isPhotoLoading" class="flex flex-col items-center">
                                <ProgressSpinner style="width: 30px; height: 30px" />
                            </div>
                            <div v-else class="flex flex-col items-center text-slate-400 italic">
                                <i class="pi pi-image text-3xl mb-2"></i>
                                <span class="text-xs">Tidak tersedia</span>
                            </div>
                        </div>

                        <div
                            class="w-full h-48 bg-slate-50 rounded-lg overflow-hidden border border-slate-200 shadow-sm mt-1">
                            <iframe v-if="activePhotos.lat_out" width="100%" height="100%" frameborder="0"
                                style="border:0" :src="getMapUrl(activePhotos.lat_out, activePhotos.lng_out)"
                                allowfullscreen>
                            </iframe>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <template #footer>
            <Button label="Tutup" icon="pi pi-times" @click="closePhotoDialog" text severity="secondary" />
        </template>
    </Dialog>
</template>

<style scoped>
:deep(.p-datatable-thead > tr > th) {
    background-color: #f8fafc;
}

iframe {
    filter: contrast(1.1);
}
</style>