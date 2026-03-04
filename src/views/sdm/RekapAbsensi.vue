<script setup>
import { useAbsensiStore } from '@/stores/absensi';
import { usePegawaiStore } from '@/stores/pegawai';
import { FilterMatchMode, FilterOperator } from '@primevue/core/api';
import { storeToRefs } from 'pinia';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';

const toast = useToast();
const absensiStore = useAbsensiStore();
const pegawaiStore = usePegawaiStore();

const { rekapList, isLoading } = storeToRefs(absensiStore);
const { list: pegawaiList } = storeToRefs(pegawaiStore);

// --- State Filter Atas ---
const filter = ref({
    bulan: new Date().getMonth() + 1,
    tahun: new Date().getFullYear(),
    pegawai_id: null
});

// --- Konfigurasi Filter Tabel (Pencarian per Kolom) ---
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    nama_pegawai: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    tanggal: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
    status: { value: null, matchMode: FilterMatchMode.EQUALS },
    keterangan: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] }
});

// --- State Dialog Manual ---
const dialogManual = ref(false);
const manualData = ref({
    pegawai_id: null,
    tanggal: null,
    status: null,
    keterangan: ''
});
const submitted = ref(false);

const bulanOptions = [
    { label: 'Januari', value: 1 }, { label: 'Februari', value: 2 }, { label: 'Maret', value: 3 },
    { label: 'April', value: 4 }, { label: 'Mei', value: 5 }, { label: 'Juni', value: 6 },
    { label: 'Juli', value: 7 }, { label: 'Agustus', value: 8 }, { label: 'September', value: 9 },
    { label: 'Oktober', value: 10 }, { label: 'November', value: 11 }, { label: 'Desember', value: 12 }
];

const statusOptions = ['Hadir', 'Sakit', 'Ijin', 'Cuti', 'Alpa'];

onMounted(() => {
    pegawaiStore.fetchAll();
    loadRekap();
});

async function loadRekap() {
    if (!filter.value.bulan || !filter.value.tahun) {
        toast.add({ severity: 'warn', summary: 'Perhatian', detail: 'Bulan dan Tahun wajib dipilih', life: 3000 });
        return;
    }
    await absensiStore.fetchRekapSemua(filter.value);
}

// Mapping data agar nama pegawai bisa dicari di tabel
const displayRekap = computed(() => {
    return rekapList.value.map(item => ({
        ...item,
        nama_pegawai: getNamaPegawai(item.pegawai_id)
    }));
});

function openManualDialog() {
    manualData.value = {
        pegawai_id: null,
        tanggal: new Date(),
        status: 'Hadir',
        keterangan: ''
    };
    submitted.value = false;
    dialogManual.value = true;
}

function formatDate(date) {
    if (!date) return null;
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

async function handleSaveManual() {
    submitted.value = true;
    if (!manualData.value.pegawai_id || !manualData.value.tanggal || !manualData.value.status) return;

    try {
        const payload = {
            ...manualData.value,
            tanggal: formatDate(manualData.value.tanggal)
        };
        await absensiStore.inputManual(payload);
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Data absensi berhasil diperbarui', life: 3000 });
        dialogManual.value = false;
        loadRekap();
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal menyimpan data manual', life: 3000 });
    }
}

function getNamaPegawai(id) {
    const p = pegawaiList.value.find(x => x.id === id);
    return p ? p.nama_lengkap : 'Pegawai Tidak Ditemukan';
}

function getStatusSeverity(status) {
    switch (status) {
        case 'Hadir': return 'success';
        case 'Sakit': return 'warn';
        case 'Ijin': return 'info';
        case 'Cuti': return 'secondary';
        case 'Alpa': return 'danger';
        default: return null;
    }
}
</script>

<template>
    <div class="card">
        <div class="flex flex-wrap justify-between items-center mb-6 gap-4">
            <h4 class="m-0">Rekap Absensi Karyawan</h4>
            <Button label="Input Manual / Perbaikan" icon="pi pi-pencil" severity="secondary"
                @click="openManualDialog" />
        </div>

        <!-- Filter Area -->
        <div class="grid grid-cols-12 gap-4 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-100 shadow-sm">
            <div class="col-span-12 md:col-span-3">
                <label class="block font-bold mb-2">Bulan</label>
                <Dropdown v-model="filter.bulan" :options="bulanOptions" optionLabel="label" optionValue="value"
                    fluid />
            </div>
            <div class="col-span-12 md:col-span-2">
                <label class="block font-bold mb-2">Tahun</label>
                <InputNumber v-model="filter.tahun" :useGrouping="false" fluid />
            </div>
            <div class="col-span-12 md:col-span-4">
                <label class="block font-bold mb-2">Pegawai (Opsional)</label>
                <Dropdown v-model="filter.pegawai_id" :options="pegawaiList" optionLabel="nama_lengkap" optionValue="id"
                    placeholder="Semua Pegawai" filter showClear fluid />
            </div>
            <div class="col-span-12 md:col-span-3 flex items-end">
                <Button label="Cari Data" icon="pi pi-search" @click="loadRekap" fluid />
            </div>
        </div>

        <DataTable :value="displayRekap" :loading="isLoading" paginator :rows="20" v-model:filters="filters"
            filterDisplay="menu" :globalFilterFields="['nama_pegawai', 'tanggal', 'status', 'keterangan']"
            responsiveLayout="scroll" class="p-datatable-sm">
            <template #header>
                <div class="flex justify-between items-center">
                    <span class="text-xl font-bold">Data Kehadiran</span>
                    <IconField>
                        <InputIcon>
                            <i class="pi pi-search" />
                        </InputIcon>
                        <InputText v-model="filters['global'].value" placeholder="Cari global..." />
                    </IconField>
                </div>
            </template>
            <template #empty> Tidak ada data absensi pada periode ini. </template>

            <Column field="tanggal" header="Tanggal" sortable style="width: 15%">
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" placeholder="Cari Tanggal..." />
                </template>
            </Column>

            <Column field="nama_pegawai" header="Nama Pegawai" sortable style="width: 25%">
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" placeholder="Cari Nama..." />
                </template>
            </Column>

            <Column field="status" header="Status" sortable style="width: 15%" :showFilterMatchModes="false">
                <template #body="slotProps">
                    <Tag :value="slotProps.data.status" :severity="getStatusSeverity(slotProps.data.status)" />
                </template>
                <template #filter="{ filterModel }">
                    <Dropdown v-model="filterModel.value" :options="statusOptions" placeholder="Pilih Status"
                        showClear />
                </template>
            </Column>

            <Column field="keterangan" header="Keterangan" style="width: 35%">
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" placeholder="Cari Keterangan..." />
                </template>
                <template #body="slotProps">
                    {{ slotProps.data.keterangan || '-' }}
                </template>
            </Column>
        </DataTable>
    </div>

    <!-- Dialog Input Manual -->
    <Dialog v-model:visible="dialogManual" header="Input/Update Kehadiran Manual" :style="{ width: '500px' }" modal>
        <div class="flex flex-col gap-6">
            <div>
                <label class="block font-bold mb-3">Pegawai *</label>
                <Dropdown v-model="manualData.pegawai_id" :options="pegawaiList" optionLabel="nama_lengkap"
                    optionValue="id" placeholder="Pilih Pegawai" filter :invalid="submitted && !manualData.pegawai_id"
                    fluid />
                <small v-if="submitted && !manualData.pegawai_id" class="text-red-500">Pegawai wajib dipilih.</small>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block font-bold mb-3">Tanggal *</label>
                    <Calendar v-model="manualData.tanggal" dateFormat="yy-mm-dd"
                        :invalid="submitted && !manualData.tanggal" fluid />
                </div>
                <div>
                    <label class="block font-bold mb-3">Status *</label>
                    <Dropdown v-model="manualData.status" :options="statusOptions" placeholder="Pilih Status"
                        :invalid="submitted && !manualData.status" fluid />
                </div>
            </div>
            <div>
                <label class="block font-bold mb-3">Keterangan (Opsional)</label>
                <Textarea v-model="manualData.keterangan" rows="3" placeholder="Contoh: Sakit dengan surat dokter"
                    fluid />
            </div>
            <div class="bg-blue-50 p-4 rounded text-sm text-blue-700">
                <i class="pi pi-info-circle mr-2"></i>
                Menginput data pada tanggal yang sudah ada datanya akan menimpa (Update) data sebelumnya.
            </div>
        </div>
        <template #footer>
            <Button label="Batal" icon="pi pi-times" text @click="dialogManual = false" />
            <Button label="Simpan Perubahan" icon="pi pi-check" @click="handleSaveManual" />
        </template>
    </Dialog>
</template>