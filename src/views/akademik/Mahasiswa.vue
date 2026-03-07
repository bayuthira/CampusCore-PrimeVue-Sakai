<script setup>
import { useMahasiswaStore } from '@/stores/mahasiswa';
import { useProdiStore } from '@/stores/prodi';
import { FilterMatchMode } from '@primevue/core/api';
import { storeToRefs } from 'pinia';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';

const toast = useToast();
const mahasiswaStore = useMahasiswaStore();
const prodiStore = useProdiStore();
const { mahasiswaList, isLoading } = storeToRefs(mahasiswaStore);
const { prodiList } = storeToRefs(prodiStore);

const mahasiswaDialog = ref(false);
const deleteMahasiswaDialog = ref(false);
const importResultDialog = ref(false);
const importResult = ref(null);
const fileInput = ref(null);
const mahasiswa = ref({});
const submitted = ref(false);
const dt = ref();

const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

const statusOptions = ['Aktif', 'Cuti', 'Lulus', 'Keluar', 'Non-Aktif'];

onMounted(() => {
    mahasiswaStore.fetchMahasiswa();
    prodiStore.fetchProdi();
});

function openNew() {
    mahasiswa.value = { angkatan: new Date().getFullYear(), status_mahasiswa: 'Aktif' };
    submitted.value = false;
    mahasiswaDialog.value = true;
}

async function saveMahasiswa() {
    submitted.value = true;

    // Validasi field wajib
    if (!mahasiswa.value.nama_mahasiswa?.trim() || !mahasiswa.value.nim?.trim() || !mahasiswa.value.prodi_id) return;

    try {
        if (mahasiswa.value.id) {
            // Partial Update: Hanya kirim data yang relevan
            const payload = { ...mahasiswa.value };
            delete payload.id;
            delete payload.nama_prodi;
            delete payload.username;
            delete payload.registrasi_id;

            await mahasiswaStore.updateMahasiswa(mahasiswa.value.id, payload);
            toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Data Mahasiswa Diperbarui', life: 3000 });
        } else {
            await mahasiswaStore.createMahasiswa(mahasiswa.value);
            toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Mahasiswa Baru Berhasil Dibuat', life: 3000 });
        }
        mahasiswaDialog.value = false;
        mahasiswa.value = {};
    } catch (error) {
        const errMsg = error.response?.data?.error || 'Gagal menyimpan data';
        toast.add({ severity: 'error', summary: 'Gagal', detail: errMsg, life: 4000 });
    }
}

function editMahasiswa(data) {
    mahasiswa.value = { ...data };
    mahasiswaDialog.value = true;
}

function confirmDeleteMahasiswa(data) {
    mahasiswa.value = data;
    deleteMahasiswaDialog.value = true;
}

async function deleteMahasiswa() {
    try {
        await mahasiswaStore.deleteMahasiswa(mahasiswa.value.id);
        deleteMahasiswaDialog.value = false;
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Data Mahasiswa Dihapus', life: 3000 });
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal menghapus data', life: 3000 });
    }
}

function triggerFileInput() {
    fileInput.value.click();
}

async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
        const result = await mahasiswaStore.importFromCSV(formData);
        importResult.value = result;
        importResultDialog.value = true;
    } catch (error) {
        importResult.value = error.response?.data || { status: 'ERROR', detail_error: [error.message] };
        importResultDialog.value = true;
    }
    event.target.value = '';
}

async function downloadTemplate() {
    try {
        const blob = await mahasiswaStore.downloadTemplateCSV();
        const url = window.URL.createObjectURL(new Blob([blob]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'template-mahasiswa.csv');
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url);
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal mengunduh template', life: 3000 });
    }
}
</script>

<template>
    <div class="card shadow-sm border-0">
        <Toolbar class="mb-6">
            <template #start>
                <Button label="Tambah Mahasiswa" icon="pi pi-plus" severity="primary" class="mr-2" @click="openNew" />
                <Button label="Import" icon="pi pi-upload" severity="secondary" class="mr-2"
                    @click="triggerFileInput" />
                <input type="file" ref="fileInput" @change="handleFileUpload" style="display: none" accept=".csv" />
                <Button label="Unduh Template" icon="pi pi-download" severity="secondary" @click="downloadTemplate" />
            </template>
            <template #end>
                <Button label="Ekspor Data" icon="pi pi-file-excel" severity="secondary" @click="dt.exportCSV()" />
            </template>
        </Toolbar>

        <DataTable ref="dt" :value="mahasiswaList" :loading="isLoading" :paginator="true" :rows="10" :filters="filters"
            stripedRows class="p-datatable-sm">
            <template #header>
                <div class="flex flex-wrap gap-2 items-center justify-between">
                    <h4 class="m-0 font-bold text-gray-700">Manajemen Mahasiswa</h4>
                    <IconField>
                        <InputIcon><i class="pi pi-search" /></InputIcon>
                        <InputText v-model="filters['global'].value" placeholder="Cari mahasiswa..." />
                    </IconField>
                </div>
            </template>
            <Column field="nim" header="NIM" sortable></Column>
            <Column field="nama_mahasiswa" header="Nama Lengkap" sortable style="min-width: 14rem"></Column>
            <Column field="nama_prodi" header="Program Studi" sortable></Column>
            <Column field="angkatan" header="Angkatan" sortable></Column>
            <Column field="status_mahasiswa" header="Status">
                <template #body="slotProps">
                    <Tag :value="slotProps.data.status_mahasiswa"
                        :severity="slotProps.data.status_mahasiswa === 'Aktif' ? 'success' : 'warn'" />
                </template>
            </Column>
            <Column header="Aksi" :exportable="false" style="min-width: 8rem">
                <template #body="slotProps">
                    <Button icon="pi pi-pencil" outlined rounded severity="info" class="mr-2"
                        @click="editMahasiswa(slotProps.data)" v-tooltip.top="'Ubah'" />
                    <Button icon="pi pi-trash" outlined rounded severity="danger"
                        @click="confirmDeleteMahasiswa(slotProps.data)" v-tooltip.top="'Hapus'" />
                </template>
            </Column>
        </DataTable>

        <!-- Modal Detail Mahasiswa (Sesuai image_465998.png) -->
        <Dialog v-model:visible="mahasiswaDialog" :style="{ width: '700px' }" header="Detail Data Mahasiswa"
            :modal="true" class="p-fluid">
            <div class="flex flex-col gap-4 mt-2">
                <!-- Seksi Biodata -->
                <div class="font-bold text-success border-b pb-2 mb-2">Biodata Dasar</div>

                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                        <label for="nim" class="font-bold text-sm text-gray-600">NIM *</label>
                        <InputText id="nim" v-model.trim="mahasiswa.nim" required placeholder="Contoh: 240101001"
                            :invalid="submitted && !mahasiswa.nim" />
                    </div>
                    <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                        <label for="nik" class="font-bold text-sm text-gray-600">NIK (KTP)</label>
                        <InputText id="nik" v-model.trim="mahasiswa.nik" placeholder="16 Digit NIK" />
                    </div>
                </div>

                <div class="flex flex-col gap-2">
                    <label for="nama" class="font-bold text-sm text-gray-600">Nama Lengkap *</label>
                    <InputText id="nama" v-model.trim="mahasiswa.nama_mahasiswa" required
                        placeholder="Nama lengkap sesuai identitas" :invalid="submitted && !mahasiswa.nama_mahasiswa" />
                </div>

                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                        <label for="email" class="font-bold text-sm text-gray-600">Email</label>
                        <InputText id="email" v-model.trim="mahasiswa.email" placeholder="email@student.ac.id" />
                    </div>
                    <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                        <label for="ibu" class="font-bold text-sm text-gray-600">Nama Ibu Kandung</label>
                        <InputText id="ibu" v-model.trim="mahasiswa.nama_ibu_kandung" placeholder="Nama ibu kandung" />
                    </div>
                </div>

                <!-- Seksi Akademik -->
                <div class="font-bold text-success border-b pb-2 mb-2 mt-4">Rekam Akademik</div>

                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                        <label for="prodi" class="font-bold text-sm text-gray-600">Program Studi *</label>
                        <Dropdown id="prodi" v-model="mahasiswa.prodi_id" :options="prodiList" optionLabel="nama_prodi"
                            optionValue="id" placeholder="Pilih Program Studi"
                            :invalid="submitted && !mahasiswa.prodi_id" filter />
                    </div>
                    <!-- Perbaikan Tumpang Tindih pada Angkatan dan Status -->
                    <div class="col-span-12 md:col-span-3 flex flex-col gap-2">
                        <label for="angkatan" class="font-bold text-sm text-gray-600">Angkatan</label>
                        <InputNumber id="angkatan" v-model="mahasiswa.angkatan" :useGrouping="false" placeholder="2024"
                            fluid />
                    </div>
                    <div class="col-span-12 md:col-span-3 flex flex-col gap-2">
                        <label for="status" class="font-bold text-sm text-gray-600">Status</label>
                        <Dropdown id="status" v-model="mahasiswa.status_mahasiswa" :options="statusOptions"
                            placeholder="Pilih Status" fluid />
                    </div>
                </div>

                <div v-if="!mahasiswa.id" class="flex flex-col gap-2">
                    <label for="pass" class="font-bold text-sm text-gray-600">Kata Sandi Baru *</label>
                    <Password id="pass" v-model="mahasiswa.password" toggleMask :feedback="false"
                        placeholder="Minimal 6 karakter" />
                </div>
            </div>
            <template #footer>
                <div class="flex justify-end gap-3 mt-4">
                    <Button label="Batal" icon="pi pi-times" text severity="success" @click="mahasiswaDialog = false" />
                    <Button label="Simpan Perubahan" icon="pi pi-check" severity="success" @click="saveMahasiswa" />
                </div>
            </template>
        </Dialog>

        <!-- Dialog Hasil Import -->
        <Dialog v-model:visible="importResultDialog" :style="{ width: '500px' }" header="Hasil Import Data"
            :modal="true">
            <div v-if="importResult">
                <Message v-if="importResult.status === 'SUKSES'" severity="success" :closable="false">Proses Import
                    Berhasil
                </Message>
                <Message v-else severity="error" :closable="false">{{ importResult.status }}</Message>

                <div class="mt-4 p-3 bg-gray-50 rounded border border-gray-100">
                    <p class="mb-2"><i class="pi pi-file-import mr-2 text-primary"></i><strong>Total Baris
                            Dipindai:</strong> {{
                                importResult.total_baris_dipindai }}</p>
                    <p class="m-0"><i class="pi pi-check-circle mr-2 text-green-500"></i><strong>Berhasil
                            Disimpan:</strong> {{
                                importResult.baris_berhasil_disimpan }}</p>
                </div>

                <div v-if="importResult.detail_error && importResult.detail_error.length > 0" class="mt-4">
                    <strong class="block mb-2 text-red-600 text-sm">Detail Kesalahan:</strong>
                    <ul class="list-disc pl-5 m-0 bg-red-50 border border-red-100 text-red-700 p-3 rounded-md text-xs">
                        <li v-for="(err, index) in importResult.detail_error" :key="index">{{ err }}</li>
                    </ul>
                </div>
            </div>
            <template #footer>
                <Button label="Tutup" icon="pi pi-check" @click="importResultDialog = false" severity="primary" />
            </template>
        </Dialog>

        <!-- Dialog Konfirmasi Hapus -->
        <Dialog v-model:visible="deleteMahasiswaDialog" :style="{ width: '450px' }" header="Konfirmasi" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle text-3xl text-red-500" />
                <span v-if="mahasiswa">Yakin ingin menghapus mahasiswa <b>{{ mahasiswa.nama_mahasiswa }}</b>?</span>
            </div>
            <template #footer>
                <Button label="Batal" icon="pi pi-times" text @click="deleteMahasiswaDialog = false" />
                <Button label="Ya, Hapus" icon="pi pi-check" severity="danger" @click="deleteMahasiswa" />
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
:deep(.p-dialog-footer) {
    padding: 0 1.5rem 1.5rem 1.5rem;
}
</style>