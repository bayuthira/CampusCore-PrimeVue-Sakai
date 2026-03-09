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
const importResultDialog = ref(false);
const data = ref({});
const selectedKurikulum = ref(null);
const submitted = ref(false);
const mkToAdd = ref(null);
const fileInput = ref(null);
const importResult = ref(null);

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
    data.value = {
        is_active: true,
        tahun_mulai: new Date().getFullYear(),
        sks_lulus: 144,
        sks_wajib: 130,
        sks_pilihan: 14
    };
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
            toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Kurikulum Diperbarui', life: 3000 });
        } else {
            await store.create(data.value);
            toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Kurikulum Baru Berhasil Dibuat', life: 3000 });
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
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Kurikulum Dihapus', life: 3000 });
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal menghapus data', life: 3000 });
    }
}

// --- Fitur Import & Template Mapping Baru ---
function triggerFileInput() {
    fileInput.value.click();
}

async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
        const result = await store.importMapping(formData);
        importResult.value = result;
        importResultDialog.value = true;
    } catch (error) {
        // Fallback struktur jika error tidak mengikuti format mapping
        importResult.value = error.response?.data || {
            message: 'Gagal melakukan import',
            success_count: 0,
            failed_count: 1,
            errors: [error.message]
        };
        importResultDialog.value = true;
    }
    event.target.value = ''; // Reset input
}

async function downloadMappingTemplate() {
    try {
        const blob = await store.downloadMappingTemplate();
        const url = window.URL.createObjectURL(new Blob([blob]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'template_mapping_kurikulum.csv');
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url);
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal mengunduh template mapping', life: 3000 });
    }
}

// --- Mapping Mata Kuliah Manual ---
async function openMapping(row) {
    selectedKurikulum.value = row;
    mkToAdd.value = null;
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
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Mata kuliah ditambahkan', life: 2000 });
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal menambahkan mata kuliah', life: 3000 });
    }
}

async function removeMk(mkId) {
    try {
        await store.removeSubject(selectedKurikulum.value.id, mkId);
        toast.add({ severity: 'warn', summary: 'Dihapus', detail: 'Mata kuliah dikeluarkan', life: 2000 });
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal menghapus relasi', life: 3000 });
    }
}

const availableMkOptions = computed(() => {
    if (!selectedKurikulum.value) return [];
    const existingIds = currentSubjects.value.map(s => s.id);
    return allMkList.value.filter(mk => {
        const isNotMapped = !existingIds.includes(mk.id);
        const isSameProdi = mk.prodi_id === selectedKurikulum.value.prodi_id;
        return isNotMapped && isSameProdi;
    });
});
</script>

<template>
    <div class="card shadow-sm border-0">
        <Toolbar class="mb-6">
            <template #start>
                <Button label="Tambah Kurikulum" icon="pi pi-plus" severity="primary" class="mr-2" @click="openNew" />
                <!-- Tombol Baru: Import & Template -->
                <Button label="Import Mapping" icon="pi pi-upload" severity="secondary" class="mr-2"
                    @click="triggerFileInput" />
                <input type="file" ref="fileInput" @change="handleFileUpload" style="display: none" accept=".csv" />
                <Button label="Unduh Template Mapping" icon="pi pi-download" severity="secondary"
                    @click="downloadMappingTemplate" />
            </template>
        </Toolbar>

        <DataTable :value="list" :loading="isLoading" :filters="filters" paginator :rows="10" stripedRows
            class="p-datatable-sm">
            <template #header>
                <div class="flex justify-between items-center">
                    <h4 class="m-0 font-bold text-gray-700">Master Kurikulum</h4>
                    <IconField>
                        <InputIcon><i class="pi pi-search" /></InputIcon>
                        <InputText v-model="filters['global'].value" placeholder="Cari kurikulum..." />
                    </IconField>
                </div>
            </template>
            <Column field="nama" header="Nama Kurikulum" sortable></Column>
            <Column field="nama_prodi" header="Program Studi" sortable></Column>
            <Column field="tahun_mulai" header="Tahun" sortable></Column>
            <Column field="sks_lulus" header="SKS Lulus" sortable></Column>
            <Column field="is_active" header="Status">
                <template #body="slotProps">
                    <Tag :value="slotProps.data.is_active ? 'Aktif' : 'Non-Aktif'"
                        :severity="slotProps.data.is_active ? 'success' : 'danger'" />
                </template>
            </Column>
            <Column header="Aksi" :exportable="false" style="min-width: 10rem">
                <template #body="slotProps">
                    <Button icon="pi pi-list" outlined rounded severity="info" class="mr-2"
                        @click="openMapping(slotProps.data)" v-tooltip.top="'Kelola Mata Kuliah'" />
                    <Button icon="pi pi-pencil" outlined rounded class="mr-2" @click="editData(slotProps.data)"
                        v-tooltip.top="'Ubah'" />
                    <Button icon="pi pi-trash" outlined rounded severity="danger" @click="confirmDelete(slotProps.data)"
                        v-tooltip.top="'Hapus'" />
                </template>
            </Column>
        </DataTable>
    </div>

    <!-- Modal Detail Kurikulum -->
    <Dialog v-model:visible="dialog" :style="{ width: '600px' }" header="Detail Kurikulum" :modal="true"
        class="p-fluid">
        <div class="flex flex-col gap-4 mt-2">
            <div class="grid grid-cols-12 gap-4">
                <div class="col-span-12 md:col-span-8 flex flex-col gap-2">
                    <label for="nama" class="font-bold text-sm text-gray-600">Nama Kurikulum *</label>
                    <InputText id="nama" v-model.trim="data.nama" required autofocus
                        placeholder="Contoh: Kurikulum MBKM 2024" :invalid="submitted && !data.nama" />
                </div>
                <div class="col-span-12 md:col-span-4 flex flex-col gap-2">
                    <label for="sem_mulai" class="font-bold text-sm text-gray-600">Smt. Mulai</label>
                    <InputText id="sem_mulai" v-model.trim="data.id_semester_mulai" placeholder="20241" />
                </div>
            </div>

            <div class="flex flex-col gap-2">
                <label for="prodi" class="font-bold text-sm text-gray-600">Program Studi *</label>
                <Dropdown id="prodi" v-model="data.prodi_id" :options="prodiList" optionLabel="nama_prodi"
                    optionValue="id" placeholder="Pilih Program Studi" filter :invalid="submitted && !data.prodi_id" />
            </div>

            <div class="p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div class="font-bold text-primary text-sm mb-3 border-b pb-2">Target SKS Lulus</div>
                <div class="grid grid-cols-3 gap-4">
                    <div class="flex flex-col gap-2">
                        <label class="text-xs font-bold text-gray-500 uppercase">Total Lulus</label>
                        <InputNumber v-model="data.sks_lulus" :min="0" fluid />
                    </div>
                    <div class="flex flex-col gap-2">
                        <label class="text-xs font-bold text-gray-500 uppercase">SKS Wajib</label>
                        <InputNumber v-model="data.sks_wajib" :min="0" fluid />
                    </div>
                    <div class="flex flex-col gap-2">
                        <label class="text-xs font-bold text-gray-500 uppercase">SKS Pilihan</label>
                        <InputNumber v-model="data.sks_pilihan" :min="0" fluid />
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-12 gap-4">
                <div class="col-span-12 md:col-span-4 flex flex-col gap-2">
                    <label for="tahun" class="font-bold text-sm text-gray-600">Tahun Mulai *</label>
                    <InputNumber id="tahun" v-model="data.tahun_mulai" :useGrouping="false" placeholder="2024"
                        :invalid="submitted && !data.tahun_mulai" fluid />
                </div>
                <div class="col-span-12 md:col-span-8 flex flex-col gap-2">
                    <label for="id_feeder" class="font-bold text-sm text-gray-600">ID Kurikulum Feeder</label>
                    <InputText id="id_feeder" v-model.trim="data.id_kurikulum_feeder" placeholder="Opsional" fluid />
                </div>
            </div>

            <div class="flex items-center gap-3 bg-gray-50 p-3 rounded border border-gray-100">
                <ToggleSwitch v-model="data.is_active" />
                <label class="font-bold text-sm text-gray-700">Set sebagai Kurikulum Aktif</label>
            </div>
        </div>
        <template #footer>
            <div class="flex justify-end gap-3 mt-4">
                <Button label="Batal" icon="pi pi-times" text severity="success" @click="dialog = false" />
                <Button label="Simpan Perubahan" icon="pi pi-check" severity="success" @click="saveData" />
            </div>
        </template>
    </Dialog>

    <!-- Modal Pemetaan Mata Kuliah -->
    <Dialog v-model:visible="mappingDialog" :style="{ width: '850px' }"
        :header="`Kelola Mata Kuliah: ${selectedKurikulum?.nama}`" :modal="true" maximizable>
        <div class="flex flex-col gap-6 mt-2">
            <div class="p-4 bg-gray-50 rounded-lg border border-gray-100">
                <label class="font-bold block mb-3 text-gray-700">Tambah Mata Kuliah Baru</label>
                <div class="flex gap-2">
                    <Dropdown v-model="mkToAdd" :options="availableMkOptions" optionLabel="nama_mk" optionValue="id"
                        placeholder="Pilih mata kuliah untuk ditambahkan" class="flex-grow" filter
                        :filterFields="['kode_mk', 'nama_mk']">
                        <template #option="slotProps">
                            <div class="flex flex-col">
                                <span class="font-bold text-sm">{{ slotProps.option.kode_mk }} - {{
                                    slotProps.option.nama_mk }}</span>
                                <small class="text-xs text-gray-500">SKS: {{ slotProps.option.sks }} | Semester: {{
                                    slotProps.option.semester_target }} | Jenis: {{ slotProps.option.jenis_mk }}</small>
                            </div>
                        </template>
                    </Dropdown>
                    <Button label="Tambah" icon="pi pi-plus" @click="handleAddMk" :disabled="!mkToAdd"
                        severity="primary" />
                </div>
            </div>

            <div>
                <DataTable :value="currentSubjects" :loading="isLoading" scrollable scrollHeight="350px"
                    class="p-datatable-sm" stripedRows>
                    <template #header>
                        <span class="font-bold text-gray-700">Mata Kuliah dalam Kurikulum Ini</span>
                    </template>
                    <Column field="kode_mk" header="Kode" style="width: 15%"></Column>
                    <Column field="nama_mk" header="Mata Kuliah" style="width: 45%"></Column>
                    <Column field="jenis_mk" header="Jenis" style="width: 10%"></Column>
                    <Column field="sks" header="SKS" style="width: 10%"></Column>
                    <Column field="semester_target" header="Sem." style="width: 10%"></Column>
                    <Column header="Aksi" style="width: 10%">
                        <template #body="slotProps">
                            <Button icon="pi pi-trash" severity="danger" text rounded
                                @click="removeMk(slotProps.data.id)" v-tooltip.top="'Hapus dari Kurikulum'" />
                        </template>
                    </Column>
                </DataTable>
            </div>
        </div>
        <template #footer>
            <Button label="Tutup" icon="pi pi-times" text severity="success" @click="mappingDialog = false" />
        </template>
    </Dialog>

    <!-- Dialog Hasil Import (Perbaikan Logic Result) -->
    <Dialog v-model:visible="importResultDialog" :style="{ width: '500px' }" header="Hasil Import Mapping"
        :modal="true">
        <div v-if="importResult">
            <!-- Alert Status -->
            <Message v-if="importResult.failed_count === 0" severity="success" :closable="false">
                {{ importResult.message || 'Proses Import Berhasil' }}
            </Message>
            <Message v-else-if="importResult.success_count > 0" severity="warn" :closable="false">
                Proses import selesai dengan beberapa kesalahan.
            </Message>
            <Message v-else severity="error" :closable="false">
                {{ importResult.message || 'Gagal melakukan import' }}
            </Message>

            <!-- Statistik -->
            <div class="mt-4 p-3 bg-gray-50 rounded border border-gray-100">
                <div class="flex items-center gap-3 mb-3">
                    <i class="pi pi-file-import text-primary text-xl"></i>
                    <div>
                        <div class="text-sm text-gray-500 font-bold uppercase">Total Baris</div>
                        <div class="text-lg font-bold text-gray-800">
                            {{ (importResult.success_count || 0) + (importResult.failed_count || 0) }} Baris
                        </div>
                    </div>
                </div>
                <div class="flex items-center gap-3">
                    <i class="pi pi-check-circle text-green-500 text-xl"></i>
                    <div>
                        <div class="text-sm text-gray-500 font-bold uppercase">Berhasil Disimpan</div>
                        <div class="text-lg font-bold text-green-600">
                            {{ importResult.success_count }} Baris
                        </div>
                    </div>
                </div>
            </div>

            <!-- List Error -->
            <div v-if="importResult.errors && importResult.errors.length > 0" class="mt-4">
                <strong class="block mb-2 text-red-600 text-sm font-bold">Detail Kesalahan ({{ importResult.failed_count
                    }}):</strong>
                <ul
                    class="list-disc pl-5 m-0 bg-red-50 border border-red-100 text-red-700 p-3 rounded-md text-xs max-h-40 overflow-auto">
                    <li v-for="(err, index) in importResult.errors" :key="index" class="mb-1 last:mb-0">{{ err }}</li>
                </ul>
            </div>
        </div>
        <template #footer>
            <Button label="Tutup" icon="pi pi-check" @click="importResultDialog = false" severity="success" />
        </template>
    </Dialog>

    <!-- Dialog Hapus -->
    <Dialog v-model:visible="deleteDialog" :style="{ width: '450px' }" header="Konfirmasi" :modal="true">
        <div class="flex items-center gap-4">
            <i class="pi pi-exclamation-triangle text-3xl text-red-500" />
            <span v-if="data">Apakah Anda yakin ingin menghapus kurikulum <b>{{ data.nama }}</b>?</span>
        </div>
        <template #footer>
            <Button label="Batal" icon="pi pi-times" text @click="deleteDialog = false" />
            <Button label="Ya, Hapus" icon="pi pi-check" severity="danger" @click="deleteData" />
        </template>
    </Dialog>
</template>

<style scoped>
:deep(.p-dialog-footer) {
    padding: 0 1.5rem 1.5rem 1.5rem;
}
</style>