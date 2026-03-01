<script setup>
import { useDosenPaStore } from '@/stores/dosenPa';
import { useTahunAkademikStore } from '@/stores/tahunAkademik';
import { storeToRefs } from 'pinia';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';

const toast = useToast();
const store = useDosenPaStore();
const taStore = useTahunAkademikStore();

const { advisees, adviseeKrs, isLoading } = storeToRefs(store);
const { list: taList } = storeToRefs(taStore);

const selectedTa = ref(null);
const selectedMahasiswa = ref(null);
const detailDialog = ref(false);

const statusOptions = [
    { label: 'Setujui', value: 'Disetujui' },
    { label: 'Tolak', value: 'Ditolak' },
    { label: 'Menunggu', value: 'MenungguPersetujuan' }
];

onMounted(() => {
    store.fetchMyAdvisees();
    taStore.fetchAll();
});

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
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Status KRS diperbarui', life: 2000 });
        await store.fetchAdviseeKrs(selectedMahasiswa.value.id, selectedTa.value);
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal memperbarui status', life: 3000 });
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
    <div class="card">
        <div class="flex justify-between items-center mb-6">
            <h4 class="m-0">Bimbingan Akademik (Dosen PA)</h4>
            <Dropdown v-model="selectedTa" :options="taList" optionLabel="nama" optionValue="id" placeholder="Pilih Semester Berjalan" class="w-64" />
        </div>

        <DataTable :value="advisees" :loading="isLoading">
            <Column field="nim" header="NIM" sortable></Column>
            <Column field="nama_mahasiswa" header="Nama Mahasiswa" sortable></Column>
            <Column field="angkatan" header="Angkatan" sortable></Column>
            <Column field="nama_prodi" header="Prodi"></Column>
            <Column header="KRS">
                <template #body="slotProps">
                    <Button label="Periksa KRS" icon="pi pi-search" size="small" outlined @click="openDetail(slotProps.data)" />
                </template>
            </Column>
        </DataTable>
    </div>

    <!-- Dialog Detail KRS Mahasiswa -->
    <Dialog v-model:visible="detailDialog" :header="`KRS: ${selectedMahasiswa?.nama_mahasiswa}`" :style="{ width: '70vw' }" modal>
        <div class="mb-4 text-gray-600">
            NIM: {{ selectedMahasiswa?.nim }} | Prodi: {{ selectedMahasiswa?.nama_prodi }}
        </div>
        
        <DataTable :value="adviseeKrs" :loading="isLoading">
            <Column field="kode_mk" header="Kode"></Column>
            <Column field="nama_mk" header="Mata Kuliah"></Column>
            <Column field="sks" header="SKS"></Column>
            <Column field="status_approval" header="Status">
                <template #body="slotProps">
                    <Tag :value="slotProps.data.status_approval" :severity="getStatusSeverity(slotProps.data.status_approval)" />
                </template>
            </Column>
            <Column header="Keputusan">
                <template #body="slotProps">
                    <div class="flex gap-2">
                        <Button 
                            icon="pi pi-check" 
                            severity="success" 
                            rounded text 
                            @click="updateStatus(slotProps.data.id, 'Disetujui')"
                            v-tooltip.top="'Setujui'"
                        />
                        <Button 
                            icon="pi pi-times" 
                            severity="danger" 
                            rounded text 
                            @click="updateStatus(slotProps.data.id, 'Ditolak')"
                            v-tooltip.top="'Tolak'"
                        />
                    </div>
                </template>
            </Column>
        </DataTable>
    </Dialog>
</template>