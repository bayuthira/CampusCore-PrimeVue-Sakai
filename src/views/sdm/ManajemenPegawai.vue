<script setup>
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
const dt = ref();
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});
const createUserDialog = ref(false);
const userCreationData = ref({});
const selectedPegawai = ref({});

const pendidikanListDialog = ref(false);
const pendidikanFormDialog = ref(false);
const deletePendidikanDialog = ref(false);
const pendidikanData = ref({});
const pendidikanSubmitted = ref(false);
const isPendidikanNew = computed(() => !pendidikanData.value.id);

const riwayatSkListDialog = ref(false);
const riwayatSkFormDialog = ref(false);
const deleteRiwayatSkDialog = ref(false);
const riwayatSkData = ref({});
const riwayatSkSubmitted = ref(false);
const isRiwayatSkNew = computed(() => !riwayatSkData.value.id);

const dokumenListDialog = ref(false);
const selectedRecord = ref(null);
const selectedRecordType = ref('');
const fileToUpload = ref(null);
const isBuktiLoading = ref(false);
const uploadRef = ref(null);
const uploadKategori = ref(null);

const jatahDialog = ref(false);
const jatahData = ref({});
const jatahSubmitted = ref(false);
const viewJatahDialog = ref(false);
const viewJatahData = ref(null);
const { isLoading: isCutiLoading } = storeToRefs(cutiStore);

const sertifikatListDialog = ref(false);
const sertifikatFormDialog = ref(false);
const deleteSertifikatDialog = ref(false);
const sertifikatData = ref({});
const sertifikatSubmitted = ref(false);
const isSertifikatNew = computed(() => !sertifikatData.value.id);

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

const penempatanListDialog = ref(false);
const penempatanFormDialog = ref(false);
const deletePenempatanDialog = ref(false);
const penempatanData = ref({});
const penempatanSubmitted = ref(false);
const isPenempatanNew = computed(() => !penempatanData.value.id);

// Opsi dropdown
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

// --- CRUD Functions ---
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
    if (!data.value.nik?.trim() || !data.value.nama_lengkap?.trim()) {
        toast.add({ severity: 'warn', summary: 'Perhatian', detail: 'NIK dan Nama Lengkap wajib diisi.', life: 3000 });
        return;
    }
    try {
        const payload = {
            ...data.value,
            tanggal_lahir: formatDate(data.value.tanggal_lahir),
            tanggal_masuk: formatDate(data.value.tanggal_masuk),
            tanggal_pensiun: formatDate(data.value.tanggal_pensiun)
        };
        if (data.value.id) {
            await store.update(data.value.id, payload);
            toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Data Pegawai Diperbarui', life: 3000 });
        } else {
            await store.create(payload);
            toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Pegawai Baru Dibuat', life: 3000 });
        }
        dialog.value = false;
        data.value = {};
    } catch (error) {
        const errorMessage = error.response?.data?.error || 'Terjadi kesalahan saat menyimpan';
        toast.add({ severity: 'error', summary: 'Gagal', detail: errorMessage, life: 4000 });
    }
}

function editData(editRow) {
    data.value = {
        ...editRow,
        tanggal_lahir: editRow.tanggal_lahir ? new Date(editRow.tanggal_lahir) : null,
        tanggal_masuk: editRow.tanggal_masuk ? new Date(editRow.tanggal_masuk) : null,
        tanggal_pensiun: editRow.tanggal_pensiun ? new Date(editRow.tanggal_pensiun) : null
    };
    dialog.value = true;
}

function confirmDelete(deleteRow) {
    data.value = deleteRow;
    deleteDialog.value = true;
}

async function deleteData() {
    try {
        await store.delete(data.value.id);
        deleteDialog.value = false;
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Data Pegawai Dihapus', life: 3000 });
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal menghapus data', life: 3000 });
    }
}

// --- Menu Handlers ---
function openCreateUserDialog(pegawai) {
    selectedPegawai.value = pegawai;
    userCreationData.value = { password: '' };
    submitted.value = false;
    createUserDialog.value = true;
}

async function saveUserAccount() {
    submitted.value = true;
    if (!userCreationData.value.password) return;
    try {
        await store.createUserAccount(selectedPegawai.value.id, userCreationData.value);
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Akun user telah dibuat.', life: 3000 });
        createUserDialog.value = false;
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal membuat akun user.', life: 4000 });
    }
}

async function openPendidikanList(pegawai) {
    selectedPegawai.value = pegawai;
    try {
        await pendidikanStore.fetchByPegawai(pegawai.id);
        pendidikanListDialog.value = true;
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal memuat pendidikan.', life: 3000 });
    }
}

function openNewPendidikan() {
    pendidikanData.value = {};
    pendidikanSubmitted.value = false;
    pendidikanFormDialog.value = true;
}

function editPendidikan(row) {
    pendidikanData.value = { ...row };
    pendidikanSubmitted.value = false;
    pendidikanFormDialog.value = true;
}

function hidePendidikanDialog() {
    pendidikanFormDialog.value = false;
    pendidikanSubmitted.value = false;
}

async function savePendidikan() {
    pendidikanSubmitted.value = true;
    if (!pendidikanData.value.jenjang || !pendidikanData.value.institusi || !pendidikanData.value.tahun_lulus) return;
    try {
        if (isPendidikanNew.value) await pendidikanStore.create(selectedPegawai.value.id, pendidikanData.value);
        else await pendidikanStore.update(pendidikanData.value.id, pendidikanData.value);
        await pendidikanStore.fetchByPegawai(selectedPegawai.value.id);
        pendidikanFormDialog.value = false;
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal menyimpan riwayat pendidikan', life: 3000 });
    }
}

function confirmDeletePendidikan(row) {
    pendidikanData.value = row;
    deletePendidikanDialog.value = true;
}

async function deletePendidikan() {
    try {
        await pendidikanStore.delete(pendidikanData.value.id);
        await pendidikanStore.fetchByPegawai(selectedPegawai.value.id);
        deletePendidikanDialog.value = false;
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal menghapus riwayat pendidikan', life: 3000 });
    }
}

async function openRiwayatSkList(pegawai) {
    selectedPegawai.value = pegawai;
    try {
        await riwayatSkStore.fetchByPegawai(pegawai.id);
        riwayatSkListDialog.value = true;
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal memuat riwayat SK.', life: 3000 });
    }
}

function openNewRiwayatSk() {
    riwayatSkData.value = { tanggal_sk: new Date() };
    riwayatSkSubmitted.value = false;
    riwayatSkFormDialog.value = true;
}

function editRiwayatSk(row) {
    riwayatSkData.value = { ...row, tanggal_sk: new Date(row.tanggal_sk) };
    riwayatSkSubmitted.value = false;
    riwayatSkFormDialog.value = true;
}

function hideRiwayatSkDialog() {
    riwayatSkFormDialog.value = false;
    riwayatSkSubmitted.value = false;
}

async function saveRiwayatSk() {
    riwayatSkSubmitted.value = true;
    if (!riwayatSkData.value.nomor_sk || !riwayatSkData.value.tanggal_sk) return;
    try {
        const payload = { ...riwayatSkData.value, tanggal_sk: formatDate(riwayatSkData.value.tanggal_sk) };
        if (isRiwayatSkNew.value) await riwayatSkStore.create(selectedPegawai.value.id, payload);
        else await riwayatSkStore.update(riwayatSkData.value.id, payload);
        await riwayatSkStore.fetchByPegawai(selectedPegawai.value.id);
        riwayatSkFormDialog.value = false;
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal menyimpan riwayat SK', life: 3000 });
    }
}

function confirmDeleteRiwayatSk(row) {
    riwayatSkData.value = row;
    deleteRiwayatSkDialog.value = true;
}

async function deleteRiwayatSk() {
    try {
        await riwayatSkStore.delete(riwayatSkData.value.id);
        await riwayatSkStore.fetchByPegawai(selectedPegawai.value.id);
        deleteRiwayatSkDialog.value = false;
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal menghapus riwayat SK', life: 3000 });
    }
}

async function openDokumenDialog(record, type, pegawaiNama) {
    selectedRecord.value = record;
    selectedRecordType.value = type;
    selectedPegawai.value.nama_lengkap = pegawaiNama;
    try {
        await dokumenStore.fetchList(type, record.id);
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
        toast.add({ severity: 'warn', summary: 'Peringatan', detail: 'Pilih file dan kategori terlebih dahulu', life: 3000 });
        return;
    }
    const formData = new FormData();
    formData.append('file', fileToUpload.value);
    formData.append('kategori', uploadKategori.value);
    try {
        await dokumenStore.upload(selectedRecordType.value, selectedRecord.value.id, formData);
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Dokumen berhasil diupload', life: 3000 });
        fileToUpload.value = null;
        if (uploadRef.value) uploadRef.value.clear();
        await dokumenStore.fetchList(selectedRecordType.value, selectedRecord.value.id);
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal upload dokumen', life: 3000 });
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
        message: `Hapus file ${dokumen.nama_file_asli}?`,
        header: 'Konfirmasi Hapus',
        icon: 'pi pi-exclamation-triangle',
        acceptClass: 'p-button-danger',
        accept: async () => {
            try {
                await dokumenStore.delete(dokumen.id);
                await dokumenStore.fetchList(selectedRecordType.value, selectedRecord.value.id);
                toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Dokumen dihapus', life: 3000 });
            } catch (error) {
                toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal menghapus dokumen', life: 3000 });
            }
        }
    });
}

function openJatahDialog(pegawai) {
    selectedPegawai.value = pegawai;
    jatahData.value = { pegawai_id: pegawai.id, tahun: new Date().getFullYear(), kuota_total: 12 };
    jatahSubmitted.value = false;
    jatahDialog.value = true;
}

async function saveJatahCuti() {
    jatahSubmitted.value = true;
    if (!jatahData.value.tahun || jatahData.value.kuota_total == null) return;
    try {
        await cutiStore.setJatahCuti(jatahData.value);
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Jatah cuti disimpan.', life: 3000 });
        jatahDialog.value = false;
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal menyimpan jatah cuti', life: 4000 });
    }
}

async function openViewJatahDialog(pegawai) {
    selectedPegawai.value = pegawai;
    viewJatahData.value = null;
    viewJatahDialog.value = true;
    try {
        const currentYear = new Date().getFullYear();
        const dataArr = await cutiStore.fetchJatahCutiByPegawai(pegawai.id, currentYear);
        if (dataArr && dataArr.length > 0) {
            const jatah = dataArr[0];
            viewJatahData.value = { ...jatah, sisa_cuti: jatah.kuota_total - jatah.kuota_terpakai };
        } else {
            viewJatahData.value = { error: `Data tahun ${currentYear} tidak ditemukan.` };
        }
    } catch (e) {
        viewJatahData.value = { error: 'Gagal memuat data.' };
    }
}

async function openSertifikatList(pegawai) {
    selectedPegawai.value = pegawai;
    try {
        await sertifikatStore.fetchByPegawai(pegawai.id);
        sertifikatListDialog.value = true;
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal memuat riwayat sertifikat.', life: 3000 });
    }
}

function openNewSertifikat() {
    sertifikatData.value = { tanggal_pelaksanaan: new Date() };
    sertifikatSubmitted.value = false;
    sertifikatFormDialog.value = true;
}

function editSertifikat(row) {
    sertifikatData.value = { ...row, tanggal_pelaksanaan: new Date(row.tanggal_pelaksanaan) };
    sertifikatSubmitted.value = false;
    sertifikatFormDialog.value = true;
}

function hideSertifikatDialog() {
    sertifikatFormDialog.value = false;
    sertifikatSubmitted.value = false;
}

async function saveSertifikat() {
    sertifikatSubmitted.value = true;
    if (!sertifikatData.value.jenis_sertifikat || !sertifikatData.value.judul_sertifikat || !sertifikatData.value.tanggal_pelaksanaan) return;
    try {
        const payload = { ...sertifikatData.value, tanggal_pelaksanaan: formatDate(sertifikatData.value.tanggal_pelaksanaan) };
        if (isSertifikatNew.value) await sertifikatStore.create(selectedPegawai.value.id, payload);
        else await sertifikatStore.update(sertifikatData.value.id, payload);
        await sertifikatStore.fetchByPegawai(selectedPegawai.value.id);
        sertifikatFormDialog.value = false;
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal menyimpan sertifikat', life: 3000 });
    }
}

function confirmDeleteSertifikat(row) {
    sertifikatData.value = row;
    deleteSertifikatDialog.value = true;
}

async function deleteSertifikat() {
    try {
        await sertifikatStore.delete(sertifikatData.value.id);
        await sertifikatStore.fetchByPegawai(selectedPegawai.value.id);
        deleteSertifikatDialog.value = false;
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal menghapus data', life: 3000 });
    }
}

async function openKarirDosenDialog(pegawai) {
    selectedPegawai.value = pegawai;
    try {
        await Promise.all([karirDosenStore.fetchJad(pegawai.id), karirDosenStore.fetchSerdos(pegawai.id)]);
        karirDosenDialog.value = true;
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal memuat data karir dosen.', life: 3000 });
    }
}

function openNewJad() {
    jadData.value = { tmt: new Date() };
    jadSubmitted.value = false;
    jadFormDialog.value = true;
}

function editJad(row) {
    jadData.value = { ...row, tmt: new Date(row.tmt) };
    jadSubmitted.value = false;
    jadFormDialog.value = true;
}

async function saveJad() {
    jadSubmitted.value = true;
    if (!jadData.value.jabatan_akademik || !jadData.value.pangkat_golongan || !jadData.value.nomor_sk || !jadData.value.tmt) return;
    try {
        const payload = { ...jadData.value, tmt: formatDate(jadData.value.tmt) };
        if (isJadNew.value) await karirDosenStore.createJad(selectedPegawai.value.id, payload);
        else await karirDosenStore.updateJad(jadData.value.id, payload);
        await karirDosenStore.fetchJad(selectedPegawai.value.id);
        jadFormDialog.value = false;
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal menyimpan JAD', life: 3000 });
    }
}

function confirmDeleteJad(row) {
    jadData.value = row;
    deleteJadDialog.value = true;
}

async function deleteJad() {
    try {
        await karirDosenStore.deleteJad(jadData.value.id);
        await karirDosenStore.fetchJad(selectedPegawai.value.id);
        deleteJadDialog.value = false;
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal menghapus data', life: 3000 });
    }
}

function openNewSerdos() {
    serdosData.value = { tanggal_terbit: new Date() };
    serdosSubmitted.value = false;
    serdosFormDialog.value = true;
}

function editSerdos(row) {
    serdosData.value = { ...row, tanggal_terbit: new Date(row.tanggal_terbit) };
    serdosSubmitted.value = false;
    serdosFormDialog.value = true;
}

async function saveSerdos() {
    serdosSubmitted.value = true;
    if (!serdosData.value.nomor_sertifikat || !serdosData.value.tanggal_terbit) return;
    try {
        const payload = { ...serdosData.value, tanggal_terbit: formatDate(serdosData.value.tanggal_terbit) };
        if (isSerdosNew.value) await karirDosenStore.createSerdos(selectedPegawai.value.id, payload);
        else await karirDosenStore.updateSerdos(serdosData.value.id, payload);
        await karirDosenStore.fetchSerdos(selectedPegawai.value.id);
        serdosFormDialog.value = false;
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal menyimpan SERDOS', life: 3000 });
    }
}

function confirmDeleteSerdos(row) {
    serdosData.value = row;
    deleteSerdosDialog.value = true;
}

async function deleteSerdos() {
    try {
        await karirDosenStore.deleteSerdos(serdosData.value.id);
        await karirDosenStore.fetchSerdos(selectedPegawai.value.id);
        deleteSerdosDialog.value = false;
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal menghapus data', life: 3000 });
    }
}

async function openPenempatanList(pegawai) {
    selectedPegawai.value = pegawai;
    try {
        await penempatanStore.fetchByPegawai(pegawai.id);
        penempatanListDialog.value = true;
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal memuat penempatan.', life: 3000 });
    }
}

function openNewPenempatan() {
    penempatanData.value = { tanggal_mulai: new Date() };
    penempatanSubmitted.value = false;
    penempatanFormDialog.value = true;
}

function editPenempatan(row) {
    penempatanData.value = { ...row, tanggal_mulai: new Date(row.tanggal_mulai) };
    penempatanSubmitted.value = false;
    penempatanFormDialog.value = true;
}

function hidePenempatanDialog() {
    penempatanFormDialog.value = false;
    penempatanSubmitted.value = false;
}

async function savePenempatan() {
    penempatanSubmitted.value = true;
    if (!penempatanData.value.unit_kerja_id || !penempatanData.value.jabatan || !penempatanData.value.nomor_sk || !penempatanData.value.tanggal_mulai) return;
    try {
        const payload = { ...penempatanData.value, tanggal_mulai: formatDate(penempatanData.value.tanggal_mulai) };
        if (isPenempatanNew.value) await penempatanStore.create(selectedPegawai.value.id, payload);
        else await penempatanStore.update(penempatanData.value.id, payload);
        await penempatanStore.fetchByPegawai(selectedPegawai.value.id);
        penempatanFormDialog.value = false;
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal menyimpan penempatan', life: 3000 });
    }
}

function confirmDeletePenempatan(row) {
    penempatanData.value = row;
    deletePenempatanDialog.value = true;
}

async function deletePenempatan() {
    try {
        await penempatanStore.delete(penempatanData.value.id);
        await penempatanStore.fetchByPegawai(selectedPegawai.value.id);
        deletePenempatanDialog.value = false;
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal menghapus penempatan', life: 3000 });
    }
}
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

        <!-- Dialog Detail Pegawai (Neo Feeder Standard) -->
        <Dialog v-model:visible="dialog" :style="{ width: '80vw' }" header="Detail Pegawai" :modal="true"
            class="p-fluid">
            <TabView>
                <TabPanel header="Identitas Dasar">
                    <div class="grid grid-cols-12 gap-4 mt-2">
                        <div class="col-span-12 md:col-span-4">
                            <label class="font-bold block mb-2 text-gray-600">NIK *</label>
                            <InputText v-model.trim="data.nik" required :invalid="submitted && !data.nik" fluid />
                        </div>
                        <div class="col-span-12 md:col-span-4">
                            <label class="font-bold block mb-2 text-gray-600">NUPTK (Opsional)</label>
                            <InputText v-model.trim="data.nuptk" placeholder="16 Digit NUPTK" fluid />
                        </div>
                        <div class="col-span-12 md:col-span-4">
                            <label class="font-bold block mb-2 text-gray-600">Kewarganegaraan</label>
                            <Dropdown v-model="data.kewarganegaraan" :options="kewarganegaraanOptions"
                                optionLabel="label" optionValue="value" fluid />
                        </div>
                        <div class="col-span-12 md:col-span-12">
                            <label class="font-bold block mb-2 text-gray-600">Nama Lengkap *</label>
                            <InputText v-model.trim="data.nama_lengkap" required
                                :invalid="submitted && !data.nama_lengkap" fluid />
                        </div>
                        <div class="col-span-12 md:col-span-4">
                            <label class="font-bold block mb-2 text-gray-600">Gelar Depan</label>
                            <InputText v-model.trim="data.gelar_depan" fluid />
                        </div>
                        <div class="col-span-12 md:col-span-4">
                            <label class="font-bold block mb-2 text-gray-600">Gelar Belakang</label>
                            <InputText v-model.trim="data.gelar_belakang" fluid />
                        </div>
                        <div class="col-span-12 md:col-span-4">
                            <label class="font-bold block mb-2 text-gray-600">Jenis Kelamin</label>
                            <Dropdown v-model="data.jenis_kelamin" :options="jenisKelaminOptions" optionLabel="label"
                                optionValue="value" placeholder="Pilih" fluid />
                        </div>
                        <div class="col-span-12 md:col-span-6">
                            <label class="font-bold block mb-2 text-gray-600">Tempat Lahir</label>
                            <InputText v-model.trim="data.tempat_lahir" fluid />
                        </div>
                        <div class="col-span-12 md:col-span-6">
                            <label class="font-bold block mb-2 text-gray-600">Tanggal Lahir</label>
                            <Calendar v-model="data.tanggal_lahir" dateFormat="yy-mm-dd" />
                        </div>
                        <div class="col-span-12 md:col-span-12">
                            <label class="font-bold block mb-2 text-gray-600">Nama Ibu Kandung *</label>
                            <InputText v-model.trim="data.nama_ibu_kandung" placeholder="Sesuai Akte" fluid />
                        </div>
                    </div>
                </TabPanel>

                <TabPanel header="Alamat & Kontak">
                    <div class="grid grid-cols-12 gap-4 mt-2">
                        <div class="col-span-12">
                            <label class="font-bold block mb-2 text-gray-600">Alamat Lengkap</label>
                            <Textarea v-model.trim="data.alamat_domisili" rows="2" fluid />
                        </div>
                        <div class="col-span-12 md:col-span-4">
                            <label class="font-bold block mb-2 text-gray-600">Dusun</label>
                            <InputText v-model.trim="data.dusun" fluid />
                        </div>
                        <!-- PERBAIKAN: Spans disesuaikan dari 3 menjadi 4 agar tidak overlap -->
                        <div class="col-span-12 md:col-span-4">
                            <label class="font-bold block mb-2 text-gray-600">RT / RW</label>
                            <div class="flex gap-2">
                                <InputText v-model.trim="data.rt" placeholder="RT" fluid class="flex-1" />
                                <InputText v-model.trim="data.rw" placeholder="RW" fluid class="flex-1" />
                            </div>
                        </div>
                        <!-- PERBAIKAN: Spans disesuaikan dari 5 menjadi 4 agar proporsional -->
                        <div class="col-span-12 md:col-span-4">
                            <label class="font-bold block mb-2 text-gray-600">Kelurahan</label>
                            <InputText v-model.trim="data.kelurahan" fluid />
                        </div>
                        <div class="col-span-12 md:col-span-6">
                            <label class="font-bold block mb-2 text-gray-600">ID Wilayah (Neo Feeder)</label>
                            <InputText v-model.trim="data.id_wilayah_feeder" placeholder="UUID Wilayah" fluid />
                        </div>
                        <div class="col-span-12 md:col-span-3">
                            <label class="font-bold block mb-2 text-gray-600">No. HP</label>
                            <InputText v-model.trim="data.nomor_hp" fluid />
                        </div>
                        <div class="col-span-12 md:col-span-3">
                            <label class="font-bold block mb-2 text-gray-600">Email Utama</label>
                            <InputText v-model.trim="data.email" fluid />
                        </div>
                    </div>
                </TabPanel>

                <TabPanel header="Kepegawaian">
                    <div class="grid grid-cols-12 gap-4 mt-2">
                        <div class="col-span-12 md:col-span-6">
                            <label class="font-bold block mb-2 text-gray-600">Kategori Pegawai</label>
                            <Dropdown v-model="data.kategori_pegawai" :options="kategoriPegawaiOptions"
                                placeholder="Pilih Kategori" fluid />
                        </div>
                        <div class="col-span-12 md:col-span-6">
                            <label class="font-bold block mb-2 text-gray-600">Status Pegawai</label>
                            <Dropdown v-model="data.status_pegawai" :options="statusPegawaiOptions"
                                placeholder="Pilih Status" fluid />
                        </div>

                        <template v-if="data.kategori_pegawai === 'Tenaga Pendidik'">
                            <div class="col-span-12 font-bold text-success border-b py-2 mb-2 text-sm mt-2">Atribut
                                Dosen (Neo Feeder)</div>
                            <div class="col-span-12 md:col-span-6 text-sm">
                                <label class="font-bold block mb-2 text-gray-600">NIDN / NIDK *</label>
                                <InputText v-model.trim="data.nidn" fluid />
                            </div>
                            <div class="col-span-12 md:col-span-6">
                                <label class="font-bold block mb-2 text-gray-600">Homebase Prodi *</label>
                                <Dropdown v-model="data.prodi_id" :options="prodiList" optionLabel="nama_prodi"
                                    optionValue="id" placeholder="Pilih Prodi" fluid filter />
                            </div>
                            <div class="col-span-12 md:col-span-6">
                                <label class="font-bold block mb-2 text-gray-600">Ikatan Kerja</label>
                                <Dropdown v-model="data.ikatan_kerja" :options="ikatanKerjaOptions" optionLabel="label"
                                    optionValue="value" fluid />
                            </div>
                            <div class="col-span-12 md:col-span-6">
                                <label class="font-bold block mb-2 text-gray-600">ID Penugasan (Feeder)</label>
                                <InputText v-model.trim="data.id_penugasan_feeder" placeholder="UUID Penugasan" fluid />
                            </div>
                        </template>

                        <div class="col-span-12 md:col-span-6">
                            <label class="font-bold block mb-2 text-gray-600">Tanggal Masuk</label>
                            <Calendar v-model="data.tanggal_masuk" dateFormat="yy-mm-dd" />
                        </div>
                        <div class="col-span-12 md:col-span-6">
                            <label class="font-bold block mb-2 text-gray-600">Tanggal Pensiun</label>
                            <Calendar v-model="data.tanggal_pensiun" dateFormat="yy-mm-dd" />
                        </div>
                        <div class="col-span-12 md:col-span-6">
                            <label class="font-bold block mb-2 text-gray-600">ID SDM Feeder</label>
                            <InputText v-model.trim="data.id_sdm_feeder" placeholder="UUID SDM dari Neo Feeder" fluid />
                        </div>
                        <div class="col-span-12 flex items-center">
                            <ToggleSwitch v-model="data.is_active" id="active_status" />
                            <label for="active_status" class="ml-2 font-bold text-gray-700">Pegawai Aktif</label>
                        </div>
                    </div>
                </TabPanel>

                <TabPanel header="Data Lain">
                    <div class="grid grid-cols-12 gap-4 mt-2">
                        <div class="col-span-12 md:col-span-6">
                            <label class="font-bold block mb-2 text-gray-600">No. KTP</label>
                            <InputText v-model.trim="data.no_ktp" fluid />
                        </div>
                        <div class="col-span-12 md:col-span-6">
                            <label class="font-bold block mb-2 text-gray-600">No. KK</label>
                            <InputText v-model.trim="data.no_kk" fluid />
                        </div>
                        <div class="col-span-12 md:col-span-6">
                            <label class="font-bold block mb-2 text-gray-600">No. NPWP</label>
                            <InputText v-model.trim="data.no_npwp" fluid />
                        </div>
                        <div v-if="!data.id" class="col-span-12 md:col-span-6">
                            <label class="font-bold block mb-2 text-gray-600">Password Akun (Opsional)</label>
                            <Password v-model="data.password" :feedback="false" toggleMask fluid
                                placeholder="Isi untuk membuat akun user" />
                        </div>
                    </div>
                </TabPanel>
            </TabView>

            <template #footer>
                <div class="flex justify-end gap-3 mt-4">
                    <Button label="Batal" icon="pi pi-times" text severity="danger" @click="hideDialog" />
                    <Button label="Simpan Perubahan" icon="pi pi-check" severity="success" @click="saveData" />
                </div>
            </template>
        </Dialog>

        <!-- Dialog-Dialog Fitur Lainnya (Tetap Ada) -->
        <Dialog v-model:visible="createUserDialog" :style="{ width: '450px' }"
            :header="`Buat Akun: ${selectedPegawai.nama_lengkap}`" :modal="true">
            <div class="field">
                <label class="block font-bold mb-3 text-gray-600">Password Awal</label>
                <Password v-model="userCreationData.password" required autofocus :feedback="false" toggleMask fluid />
                <small v-if="submitted && !userCreationData.password" class="p-error">Password wajib diisi.</small>
            </div>
            <template #footer>
                <Button label="Batal" icon="pi pi-times" text @click="createUserDialog = false" />
                <Button label="Buat Akun" icon="pi pi-check" severity="success" @click="saveUserAccount" />
            </template>
        </Dialog>

        <Dialog v-model:visible="pendidikanListDialog" :style="{ width: '70vw' }"
            :header="`Pendidikan: ${selectedPegawai.nama_lengkap}`" :modal="true" maximizable>
            <Toolbar class="mb-4">
                <template #start><Button label="Tambah" icon="pi pi-plus" severity="secondary"
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
            <template #footer>
                <Button label="Batal" icon="pi pi-times" text @click="hidePendidikanDialog" />
                <Button label="Simpan" icon="pi pi-check" severity="success" @click="savePendidikan" />
            </template>
        </Dialog>

        <Dialog v-model:visible="deletePendidikanDialog" :style="{ width: '450px' }" header="Konfirmasi" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle text-3xl text-red-500" />
                <span v-if="pendidikanData">Hapus riwayat pendidikan di <b>{{ pendidikanData.institusi }}</b>?</span>
            </div>
            <template #footer>
                <Button label="Tidak" text @click="deletePendidikanDialog = false" />
                <Button label="Ya, Hapus" icon="pi pi-check" severity="danger" @click="deletePendidikan" />
            </template>
        </Dialog>

        <Dialog v-model:visible="riwayatSkListDialog" :style="{ width: '70vw' }"
            :header="`Riwayat SK: ${selectedPegawai.nama_lengkap}`" :modal="true" maximizable>
            <Toolbar class="mb-4">
                <template #start><Button label="Tambah SK" icon="pi pi-plus" severity="secondary"
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
                <div><label class="font-bold block mb-2 text-gray-600">Jabatan</label>
                    <InputText v-model.trim="riwayatSkData.jabatan" fluid />
                </div>
                <div><label class="font-bold block mb-2 text-gray-600">Keterangan</label><Textarea
                        v-model.trim="riwayatSkData.keterangan" rows="3" fluid /></div>
            </div>
            <template #footer>
                <Button label="Batal" icon="pi pi-times" text @click="hideRiwayatSkDialog" />
                <Button label="Simpan" icon="pi pi-check" severity="success" @click="saveRiwayatSk" />
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteRiwayatSkDialog" :style="{ width: '450px' }" header="Konfirmasi" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle text-3xl text-red-500" />
                <span v-if="riwayatSkData">Hapus SK Nomor <b>{{ riwayatSkData.nomor_sk }}</b>?</span>
            </div>
            <template #footer>
                <Button label="Tidak" text @click="deleteRiwayatSkDialog = false" />
                <Button label="Ya, Hapus" icon="pi pi-check" severity="danger" @click="deleteRiwayatSk" />
            </template>
        </Dialog>

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
                <Column header="Aksi" style="width: 120px">
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
            <template #footer>
                <Button label="Batal" icon="pi pi-times" text @click="jatahDialog = false" />
                <Button label="Simpan" icon="pi pi-check" severity="success" @click="saveJatahCuti" />
            </template>
        </Dialog>

        <Dialog v-model:visible="viewJatahDialog" :style="{ width: '450px' }" header="Informasi Jatah Cuti"
            :modal="true">
            <div v-if="isCutiLoading" class="text-center p-4">
                <ProgressSpinner style="width:40px; height:40px" />
            </div>
            <div v-else-if="viewJatahData && !viewJatahData.error" class="flex flex-col gap-4">
                <div class="text-center font-bold text-xl mb-2 text-gray-700">Tahun {{ viewJatahData.tahun }}</div>
                <div class="bg-gray-50 p-3 rounded border flex justify-between"><span>Kuota Total:</span> <span
                        class="font-bold text-blue-600">{{ viewJatahData.kuota_total }} Hari</span></div>
                <div class="bg-gray-50 p-3 rounded border flex justify-between"><span>Terpakai:</span> <span
                        class="font-bold text-red-500">{{ viewJatahData.kuota_terpakai }} Hari</span></div>
                <div class="bg-gray-50 p-3 rounded border flex justify-between text-lg"><span>Sisa Cuti:</span> <span
                        class="font-bold text-green-600">{{ viewJatahData.sisa_cuti }} Hari</span></div>
            </div>
            <div v-else class="p-4 text-center text-gray-500">
                <p>{{ viewJatahData?.error || 'Gagal memuat data.' }}</p>
            </div>
            <template #footer><Button label="Tutup" icon="pi pi-times" text
                    @click="viewJatahDialog = false" /></template>
        </Dialog>

        <Dialog v-model:visible="sertifikatListDialog" :style="{ width: '70vw' }"
            :header="`Sertifikat: ${selectedPegawai.nama_lengkap}`" :modal="true" maximizable>
            <Toolbar class="mb-4">
                <template #start><Button label="Tambah" icon="pi pi-plus" severity="secondary"
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
                <div><label class="font-bold block mb-2 text-gray-600">Tingkat</label>
                    <Dropdown v-model="sertifikatData.tingkat" :options="tingkatSertifikatOptions" placeholder="Pilih"
                        fluid />
                </div>
                <div><label class="font-bold block mb-2 text-gray-600">Penyelenggara</label>
                    <InputText v-model.trim="sertifikatData.penyelenggara" fluid />
                </div>
                <div><label class="font-bold block mb-2 text-gray-600">Nomor Sertifikat</label>
                    <InputText v-model.trim="sertifikatData.nomor_sertifikat" fluid />
                </div>
                <div><label class="font-bold block mb-2 text-gray-600">Keterangan</label><Textarea
                        v-model.trim="sertifikatData.keterangan" rows="3" fluid /></div>
            </div>
            <template #footer>
                <Button label="Batal" icon="pi pi-times" text @click="hideSertifikatDialog" />
                <Button label="Simpan" icon="pi pi-check" severity="success" @click="saveSertifikat" />
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteSertifikatDialog" :style="{ width: '450px' }" header="Konfirmasi" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle text-3xl text-red-500" />
                <span v-if="sertifikatData">Hapus riwayat sertifikat <b>{{ sertifikatData.judul_sertifikat
                }}</b>?</span>
            </div>
            <template #footer>
                <Button label="Tidak" text @click="deleteSertifikatDialog = false" />
                <Button label="Ya, Hapus" icon="pi pi-check" severity="danger" @click="deleteSertifikat" />
            </template>
        </Dialog>

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
                <div><label class="font-bold block mb-2 text-gray-600">Kompetensi MK</label>
                    <InputText v-model.trim="jadData.kompetensi_mk" fluid />
                </div>
            </div>
            <template #footer><Button label="Batal" icon="pi pi-times" text @click="jadFormDialog = false" /><Button
                    label="Simpan" icon="pi pi-check" severity="success" @click="saveJad" /></template>
        </Dialog>

        <Dialog v-model:visible="deleteJadDialog" :style="{ width: '450px' }" header="Konfirmasi" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle text-3xl text-red-500" />
                <span v-if="jadData">Hapus riwayat JAD <b>{{ jadData.jabatan_akademik }}</b>?</span>
            </div>
            <template #footer><Button label="Tidak" text @click="deleteJadDialog = false" /><Button label="Ya, Hapus"
                    icon="pi pi-check" severity="danger" @click="deleteJad" /></template>
        </Dialog>

        <Dialog v-model:visible="serdosFormDialog" :style="{ width: '450px' }"
            :header="isSerdosNew ? 'Tambah SERDOS' : 'Edit SERDOS'" :modal="true">
            <div class="flex flex-col gap-4 p-fluid">
                <div><label class="font-bold block mb-2 text-gray-600">Nomor Sertifikat *</label>
                    <InputText v-model.trim="serdosData.nomor_sertifikat" required
                        :invalid="serdosSubmitted && !serdosData.nomor_sertifikat" fluid />
                </div>
                <div><label class="font-bold block mb-2 text-gray-600">Tanggal Terbit *</label>
                    <Calendar v-model="serdosData.tanggal_terbit" dateFormat="yy-mm-dd" required
                        :invalid="serdosSubmitted && !serdosData.tanggal_terbit" />
                </div>
            </div>
            <template #footer><Button label="Batal" icon="pi pi-times" text @click="serdosFormDialog = false" /><Button
                    label="Simpan" icon="pi pi-check" severity="success" @click="saveSerdos" /></template>
        </Dialog>

        <Dialog v-model:visible="deleteSerdosDialog" :style="{ width: '450px' }" header="Konfirmasi" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle text-3xl text-red-500" />
                <span v-if="serdosData">Hapus riwayat SERDOS Nomor <b>{{ serdosData.nomor_sertifikat }}</b>?</span>
            </div>
            <template #footer><Button label="Tidak" text @click="deleteSerdosDialog = false" /><Button label="Ya, Hapus"
                    icon="pi pi-check" severity="danger" @click="deleteSerdos" /></template>
        </Dialog>

        <Dialog v-model:visible="penempatanListDialog" :style="{ width: '70vw' }"
            :header="`Penempatan: ${selectedPegawai.nama_lengkap}`" :modal="true" maximizable>
            <Toolbar class="mb-4">
                <template #start><Button label="Tambah" icon="pi pi-plus" severity="secondary"
                        @click="openNewPenempatan" /></template>
            </Toolbar>
            <DataTable :value="penempatanList" :loading="isPenempatanLoading">
                <Column field="nama_unit_kerja" header="Unit Kerja" sortable></Column>
                <Column field="jabatan" header="Jabatan" sortable></Column>
                <Column field="tanggal_mulai" header="Mulai" sortable></Column>
                <Column header="Aksi">
                    <template #body="slotProps">
                        <div class="flex gap-2">
                            <Button icon="pi pi-pencil" text rounded @click="editPenempatan(slotProps.data)" />
                            <Button icon="pi pi-trash" text rounded severity="danger"
                                @click="confirmDeletePenempatan(slotProps.data)" />
                        </div>
                    </template>
                </Column>
            </DataTable>
        </Dialog>

        <Dialog v-model:visible="penempatanFormDialog" :style="{ width: '450px' }"
            :header="isPenempatanNew ? 'Tambah Penempatan' : 'Edit Penempatan'" :modal="true">
            <div class="flex flex-col gap-4 p-fluid">
                <div><label class="font-bold block mb-2 text-gray-600">Unit Kerja *</label>
                    <Dropdown v-model="penempatanData.unit_kerja_id" :options="unitKerjaList" optionLabel="nama_unit"
                        optionValue="id" placeholder="Pilih" filter required fluid />
                </div>
                <div><label class="font-bold block mb-2 text-gray-600">Jabatan *</label>
                    <InputText v-model.trim="penempatanData.jabatan" required
                        :invalid="penempatanSubmitted && !penempatanData.jabatan" fluid />
                </div>
                <div><label class="font-bold block mb-2 text-gray-600">Nomor SK *</label>
                    <InputText v-model.trim="penempatanData.nomor_sk" required
                        :invalid="penempatanSubmitted && !penempatanData.nomor_sk" fluid />
                </div>
                <div><label class="font-bold block mb-2 text-gray-600">Tanggal Mulai *</label>
                    <Calendar v-model="penempatanData.tanggal_mulai" dateFormat="yy-mm-dd" required
                        :invalid="penempatanSubmitted && !penempatanData.tanggal_mulai" />
                </div>
            </div>
            <template #footer><Button label="Batal" icon="pi pi-times" text @click="hidePenempatanDialog" /><Button
                    label="Simpan" icon="pi pi-check" severity="success" @click="savePenempatan" /></template>
        </Dialog>

        <Dialog v-model:visible="deletePenempatanDialog" :style="{ width: '450px' }" header="Konfirmasi" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle text-3xl text-red-500" />
                <span v-if="penempatanData">Hapus penempatan di <b>{{ penempatanData.nama_unit_kerja }}</b>?</span>
            </div>
            <template #footer><Button label="Tidak" text @click="deletePenempatanDialog = false" /><Button
                    label="Ya, Hapus" icon="pi pi-check" severity="danger" @click="deletePenempatan" /></template>
        </Dialog>

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