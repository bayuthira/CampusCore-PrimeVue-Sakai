<script setup>
import { useDosenStore } from '@/stores/dosen';
import { usePegawaiStore } from '@/stores/pegawai';
import { useProdiStore } from '@/stores/prodi';
import { FilterMatchMode } from '@primevue/core/api';
import { storeToRefs } from 'pinia';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';

const toast = useToast();
const dosenStore = useDosenStore();
const prodiStore = useProdiStore();
const pegawaiStore = usePegawaiStore();

const { dosenList, isLoading } = storeToRefs(dosenStore);
const { prodiList } = storeToRefs(prodiStore);
const { list: allPegawaiList } = storeToRefs(pegawaiStore);

const dosenDialog = ref(false);
const deleteDosenDialog = ref(false);
const dosen = ref({});
const submitted = ref(false);

const dt = ref();
const filters = ref({ global: { value: null, matchMode: FilterMatchMode.CONTAINS } });

const ikatanKerjaOptions = ref([
    { label: 'Dosen Tetap (A)', value: 'A' },
    { label: 'Dosen Dpk (B)', value: 'B' },
    { label: 'Dosen LB (C)', value: 'C' }
]);

const pendidikList = computed(() => allPegawaiList.value.filter(p => p.kategori_pegawai === 'Tenaga Pendidik'));

onMounted(() => {
    dosenStore.fetchDosen();
    prodiStore.fetchProdi();
    pegawaiStore.fetchAll();
});

async function saveDosen() {
    submitted.value = true;
    if (!dosen.value.nidn?.trim() || !dosen.value.prodi_id || (!dosen.value.id && !dosen.value.pegawai_id)) return;

    try {
        if (dosen.value.id) {
            const payload = {
                nidn: dosen.value.nidn,
                prodi_id: dosen.value.prodi_id.id || dosen.value.prodi_id,
                ikatan_kerja: dosen.value.ikatan_kerja,
                id_penugasan_feeder: dosen.value.id_penugasan_feeder
            };
            await dosenStore.updateDosen(dosen.value.id, payload);
            toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Data Dosen Diperbarui', life: 3000 });
        } else {
            const payload = {
                nidn: dosen.value.nidn,
                pegawai_id: dosen.value.pegawai_id,
                prodi_id: dosen.value.prodi_id.id || dosen.value.prodi_id,
                ikatan_kerja: dosen.value.ikatan_kerja,
                id_penugasan_feeder: dosen.value.id_penugasan_feeder
            };
            await dosenStore.createDosen(payload);
            toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Dosen Berhasil Ditambahkan', life: 3000 });
        }
        dosenDialog.value = false;
        dosen.value = {};
    } catch (error) {
        const errorMessage = error.response?.data?.error || 'Terjadi kesalahan';
        toast.add({ severity: 'error', summary: 'Gagal', detail: errorMessage, life: 4000 });
    }
}

function openNew() {
    dosen.value = { ikatan_kerja: 'A' };
    submitted.value = false;
    dosenDialog.value = true;
}

function editDosen(data) {
    dosen.value = { ...data };
    dosenDialog.value = true;
}

async function deleteDosen() {
    try {
        await dosenStore.deleteDosen(dosen.value.id);
        deleteDosenDialog.value = false;
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Ikatan Dosen Dihapus', life: 3000 });
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal menghapus data', life: 3000 });
    }
}
</script>

<template>
    <div class="card shadow-sm border-0">
        <Toolbar class="mb-6">
            <template #start><Button label="Tambah Dosen" icon="pi pi-plus" severity="primary"
                    @click="openNew" /></template>
        </Toolbar>

        <DataTable :value="dosenList" :loading="isLoading" paginator :rows="10" v-model:filters="filters" stripedRows
            class="p-datatable-sm">
            <template #header>
                <div class="flex flex-wrap gap-2 items-center justify-between">
                    <h4 class="m-0 font-bold text-gray-700">Data Master Dosen</h4>
                    <IconField>
                        <InputIcon><i class="pi pi-search" /></InputIcon>
                        <InputText v-model="filters.global.value" placeholder="Cari..." />
                    </IconField>
                </div>
            </template>
            <Column field="nidn" header="NIDN" sortable></Column>
            <Column field="nama_dosen" header="Nama Dosen" sortable></Column>
            <Column field="nama_prodi" header="Homebase" sortable></Column>
            <Column :exportable="false" header="Aksi">
                <template #body="slotProps">
                    <Button icon="pi pi-pencil" outlined rounded severity="info" class="mr-2"
                        @click="editDosen(slotProps.data)" />
                    <Button icon="pi pi-trash" outlined rounded severity="danger"
                        @click="dosen = slotProps.data; deleteDosenDialog = true" />
                </template>
            </Column>
        </DataTable>

        <Dialog v-model:visible="dosenDialog" :style="{ width: '550px' }" header="Detail Data Dosen" :modal="true"
            class="p-fluid">
            <div class="flex flex-col gap-4 mt-2">
                <div v-if="!dosen.id" class="flex flex-col gap-2">
                    <label class="font-bold text-sm text-gray-600">Pilih Pegawai *</label>
                    <Dropdown v-model="dosen.pegawai_id" :options="pendidikList" optionLabel="nama_lengkap"
                        optionValue="id" placeholder="Cari Pegawai" filter :invalid="submitted && !dosen.pegawai_id" />
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div class="flex flex-col gap-2">
                        <label class="font-bold text-sm text-gray-600">NIDN / NIDK *</label>
                        <InputText v-model.trim="dosen.nidn" required :invalid="submitted && !dosen.nidn" />
                    </div>
                    <div class="flex flex-col gap-2">
                        <label class="font-bold text-sm text-gray-600">Ikatan Kerja</label>
                        <Dropdown v-model="dosen.ikatan_kerja" :options="ikatanKerjaOptions" optionLabel="label"
                            optionValue="value" />
                    </div>
                </div>
                <div class="flex flex-col gap-2">
                    <label class="font-bold text-sm text-gray-600">Program Studi (Homebase) *</label>
                    <Dropdown v-model="dosen.prodi_id" :options="prodiList" optionLabel="nama_prodi" optionValue="id"
                        filter :invalid="submitted && !dosen.prodi_id" />
                </div>
                <div class="flex flex-col gap-2">
                    <label class="font-bold text-sm text-gray-600">ID Penugasan (Neo Feeder)</label>
                    <InputText v-model.trim="dosen.id_penugasan_feeder" placeholder="Opsional" />
                </div>
            </div>
            <template #footer>
                <div class="flex justify-end gap-3 mt-4">
                    <Button label="Batal" icon="pi pi-times" text severity="success" @click="dosenDialog = false" />
                    <Button label="Simpan Perubahan" icon="pi pi-check" severity="success" @click="saveDosen" />
                </div>
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteDosenDialog" :style="{ width: '450px' }" header="Konfirmasi" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle text-3xl text-red-500" />
                <span v-if="dosen">Hapus ikatan dosen <b>{{ dosen.nama_dosen }}</b>?</span>
            </div>
            <template #footer>
                <Button label="Batal" icon="pi pi-times" text @click="deleteDosenDialog = false" />
                <Button label="Ya, Hapus" icon="pi pi-check" severity="danger" @click="deleteDosen" />
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
:deep(.p-dialog-footer) {
    padding: 0 1.5rem 1.5rem 1.5rem;
}
</style>