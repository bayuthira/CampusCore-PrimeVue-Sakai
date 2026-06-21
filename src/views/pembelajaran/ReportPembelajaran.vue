<script setup>
import { useReportPembelajaranStore } from '@/stores/reportPembelajaran';
import { useTahunAkademikStore } from '@/stores/tahunAkademik';
import { FilterMatchMode } from '@primevue/core/api';
import { storeToRefs } from 'pinia';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref, watch } from 'vue';

const store = useReportPembelajaranStore();
const tahunStore = useTahunAkademikStore();
const toast = useToast();
const { rows, detail, isLoading, error } = storeToRefs(store);
const { list: tahunList } = storeToRefs(tahunStore);

const selectedTahun = ref(null);
const selectedKelas = ref(null);
const detailDialog = ref(false);
const table = ref(null);
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

onMounted(async () => {
    await tahunStore.fetchAll();
    selectedTahun.value = tahunList.value.find(item => item.is_active)?.id || tahunList.value[0]?.id || null;
});

watch(selectedTahun, async (id) => {
    if (!id) return;
    try {
        await store.fetchReport(id);
    } catch (requestError) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: store.error, life: 4000 });
    }
});

function percent(value, total) {
    if (!total) return 0;
    return Math.round((value / total) * 100);
}

const summary = computed(() => {
    const target = rows.value.reduce((sum, row) => sum + row.target_pertemuan, 0);
    const closed = rows.value.reduce((sum, row) => sum + row.pertemuan_ditutup, 0);
    const bap = rows.value.reduce((sum, row) => sum + row.bap_lengkap, 0);
    const attended = rows.value.reduce((sum, row) => sum + row.mahasiswa_hadir, 0);
    const slots = rows.value.reduce((sum, row) => sum + row.total_slot_presensi, 0);
    return {
        kelas: rows.value.length,
        realisasi: percent(closed, target),
        bap: percent(bap, closed),
        kehadiran: percent(attended, slots)
    };
});

async function openDetail(row) {
    selectedKelas.value = row;
    try {
        await store.fetchDetail(row.jadwal_kuliah_id);
        detailDialog.value = true;
    } catch (requestError) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: store.error, life: 4000 });
    }
}

function exportCsv() {
    table.value?.exportCSV();
}

function statusSeverity(status) {
    return { Dibuka: 'success', Ditutup: 'info', Dibatalkan: 'danger' }[status] || 'secondary';
}
</script>

<template>
    <div class="card">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
                <h1 class="text-2xl font-semibold m-0">Report Pembelajaran</h1>
                <p class="text-muted-color mt-2 mb-0">Monitoring realisasi pertemuan, BAP, dan presensi per kelas.</p>
            </div>
            <div class="flex flex-wrap gap-2">
                <Select v-model="selectedTahun" :options="tahunList" optionLabel="nama" optionValue="id"
                    placeholder="Pilih Tahun Akademik" class="w-64" />
                <Button label="Ekspor CSV" icon="pi pi-download" outlined :disabled="!rows.length" @click="exportCsv" />
            </div>
        </div>

        <Message v-if="error" severity="error" class="mb-4">{{ error }}</Message>

        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div class="p-4 rounded-xl border border-surface"><div class="text-muted-color text-sm">Total Kelas</div><div class="text-3xl font-bold mt-2">{{ summary.kelas }}</div></div>
            <div class="p-4 rounded-xl border border-surface"><div class="text-muted-color text-sm">Realisasi Pertemuan</div><div class="text-3xl font-bold mt-2 text-primary">{{ summary.realisasi }}%</div></div>
            <div class="p-4 rounded-xl border border-surface"><div class="text-muted-color text-sm">Kelengkapan BAP</div><div class="text-3xl font-bold mt-2 text-green-600">{{ summary.bap }}%</div></div>
            <div class="p-4 rounded-xl border border-surface"><div class="text-muted-color text-sm">Kehadiran Mahasiswa</div><div class="text-3xl font-bold mt-2 text-blue-600">{{ summary.kehadiran }}%</div></div>
        </div>

        <DataTable ref="table" :value="rows" :loading="isLoading" paginator :rows="15" stripedRows
            v-model:filters="filters" :globalFilterFields="['kode_mk', 'nama_mk', 'kelas', 'nama_prodi', 'dosen_pengampu']"
            exportFilename="report-pembelajaran">
            <template #header>
                <div class="flex justify-end">
                    <IconField><InputIcon><i class="pi pi-search" /></InputIcon><InputText v-model="filters.global.value" placeholder="Cari kelas..." /></IconField>
                </div>
            </template>
            <Column field="kode_mk" header="Kode" sortable />
            <Column field="nama_mk" header="Mata Kuliah" sortable />
            <Column field="kelas" header="Kelas" />
            <Column field="nama_prodi" header="Prodi" sortable />
            <Column field="dosen_pengampu" header="Dosen Pengampu" />
            <Column header="RPS"><template #body="{ data }"><Tag :value="data.status_rps" :severity="data.status_rps === 'Disetujui' ? 'success' : 'warn'" /></template></Column>
            <Column header="Pertemuan" class="text-center"><template #body="{ data }">{{ data.pertemuan_ditutup }}/{{ data.target_pertemuan }}</template></Column>
            <Column header="BAP" class="text-center"><template #body="{ data }">{{ data.bap_lengkap }}/{{ data.pertemuan_ditutup }}</template></Column>
            <Column header="Kehadiran" class="text-center"><template #body="{ data }">{{ percent(data.mahasiswa_hadir, data.total_slot_presensi) }}%</template></Column>
            <Column header="Aksi" class="text-center"><template #body="{ data }"><Button label="Detail" icon="pi pi-eye" size="small" text @click="openDetail(data)" /></template></Column>
            <template #empty><div class="text-center p-8">Belum ada data pembelajaran pada periode ini.</div></template>
        </DataTable>
    </div>

    <Dialog v-model:visible="detailDialog" :header="`Detail: ${selectedKelas?.kode_mk || ''} - ${selectedKelas?.nama_mk || ''}`"
        modal maximizable :style="{ width: '90vw' }">
        <DataTable :value="detail" :loading="isLoading" paginator :rows="16" stripedRows>
            <Column field="pertemuan_ke" header="Ke-" class="text-center" />
            <Column field="tanggal" header="Tanggal" />
            <Column field="topik_rencana" header="Topik Rencana" />
            <Column field="topik_realisasi" header="Topik Realisasi" />
            <Column header="Status"><template #body="{ data }"><Tag :value="data.status" :severity="statusSeverity(data.status)" /></template></Column>
            <Column header="BAP"><template #body="{ data }"><Tag :value="data.bap_lengkap ? 'Lengkap' : 'Belum'" :severity="data.bap_lengkap ? 'success' : 'warn'" /></template></Column>
            <Column field="hadir" header="H" class="text-center" />
            <Column field="terlambat" header="T" class="text-center" />
            <Column field="izin" header="I" class="text-center" />
            <Column field="sakit" header="S" class="text-center" />
            <Column field="alpa" header="A" class="text-center" />
        </DataTable>
    </Dialog>
</template>
