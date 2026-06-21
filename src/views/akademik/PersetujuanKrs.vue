<script setup>
import { useDosenPaStore } from '@/stores/dosenPa';
import { useTahunAkademikStore } from '@/stores/tahunAkademik';
import { storeToRefs } from 'pinia';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref, watch } from 'vue';

const toast = useToast();
const store = useDosenPaStore();
const taStore = useTahunAkademikStore();

const { advisees, adviseeKrs, isLoading } = storeToRefs(store);
const { list: taList } = storeToRefs(taStore);

const selectedTa = ref(null);
const statusFilter = ref(null);
const selectedMahasiswa = ref(null);
const detailDialog = ref(false);

const statusOptions = ['Belum Isi', 'Menunggu Persetujuan', 'Perlu Perbaikan', 'Disetujui', 'Diproses'];

onMounted(async () => {
    await taStore.fetchAll();
    const activeTa = taList.value.find(ta => ta.is_active);
    selectedTa.value = activeTa?.id || taList.value[0]?.id || null;
});

watch(selectedTa, async (tahunAkademikId) => {
    if (tahunAkademikId) await store.fetchMyAdvisees(tahunAkademikId);
});

const filteredAdvisees = computed(() => {
    if (!statusFilter.value) return advisees.value;
    return advisees.value.filter(item => item.status_krs === statusFilter.value);
});

const statusSummary = computed(() => ({
    total: advisees.value.length,
    belum: advisees.value.filter(item => item.status_krs === 'Belum Isi').length,
    sudah: advisees.value.filter(item => item.jumlah_mata_kuliah > 0).length,
    menunggu: advisees.value.filter(item => item.status_krs === 'Menunggu Persetujuan').length,
    selesai: advisees.value.filter(item => item.status_krs === 'Disetujui').length,
    perbaikan: advisees.value.filter(item => item.status_krs === 'Perlu Perbaikan').length
}));

async function openDetail(mhs) {
    selectedMahasiswa.value = mhs;
    if (selectedTa.value) {
        await store.fetchAdviseeKrs(mhs.id, selectedTa.value);
        detailDialog.value = true;
    } else {
        toast.add({ severity: 'warn', summary: 'Peringatan', detail: 'Pilih Tahun Akademik terlebih dahulu', life: 3000 });
    }
}

async function updateStatus(enrollmentId, status) {
    try {
        await store.updateStatus(enrollmentId, status);
        toast.add({ severity: 'success', summary: 'Berhasil', detail: `Status KRS menjadi ${status}`, life: 2000 });
        // Refresh data KRS mahasiswa bimbingan tersebut
        await store.fetchAdviseeKrs(selectedMahasiswa.value.id, selectedTa.value);
        await store.fetchMyAdvisees(selectedTa.value);
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal memperbarui status', life: 3000 });
    }
}

const totalSksBimbingan = computed(() => {
    return adviseeKrs.value.reduce((acc, curr) => acc + (curr.sks || 0), 0);
});

function getStatusSeverity(status) {
    switch (status) {
        case 'Disetujui': return 'success';
        case 'Ditolak': return 'danger';
        case 'MenungguPersetujuan': return 'warn';
        case 'Menunggu Persetujuan': return 'warn';
        case 'Perlu Perbaikan': return 'danger';
        case 'Belum Isi': return 'secondary';
        default: return 'info';
    }
}
</script>

<template>
    <div class="card shadow-sm border-0">
        <div class="flex justify-between items-center mb-6">
            <div>
                <h4 class="m-0 font-bold text-gray-800">Bimbingan Akademik (Dosen PA)</h4>
                <p class="text-sm text-gray-500 m-0">Review dan berikan persetujuan KRS mahasiswa bimbingan Anda.</p>
            </div>
            <div class="flex flex-wrap gap-3">
                <Select v-model="statusFilter" :options="statusOptions" placeholder="Semua Status"
                    showClear class="w-56" />
                <Select v-model="selectedTa" :options="taList" optionLabel="nama" optionValue="id"
                    placeholder="Pilih Semester" class="w-64" filter />
            </div>
        </div>

        <div class="flex flex-wrap gap-2 mb-4">
            <Tag :value="`Total: ${statusSummary.total}`" severity="info" />
            <Tag :value="`Belum Isi: ${statusSummary.belum}`" severity="secondary" />
            <Tag :value="`Sudah Isi: ${statusSummary.sudah}`" severity="contrast" />
            <Tag :value="`Menunggu: ${statusSummary.menunggu}`" severity="warn" />
            <Tag :value="`Disetujui: ${statusSummary.selesai}`" severity="success" />
            <Tag v-if="statusSummary.perbaikan" :value="`Perlu Perbaikan: ${statusSummary.perbaikan}`" severity="danger" />
        </div>

        <DataTable :value="filteredAdvisees" :loading="isLoading" stripedRows class="p-datatable-sm" paginator :rows="15">
            <Column field="nim" header="NIM" sortable class="font-mono font-bold"></Column>
            <Column field="nama_mahasiswa" header="Nama Mahasiswa" sortable></Column>
            <Column field="angkatan" header="Angkatan" sortable class="text-center"></Column>
            <Column field="nama_prodi" header="Program Studi"></Column>
            <Column field="status_krs" header="Status KRS" sortable>
                <template #body="slotProps">
                    <Tag :value="slotProps.data.status_krs" :severity="getStatusSeverity(slotProps.data.status_krs)" />
                </template>
            </Column>
            <Column header="Ringkasan" class="text-center">
                <template #body="slotProps">
                    {{ slotProps.data.jumlah_mata_kuliah }} MK / {{ slotProps.data.total_sks }} SKS
                </template>
            </Column>
            <Column header="KRS" class="text-center">
                <template #body="slotProps">
                    <Button label="Periksa KRS" icon="pi pi-search" size="small" outlined severity="success"
                        :disabled="slotProps.data.jumlah_mata_kuliah === 0" @click="openDetail(slotProps.data)" />
                </template>
            </Column>
            <template #empty>
                <div class="text-center p-4">Tidak ada data mahasiswa bimbingan.</div>
            </template>
        </DataTable>
    </div>

    <!-- Dialog Detail KRS Mahasiswa -->
    <Dialog v-model:visible="detailDialog" :header="`Review KRS: ${selectedMahasiswa?.nama_mahasiswa}`"
        :style="{ width: '75vw' }" modal maximizable>
        <div class="mb-4 p-3 bg-gray-50 rounded border flex justify-between items-center">
            <div class="text-gray-600 text-sm">
                <b>NIM:</b> {{ selectedMahasiswa?.nim }} | <b>Prodi:</b> {{ selectedMahasiswa?.nama_prodi }}
            </div>
            <div class="text-lg font-bold">Total SKS: <span class="text-primary">{{ totalSksBimbingan }}</span></div>
        </div>

        <DataTable :value="adviseeKrs" :loading="isLoading" stripedRows class="p-datatable-sm">
            <Column field="kode_mk" header="Kode" style="width: 100px" class="font-mono"></Column>
            <Column field="nama_mk" header="Mata Kuliah"></Column>
            <Column field="sks" header="SKS" style="width: 80px" class="text-center"></Column>
            <Column field="status_approval" header="Status Saat Ini">
                <template #body="slotProps">
                    <Tag :value="slotProps.data.status_approval"
                        :severity="getStatusSeverity(slotProps.data.status_approval)" />
                </template>
            </Column>
            <Column header="Keputusan Approval" style="width: 150px" class="text-center">
                <template #body="slotProps">
                    <div class="flex gap-2 justify-center">
                        <Button icon="pi pi-check" severity="success" rounded text
                            @click="updateStatus(slotProps.data.id, 'Disetujui')" v-tooltip.top="'Setujui'"
                            :disabled="slotProps.data.status_approval === 'Disetujui'" />
                        <Button icon="pi pi-times" severity="danger" rounded text
                            @click="updateStatus(slotProps.data.id, 'Ditolak')" v-tooltip.top="'Tolak'"
                            :disabled="slotProps.data.status_approval === 'Ditolak'" />
                    </div>
                </template>
            </Column>
        </DataTable>

        <template #footer>
            <Button label="Selesai" icon="pi pi-check" severity="success" @click="detailDialog = false" />
        </template>
    </Dialog>
</template>
