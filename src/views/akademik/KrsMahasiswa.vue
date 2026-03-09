<script setup>
import { useKrsStore } from '@/stores/krs';
import { useTahunAkademikStore } from '@/stores/tahunAkademik';
import { storeToRefs } from 'pinia';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref, watch } from 'vue';

const toast = useToast();
const krsStore = useKrsStore();
const taStore = useTahunAkademikStore();

const { myEnrollments, availableJadwal, isLoading } = storeToRefs(krsStore);
const { list: taList } = storeToRefs(taStore);

const selectedTa = ref(null);
const mkDialog = ref(false);
const selectedJadwal = ref([]); // Untuk penampung checkbox

onMounted(async () => {
    await taStore.fetchAll();
    const activeTa = taList.value.find(ta => ta.is_active);
    if (activeTa) {
        selectedTa.value = activeTa.id;
    }
});

watch(selectedTa, (newVal) => {
    if (newVal) {
        krsStore.fetchMyEnrollments(newVal);
        krsStore.fetchAvailableJadwal(newVal);
    }
});

const totalSks = computed(() => {
    return myEnrollments.value.reduce((acc, curr) => acc + (curr.sks || 0), 0);
});

// Filter jadwal cerdas berdasarkan is_paket
const paketJadwal = computed(() => availableJadwal.value.filter(j => j.is_paket));
const pilihanJadwal = computed(() => availableJadwal.value.filter(j => !j.is_paket));

async function handleKrsSubmit() {
    if (selectedJadwal.value.length === 0) {
        toast.add({ severity: 'warn', summary: 'Peringatan', detail: 'Pilih minimal satu mata kuliah', life: 3000 });
        return;
    }

    try {
        await krsStore.submitKrs({
            tahun_akademik_id: selectedTa.value,
            jadwal_kuliah_ids: selectedJadwal.value.map(j => j.jadwal_id)
        });
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'KRS berhasil diajukan', life: 3000 });
        selectedJadwal.value = [];
        mkDialog.value = false;
        krsStore.fetchMyEnrollments(selectedTa.value);
    } catch (e) {
        const errorMsg = e.response?.data?.error || 'Gagal mengirim KRS. Mungkin di luar periode pengisian.';
        toast.add({ severity: 'error', summary: 'Gagal', detail: errorMsg, life: 5000 });
    }
}

async function dropMk(id) {
    try {
        await krsStore.unenroll(id);
        toast.add({ severity: 'info', summary: 'Berhasil', detail: 'Mata Kuliah dihapus dari KRS', life: 3000 });
        krsStore.fetchMyEnrollments(selectedTa.value);
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal menghapus mata kuliah', life: 3000 });
    }
}

function getStatusSeverity(status) {
    switch (status) {
        case 'Disetujui': return 'success';
        case 'Ditolak': return 'danger';
        case 'MenungguPersetujuan': return 'warn';
        default: return 'info';
    }
}
</script>

<template>
    <div class="card shadow-sm border-0">
        <div class="flex flex-wrap justify-between items-center mb-6 gap-4">
            <div>
                <h4 class="m-0 font-bold text-gray-800">Kartu Rencana Studi (KRS)</h4>
                <p class="text-sm text-gray-500 m-0">Silakan pilih semester dan ajukan rencana studi Anda.</p>
            </div>
            <div class="flex gap-3 items-center">
                <Dropdown v-model="selectedTa" :options="taList" optionLabel="nama" optionValue="id"
                    placeholder="Pilih Semester" class="w-64" filter />
                <Button label="Isi / Tambah MK" icon="pi pi-plus" severity="primary" @click="mkDialog = true"
                    :disabled="!selectedTa" />
            </div>
        </div>

        <DataTable :value="myEnrollments" :loading="isLoading" stripedRows class="p-datatable-sm">
            <template #header>
                <div class="font-bold text-gray-700">Daftar Mata Kuliah Diambil</div>
            </template>
            <Column field="kode_mk" header="Kode" style="width: 100px" class="font-mono"></Column>
            <Column field="nama_mk" header="Mata Kuliah"></Column>
            <Column field="sks" header="SKS" style="width: 80px" class="text-center"></Column>
            <Column field="status_approval" header="Status Approval">
                <template #body="slotProps">
                    <Tag :value="slotProps.data.status_approval"
                        :severity="getStatusSeverity(slotProps.data.status_approval)" />
                </template>
            </Column>
            <Column header="Aksi" style="width: 100px" class="text-center">
                <template #body="slotProps">
                    <Button icon="pi pi-trash" severity="danger" text rounded @click="dropMk(slotProps.data.id)"
                        :disabled="slotProps.data.status_approval === 'Disetujui'" v-tooltip.top="'Batalkan MK'" />
                </template>
            </Column>
            <template #footer>
                <div class="flex justify-end p-2 text-xl">
                    <span>Total Beban Studi: <b class="text-primary">{{ totalSks }} SKS</b></span>
                </div>
            </template>
            <template #empty>
                <div class="text-center p-4 text-gray-400">Belum ada mata kuliah yang diambil untuk semester ini.</div>
            </template>
        </DataTable>
    </div>

    <!-- Dialog Pengisian KRS (UI Cerdas) -->
    <Dialog v-model:visible="mkDialog" header="Pengisian KRS Online" :style="{ width: '85vw' }" modal maximizable>
        <div class="flex flex-col gap-4">
            <div class="p-3 bg-blue-50 border border-blue-100 rounded text-blue-800 text-sm">
                <i class="pi pi-info-circle mr-2"></i>
                Pilih mata kuliah yang ingin Anda ambil, lalu klik tombol <b>Ajukan KRS</b> di bawah.
            </div>

            <TabView>
                <TabPanel header="Mata Kuliah Paket (Rombel)">
                    <DataTable :value="paketJadwal" v-model:selection="selectedJadwal" dataKey="jadwal_id"
                        class="p-datatable-sm">
                        <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
                        <Column field="kode_mk" header="Kode"></Column>
                        <Column field="nama_mk" header="Mata Kuliah"></Column>
                        <Column field="sks" header="SKS" class="text-center"></Column>
                        <Column field="kelas" header="Kelas" class="text-center"></Column>
                        <Column header="Jadwal">
                            <template #body="slotProps">
                                {{ slotProps.data.hari }}, {{ slotProps.data.jam_mulai.substring(0, 5) }}
                            </template>
                        </Column>
                        <Column field="dosen_pengampu" header="Dosen"></Column>
                    </DataTable>
                </TabPanel>
                <TabPanel header="Mata Kuliah Pilihan / Lainnya">
                    <DataTable :value="pilihanJadwal" v-model:selection="selectedJadwal" dataKey="jadwal_id"
                        class="p-datatable-sm">
                        <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
                        <Column field="kode_mk" header="Kode"></Column>
                        <Column field="nama_mk" header="Mata Kuliah"></Column>
                        <Column field="sks" header="SKS" class="text-center"></Column>
                        <Column field="kelas" header="Kelas" class="text-center"></Column>
                        <Column header="Jadwal">
                            <template #body="slotProps">
                                {{ slotProps.data.hari }}, {{ slotProps.data.jam_mulai.substring(0, 5) }}
                            </template>
                        </Column>
                        <Column field="dosen_pengampu" header="Dosen"></Column>
                    </DataTable>
                </TabPanel>
            </TabView>
        </div>

        <template #footer>
            <div class="flex justify-between items-center w-full">
                <span class="text-gray-600">Terpilih: <b>{{ selectedJadwal.length }}</b> Mata Kuliah</span>
                <div class="flex gap-2">
                    <Button label="Batal" icon="pi pi-times" text severity="danger" @click="mkDialog = false" />
                    <Button label="Ajukan KRS" icon="pi pi-check-square" severity="success" @click="handleKrsSubmit"
                        :loading="isLoading" />
                </div>
            </div>
        </template>
    </Dialog>
</template>