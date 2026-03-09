<script setup>
import { useDosenStore } from '@/stores/dosen';
import { useDosenPaStore } from '@/stores/dosenPa';
import { useProdiStore } from '@/stores/prodi';
import { storeToRefs } from 'pinia';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';

const toast = useToast();
const store = useDosenPaStore();
const dosenStore = useDosenStore();
const prodiStore = useProdiStore();

const { dosenList } = storeToRefs(dosenStore);
const { prodiList } = storeToRefs(prodiStore);

const batchData = ref({
    prodi_id: null,
    angkatan: new Date().getFullYear(),
    kode_rombel: '',
    dosen_pa_id: null
});

const submitted = ref(false);

onMounted(() => {
    dosenStore.fetchDosen();
    prodiStore.fetchProdi();
});

async function handleBatchAssign() {
    submitted.value = true;
    if (!batchData.value.prodi_id || !batchData.value.angkatan || !batchData.value.kode_rombel || !batchData.value.dosen_pa_id) {
        toast.add({ severity: 'warn', summary: 'Perhatian', detail: 'Harap lengkapi semua field', life: 3000 });
        return;
    }

    try {
        await store.batchAssign(batchData.value);
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Dosen PA berhasil diatur secara massal', life: 3000 });
        submitted.value = false;
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal memproses batch assign', life: 3000 });
    }
}
</script>

<template>
    <div class="card shadow-sm border-0">
        <h4 class="font-bold text-gray-800 mb-6">Batch Assign Dosen Pembimbing Akademik</h4>

        <div class="p-fluid grid grid-cols-12 gap-4">
            <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                <label class="font-bold text-sm text-gray-600">Program Studi *</label>
                <Dropdown v-model="batchData.prodi_id" :options="prodiList" optionLabel="nama_prodi" optionValue="id"
                    placeholder="Pilih Prodi" filter :invalid="submitted && !batchData.prodi_id" />
            </div>

            <div class="col-span-12 md:col-span-3 flex flex-col gap-2">
                <label class="font-bold text-sm text-gray-600">Angkatan *</label>
                <InputNumber v-model="batchData.angkatan" :useGrouping="false" placeholder="2024"
                    :invalid="submitted && !batchData.angkatan" />
            </div>

            <div class="col-span-12 md:col-span-3 flex flex-col gap-2">
                <label class="font-bold text-sm text-gray-600">Kode Rombel (Kelas) *</label>
                <InputText v-model.trim="batchData.kode_rombel" placeholder="Contoh: A"
                    :invalid="submitted && !batchData.kode_rombel" />
            </div>

            <div class="col-span-12 flex flex-col gap-2">
                <label class="font-bold text-sm text-gray-600">Dosen Pembimbing (PA) *</label>
                <Dropdown v-model="batchData.dosen_pa_id" :options="dosenList" optionLabel="nama_dosen" optionValue="id"
                    placeholder="Cari Nama Dosen" filter :invalid="submitted && !batchData.dosen_pa_id" />
            </div>

            <div class="col-span-12 mt-4">
                <div class="p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 text-sm mb-4">
                    <i class="pi pi-exclamation-triangle mr-2"></i>
                    Tindakan ini akan <b>mengganti</b> Dosen PA seluruh mahasiswa pada kriteria di atas dengan dosen
                    terpilih.
                </div>
                <Button label="Terapkan Dosen PA Massal" icon="pi pi-users" severity="success" class="w-full md:w-auto"
                    @click="handleBatchAssign" />
            </div>
        </div>
    </div>
</template>