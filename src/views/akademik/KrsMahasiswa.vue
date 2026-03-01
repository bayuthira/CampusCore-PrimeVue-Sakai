<script setup>
import { useKrsStore } from '@/stores/krs';
import { useMataKuliahStore } from '@/stores/matakuliah';
import { useTahunAkademikStore } from '@/stores/tahunAkademik';
import { storeToRefs } from 'pinia';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref, watch } from 'vue';

const toast = useToast();
const krsStore = useKrsStore();
const mkStore = useMataKuliahStore();
const taStore = useTahunAkademikStore();

const { myEnrollments, isLoading } = storeToRefs(krsStore);
const { mataKuliahList } = storeToRefs(mkStore);
const { list: taList } = storeToRefs(taStore);

const selectedTa = ref(null);
const mkDialog = ref(false);

onMounted(async () => {
    await taStore.fetchAll(); 
    await mkStore.fetchMataKuliah();
    
    // Set default TA aktif jika ada
    const activeTa = taList.value.find(ta => ta.is_active);
    if (activeTa) {
        selectedTa.value = activeTa.id; // Perbaikan: Gunakan .value, bukan .ref
    }
});

// Watch perubahan TA untuk refresh data KRS
watch(selectedTa, (newVal) => {
    if (newVal) krsStore.fetchMyEnrollments(newVal);
});

const totalSks = computed(() => {
    return myEnrollments.value.reduce((acc, curr) => acc + (curr.sks || 0), 0);
});

async function addMk(mkId) {
    if (!selectedTa.value) {
        toast.add({ severity: 'warn', summary: 'Peringatan', detail: 'Pilih Tahun Akademik terlebih dahulu', life: 3000 });
        return;
    }
    try {
        await krsStore.enroll({
            matakuliah_id: mkId,
            tahun_akademik_id: selectedTa.value
        });
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Mata Kuliah berhasil masuk KRS', life: 3000 });
        krsStore.fetchMyEnrollments(selectedTa.value);
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: e.response?.data?.error || 'Gagal menambah KRS', life: 3000 });
    }
}

async function dropMk(id) {
    try {
        await krsStore.unenroll(id);
        toast.add({ severity: 'info', summary: 'Berhasil', detail: 'Mata Kuliah dihapus dari KRS', life: 3000 });
        krsStore.fetchMyEnrollments(selectedTa.value);
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal menghapus KRS', life: 3000 });
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
        <div class="flex flex-wrap justify-between items-center mb-6 gap-4">
            <h4 class="m-0">Kartu Rencana Studi (KRS)</h4>
            <div class="flex gap-4 items-center">
                <Dropdown v-model="selectedTa" :options="taList" optionLabel="nama" optionValue="id" placeholder="Pilih Semester" class="w-64" filter />
                <Button label="Tambah Mata Kuliah" icon="pi pi-plus" @click="mkDialog = true" :disabled="!selectedTa" />
            </div>
        </div>

        <DataTable :value="myEnrollments" :loading="isLoading" responsiveLayout="scroll">
            <Column field="kode_mk" header="Kode" style="width: 15%"></Column>
            <Column field="nama_mk" header="Mata Kuliah" style="width: 40%"></Column>
            <Column field="sks" header="SKS" style="width: 10%"></Column>
            <Column field="status_approval" header="Status">
                <template #body="slotProps">
                    <Tag :value="slotProps.data.status_approval" :severity="getStatusSeverity(slotProps.data.status_approval)" />
                </template>
            </Column>
            <Column header="Aksi" style="width: 10%">
                <template #body="slotProps">
                    <Button 
                        icon="pi pi-trash" 
                        severity="danger" 
                        text rounded 
                        @click="dropMk(slotProps.data.id)" 
                        :disabled="slotProps.data.status_approval === 'Disetujui'"
                        v-tooltip.top="'Batalkan Pengambilan'"
                    />
                </template>
            </Column>
            <template #footer>
                <div class="flex justify-end p-2 text-xl font-bold">
                    Total SKS: {{ totalSks }}
                </div>
            </template>
        </DataTable>
    </div>

    <!-- Dialog Pilih MK -->
    <Dialog v-model:visible="mkDialog" header="Pilih Mata Kuliah" :style="{ width: '80vw' }" modal maximizable>
        <DataTable :value="mataKuliahList" paginator :rows="10" filterDisplay="menu">
            <Column field="kode_mk" header="Kode" sortable></Column>
            <Column field="nama_mk" header="Mata Kuliah" sortable></Column>
            <Column field="sks" header="SKS" sortable></Column>
            <Column header="Aksi">
                <template #body="slotProps">
                    <Button 
                        label="Ambil" 
                        icon="pi pi-plus" 
                        size="small"
                        @click="addMk(slotProps.data.id)" 
                        :disabled="myEnrollments.some(e => e.kode_mk === slotProps.data.kode_mk)"
                    />
                </template>
            </Column>
        </DataTable>
    </Dialog>
</template>