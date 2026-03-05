<script setup>
import { useDokumenStore } from '@/stores/dokumen';
import { useIjinStore } from '@/stores/ijin';
import { storeToRefs } from 'pinia';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';

const toast = useToast();
const store = useIjinStore();

const { myIjinList, isLoading } = storeToRefs(store);
const kategoriIjinOptions = ref(['Sakit', 'Urusan Keluarga', 'Dinas Luar', 'WFH', 'Lainnya']);

const dialog = ref(false);
const data = ref({});
const submitted = ref(false);

const confirm = useConfirm();
const dokumenStore = useDokumenStore();
const { list: dokumenList, isLoading: isDokumenLoading } = storeToRefs(dokumenStore);

const dokumenListDialog = ref(false);
const selectedRecord = ref(null);
const fileToUpload = ref(null);
const uploadKategori = ref(null);
const uploadRef = ref(null);
const isBuktiLoading = ref(false);

// Daftar kategori khusus untuk ijin
const kategoriIjinDokumenOptions = ref(['SuratSakit', 'DokumenPendukung', 'Lainnya']);

onMounted(() => {
    store.fetchMyIjin();
});

function formatDate(date) {
    if (!date) return null;
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function openNew() {
    data.value = {};
    submitted.value = false;
    dialog.value = true;
}

async function saveData() {
    submitted.value = true;
    if (!data.value.tanggal_mulai || !data.value.tanggal_selesai || !data.value.alasan?.trim() || !data.value.kategori) {
        toast.add({ severity: 'warn', summary: 'Perhatian', detail: 'Semua field wajib diisi', life: 3000 });
        return;
    }

    try {
        const payload = {
            alasan: data.value.alasan,
            tanggal_mulai: formatDate(data.value.tanggal_mulai),
            tanggal_selesai: formatDate(data.value.tanggal_selesai),
            kategori: data.value.kategori
        };

        await store.ajukanIjin(payload);
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Pengajuan ijin berhasil dikirim', life: 3000 });
        dialog.value = false;
    } catch (error) {
        const errorMessage = error.response?.data?.error || 'Gagal mengajukan ijin';
        toast.add({ severity: 'error', summary: 'Gagal', detail: errorMessage, life: 4000 });
    }
}

function getSeverity(status) {
    if (status === 'Disetujui') return 'success';
    if (status === 'Ditolak') return 'danger';
    if (status === 'Diajukan') return 'info';
    return 'secondary';
}

async function openDokumenDialog(record) {
    selectedRecord.value = record;
    uploadKategori.value = null; // Reset
    fileToUpload.value = null; // Reset

    try {
        // Gunakan entity_type "pengajuan-ijin"
        await dokumenStore.fetchList('pengajuan-ijin', record.id);
        dokumenListDialog.value = true;
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal memuat dokumen.', life: 3000 });
    }
}

function onFileSelect(event) {
    fileToUpload.value = event.files[0];
}

async function handleUploadDokumen() {
    if (!fileToUpload.value || !uploadKategori.value) {
        toast.add({ severity: 'warn', summary: 'Perhatian', detail: 'Pilih file dan kategori terlebih dahulu', life: 3000 });
        return;
    }

    const formData = new FormData();
    formData.append('file', fileToUpload.value);
    formData.append('kategori', uploadKategori.value);

    try {
        await dokumenStore.upload('pengajuan-ijin', selectedRecord.value.id, formData);
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Dokumen berhasil diupload', life: 3000 });

        fileToUpload.value = null;
        uploadKategori.value = null;
        if (uploadRef.value) {
            uploadRef.value.clear();
        }
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal mengupload file', life: 3000 });
    }
}

async function viewDokumen(path) {
    if (!path) return;
    isBuktiLoading.value = true;
    try {
        const blob = await dokumenStore.viewFile(path);
        const fileURL = URL.createObjectURL(blob);
        window.open(fileURL, '_blank');
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: error.message, life: 3000 });
    } finally {
        isBuktiLoading.value = false;
    }
}

function confirmDeleteDokumen(dokumen) {
    confirm.require({
        message: `Apakah Anda yakin ingin menghapus file ${dokumen.nama_file_asli}?`,
        header: 'Konfirmasi Hapus Dokumen',
        icon: 'pi pi-exclamation-triangle',
        acceptClass: 'p-button-danger',
        accept: async () => {
            try {
                await dokumenStore.delete(dokumen.id);
                dokumenStore.list = dokumenStore.list.filter((d) => d.id !== dokumen.id);
                toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Dokumen telah dihapus', life: 3000 });
            } catch (error) {
                toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal menghapus dokumen', life: 3000 });
            }
        }
    });
}
</script>

<template>
    <div class="card">
        <Toolbar class="mb-6">
            <template #start>
                <Button label="Ajukan Ijin Baru" icon="pi pi-plus" severity="secondary" @click="openNew" />
            </template>
        </Toolbar>

        <DataTable :value="myIjinList" :loading="isLoading" responsiveLayout="scroll">
            <template #header>
                <h4 class="m-0">Riwayat Pengajuan Ijin Saya</h4>
            </template>
            <Column field="tanggal_mulai" header="Tanggal Mulai" sortable></Column>
            <Column field="tanggal_selesai" header="Tanggal Selesai" sortable></Column>
            <Column field="kategori" header="Kategori" sortable></Column>
            <Column field="alasan" header="Alasan"></Column>
            <Column field="status" header="Status" sortable>
                <template #body="slotProps">
                    <Tag :value="slotProps.data.status" :severity="getSeverity(slotProps.data.status)" />
                </template>
            </Column>
            <Column field="catatan_approval" header="Catatan Admin"></Column>
            <Column header="Dokumen">
                <template #body="slotProps">
                    <Button icon="pi pi-paperclip" text rounded severity="info"
                        @click="openDokumenDialog(slotProps.data)"
                        v-tooltip.top="'Upload Dokumen (cth: Surat Sakit)'" />
                </template>
            </Column>
        </DataTable>
    </div>

    <Dialog v-model:visible="dialog" :style="{ width: '450px' }" header="Form Pengajuan Ijin" :modal="true">
        <div class="flex flex-col gap-6">
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block font-bold mb-3">Tanggal Mulai *</label>
                    <Calendar v-model="data.tanggal_mulai" dateFormat="yy-mm-dd"
                        :invalid="submitted && !data.tanggal_mulai" />
                </div>
                <div>
                    <label class="block font-bold mb-3">Tanggal Selesai *</label>
                    <Calendar v-model="data.tanggal_selesai" dateFormat="yy-mm-dd"
                        :invalid="submitted && !data.tanggal_selesai" />
                </div>
            </div>
            <div>
                <label class="block font-bold mb-3">Kategori Ijin *</label>
                <Dropdown v-model="data.kategori" :options="kategoriIjinOptions" placeholder="Pilih Kategori Ijin"
                    :invalid="submitted && !data.kategori" fluid />
            </div>
            <div>
                <label class="block font-bold mb-3">Alasan *</label>
                <Textarea v-model.trim="data.alasan" rows="3" fluid :invalid="submitted && !data.alasan" />
            </div>
        </div>
        <template #footer>
            <Button label="Batal" icon="pi pi-times" text @click="dialog = false" />
            <Button label="Ajukan" icon="pi pi-check" @click="saveData" />
        </template>
    </Dialog>

    <Dialog v-model:visible="dokumenListDialog" :style="{ width: '70vw' }" maximizable
        :header="`Manajemen Dokumen Ijin`" :modal="true">
        <Toolbar class="mb-4">
            <template #start>
                <div class="flex flex-wrap gap-2">
                    <Dropdown v-model="uploadKategori" :options="kategoriIjinDokumenOptions"
                        placeholder="Pilih Kategori Dokumen" class="w-full md:w-auto" />
                    <FileUpload ref="uploadRef" mode="basic" name="dokumen" @select="onFileSelect" :auto="false"
                        :customUpload="true" chooseLabel="Pilih File" accept="image/*,application/pdf" />
                    <Button label="Upload" icon="pi pi-upload" @click="handleUploadDokumen"
                        :disabled="!fileToUpload || isDokumenLoading" :loading="isDokumenLoading" />
                </div>
            </template>
        </Toolbar>

        <DataTable :value="dokumenList" :loading="isDokumenLoading" responsiveLayout="scroll">
            <Column field="nama_file_asli" header="Nama File" sortable></Column>
            <Column field="kategori" header="Kategori" sortable></Column>
            <Column header="Aksi">
                <template #body="slotProps">
                    <Button icon="pi pi-eye" text rounded severity="info" @click="viewDokumen(slotProps.data.path_file)"
                        :loading="isBuktiLoading" v-tooltip.top="'Lihat Dokumen'" />
                    <Button icon="pi pi-trash" text rounded severity="danger"
                        @click="confirmDeleteDokumen(slotProps.data)" v-tooltip.top="'Hapus Dokumen'" />
                </template>
            </Column>
        </DataTable>
    </Dialog>
</template>
