<script setup>
import { useAuthStore } from '@/stores/auth';
import { useMataKuliahStore } from '@/stores/matakuliah';
import { useRpsStore } from '@/stores/rps';
import { FilterMatchMode } from '@primevue/core/api';
import { storeToRefs } from 'pinia';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';

const toast = useToast();
const authStore = useAuthStore();
const mkStore = useMataKuliahStore();
const rpsStore = useRpsStore();

const { mataKuliahList, isLoading: mkLoading } = storeToRefs(mkStore);
const { header, weeklyMatrix, isLoading: rpsLoading } = storeToRefs(rpsStore);

const rpsDialog = ref(false);
const weeklyFormDialog = ref(false);
const verifyDialog = ref(false);
const selectedMk = ref(null);
const weeklyData = ref({});
const verifyData = ref({ status_verifikasi: 'Disetujui', catatan: '' });
const submitted = ref(false);
const isPrintLoading = ref(false);

const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

const isManager = computed(() => authStore.userData?.roles.some(r => ['SUPER_ADMIN', 'KAPRODI'].includes(r)));

onMounted(() => {
    mkStore.fetchMataKuliah();
});

// --- Alur Kelola RPS ---
async function openRpsManager(mk) {
    selectedMk.value = mk;
    rpsDialog.value = true;

    try {
        await Promise.all([
            rpsStore.fetchHeader(mk.id),
            rpsStore.fetchWeekly(mk.id)
        ]);

        if (!rpsStore.header) {
            rpsStore.header = {
                deskripsi_singkat: '',
                capaian_pembelajaran: '',
                pustaka_utama: '',
                pustaka_pendukung: ''
            };
        }
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal mengambil data RPS dari server.', life: 3000 });
    }
}

// --- Header ---
async function handleSaveHeader() {
    try {
        await rpsStore.saveHeader(selectedMk.value.id, header.value || {});
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Informasi Umum RPS berhasil disimpan', life: 3000 });
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal menyimpan header', life: 3000 });
    }
}

// --- Matriks Mingguan ---
function openWeeklyForm(data = null) {
    weeklyData.value = data ? { ...data } : { minggu_ke: weeklyMatrix.value.length + 1, bobot_penilaian: 0 };
    submitted.value = false;
    weeklyFormDialog.value = true;
}

async function handleSaveWeekly() {
    submitted.value = true;
    if (!weeklyData.value.minggu_ke || !weeklyData.value.kemampuan_akhir_diharapkan) return;

    try {
        await rpsStore.saveWeekly(selectedMk.value.id, weeklyData.value);
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Matriks mingguan diperbarui', life: 2000 });
        weeklyFormDialog.value = false;
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal menyimpan matriks', life: 3000 });
    }
}

async function removeWeekly(id) {
    try {
        await rpsStore.deleteWeekly(id, selectedMk.value.id);
        toast.add({ severity: 'info', summary: 'Dihapus', detail: 'Matriks mingguan dihapus', life: 2000 });
    } catch (e) { }
}

// --- Upload & Verifikasi ---
async function onRpsUpload(event) {
    const file = event.files[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
        await rpsStore.uploadRpsFile(selectedMk.value.id, formData);
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'File RPS diunggah, menunggu verifikasi', life: 3000 });
        mkStore.fetchMataKuliah();
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal mengunggah file', life: 3000 });
    }
}

async function handleVerify() {
    try {
        await rpsStore.verifyRps(selectedMk.value.id, verifyData.value);
        toast.add({ severity: 'success', summary: 'Berhasil', detail: `RPS telah ${verifyData.value.status_verifikasi}`, life: 3000 });
        verifyDialog.value = false;
        rpsDialog.value = false;
        mkStore.fetchMataKuliah();
    } catch (e) { }
}

// PERBAIKAN: Menggunakan Blob agar Token terkirim dan tidak error 401/403
async function handlePrint() {
    isPrintLoading.value = true;
    try {
        const blobUrl = await rpsStore.fetchPrintHtml(selectedMk.value.id);
        if (blobUrl) {
            const newTab = window.open(blobUrl, '_blank');
            if (newTab) {
                setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
            }
        } else {
            toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal men-generate dokumen RPS.', life: 3000 });
        }
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Terjadi kesalahan sistem.', life: 3000 });
    } finally {
        isPrintLoading.value = false;
    }
}

function getStatusSeverity(status) {
    switch (status) {
        case 'Disetujui': return 'success';
        case 'Menunggu Verifikasi': return 'warn';
        case 'Ditolak': return 'danger';
        default: return 'secondary';
    }
}
</script>

<template>
    <div class="card shadow-sm border-0">
        <DataTable :value="mataKuliahList" :loading="mkLoading" paginator :rows="10" v-model:filters="filters"
            stripedRows class="p-datatable-sm">
            <template #header>
                <div class="flex justify-between items-center">
                    <h4 class="m-0 font-bold text-gray-700">Manajemen RPS Terstruktur</h4>
                    <IconField>
                        <InputIcon><i class="pi pi-search" /></InputIcon>
                        <InputText v-model="filters['global'].value" placeholder="Cari Mata Kuliah..." />
                    </IconField>
                </div>
            </template>

            <Column field="kode_mk" header="Kode" sortable class="font-mono font-bold"></Column>
            <Column field="nama_mk" header="Mata Kuliah" sortable></Column>
            <Column field="nama_prodi" header="Prodi" sortable></Column>
            <Column field="status_verifikasi_rps" header="Status RPS">
                <template #body="slotProps">
                    <Tag :value="slotProps.data.status_verifikasi_rps || 'Belum Ada'"
                        :severity="getStatusSeverity(slotProps.data.status_verifikasi_rps)" />
                </template>
            </Column>
            <Column header="Aksi" class="text-center">
                <template #body="slotProps">
                    <Button label="Kelola RPS" icon="pi pi-file-edit" outlined size="small"
                        @click="openRpsManager(slotProps.data)" />
                </template>
            </Column>
        </DataTable>
    </div>

    <Dialog v-model:visible="rpsDialog" :header="`Manajemen RPS: ${selectedMk?.nama_mk}`" :style="{ width: '90vw' }"
        modal maximizable>
        <div v-if="rpsLoading" class="flex flex-col items-center justify-center py-20">
            <ProgressSpinner style="width: 50px; height: 50px" />
            <span class="text-gray-500 mt-4 font-bold">Mengambil data RPS...</span>
        </div>

        <TabView v-else>
            <!-- TAB 1: BERKAS & VERIFIKASI -->
            <TabPanel header="Berkas & Verifikasi">
                <div class="grid grid-cols-12 gap-6 mt-4">
                    <div class="col-span-12 md:col-span-6">
                        <div class="p-5 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                            <h5 class="font-bold mb-4 flex items-center gap-2">
                                <i class="pi pi-cloud-upload text-primary"></i>
                                Upload Dokumen RPS (Fisik)
                            </h5>
                            <FileUpload mode="basic" name="file" accept=".pdf,.doc,.docx" :maxFileSize="5000000"
                                customUpload @uploader="onRpsUpload" auto chooseLabel="Pilih & Upload RPS"
                                class="w-full" />
                            <div class="mt-4 p-3 bg-white rounded border border-gray-100">
                                <p class="text-xs text-gray-500 m-0 italic">
                                    <i class="pi pi-info-circle mr-1"></i>
                                    Format yang didukung: PDF, DOC, DOCX. Maksimal 5MB.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div class="col-span-12 md:col-span-6">
                        <div class="p-5 bg-blue-50 rounded-xl border border-blue-100 flex flex-col h-full">
                            <h5 class="font-bold text-blue-800 mb-4 flex items-center gap-2">
                                <i class="pi pi-shield"></i>
                                Status Peninjauan
                            </h5>
                            <div class="flex-grow">
                                <div class="flex items-center gap-3 mb-4">
                                    <Tag :value="selectedMk?.status_verifikasi_rps || 'Belum Ada'"
                                        :severity="getStatusSeverity(selectedMk?.status_verifikasi_rps)"
                                        class="text-lg px-3 py-1" />
                                </div>
                                <div class="p-3 bg-white/50 rounded border border-blue-100 min-h-[60px]">
                                    <span class="text-xs font-bold text-blue-700 uppercase block mb-1">Catatan
                                        Kaprodi:</span>
                                    <p class="text-sm text-blue-900 m-0">
                                        {{ selectedMk?.catatan_rps || 'Tidak ada catatan.'
                                        }}</p>
                                </div>
                            </div>
                            <div v-if="isManager && selectedMk?.status_verifikasi_rps === 'Menunggu Verifikasi'"
                                class="mt-6">
                                <Button label="Lakukan Verifikasi" icon="pi pi-check-square" severity="primary"
                                    @click="verifyDialog = true" class="w-full" />
                            </div>
                        </div>
                    </div>
                </div>
            </TabPanel>

            <!-- TAB 2: INFORMASI UMUM (UI REVISED - TEXTAREA WIDTH FIX) -->
            <TabPanel header="Informasi Umum">
                <div class="mt-4" v-if="header">
                    <div class="grid grid-cols-12 gap-8">
                        <!-- Kolom Kiri -->
                        <div class="col-span-12 lg:col-span-6 flex flex-col gap-8">
                            <div
                                class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                                <div
                                    class="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                                    <div class="flex items-center gap-3">
                                        <div class="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                                            <i class="pi pi-align-left text-primary"></i>
                                        </div>
                                        <span class="font-bold text-slate-700">Deskripsi Singkat Mata Kuliah</span>
                                    </div>
                                </div>
                                <!-- PERBAIKAN: Menghilangkan container p-fluid agar textarea mengisi seluruh lebar card -->
                                <Textarea v-model="header.deskripsi_singkat" rows="6" autoResize fluid
                                    class="custom-textarea"
                                    placeholder="Jelaskan ringkasan materi, fokus pembelajaran, dan urgensi mata kuliah ini..." />
                            </div>

                            <div
                                class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                                <div
                                    class="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                                    <div class="flex items-center gap-3">
                                        <div class="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                                            <i class="pi pi-book text-primary"></i>
                                        </div>
                                        <span class="font-bold text-slate-700">Daftar Pustaka Utama</span>
                                    </div>
                                </div>
                                <Textarea v-model="header.pustaka_utama" rows="5" autoResize fluid
                                    class="custom-textarea"
                                    placeholder="Tuliskan referensi buku wajib, modul, atau sumber utama lainnya..." />
                            </div>
                        </div>

                        <!-- Kolom Kanan -->
                        <div class="col-span-12 lg:col-span-6 flex flex-col gap-8">
                            <div
                                class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                                <div
                                    class="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                                    <div class="flex items-center gap-3">
                                        <div class="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                                            <i class="pi pi-list text-primary"></i>
                                        </div>
                                        <span class="font-bold text-slate-700">Capaian Pembelajaran (CPMK)</span>
                                    </div>
                                </div>
                                <Textarea v-model="header.capaian_pembelajaran" rows="6" autoResize fluid
                                    class="custom-textarea"
                                    placeholder="Tuliskan kemampuan akhir yang diharapkan dikuasai mahasiswa..." />
                            </div>

                            <div
                                class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                                <div
                                    class="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                                    <div class="flex items-center gap-3">
                                        <div class="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                                            <i class="pi pi-bookmark text-primary"></i>
                                        </div>
                                        <span class="font-bold text-slate-700">Daftar Pustaka Pendukung</span>
                                    </div>
                                </div>
                                <Textarea v-model="header.pustaka_pendukung" rows="5" autoResize fluid
                                    class="custom-textarea"
                                    placeholder="Jurnal, website, atau artikel ilmiah yang mendukung pembelajaran..." />
                            </div>
                        </div>
                    </div>

                    <!-- Footer Action -->
                    <div
                        class="mt-10 flex justify-end p-5 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner">
                        <div class="flex flex-col items-end gap-2">
                            <Button label="Simpan Perubahan Informasi Umum" icon="pi pi-save" severity="success"
                                size="large" @click="handleSaveHeader" :loading="rpsLoading"
                                class="px-8 font-bold shadow-md" />
                            <small class="text-slate-400">Terakhir diperbarui: {{ header.updated_at ? new
                                Date(header.updated_at).toLocaleString('id-ID') : '-' }}</small>
                        </div>
                    </div>
                </div>
            </TabPanel>

            <!-- TAB 3: MATRIKS MINGGUAN -->
            <TabPanel header="Matriks Mingguan">
                <Toolbar class="mb-4">
                    <template #start>
                        <Button label="Tambah Rencana Minggu" icon="pi pi-plus" severity="primary" size="small"
                            @click="openWeeklyForm()" />
                    </template>
                    <template #end>
                        <small class="text-gray-500 italic">Total Mingguan: {{ weeklyMatrix.length }} / 16</small>
                    </template>
                </Toolbar>
                <DataTable :value="weeklyMatrix" class="p-datatable-sm" stripedRows dataKey="id">
                    <Column field="minggu_ke" header="Mg-" style="width: 50px" class="font-bold text-center"></Column>
                    <Column field="kemampuan_akhir_diharapkan" header="Kemampuan Akhir"></Column>
                    <Column field="bahan_kajian" header="Bahan Kajian / Materi"></Column>
                    <Column field="bobot_penilaian" header="Bobot" style="width: 80px" class="text-center font-bold">
                        <template #body="slotProps">
                            <span :class="slotProps.data.bobot_penilaian > 0 ? 'text-primary' : 'text-gray-400'">
                                {{ slotProps.data.bobot_penilaian }}%
                            </span>
                        </template>
                    </Column>
                    <Column header="Aksi" style="width: 100px" class="text-center">
                        <template #body="slotProps">
                            <div class="flex gap-2 justify-center">
                                <Button icon="pi pi-pencil" text rounded severity="info"
                                    @click="openWeeklyForm(slotProps.data)" v-tooltip.top="'Ubah'" />
                                <Button icon="pi pi-trash" text rounded severity="danger"
                                    @click="removeWeekly(slotProps.data.id)" v-tooltip.top="'Hapus'" />
                            </div>
                        </template>
                    </Column>
                </DataTable>
            </TabPanel>

            <!-- TAB 4: CETAK -->
            <TabPanel header="Preview & Cetak">
                <div
                    class="flex flex-col items-center justify-center p-16 bg-gray-50 rounded-2xl border border-gray-200 mt-4">
                    <div
                        class="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm mb-6 border border-gray-100">
                        <i class="pi pi-print text-5xl text-primary"></i>
                    </div>
                    <h4 class="font-bold text-2xl text-gray-800 mb-2">Dokumen RPS Siap Diterbitkan</h4>
                    <p class="text-gray-500 mb-8 text-center max-w-lg leading-relaxed">
                        Sistem akan mengompilasi Informasi Umum dan Matriks Mingguan ke dalam format standar dokumen
                        STIKes
                        Respati. Silakan gunakan pratinjau untuk memeriksa kembali sebelum mencetak.
                    </p>
                    <div class="flex gap-4">
                        <Button label="Buka Format Cetak (HTML)" icon="pi pi-external-link" severity="help" size="large"
                            @click="handlePrint" :loading="isPrintLoading" />
                    </div>
                </div>
            </TabPanel>
        </TabView>
    </Dialog>

    <!-- Modal Form Matriks -->
    <Dialog v-model:visible="weeklyFormDialog" header="Detail Rencana Mingguan" :style="{ width: '650px' }" modal
        class="p-fluid">
        <div class="flex flex-col gap-5 mt-2">
            <div class="grid grid-cols-2 gap-4">
                <div class="flex flex-col gap-2">
                    <label class="font-bold text-sm text-gray-600">Minggu Ke- (1-16) *</label>
                    <InputNumber v-model="weeklyData.minggu_ke" :min="1" :max="16" showButtons />
                </div>
                <div class="flex flex-col gap-2">
                    <label class="font-bold text-sm text-gray-600">Bobot Penilaian (%)</label>
                    <InputNumber v-model="weeklyData.bobot_penilaian" :min="0" :max="100" suffix=" %" />
                </div>
            </div>
            <div class="flex flex-col gap-2">
                <label class="font-bold text-sm text-gray-600">Kemampuan Akhir yang Diharapkan *</label>
                <Textarea v-model="weeklyData.kemampuan_akhir_diharapkan" rows="3" autoResize
                    :invalid="submitted && !weeklyData.kemampuan_akhir_diharapkan"
                    placeholder="Sub-CPMK yang ingin dicapai..." />
            </div>
            <div class="flex flex-col gap-2">
                <label class="font-bold text-sm text-gray-600">Bahan Kajian / Materi *</label>
                <Textarea v-model="weeklyData.bahan_kajian" rows="3" autoResize placeholder="Topik bahasan utama..." />
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div class="flex flex-col gap-2">
                    <label class="font-bold text-sm text-gray-600">Metode Pembelajaran</label>
                    <InputText v-model="weeklyData.metode_pembelajaran" placeholder="Contoh: Ceramah, PBL, SGD" />
                </div>
                <div class="flex flex-col gap-2">
                    <label class="font-bold text-sm text-gray-600">Estimasi Waktu</label>
                    <InputText v-model="weeklyData.waktu_belajar" placeholder="Contoh: 2 x 50 Menit" />
                </div>
            </div>
        </div>
        <template #footer>
            <div class="flex justify-end gap-2 mt-2">
                <Button label="Batal" text severity="secondary" @click="weeklyFormDialog = false" />
                <Button label="Simpan Matriks" icon="pi pi-check" @click="handleSaveWeekly" severity="success"
                    class="px-4" />
            </div>
        </template>
    </Dialog>

    <!-- Modal Verifikasi -->
    <Dialog v-model:visible="verifyDialog" header="Keputusan Verifikasi RPS" :style="{ width: '450px' }" modal>
        <div class="flex flex-col gap-5 mt-2 p-fluid">
            <div class="flex flex-col gap-3">
                <label class="font-bold text-gray-700">Keputusan Akhir</label>
                <SelectButton v-model="verifyData.status_verifikasi" :options="['Disetujui', 'Ditolak']" />
            </div>
            <div class="flex flex-col gap-2">
                <label class="font-bold text-gray-700">Feedback / Catatan Perbaikan</label>
                <Textarea v-model="verifyData.catatan" rows="4"
                    placeholder="Tuliskan alasan penolakan atau saran perbaikan RPS jika diperlukan..." />
            </div>
        </div>
        <template #footer>
            <div class="flex justify-end gap-2">
                <Button label="Batal" text severity="secondary" @click="verifyDialog = false" />
                <Button label="Kirim Keputusan" icon="pi pi-send" severity="primary" @click="handleVerify" />
            </div>
        </template>
    </Dialog>
</template>

<style scoped>
:deep(.p-tabview-panels) {
    padding: 1.5rem 0;
}

/* Custom Styling for Textarea - Diperbarui agar width 100% konsisten */
.custom-textarea {
    width: 100% !important;
    background-color: transparent;
    border: none;
    transition: all 0.2s ease;
    font-size: 0.95rem;
    line-height: 1.7;
    padding: 1.25rem;
    color: #334155;
    border-radius: 0;
    box-shadow: none !important;
}

.custom-textarea:focus {
    outline: none;
    background-color: #fafbfc;
}

:deep(.p-textarea:not(.p-invalid):focus) {
    border: none !important;
    box-shadow: none !important;
}
</style>