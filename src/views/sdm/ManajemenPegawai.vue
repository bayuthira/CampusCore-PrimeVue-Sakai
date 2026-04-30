<script setup>
import { useAbsensiStore } from '@/stores/absensi'; // Store Absensi untuk fitur Biometrik
import { useAuthStore } from '@/stores/auth';
import { useCutiStore } from '@/stores/cuti';
import { useDokumenStore } from '@/stores/dokumen';
import { useKarirDosenStore } from '@/stores/karirDosen';
import { usePegawaiStore } from '@/stores/pegawai';
import { usePendidikanStore } from '@/stores/pendidikan';
import { usePenempatanStore } from '@/stores/penempatan';
import { useProdiStore } from '@/stores/prodi';
import { useRiwayatSkStore } from '@/stores/riwayatSk';
import { useSertifikatStore } from '@/stores/sertifikat';
import { useUnitKerjaStore } from '@/stores/unitKerja';
import { FilterMatchMode } from '@primevue/core/api';
import { storeToRefs } from 'pinia';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';

// --- Setup ---
const toast = useToast();
const confirm = useConfirm();
const store = usePegawaiStore();
const prodiStore = useProdiStore();
const absensiStore = useAbsensiStore();
const { list, isLoading } = storeToRefs(store);
const { prodiList } = storeToRefs(prodiStore);
const riwayatSkStore = useRiwayatSkStore();
const authStore = useAuthStore();
const cutiStore = useCutiStore();
const pendidikanStore = usePendidikanStore();
const dokumenStore = useDokumenStore();
const sertifikatStore = useSertifikatStore();
const karirDosenStore = useKarirDosenStore();
const penempatanStore = usePenempatanStore();
const unitKerjaStore = useUnitKerjaStore();

const { list: pendidikanList, isLoading: isPendidikanLoading } = storeToRefs(pendidikanStore);
const { list: riwayatSkList, isLoading: isRiwayatSkLoading } = storeToRefs(riwayatSkStore);
const { list: dokumenList, isLoading: isDokumenLoading } = storeToRefs(dokumenStore);
const { list: sertifikatList, isLoading: isSertifikatLoading } = storeToRefs(sertifikatStore);
const { jadList, serdosList, isLoading: isKarirDosenLoading } = storeToRefs(karirDosenStore);
const { list: penempatanList, isLoading: isPenempatanLoading } = storeToRefs(penempatanStore);
const { list: unitKerjaList } = storeToRefs(unitKerjaStore);

const dialog = ref(false);
const deleteDialog = ref(false);
const data = ref({});
const submitted = ref(false);
const filters = ref({ global: { value: null, matchMode: FilterMatchMode.CONTAINS } });
const createUserDialog = ref(false);
const userCreationData = ref({});
const selectedPegawai = ref({});

// --- State Khusus Audit Wajah ---
const faceAuditDialog = ref(false);
const facePhotoUrl = ref(null);
const isFaceLoading = ref(false);

// --- State Pendidikan ---
const pendidikanListDialog = ref(false);
const pendidikanFormDialog = ref(false);
const deletePendidikanDialog = ref(false);
const pendidikanData = ref({});
const pendidikanSubmitted = ref(false);
const isPendidikanNew = computed(() => !pendidikanData.value.id);

// --- State SK ---
const riwayatSkListDialog = ref(false);
const riwayatSkFormDialog = ref(false);
const deleteRiwayatSkDialog = ref(false);
const riwayatSkData = ref({});
const riwayatSkSubmitted = ref(false);
const isRiwayatSkNew = computed(() => !riwayatSkData.value.id);

// --- State Dokumen ---
const dokumenListDialog = ref(false);
const selectedRecord = ref(null);
const selectedRecordType = ref('');
const fileToUpload = ref(null);
const isBuktiLoading = ref(false);
const uploadRef = ref(null);
const uploadKategori = ref(null);

// --- State Cuti ---
const jatahDialog = ref(false);
const jatahData = ref({});
const jatahSubmitted = ref(false);
const viewJatahDialog = ref(false);
const viewJatahData = ref(null);
const { isLoading: isCutiLoading } = storeToRefs(cutiStore);

// --- State Sertifikat ---
const sertifikatListDialog = ref(false);
const sertifikatFormDialog = ref(false);
const deleteSertifikatDialog = ref(false);
const sertifikatData = ref({});
const sertifikatSubmitted = ref(false);
const isSertifikatNew = computed(() => !sertifikatData.value.id);

// --- State Karir Dosen ---
const karirDosenDialog = ref(false);
const jadFormDialog = ref(false);
const deleteJadDialog = ref(false);
const jadData = ref({});
const jadSubmitted = ref(false);
const isJadNew = computed(() => !jadData.value.id);

const serdosFormDialog = ref(false);
const deleteSerdosDialog = ref(false);
const serdosData = ref({});
const serdosSubmitted = ref(false);
const isSerdosNew = computed(() => !serdosData.value.id);

// --- State Penempatan ---
const penempatanListDialog = ref(false);
const penempatanFormDialog = ref(false);
const deletePenempatanDialog = ref(false);
const penempatanData = ref({});
const penempatanSubmitted = ref(false);
const isPenempatanNew = computed(() => !penempatanData.value.id);

// --- Opsi Dropdown ---
const jenisKelaminOptions = ref([{ label: 'Laki-laki', value: 'L' }, { label: 'Perempuan', value: 'P' }]);
const statusNikahOptions = ref(['Menikah', 'Belum Menikah', 'Cerai Hidup', 'Cerai Mati']);
const statusPegawaiOptions = ref(['Tetap', 'Kontrak', 'Honorer']);
const kategoriPegawaiOptions = ref(['Tenaga Pendidik', 'Tenaga Kependidikan']);
const kewarganegaraanOptions = ref([{ label: 'Indonesia (ID)', value: 'ID' }, { label: 'Asing', value: 'Foreign' }]);
const ikatanKerjaOptions = ref([{ label: 'Dosen Tetap (A)', value: 'A' }, { label: 'Dosen Dpk (B)', value: 'B' }, { label: 'Dosen LB (C)', value: 'C' }]);
const kategoriSertifikatOptions = ref(['Pelatihan', 'BIMTEK', 'Seminar', 'Workshop', 'Rekognisi Dosen']);
const tingkatSertifikatOptions = ref(['Lokal', 'Nasional', 'Internasional']);
const jabatanAkademikOptions = ref(['Asisten Ahli', 'Lektor', 'Lektor Kepala', 'Guru Besar']);
const pangkatGolonganOptions = ref(['Penata Muda / III.a', 'Penata Muda Tk.I / III.b', 'Penata / III.c', 'Penata Tk. I / III.d', 'Pembina / IV.a', 'Pembina Tk. I / IV.b', 'Pembina Utama Muda / IV.c', 'Pembina Utama Madya / IV.d', 'Pembina Utama / IV.e']);

const computedKategoriOptions = computed(() => {
    if (selectedRecordType.value === 'riwayat-sk') return ['SK', 'Lainnya'];
    if (selectedRecordType.value === 'riwayat-pendidikan') return ['Ijazah', 'Transkrip', 'Lainnya'];
    if (selectedRecordType.value === 'riwayat-sertifikat') return ['Sertifikat', 'Lainnya'];
    if (selectedRecordType.value === 'riwayat-jad') return ['SK', 'Lainnya'];
    if (selectedRecordType.value === 'riwayat-serdos') return ['Sertifikat', 'Lainnya'];
    if (selectedRecordType.value === 'pegawai') return ['FotoProfil', 'KTP', 'KK', 'Lainnya'];
    return [];
});

onMounted(() => {
    store.fetchAll();
    prodiStore.fetchProdi();
    unitKerjaStore.fetchAll();
});

function formatDate(date) {
    if (!date) return null;
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// --- CRUD Utama ---
function openNew() {
    data.value = { is_active: true, kewarganegaraan: 'ID', kategori_pegawai: 'Tenaga Kependidikan', ikatan_kerja: 'A' };
    submitted.value = false;
    dialog.value = true;
}

function hideDialog() {
    dialog.value = false;
    submitted.value = false;
}

async function saveData() {
    submitted.value = true;
    if (!data.value.nik?.trim() || !data.value.nama_lengkap?.trim()) return;
    try {
        const payload = {
            ...data.value,
            tanggal_lahir: formatDate(data.value.tanggal_lahir),
            tanggal_masuk: formatDate(data.value.tanggal_masuk),
            tanggal_pensiun: formatDate(data.value.tanggal_pensiun)
        };
        if (data.value.id) await store.update(data.value.id, payload);
        else await store.create(payload);
        dialog.value = false;
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Data Pegawai disimpan', life: 3000 });
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal menyimpan data', life: 3000 });
    }
}

function editData(row) {
    data.value = {
        ...row,
        tanggal_lahir: row.tanggal_lahir ? new Date(row.tanggal_lahir) : null,
        tanggal_masuk: row.tanggal_masuk ? new Date(row.tanggal_masuk) : null,
        tanggal_pensiun: row.tanggal_pensiun ? new Date(row.tanggal_pensiun) : null
    };
    dialog.value = true;
}

function confirmDelete(row) {
    data.value = row;
    deleteDialog.value = true;
}

async function deleteData() {
    try {
        await store.delete(data.value.id);
        deleteDialog.value = false;
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Data Pegawai dihapus', life: 3000 });
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal menghapus data', life: 3000 });
    }
}

// --- Handler Manajemen Wajah (Biometrik) ---
async function openFaceAudit(pegawai) {
    selectedPegawai.value = pegawai;
    facePhotoUrl.value = null;
    faceAuditDialog.value = true;
    isFaceLoading.value = true;

    try {
        const url = await absensiStore.fetchFaceBlob(pegawai.id);
        facePhotoUrl.value = url;
    } catch (e) {
        // Error di-handle di store
    } finally {
        isFaceLoading.value = false;
    }
}

async function handleAuditFace(status) {
    try {
        await absensiStore.auditFace(selectedPegawai.value.id, status);
        toast.add({ severity: 'success', summary: 'Berhasil', detail: `Foto wajah ditandai sebagai ${status}`, life: 3000 });
        faceAuditDialog.value = false;
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal memperbarui status audit', life: 3000 });
    }
}

function confirmDeleteFace() {
    confirm.require({
        message: `Hapus foto referensi wajah ${selectedPegawai.value.nama_lengkap}? Karyawan harus mengunggah ulang fotonya.`,
        header: 'Konfirmasi Reset Wajah',
        icon: 'pi pi-exclamation-triangle',
        acceptClass: 'p-button-danger',
        accept: async () => {
            try {
                await absensiStore.deleteFace(selectedPegawai.value.id);
                toast.add({ severity: 'info', summary: 'Berhasil', detail: 'Foto wajah dihapus', life: 3000 });
                faceAuditDialog.value = false;
            } catch (e) {
                toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal menghapus foto', life: 3000 });
            }
        }
    });
}

function closeFaceDialog() {
    if (facePhotoUrl.value) URL.revokeObjectURL(facePhotoUrl.value);
    faceAuditDialog.value = false;
}

// --- Menu Handlers: User & Pendidikan ---
function openCreateUserDialog(p) { selectedPegawai.value = p; userCreationData.value = { password: '' }; createUserDialog.value = true; }
async function saveUserAccount() { try { await store.createUserAccount(selectedPegawai.value.id, userCreationData.value); createUserDialog.value = false; toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Akun user dibuat', life: 3000 }); } catch (e) { } }

async function openPendidikanList(p) { selectedPegawai.value = p; await pendidikanStore.fetchByPegawai(p.id); pendidikanListDialog.value = true; }
function openNewPendidikan() { pendidikanData.value = {}; pendidikanFormDialog.value = true; }
function editPendidikan(r) { pendidikanData.value = { ...r }; pendidikanFormDialog.value = true; }
function hidePendidikanDialog() { pendidikanFormDialog.value = false; }
async function savePendidikan() { try { if (isPendidikanNew.value) await pendidikanStore.create(selectedPegawai.value.id, pendidikanData.value); else await pendidikanStore.update(pendidikanData.value.id, pendidikanData.value); await pendidikanStore.fetchByPegawai(selectedPegawai.value.id); pendidikanFormDialog.value = false; } catch (e) { } }
function confirmDeletePendidikan(r) { pendidikanData.value = r; deletePendidikanDialog.value = true; }
async function deletePendidikan() { try { await pendidikanStore.delete(pendidikanData.value.id); await pendidikanStore.fetchByPegawai(selectedPegawai.value.id); deletePendidikanDialog.value = false; } catch (e) { } }

// --- Menu Handlers: SK & Sertifikat ---
async function openRiwayatSkList(p) { selectedPegawai.value = p; await riwayatSkStore.fetchByPegawai(p.id); riwayatSkListDialog.value = true; }
function openNewRiwayatSk() { riwayatSkData.value = { tanggal_sk: new Date() }; riwayatSkFormDialog.value = true; }
function editRiwayatSk(r) { riwayatSkData.value = { ...r, tanggal_sk: new Date(r.tanggal_sk) }; riwayatSkFormDialog.value = true; }
function hideRiwayatSkDialog() { riwayatSkFormDialog.value = false; }
async function saveRiwayatSk() { try { const p = { ...riwayatSkData.value, tanggal_sk: formatDate(riwayatSkData.value.tanggal_sk) }; if (isRiwayatSkNew.value) await riwayatSkStore.create(selectedPegawai.value.id, p); else await riwayatSkStore.update(riwayatSkData.value.id, p); await riwayatSkStore.fetchByPegawai(selectedPegawai.value.id); riwayatSkFormDialog.value = false; } catch (e) { } }
function confirmDeleteRiwayatSk(r) { riwayatSkData.value = r; deleteRiwayatSkDialog.value = true; }
async function deleteRiwayatSk() { try { await riwayatSkStore.delete(riwayatSkData.value.id); await riwayatSkStore.fetchByPegawai(selectedPegawai.value.id); deleteRiwayatSkDialog.value = false; } catch (e) { } }

async function openSertifikatList(p) { selectedPegawai.value = p; await sertifikatStore.fetchByPegawai(p.id); sertifikatListDialog.value = true; }
function openNewSertifikat() { sertifikatData.value = { tanggal_pelaksanaan: new Date() }; sertifikatFormDialog.value = true; }
function editSertifikat(r) { sertifikatData.value = { ...r, tanggal_pelaksanaan: new Date(r.tanggal_pelaksanaan) }; sertifikatFormDialog.value = true; }
function hideSertifikatDialog() { sertifikatFormDialog.value = false; }
async function saveSertifikat() { try { const p = { ...sertifikatData.value, tanggal_pelaksanaan: formatDate(sertifikatData.value.tanggal_pelaksanaan) }; if (isSertifikatNew.value) await sertifikatStore.create(selectedPegawai.value.id, p); else await sertifikatStore.update(sertifikatData.value.id, p); await sertifikatStore.fetchByPegawai(selectedPegawai.value.id); sertifikatFormDialog.value = false; } catch (e) { } }
function confirmDeleteSertifikat(r) { sertifikatData.value = r; deleteSertifikatDialog.value = true; }
async function deleteSertifikat() { try { await sertifikatStore.delete(sertifikatData.value.id); await sertifikatStore.fetchByPegawai(selectedPegawai.value.id); deleteSertifikatDialog.value = false; } catch (e) { } }

// --- Menu Handlers: Dokumen ---
async function openDokumenDialog(r, t, n) { selectedRecord.value = r; selectedRecordType.value = t; selectedPegawai.value.nama_lengkap = n; await dokumenStore.fetchList(t, r.id); dokumenListDialog.value = true; }
function onFileSelect(e) { fileToUpload.value = e.files[0]; }
async function handleUploadDokumen() { const f = new FormData(); f.append('file', fileToUpload.value); f.append('kategori', uploadKategori.value); try { await dokumenStore.upload(selectedRecordType.value, selectedRecord.value.id, f); fileToUpload.value = null; if (uploadRef.value) uploadRef.value.clear(); await dokumenStore.fetchList(selectedRecordType.value, selectedRecord.value.id); } catch (e) { } }
async function viewDokumen(path) { if (!path) return; isBuktiLoading.value = true; try { const b = await dokumenStore.viewFile(path); const u = URL.createObjectURL(b); window.open(u, '_blank'); } catch (e) { } finally { isBuktiLoading.value = false; } }
function confirmDeleteDokumen(d) { confirm.require({ message: `Hapus file ${d.nama_file_asli}?`, accept: async () => { try { await dokumenStore.delete(d.id); await dokumenStore.fetchList(selectedRecordType.value, selectedRecord.value.id); } catch (e) { } } }); }

// --- Menu Handlers: Cuti ---
function openJatahDialog(p) { selectedPegawai.value = p; jatahData.value = { pegawai_id: p.id, tahun: new Date().getFullYear(), kuota_total: 12 }; jatahDialog.value = true; }
async function saveJatahCuti() { try { await cutiStore.setJatahCuti(jatahData.value); jatahDialog.value = false; } catch (e) { } }
async function openViewJatahDialog(p) { selectedPegawai.value = p; viewJatahData.value = null; viewJatahDialog.value = true; try { const y = new Date().getFullYear(); const d = await cutiStore.fetchJatahCutiByPegawai(p.id, y); if (d && d.length > 0) viewJatahData.value = { ...d[0], sisa_cuti: d[0].kuota_total - d[0].kuota_terpakai }; else viewJatahData.value = { error: `Data ${y} tidak ditemukan.` }; } catch (e) { } }

// --- Menu Handlers: Karir Dosen & Penempatan ---
async function openKarirDosenDialog(p) { selectedPegawai.value = p; await Promise.all([karirDosenStore.fetchJad(p.id), karirDosenStore.fetchSerdos(p.id)]); karirDosenDialog.value = true; }
function openNewJad() { jadData.value = { tmt: new Date() }; jadFormDialog.value = true; }
function editJad(r) { jadData.value = { ...r, tmt: new Date(r.tmt) }; jadFormDialog.value = true; }
async function saveJad() { try { const p = { ...jadData.value, tmt: formatDate(jadData.value.tmt) }; if (isJadNew.value) await karirDosenStore.createJad(selectedPegawai.value.id, p); else await karirDosenStore.updateJad(jadData.value.id, p); await karirDosenStore.fetchJad(selectedPegawai.value.id); jadFormDialog.value = false; } catch (e) { } }
function confirmDeleteJad(r) { jadData.value = r; deleteJadDialog.value = true; }
async function deleteJad() { try { await karirDosenStore.deleteJad(jadData.value.id); await karirDosenStore.fetchJad(selectedPegawai.value.id); deleteJadDialog.value = false; } catch (e) { } }
function openNewSerdos() { serdosData.value = { tanggal_terbit: new Date() }; serdosFormDialog.value = true; }
function editSerdos(r) { serdosData.value = { ...r, tanggal_terbit: new Date(r.tanggal_terbit) }; serdosFormDialog.value = true; }
async function saveSerdos() { try { const p = { ...serdosData.value, tanggal_terbit: formatDate(serdosData.value.tanggal_terbit) }; if (isSerdosNew.value) await karirDosenStore.createSerdos(selectedPegawai.value.id, p); else await karirDosenStore.updateSerdos(serdosData.value.id, p); await karirDosenStore.fetchSerdos(selectedPegawai.value.id); serdosFormDialog.value = false; } catch (e) { } }
function confirmDeleteSerdos(r) { serdosData.value = r; deleteSerdosDialog.value = true; }
async function deleteSerdos() { try { await karirDosenStore.deleteSerdos(serdosData.value.id); await karirDosenStore.fetchSerdos(selectedPegawai.value.id); deleteSerdosDialog.value = false; } catch (e) { } }

async function openPenempatanList(p) { selectedPegawai.value = p; await penempatanStore.fetchByPegawai(p.id); penempatanListDialog.value = true; }
function openNewPenempatan() { penempatanData.value = { tanggal_mulai: new Date() }; penempatanFormDialog.value = true; }
function editPenempatan(r) { penempatanData.value = { ...r, tanggal_mulai: new Date(r.tanggal_mulai) }; penempatanFormDialog.value = true; }
function hidePenempatanDialog() { penempatanFormDialog.value = false; }
async function savePenempatan() { try { const p = { ...penempatanData.value, tanggal_mulai: formatDate(penempatanData.value.tanggal_mulai) }; if (isPenempatanNew.value) await penempatanStore.create(selectedPegawai.value.id, p); else await penempatanStore.update(penempatanData.value.id, p); await penempatanStore.fetchByPegawai(selectedPegawai.value.id); penempatanFormDialog.value = false; } catch (e) { } }
function confirmDeletePenempatan(r) { penempatanData.value = r; deletePenempatanDialog.value = true; }
async function deletePenempatan() { try { await penempatanStore.delete(penempatanData.value.id); await penempatanStore.fetchByPegawai(selectedPegawai.value.id); deletePenempatanDialog.value = false; } catch (e) { } }
</script>

<template>
    <div>
        <div class="card shadow-sm border-0">
            <Toolbar class="mb-6">
                <template #start>
                    <Button label="Tambah Pegawai" icon="pi pi-plus" severity="primary" class="mr-2" @click="openNew" />
                </template>
            </Toolbar>

            <DataTable ref="dt" :value="list" :loading="isLoading" dataKey="id" :paginator="true" :rows="10"
                :filters="filters" stripedRows class="p-datatable-sm">
                <template #header>
                    <div class="flex flex-wrap gap-2 items-center justify-between">
                        <h4 class="m-0 font-bold text-gray-700">Manajemen Pegawai & Dosen</h4>
                        <IconField>
                            <InputIcon> <i class="pi pi-search" /> </InputIcon>
                            <InputText v-model="filters['global'].value" placeholder="Cari..." />
                        </IconField>
                    </div>
                </template>

                <Column field="nik" header="NIK" sortable></Column>
                <Column field="nama_lengkap" header="Nama Lengkap" sortable></Column>
                <Column field="kategori_pegawai" header="Kategori" sortable>
                    <template #body="slotProps">
                        <Tag :value="slotProps.data.kategori_pegawai"
                            :severity="slotProps.data.kategori_pegawai === 'Tenaga Pendidik' ? 'info' : 'secondary'" />
                    </template>
                </Column>

                <Column :exportable="false" style="min-width: 25rem" header="Aksi">
                    <template #body="slotProps">
                        <div class="flex flex-wrap gap-2">
                            <!-- TOMBOL VERIFIKASI WAJAH (Khusus Admin) -->
                            <Button
                                v-if="authStore.userData?.roles.some(r => ['SUPER_ADMIN', 'STAF_BASDM'].includes(r))"
                                icon="pi pi-camera" outlined rounded severity="help"
                                @click="openFaceAudit(slotProps.data)" v-tooltip.top="'Verifikasi Wajah (Biometrik)'" />

                            <Button v-if="slotProps.data.kategori_pegawai === 'Tenaga Pendidik'" icon="pi pi-star"
                                outlined rounded severity="success" @click="openKarirDosenDialog(slotProps.data)"
                                v-tooltip.top="'Karir Dosen (JAD/SERDOS)'" />
                            <Button icon="pi pi-briefcase" outlined rounded severity="success"
                                @click="openPenempatanList(slotProps.data)" v-tooltip.top="'Riwayat Penempatan'" />
                            <Button icon="pi pi-book" outlined rounded severity="info"
                                @click="openPendidikanList(slotProps.data)" v-tooltip.top="'Riwayat Pendidikan'" />
                            <Button icon="pi pi-file-o" outlined rounded severity="secondary"
                                @click="openRiwayatSkList(slotProps.data)" v-tooltip.top="'Riwayat SK'" />
                            <Button icon="pi pi-id-card" outlined rounded severity="warning"
                                @click="openSertifikatList(slotProps.data)" v-tooltip.top="'Riwayat Sertifikat'" />
                            <Button icon="pi pi-address-book" outlined rounded severity="help"
                                @click="openDokumenDialog(slotProps.data, 'pegawai', slotProps.data.nama_lengkap)"
                                v-tooltip.top="'Dokumen Pegawai (KTP, Foto, dll)'" />
                            <Button icon="pi pi-cog" outlined rounded severity="secondary"
                                @click="openJatahDialog(slotProps.data)" v-tooltip.top="'Atur Jatah Cuti'" />
                            <Button icon="pi pi-calendar-times" outlined rounded severity="help"
                                @click="openViewJatahDialog(slotProps.data)" v-tooltip.top="'Cek Jatah Cuti'" />
                            <Button icon="pi pi-pencil" outlined rounded severity="warning"
                                @click="editData(slotProps.data)" v-tooltip.top="'Ubah Data'" />
                            <Button v-if="!slotProps.data.user_id && authStore.userData?.roles.includes('SUPER_ADMIN')"
                                icon="pi pi-user-plus" outlined rounded severity="success"
                                @click="openCreateUserDialog(slotProps.data)" v-tooltip.top="'Buat Akun User'" />
                            <Button icon="pi pi-trash" outlined rounded severity="danger"
                                @click="confirmDelete(slotProps.data)" v-tooltip.top="'Hapus'" />
                        </div>
                    </template>
                </Column>
            </DataTable>
        </div>

        <!-- DIALOG AUDIT WAJAH BIOMETRIK -->
        <Dialog v-model:visible="faceAuditDialog" :style="{ width: '500px' }"
            :header="`Audit Wajah: ${selectedPegawai.nama_lengkap}`" :modal="true" @hide="closeFaceDialog">
            <div class="flex flex-col items-center gap-6 py-4">
                <div v-if="isFaceLoading" class="flex flex-col items-center py-8">
                    <ProgressSpinner style="width: 50px; height: 50px" />
                    <span class="text-slate-500 mt-2">Mengambil foto aman...</span>
                </div>

                <div v-else-if="facePhotoUrl" class="w-full flex flex-col items-center gap-4">
                    <div
                        class="w-64 h-64 rounded-full overflow-hidden border-4 border-slate-100 shadow-lg bg-slate-50 relative group">
                        <img :src="facePhotoUrl" class="w-full h-full object-cover" />
                    </div>
                    <div class="text-center px-4">
                        <p class="m-0 text-slate-600 text-sm">Validasi apakah foto ini sesuai dengan wajah asli <b>{{
                                selectedPegawai.nama_lengkap }}</b> untuk keperluan presensi biometrik.</p>
                    </div>

                    <div class="flex flex-col w-full gap-3 mt-4 px-4">
                        <div class="grid grid-cols-2 gap-3">
                            <Button label="Audit: Valid" icon="pi pi-check-circle" severity="success"
                                @click="handleAuditFace('Valid')" />
                            <Button label="Audit: Tolak" icon="pi pi-times-circle" severity="warn"
                                @click="handleAuditFace('Ditolak')" />
                        </div>
                        <Button label="Hapus / Reset Foto" icon="pi pi-trash" severity="danger" text
                            @click="confirmDeleteFace" />
                    </div>
                </div>

                <div v-else class="py-12 flex flex-col items-center text-slate-400 italic">
                    <i class="pi pi-image text-5xl mb-4 opacity-20"></i>
                    <span>Belum ada foto referensi wajah.</span>
                </div>
            </div>
            <template #footer>
                <Button label="Tutup" icon="pi pi-times" text severity="secondary" @click="closeFaceDialog" />
            </template>
        </Dialog>

        <!-- DIALOG UTAMA PEGAWAI -->
        <Dialog v-model:visible="dialog" :style="{ width: '80vw' }" header="Detail Pegawai" :modal="true"
            class="p-fluid">
            <TabView>
                <TabPanel header="Identitas Dasar">
                    <div class="grid grid-cols-12 gap-4 mt-2">
                        <div class="col-span-12 md:col-span-4"><label class="font-bold block mb-2 text-gray-600">NIK
                                *</label>
                            <InputText v-model.trim="data.nik" required :invalid="submitted && !data.nik" fluid />
                        </div>
                        <div class="col-span-12 md:col-span-4"><label class="font-bold block mb-2 text-gray-600">NUPTK
                                (Opsional)</label>
                            <InputText v-model.trim="data.nuptk" placeholder="16 Digit NUPTK" fluid />
                        </div>
                        <div class="col-span-12 md:col-span-4"><label
                                class="font-bold block mb-2 text-gray-600">Kewarganegaraan</label>
                            <Dropdown v-model="data.kewarganegaraan" :options="kewarganegaraanOptions"
                                optionLabel="label" optionValue="value" fluid />
                        </div>
                        <div class="col-span-12 md:col-span-12"><label class="font-bold block mb-2 text-gray-600">Nama
                                Lengkap
                                *</label>
                            <InputText v-model.trim="data.nama_lengkap" required
                                :invalid="submitted && !data.nama_lengkap" fluid />
                        </div>
                        <div class="col-span-12 md:col-span-4"><label class="font-bold block mb-2 text-gray-600">Gelar
                                Depan</label>
                            <InputText v-model.trim="data.gelar_depan" fluid />
                        </div>
                        <div class="col-span-12 md:col-span-4"><label class="font-bold block mb-2 text-gray-600">Gelar
                                Belakang</label>
                            <InputText v-model.trim="data.gelar_belakang" fluid />
                        </div>
                        <div class="col-span-12 md:col-span-4"><label class="font-bold block mb-2 text-gray-600">Jenis
                                Kelamin</label>
                            <Dropdown v-model="data.jenis_kelamin" :options="jenisKelaminOptions" optionLabel="label"
                                optionValue="value" placeholder="Pilih" fluid />
                        </div>
                        <div class="col-span-12 md:col-span-6"><label class="font-bold block mb-2 text-gray-600">Tempat
                                Lahir</label>
                            <InputText v-model.trim="data.tempat_lahir" fluid />
                        </div>
                        <div class="col-span-12 md:col-span-6"><label class="font-bold block mb-2 text-gray-600">Tanggal
                                Lahir</label>
                            <Calendar v-model="data.tanggal_lahir" dateFormat="yy-mm-dd" />
                        </div>
                        <div class="col-span-12 md:col-span-12"><label class="font-bold block mb-2 text-gray-600">Nama
                                Ibu
                                Kandung *</label>
                            <InputText v-model.trim="data.nama_ibu_kandung" placeholder="Sesuai Akte" fluid />
                        </div>
                    </div>
                </TabPanel>
                <TabPanel header="Alamat & Kontak">
                    <div class="grid grid-cols-12 gap-4 mt-2">
                        <div class="col-span-12"><label class="font-bold block mb-2 text-gray-600">Alamat
                                Lengkap</label><Textarea v-model.trim="data.alamat_domisili" rows="2" fluid /></div>
                        <div class="col-span-12 md:col-span-4"><label
                                class="font-bold block mb-2 text-gray-600">Dusun</label>
                            <InputText v-model.trim="data.dusun" fluid />
                        </div>
                        <div class="col-span-12 md:col-span-4">
                            <label class="font-bold block mb-2 text-gray-600">RT / RW</label>
                            <div class="flex gap-2">
                                <InputText v-model.trim="data.rt" placeholder="RT" fluid class="flex-1" />
                                <InputText v-model.trim="data.rw" placeholder="RW" fluid class="flex-1" />
                            </div>
                        </div>
                        <div class="col-span-12 md:col-span-4"><label
                                class="font-bold block mb-2 text-gray-600">Kelurahan</label>
                            <InputText v-model.trim="data.kelurahan" fluid />
                        </div>
                        <div class="col-span-12 md:col-span-6"><label class="font-bold block mb-2 text-gray-600">ID
                                Wilayah (Neo
                                Feeder)</label>
                            <InputText v-model.trim="data.id_wilayah_feeder" placeholder="UUID Wilayah" fluid />
                        </div>
                        <div class="col-span-12 md:col-span-3"><label class="font-bold block mb-2 text-gray-600">No.
                                HP</label>
                            <InputText v-model.trim="data.nomor_hp" fluid />
                        </div>
                        <div class="col-span-12 md:col-span-3"><label class="font-bold block mb-2 text-gray-600">Email
                                Utama</label>
                            <InputText v-model.trim="data.email" fluid />
                        </div>
                    </div>
                </TabPanel>
                <TabPanel header="Kepegawaian">
                    <div class="grid grid-cols-12 gap-4 mt-2">
                        <div class="col-span-12 md:col-span-6"><label
                                class="font-bold block mb-2 text-gray-600">Kategori
                                Pegawai</label>
                            <Dropdown v-model="data.kategori_pegawai" :options="kategoriPegawaiOptions"
                                placeholder="Pilih Kategori" fluid />
                        </div>
                        <div class="col-span-12 md:col-span-6"><label class="font-bold block mb-2 text-gray-600">Status
                                Pegawai</label>
                            <Dropdown v-model="data.status_pegawai" :options="statusPegawaiOptions"
                                placeholder="Pilih Status" fluid />
                        </div>
                        <template v-if="data.kategori_pegawai === 'Tenaga Pendidik'">
                            <div class="col-span-12 font-bold text-success border-b py-2 mb-2 text-sm mt-2">Atribut
                                Dosen (Neo Feeder)</div>
                            <div class="col-span-12 md:col-span-6 text-sm"><label
                                    class="font-bold block mb-2 text-gray-600">NIDN / NIDK *</label>
                                <InputText v-model.trim="data.nidn" fluid />
                            </div>
                            <div class="col-span-12 md:col-span-6"><label
                                    class="font-bold block mb-2 text-gray-600">Homebase Prodi *</label>
                                <Dropdown v-model="data.prodi_id" :options="prodiList" optionLabel="nama_prodi"
                                    optionValue="id" placeholder="Pilih Prodi" fluid filter />
                            </div>
                            <div class="col-span-12 md:col-span-6"><label
                                    class="font-bold block mb-2 text-gray-600">Ikatan Kerja</label>
                                <Dropdown v-model="data.ikatan_kerja" :options="ikatanKerjaOptions" optionLabel="label"
                                    optionValue="value" fluid />
                            </div>
                            <div class="col-span-12 md:col-span-6"><label class="font-bold block mb-2 text-gray-600">ID
                                    Penugasan (Feeder)</label>
                                <InputText v-model.trim="data.id_penugasan_feeder" placeholder="UUID Penugasan" fluid />
                            </div>
                        </template>
                        <div class="col-span-12 md:col-span-6"><label class="font-bold block mb-2 text-gray-600">Tanggal
                                Masuk</label>
                            <Calendar v-model="data.tanggal_masuk" dateFormat="yy-mm-dd" />
                        </div>
                        <div class="col-span-12 md:col-span-6"><label class="font-bold block mb-2 text-gray-600">Tanggal
                                Pensiun</label>
                            <Calendar v-model="data.tanggal_pensiun" dateFormat="yy-mm-dd" />
                        </div>
                        <div class="col-span-12 md:col-span-6"><label class="font-bold block mb-2 text-gray-600">ID SDM
                                Feeder</label>
                            <InputText v-model.trim="data.id_sdm_feeder" placeholder="UUID SDM dari Neo Feeder" fluid />
                        </div>
                        <div class="col-span-12 flex items-center">
                            <ToggleSwitch v-model="data.is_active" id="active_status" /><label for="active_status"
                                class="ml-2 font-bold text-gray-700">Pegawai Aktif</label>
                        </div>
                    </div>
                </TabPanel>
                <TabPanel header="Data Lain">
                    <div class="grid grid-cols-12 gap-4 mt-2">
                        <div class="col-span-12 md:col-span-4"><label
                                class="font-bold block mb-2 text-gray-600">Agama</label>
                            <InputText v-model.trim="data.agama" fluid />
                        </div>
                        <div class="col-span-12 md:col-span-4"><label
                                class="font-bold block mb-2 text-gray-600">Golongan
                                Darah</label>
                            <InputText v-model.trim="data.gol_darah" fluid />
                        </div>
                        <div class="col-span-12 md:col-span-4"><label class="font-bold block mb-2 text-gray-600">Status
                                Nikah</label>
                            <Dropdown v-model="data.status_nikah" :options="statusNikahOptions" placeholder="Pilih"
                                fluid />
                        </div>
                        <div class="col-span-12 md:col-span-4"><label class="font-bold block mb-2 text-gray-600">No.
                                KTP</label>
                            <InputText v-model.trim="data.no_ktp" fluid />
                        </div>
                        <div class="col-span-12 md:col-span-4"><label class="font-bold block mb-2 text-gray-600">No.
                                KK</label>
                            <InputText v-model.trim="data.no_kk" fluid />
                        </div>
                        <div class="col-span-12 md:col-span-4"><label class="font-bold block mb-2 text-gray-600">No.
                                NPWP</label>
                            <InputText v-model.trim="data.no_npwp" fluid />
                        </div>
                        <div v-if="!data.id" class="col-span-12 md:col-span-6"><label
                                class="font-bold block mb-2 text-gray-600">Password Akun (Opsional)</label>
                            <Password v-model="data.password" :feedback="false" toggleMask fluid
                                placeholder="Isi untuk membuat akun user" />
                        </div>
                    </div>
                </TabPanel>
            </TabView>
            <template #footer>
                <div class="flex justify-end gap-3 mt-4"><Button label="Batal" icon="pi pi-times" text severity="danger"
                        @click="hideDialog" /><Button label="Simpan Perubahan" icon="pi pi-check" severity="success"
                        @click="saveData" /></div>
            </template>
        </Dialog>

        <!-- DIALOG PENDIDIKAN -->
        <Dialog v-model:visible="pendidikanListDialog" :style="{ width: '70vw' }"
            :header="`Pendidikan: ${selectedPegawai.nama_lengkap}`" :modal="true" maximizable>
            <Toolbar class="mb-4"><template #start><Button label="Tambah" icon="pi pi-plus" severity="secondary"
                        @click="openNewPendidikan" /></template>
            </Toolbar>
            <DataTable :value="pendidikanList" :loading="isPendidikanLoading">
                <Column field="jenjang" header="Jenjang" sortable></Column>
                <Column field="institusi" header="Institusi" sortable></Column>
                <Column field="tahun_lulus" header="Lulus" sortable></Column>
                <Column header="Aksi">
                    <template #body="slotProps">
                        <div class="flex gap-2">
                            <Button icon="pi pi-paperclip" text rounded severity="info"
                                @click="openDokumenDialog(slotProps.data, 'riwayat-pendidikan', selectedPegawai.nama_lengkap)" />
                            <Button icon="pi pi-pencil" text rounded @click="editPendidikan(slotProps.data)" />
                            <Button icon="pi pi-trash" text rounded severity="danger"
                                @click="confirmDeletePendidikan(slotProps.data)" />
                        </div>
                    </template>
                </Column>
            </DataTable>
        </Dialog>

        <Dialog v-model:visible="pendidikanFormDialog" :style="{ width: '450px' }"
            :header="isPendidikanNew ? 'Tambah Riwayat' : 'Edit Riwayat'" :modal="true">
            <div class="flex flex-col gap-4 p-fluid">
                <div><label class="font-bold block mb-2 text-gray-600">Jenjang *</label>
                    <InputText v-model.trim="pendidikanData.jenjang" required
                        :invalid="pendidikanSubmitted && !pendidikanData.jenjang" fluid />
                </div>
                <div><label class="font-bold block mb-2 text-gray-600">Institusi *</label>
                    <InputText v-model.trim="pendidikanData.institusi" required
                        :invalid="pendidikanSubmitted && !pendidikanData.institusi" fluid />
                </div>
                <div><label class="font-bold block mb-2 text-gray-600">Jurusan</label>
                    <InputText v-model.trim="pendidikanData.jurusan" fluid />
                </div>
                <div><label class="font-bold block mb-2 text-gray-600">Tahun Lulus *</label>
                    <InputNumber v-model="pendidikanData.tahun_lulus" :useGrouping="false" required
                        :invalid="pendidikanSubmitted && !pendidikanData.tahun_lulus" fluid />
                </div>
            </div>
            <template #footer><Button label="Batal" icon="pi pi-times" text @click="hidePendidikanDialog" /><Button
                    label="Simpan" icon="pi pi-check" severity="success" @click="savePendidikan" /></template>
        </Dialog>

        <!-- DIALOG RIWAYAT SK -->
        <Dialog v-model:visible="riwayatSkListDialog" :style="{ width: '70vw' }"
            :header="`Riwayat SK: ${selectedPegawai.nama_lengkap}`" :modal="true" maximizable>
            <Toolbar class="mb-4"><template #start><Button label="Tambah SK" icon="pi pi-plus" severity="secondary"
                        @click="openNewRiwayatSk" /></template>
            </Toolbar>
            <DataTable :value="riwayatSkList" :loading="isRiwayatSkLoading">
                <Column field="nomor_sk" header="Nomor SK" sortable></Column>
                <Column field="tanggal_sk" header="Tanggal" sortable></Column>
                <Column field="jenis_sk" header="Jenis" sortable></Column>
                <Column header="Aksi">
                    <template #body="slotProps">
                        <div class="flex gap-2">
                            <Button icon="pi pi-paperclip" text rounded severity="info"
                                @click="openDokumenDialog(slotProps.data, 'riwayat-sk', selectedPegawai.nama_lengkap)" />
                            <Button icon="pi pi-pencil" text rounded @click="editRiwayatSk(slotProps.data)" />
                            <Button icon="pi pi-trash" text rounded severity="danger"
                                @click="confirmDeleteRiwayatSk(slotProps.data)" />
                        </div>
                    </template>
                </Column>
            </DataTable>
        </Dialog>

        <Dialog v-model:visible="riwayatSkFormDialog" :style="{ width: '450px' }"
            :header="isRiwayatSkNew ? 'Tambah SK' : 'Edit SK'" :modal="true">
            <div class="flex flex-col gap-4 p-fluid">
                <div><label class="font-bold block mb-2 text-gray-600">Nomor SK *</label>
                    <InputText v-model.trim="riwayatSkData.nomor_sk" required
                        :invalid="riwayatSkSubmitted && !riwayatSkData.nomor_sk" fluid />
                </div>
                <div><label class="font-bold block mb-2 text-gray-600">Tanggal SK *</label>
                    <Calendar v-model="riwayatSkData.tanggal_sk" dateFormat="yy-mm-dd" required
                        :invalid="riwayatSkSubmitted && !riwayatSkData.tanggal_sk" />
                </div>
                <div><label class="font-bold block mb-2 text-gray-600">Jenis SK *</label>
                    <InputText v-model.trim="riwayatSkData.jenis_sk" required
                        :invalid="riwayatSkSubmitted && !riwayatSkData.jenis_sk" fluid />
                </div>
            </div>
            <template #footer><Button label="Batal" icon="pi pi-times" text @click="hideRiwayatSkDialog" /><Button
                    label="Simpan" icon="pi pi-check" severity="success" @click="saveRiwayatSk" /></template>
        </Dialog>

        <!-- DIALOG SERTIFIKAT -->
        <Dialog v-model:visible="sertifikatListDialog" :style="{ width: '70vw' }"
            :header="`Sertifikat: ${selectedPegawai.nama_lengkap}`" :modal="true" maximizable>
            <Toolbar class="mb-4"><template #start><Button label="Tambah" icon="pi pi-plus" severity="secondary"
                        @click="openNewSertifikat" /></template>
            </Toolbar>
            <DataTable :value="sertifikatList" :loading="isSertifikatLoading">
                <Column field="judul_sertifikat" header="Judul"></Column>
                <Column field="jenis_sertifikat" header="Jenis"></Column>
                <Column field="tanggal_pelaksanaan" header="Tanggal"></Column>
                <Column header="Aksi">
                    <template #body="slotProps">
                        <div class="flex gap-2">
                            <Button icon="pi pi-paperclip" text rounded severity="info"
                                @click="openDokumenDialog(slotProps.data, 'riwayat-sertifikat', selectedPegawai.nama_lengkap)" />
                            <Button icon="pi pi-pencil" text rounded @click="editSertifikat(slotProps.data)" />
                            <Button icon="pi pi-trash" text rounded severity="danger"
                                @click="confirmDeleteSertifikat(slotProps.data)" />
                        </div>
                    </template>
                </Column>
            </DataTable>
        </Dialog>

        <Dialog v-model:visible="sertifikatFormDialog" :style="{ width: '450px' }"
            :header="isSertifikatNew ? 'Tambah Sertifikat' : 'Edit Sertifikat'" :modal="true">
            <div class="flex flex-col gap-4 p-fluid">
                <div><label class="font-bold block mb-2 text-gray-600">Jenis *</label>
                    <Dropdown v-model="sertifikatData.jenis_sertifikat" :options="kategoriSertifikatOptions"
                        placeholder="Pilih" required fluid />
                </div>
                <div><label class="font-bold block mb-2 text-gray-600">Judul *</label>
                    <InputText v-model.trim="sertifikatData.judul_sertifikat" required
                        :invalid="sertifikatSubmitted && !sertifikatData.judul_sertifikat" fluid />
                </div>
                <div><label class="font-bold block mb-2 text-gray-600">Tanggal *</label>
                    <Calendar v-model="sertifikatData.tanggal_pelaksanaan" dateFormat="yy-mm-dd" required
                        :invalid="sertifikatSubmitted && !sertifikatData.tanggal_pelaksanaan" />
                </div>
            </div>
            <template #footer><Button label="Batal" icon="pi pi-times" text @click="hideSertifikatDialog" /><Button
                    label="Simpan" icon="pi pi-check" severity="success" @click="saveSertifikat" /></template>
        </Dialog>

        <!-- DIALOG DOKUMEN -->
        <Dialog v-model:visible="dokumenListDialog" :style="{ width: '70vw' }"
            :header="`Dokumen: ${selectedPegawai.nama_lengkap}`" :modal="true" maximizable>
            <div class="grid grid-cols-12 gap-4 mb-4 p-fluid">
                <div class="col-span-12 md:col-span-4">
                    <Dropdown v-model="uploadKategori" :options="computedKategoriOptions" placeholder="Pilih Kategori"
                        fluid />
                </div>
                <div class="col-span-12 md:col-span-6">
                    <FileUpload ref="uploadRef" mode="basic" name="dokumen" @select="onFileSelect" :auto="false"
                        chooseLabel="Pilih File" accept="image/*,application/pdf" />
                </div>
                <div class="col-span-12 md:col-span-2"><Button label="Upload" icon="pi pi-upload"
                        @click="handleUploadDokumen" :loading="isDokumenLoading" severity="info" /></div>
            </div>
            <DataTable :value="dokumenList" :loading="isDokumenLoading">
                <Column field="nama_file_asli" header="Nama File"></Column>
                <Column field="kategori" header="Kategori"></Column>
                <Column header="Aksi">
                    <template #body="slotProps">
                        <div class="flex gap-2">
                            <Button icon="pi pi-eye" text rounded severity="info"
                                @click="viewDokumen(slotProps.data.path_file)" :loading="isBuktiLoading"
                                v-tooltip.top="'Lihat'" />
                            <Button icon="pi pi-trash" text rounded severity="danger"
                                @click="confirmDeleteDokumen(slotProps.data)" v-tooltip.top="'Hapus'" />
                        </div>
                    </template>
                </Column>
            </DataTable>
        </Dialog>

        <!-- DIALOG CUTI -->
        <Dialog v-model:visible="jatahDialog" :style="{ width: '450px' }"
            :header="`Atur Jatah Cuti: ${selectedPegawai.nama_lengkap}`" :modal="true">
            <div class="flex flex-col gap-4 p-fluid">
                <div><label class="font-bold block mb-2 text-gray-600">Tahun *</label>
                    <InputNumber v-model="jatahData.tahun" :useGrouping="false" required
                        :invalid="jatahSubmitted && !jatahData.tahun" fluid />
                </div>
                <div><label class="font-bold block mb-2 text-gray-600">Kuota Total (Hari) *</label>
                    <InputNumber v-model="jatahData.kuota_total" required
                        :invalid="jatahSubmitted && jatahData.kuota_total == null" fluid />
                </div>
            </div>
            <template #footer><Button label="Batal" icon="pi pi-times" text @click="jatahDialog = false" /><Button
                    label="Simpan" icon="pi pi-check" severity="success" @click="saveJatahCuti" /></template>
        </Dialog>

        <!-- DIALOG KARIR DOSEN -->
        <Dialog v-model:visible="karirDosenDialog" :style="{ width: '80vw' }"
            :header="`Karir Dosen: ${selectedPegawai.nama_lengkap}`" :modal="true" maximizable>
            <TabView>
                <TabPanel header="Jabatan Akademik (JAD)">
                    <Toolbar class="mb-4"><template #start><Button label="Tambah JAD" icon="pi pi-plus"
                                severity="secondary" @click="openNewJad" /></template>
                    </Toolbar>
                    <DataTable :value="jadList" :loading="isKarirDosenLoading">
                        <Column field="jabatan_akademik" header="Jabatan" sortable></Column>
                        <Column field="pangkat_golongan" header="Pangkat/Gol" sortable></Column>
                        <Column field="nomor_sk" header="Nomor SK"></Column>
                        <Column field="tmt" header="TMT" sortable></Column>
                        <Column header="Aksi">
                            <template #body="slotProps">
                                <div class="flex gap-2">
                                    <Button icon="pi pi-paperclip" text rounded severity="info"
                                        @click="openDokumenDialog(slotProps.data, 'riwayat-jad', selectedPegawai.nama_lengkap)" />
                                    <Button icon="pi pi-pencil" text rounded @click="editJad(slotProps.data)" />
                                    <Button icon="pi pi-trash" text rounded severity="danger"
                                        @click="confirmDeleteJad(slotProps.data)" />
                                </div>
                            </template>
                        </Column>
                    </DataTable>
                </TabPanel>
                <TabPanel header="SERDOS">
                    <Toolbar class="mb-4"><template #start><Button label="Tambah SERDOS" icon="pi pi-plus"
                                severity="secondary" @click="openNewSerdos" /></template>
                    </Toolbar>
                    <DataTable :value="serdosList" :loading="isKarirDosenLoading">
                        <Column field="nomor_sertifikat" header="Nomor Sertifikat" sortable></Column>
                        <Column field="tanggal_terbit" header="Tanggal" sortable></Column>
                        <Column header="Aksi">
                            <template #body="slotProps">
                                <div class="flex gap-2">
                                    <Button icon="pi pi-paperclip" text rounded severity="info"
                                        @click="openDokumenDialog(slotProps.data, 'riwayat-serdos', selectedPegawai.nama_lengkap)" />
                                    <Button icon="pi pi-pencil" text rounded @click="editSerdos(slotProps.data)" />
                                    <Button icon="pi pi-trash" text rounded severity="danger"
                                        @click="confirmDeleteSerdos(slotProps.data)" />
                                </div>
                            </template>
                        </Column>
                    </DataTable>
                </TabPanel>
            </TabView>
        </Dialog>

        <Dialog v-model:visible="jadFormDialog" :style="{ width: '450px' }"
            :header="isJadNew ? 'Tambah JAD' : 'Edit JAD'" :modal="true">
            <div class="flex flex-col gap-4 p-fluid">
                <div><label class="font-bold block mb-2 text-gray-600">Jabatan *</label>
                    <Dropdown v-model="jadData.jabatan_akademik" :options="jabatanAkademikOptions" placeholder="Pilih"
                        required fluid />
                </div>
                <div><label class="font-bold block mb-2 text-gray-600">Golongan *</label>
                    <Dropdown v-model="jadData.pangkat_golongan" :options="pangkatGolonganOptions" placeholder="Pilih"
                        required fluid />
                </div>
                <div><label class="font-bold block mb-2 text-gray-600">Nomor SK *</label>
                    <InputText v-model.trim="jadData.nomor_sk" required :invalid="jadSubmitted && !jadData.nomor_sk"
                        fluid />
                </div>
                <div><label class="font-bold block mb-2 text-gray-600">TMT *</label>
                    <Calendar v-model="jadData.tmt" dateFormat="yy-mm-dd" required
                        :invalid="jadSubmitted && !jadData.tmt" />
                </div>
            </div>
            <template #footer><Button label="Batal" icon="pi pi-times" text @click="jadFormDialog = false" /><Button
                    label="Simpan" icon="pi pi-check" severity="success" @click="saveJad" /></template>
        </Dialog>

        <!-- KONFIRMASI HAPUS UMUM -->
        <Dialog v-model:visible="deleteDialog" :style="{ width: '450px' }" header="Konfirmasi" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle text-3xl text-red-500" />
                <span v-if="data">Yakin ingin menghapus <b>{{ data.nama_lengkap }}</b>?</span>
            </div>
            <template #footer>
                <Button label="Tidak" icon="pi pi-times" text @click="deleteDialog = false" />
                <Button label="Ya, Hapus" icon="pi pi-check" severity="danger" @click="deleteData" />
            </template>
        </Dialog>

        <ConfirmDialog />
    </div>
</template>

<style scoped>
:deep(.p-dialog-footer) {
    padding: 0 1.5rem 1.5rem 1.5rem;
}

:deep(.p-tabview-panels) {
    padding: 1rem 0;
}
</style>