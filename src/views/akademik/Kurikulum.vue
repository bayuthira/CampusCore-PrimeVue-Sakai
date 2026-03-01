<script setup>
import { useKurikulumStore } from '@/stores/kurikulum';
import { useMataKuliahStore } from '@/stores/matakuliah';
import { useProdiStore } from '@/stores/prodi';
import { FilterMatchMode } from '@primevue/core/api';
import { storeToRefs } from 'pinia';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';

const toast = useToast();
const store = useKurikulumStore();
const prodiStore = useProdiStore();
const mkStore = useMataKuliahStore();

const { list, isLoading, currentSubjects } = storeToRefs(store);
const { prodiList } = storeToRefs(prodiStore);
const { mataKuliahList: allMkList } = storeToRefs(mkStore);

const dialog = ref(false);
const mappingDialog = ref(false);
const deleteDialog = ref(false);
const data = ref({});
const selectedKurikulum = ref(null);
const submitted = ref(false);
const mkToAdd = ref(null);

const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

onMounted(() => {
    store.fetchAll();
    prodiStore.fetchProdi();
    mkStore.fetchMataKuliah();
});

// --- Master Kurikulum ---
function openNew() {
    data.value = { is_active: true, tahun_mulai: new Date().getFullYear() };
    submitted.value = false;
    dialog.value = true;
}

function editData(row) {
    data.value = { ...row };
    dialog.value = true;
}

async function saveData() {
    submitted.value = true;
    if (!data.value.nama || !data.value.prodi_id || !data.value.tahun_mulai) return;

    try {
        if (data.value.id) {
            await store.update(data.value.id, data.value);
            toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Kurikulum diperbarui', life: 3000 });
        } else {
            await store.create(data.value);
            toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Kurikulum dibuat', life: 3000 });
        }
        dialog.value = false;
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal menyimpan data', life: 3000 });
    }
}

function confirmDelete(row) {
    data.value = row;
    deleteDialog.value = true;
}

async function deleteData() {
    try {
        await store.delete(data.value.id);
        deleteDialog.value = false;
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Kurikulum dihapus', life: 3000 });
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal menghapus data', life: 3000 });
    }
}

// --- Mapping Mata Kuliah ---
async function openMapping(row) {
    selectedKurikulum.value = row;
    mkToAdd.value = null;
    // Ambil data terbaru baik relasi maupun master makul
    await Promise.all([
        store.fetchSubjects(row.id),
        mkStore.fetchMataKuliah()
    ]);
    mappingDialog.value = true;
}

async function handleAddMk() {
    if (!mkToAdd.value) return;
    try {
        await store.addSubject(selectedKurikulum.value.id, mkToAdd.value);
        mkToAdd.value = null;
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Mata kuliah ditambahkan ke kurikulum', life: 2000 });
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal menambahkan mata kuliah', life: 3000 });
    }
}

async function removeMk(mkId) {
    try {
        await store.removeSubject(selectedKurikulum.value.id, mkId);
        toast.add({ severity: 'warn', summary: 'Dihapus', detail: 'Mata kuliah dikeluarkan dari kurikulum', life: 2000 });
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal menghapus relasi', life: 3000 });
    }
}

// Filter MK yang belum ada di kurikulum saat ini dan sesuai Prodi
const availableMkOptions = computed(() => {
    if (!selectedKurikulum.value) return [];
    
    // Ambil ID semua MK yang sudah terdaftar di kurikulum ini
    const existingIds = currentSubjects.value.map(s => s.id);
    
    return allMkList.value.filter(mk => {
        const isNotMapped = !existingIds.includes(mk.id);
        const isSameProdi = mk.prodi_id === selectedKurikulum.value.prodi_id;
        return isNotMapped && isSameProdi;
    });
});

</script>

<template>
    <div class="card">
        <Toolbar class="mb-6">
            <template #start>
                <Button label="Tambah Kurikulum" icon="pi pi-plus" severity="secondary" @click="openNew" />
            </template>
        </Toolbar>

        <DataTable :value="list" :loading="isLoading" :filters="filters" paginator :rows="10">
            <template #header>
                <div class="flex justify-between items-center">
                    <h4 class="m-0">Master Kurikulum</h4>
                    <IconField>
                        <InputIcon><i class="pi pi-search" /></InputIcon>
                        <InputText v-model="filters['global'].value" placeholder="Cari..." />
                    </IconField>
                </div>
            </template>
            <Column field="nama" header="Nama Kurikulum" sortable></Column>
            <Column field="nama_prodi" header="Program Studi" sortable></Column>
            <Column field="tahun_mulai" header="Tahun" sortable></Column>
            <Column field="is_active" header="Status">
                <template #body="slotProps">
                    <Tag :value="slotProps.data.is_active ? 'Aktif' : 'Non-Aktif'" :severity="slotProps.data.is_active ? 'success' : 'danger'" />
                </template>
            </Column>
            <Column header="Aksi" :exportable="false" style="min-width: 12rem">
                <template #body="slotProps">
                    <Button icon="pi pi-list" outlined rounded severity="info" class="mr-2" @click="openMapping(slotProps.data)" v-tooltip.top="'Kelola Mata Kuliah'" />
                    <Button icon="pi pi-pencil" outlined rounded class="mr-2" @click="editData(slotProps.data)" />
                    <Button icon="pi pi-trash" outlined rounded severity="danger" @click="confirmDelete(slotProps.data)" />
                </template>
            </Column>
        </DataTable>
    </div>

    <!-- Dialog Edit/Tambah Kurikulum -->
    <Dialog v-model:visible="dialog" :style="{ width: '450px' }" header="Detail Kurikulum" :modal="true">
        <div class="flex flex-col gap-6">
            <div>
                <label class="block font-bold mb-3">Nama Kurikulum *</label>
                <InputText v-model.trim="data.nama" required autofocus :invalid="submitted && !data.nama" fluid />
            </div>
            <div>
                <label class="block font-bold mb-3">Program Studi *</label>
                <Dropdown v-model="data.prodi_id" :options="prodiList" optionLabel="nama_prodi" optionValue="id" placeholder="Pilih Prodi" fluid filter />
            </div>
            <div>
                <label class="block font-bold mb-3">Tahun Mulai *</label>
                <InputNumber v-model="data.tahun_mulai" :useGrouping="false" fluid />
            </div>
            <div class="flex items-center">
                <InputSwitch v-model="data.is_active" />
                <label class="ml-2 font-bold">Aktif</label>
            </div>
        </div>
        <template #footer>
            <Button label="Batal" icon="pi pi-times" text @click="dialog = false" />
            <Button label="Simpan" icon="pi pi-check" @click="saveData" />
        </template>
    </Dialog>

    <!-- Dialog Pemetaan Mata Kuliah -->
    <Dialog v-model:visible="mappingDialog" :style="{ width: '800px' }" :header="`Mata Kuliah: ${selectedKurikulum?.nama}`" :modal="true" maximizable>
        <div class="flex flex-col gap-4">
            <div class="flex gap-2">
                <Dropdown 
                    v-model="mkToAdd" 
                    :options="availableMkOptions" 
                    optionLabel="nama_mk" 
                    optionValue="id" 
                    placeholder="Pilih Mata Kuliah untuk ditambahkan" 
                    class="flex-grow" 
                    filter 
                    :filterFields="['kode_mk', 'nama_mk']"
                >
                    <template #option="slotProps">
                        <div class="flex flex-col">
                            <span class="font-bold">{{ slotProps.option.kode_mk }} - {{ slotProps.option.nama_mk }}</span>
                            <small>Prodi: {{ slotProps.option.nama_prodi }} | SKS: {{ slotProps.option.sks }}</small>
                        </div>
                    </template>
                </Dropdown>
                <Button label="Tambah" icon="pi pi-plus" @click="handleAddMk" :disabled="!mkToAdd" />
            </div>

            <DataTable :value="currentSubjects" :loading="isLoading" scrollable scrollHeight="400px">
                <Column field="kode_mk" header="Kode" style="width: 20%"></Column>
                <Column field="nama_mk" header="Mata Kuliah" style="width: 50%"></Column>
                <Column field="sks" header="SKS" style="width: 10%"></Column>
                <Column field="semester_target" header="Sem." style="width: 10%"></Column>
                <Column header="Aksi" style="width: 10%">
                    <template #body="slotProps">
                        <Button icon="pi pi-trash" severity="danger" text rounded @click="removeMk(slotProps.data.id)" v-tooltip.top="'Hapus dari Kurikulum'" />
                    </template>
                </Column>
            </DataTable>
        </div>
    </Dialog>

    <!-- Dialog Hapus Kurikulum -->
    <Dialog v-model:visible="deleteDialog" :style="{ width: '450px' }" header="Konfirmasi" :modal="true">
        <div class="flex items-center gap-4">
            <i class="pi pi-exclamation-triangle text-3xl text-red-500" />
            <span v-if="data">Hapus kurikulum <b>{{ data.nama }}</b>?</span>
        </div>
        <template #footer>
            <Button label="Tidak" icon="pi pi-times" text @click="deleteDialog = false" />
            <Button label="Ya" icon="pi pi-check" @click="deleteData" />
        </template>
    </Dialog>
</template>