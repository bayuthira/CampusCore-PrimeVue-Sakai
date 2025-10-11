<script setup>
import { useDashboardStore } from '@/stores/dashboard';
import { useKendaraanStore } from '@/stores/kendaraan';
import { storeToRefs } from 'pinia';
import { computed, onMounted, ref, watch } from 'vue';

// --- Stores & Refs ---
const dashboardStore = useDashboardStore();
const kendaraanStore = useKendaraanStore();

const { kondisiAset, lowStock, biayaAset, bookingSummary, kendaraanSummary } = storeToRefs(dashboardStore);
const { list: kendaraanList } = storeToRefs(kendaraanStore);

// Refs untuk filter
const biayaStartDate = ref(new Date(new Date().getFullYear(), 0, 1));
const biayaEndDate = ref(new Date());
const kendaraanFilter = ref({
    id: null,
    startDate: new Date(new Date().getFullYear(), 0, 1),
    endDate: new Date()
});

// --- Lifecycle & Watchers ---
onMounted(() => {
    fetchDashboardData();
    kendaraanStore.fetchAll();
});

watch([biayaStartDate, biayaEndDate], fetchDashboardData, { deep: true });
watch(
    kendaraanFilter,
    () => {
        if (kendaraanFilter.value.id) {
            dashboardStore.fetchKendaraanSummary(kendaraanFilter.value.id, {
                start_date: formatDate(kendaraanFilter.value.startDate),
                end_date: formatDate(kendaraanFilter.value.endDate)
            });
        }
    },
    { deep: true }
);

function fetchDashboardData() {
    dashboardStore.fetchAllBaumData({
        start_date: formatDate(biayaStartDate.value),
        end_date: formatDate(biayaEndDate.value)
    });
}

function formatDate(date) {
    if (!date) return null;
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// --- Data & Options untuk Chart ---

// Opsi untuk Pie & Doughnut (tanpa scales)
const pieDoughnutOptions = ref({
    maintainAspectRatio: false,
    aspectRatio: 0.8,
    plugins: {
        legend: {
            labels: {
                color: 'var(--text-color)'
            }
        }
    }
});

// Opsi khusus untuk Bar Chart (dengan scales)
const barChartOptions = ref({
    maintainAspectRatio: false,
    aspectRatio: 0.8,
    plugins: {
        legend: {
            labels: {
                color: 'var(--text-color)'
            }
        }
    },
    scales: {
        x: {
            ticks: { color: 'var(--text-color-secondary)' },
            grid: { color: 'var(--surface-border)' }
        },
        y: {
            ticks: { color: 'var(--text-color-secondary)' },
            grid: { color: 'var(--surface-border)' }
        }
    }
});

const kondisiAsetChart = computed(() => {
    const data = kondisiAset.value || {};
    return {
        labels: Object.keys(data).map((key) => key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())),
        datasets: [
            {
                data: Object.values(data),
                backgroundColor: ['#42A5F5', '#FFCA28', '#FF7043', '#78909C', '#EF5350'],
                hoverBackgroundColor: ['#64B5F6', '#FFD54F', '#FF8A65', '#90A4AE', '#F06292']
            }
        ]
    };
});

const biayaAsetChart = computed(() => {
    const data = biayaAset.value || [];
    return {
        labels: data.map((item) => item.tipe_biaya),
        datasets: [
            {
                label: 'Total Biaya (Rp)',
                data: data.map((item) => parseFloat(item.total)),
                backgroundColor: '#6366F1',
                borderColor: '#6366F1'
            }
        ]
    };
});

const bookingSummaryChart = computed(() => {
    const data = bookingSummary.value || {};
    return {
        labels: Object.keys(data).map((key) => key.charAt(0).toUpperCase() + key.slice(1)),
        datasets: [
            {
                data: Object.values(data),
                backgroundColor: ['#64748B', '#22C55E', '#EF4444', '#A855F7', '#F97316', '#3B82F6'],
                hoverBackgroundColor: ['#94A3B8', '#4ADE80', '#F87171', '#C084FC', '#FB923C', '#60A5FA']
            }
        ]
    };
});

// Helper untuk format mata uang
const formatCurrency = (value) => {
    if (value === null || value === undefined) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(value);
};
</script>

<template>
    <div class="grid grid-cols-12 gap-4">
        <div class="col-span-12 lg:col-span-6">
            <div class="card h-full">
                <div class="font-semibold text-xl mb-4">Ringkasan Kondisi Aset Tetap</div>
                <Chart type="pie" :data="kondisiAsetChart" :options="pieDoughnutOptions" style="position: relative; height: 300px" />
            </div>
        </div>

        <div class="col-span-12 lg:col-span-6">
            <div class="card h-full">
                <div class="font-semibold text-xl mb-4">Ringkasan Status Booking</div>
                <Chart type="doughnut" :data="bookingSummaryChart" :options="pieDoughnutOptions" style="position: relative; height: 300px" />
            </div>
        </div>

        <div class="col-span-12 lg:col-span-6">
            <div class="card h-full">
                <div class="font-semibold text-xl mb-4">Ringkasan Biaya Aset per Kategori</div>
                <div class="flex flex-wrap gap-4 mb-4">
                    <div>
                        <label for="biayaStart" class="font-bold block mb-2">Dari Tanggal</label>
                        <Calendar id="biayaStart" v-model="biayaStartDate" dateFormat="yy-mm-dd" />
                    </div>
                    <div>
                        <label for="biayaEnd" class="font-bold block mb-2">Sampai Tanggal</label>
                        <Calendar id="biayaEnd" v-model="biayaEndDate" dateFormat="yy-mm-dd" />
                    </div>
                </div>
                <Chart type="bar" :data="biayaAsetChart" :options="barChartOptions" style="position: relative; height: 300px" />
            </div>
        </div>

        <div class="col-span-12 lg:col-span-6">
            <div class="card h-full">
                <div class="font-semibold text-xl mb-4">Laporan Stok Aset Habis Pakai Menipis</div>
                <DataTable :value="lowStock" responsiveLayout="scroll" scrollable scrollHeight="350px">
                    <Column field="nama_barang" header="Nama Barang"></Column>
                    <Column field="stok" header="Stok"></Column>
                    <Column field="batas_minimum_stok" header="Min."></Column>
                </DataTable>
            </div>
        </div>

        <div class="col-span-12 lg:col-span-6">
            <div class="card">
                <div class="font-semibold text-xl mb-4">Ringkasan Biaya & Penggunaan per Kendaraan</div>
                <div class="flex flex-wrap gap-4 mb-4">
                    <div>
                        <label for="kendaraanSelect" class="font-bold block mb-2">Pilih Kendaraan</label>
                        <Dropdown id="kendaraanSelect" v-model="kendaraanFilter.id" :options="kendaraanList" optionLabel="display_label" optionValue="id" placeholder="Pilih Kendaraan" filter />
                    </div>
                    <div>
                        <label for="kendaraanStart" class="font-bold block mb-2">Dari Tanggal</label>
                        <Calendar id="kendaraanStart" v-model="kendaraanFilter.startDate" dateFormat="yy-mm-dd" />
                    </div>
                    <div>
                        <label for="kendaraanEnd" class="font-bold block mb-2">Sampai Tanggal</label>
                        <Calendar id="kendaraanEnd" v-model="kendaraanFilter.endDate" dateFormat="yy-mm-dd" />
                    </div>
                </div>
                <div v-if="kendaraanSummary" class="grid grid-cols-12 gap-4 mt-4">
                    <div class="col-span-12 md:col-span-4">
                        <div class="surface-ground p-3 border-round">
                            <div class="flex justify-between mb-3">
                                <div>
                                    <span class="block text-500 font-medium mb-3">Total Biaya Servis</span>
                                    <div class="text-900 font-medium text-xl">{{ formatCurrency(kendaraanSummary.total_biaya_servis) }}</div>
                                </div>
                                <div class="flex items-center justify-center bg-blue-100 rounded-md" style="width: 2.5rem; height: 2.5rem">
                                    <i class="pi pi-dollar text-blue-500 text-xl"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-span-12 md:col-span-4">
                        <div class="surface-ground p-3 border-round">
                            <div class="flex justify-between mb-3">
                                <div>
                                    <span class="block text-500 font-medium mb-3">Total Jarak Tempuh</span>
                                    <div class="text-900 font-medium text-xl">{{ kendaraanSummary.total_jarak_tempuh }} KM</div>
                                </div>
                                <div class="flex items-center justify-center bg-orange-100 rounded-md" style="width: 2.5rem; height: 2.5rem">
                                    <i class="pi pi-map-marker text-orange-500 text-xl"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-span-12 md:col-span-4">
                        <div class="surface-ground p-3 border-round">
                            <div class="flex justify-between mb-3">
                                <div>
                                    <span class="block text-500 font-medium mb-3">Biaya per KM</span>
                                    <div class="text-900 font-medium text-xl">{{ formatCurrency(kendaraanSummary.biaya_per_km) }}</div>
                                </div>
                                <div class="flex items-center justify-center bg-cyan-100 rounded-md" style="width: 2.5rem; height: 2.5rem">
                                    <i class="pi pi-chart-line text-cyan-500 text-xl"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div v-else class="text-center p-4">
                    <p>Silakan pilih kendaraan untuk melihat ringkasan.</p>
                </div>
            </div>
        </div>
    </div>
</template>
