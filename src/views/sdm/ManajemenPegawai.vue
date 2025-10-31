<script setup>
import { useAuthStore } from '@/stores/auth';
import { useCutiStore } from '@/stores/cuti';
import { useDokumenStore } from '@/stores/dokumen';
import { useKarirDosenStore } from '@/stores/karirDosen';
import { usePegawaiStore } from '@/stores/pegawai';
import { usePendidikanStore } from '@/stores/pendidikan';
import { useProdiStore } from '@/stores/prodi';
import { useRiwayatSkStore } from '@/stores/riwayatSk';
import { useSertifikatStore } from '@/stores/sertifikat';
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
const { list: pendidikanList, isLoading: isPendidikanLoading } = storeToRefs(pendidikanStore);
const { list: riwayatSkList, isLoading: isRiwayatSkLoading } = storeToRefs(riwayatSkStore);
const { list: dokumenList, isLoading: isDokumenLoading } = storeToRefs(dokumenStore);
const { list: sertifikatList, isLoading: isSertifikatLoading } = storeToRefs(sertifikatStore);
const { jadList, serdosList, isLoading: isKarirDosenLoading } = storeToRefs(karirDosenStore);

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

// Opsi untuk dropdown
const jenisKelaminOptions = ref([
    { label: 'Laki-laki', value: 'L' },
    { label: 'Perempuan', value: 'P' }
]);
const statusNikahOptions = ref(['Menikah', 'Belum Menikah', 'Cerai Hidup', 'Cerai Mati']);
const kategoriPegawaiOptions = ref(['Tenaga Pendidik', 'Tenaga Kependidikan']);
const statusPegawaiOptions = ref(['Tetap', 'Kontrak', 'Honorer']);
const kategoriSertifikatOptions = ref(['Pelatihan', 'BIMTEK', 'Seminar', 'Workshop', 'Rekognisi Dosen']);
const tingkatSertifikatOptions = ref(['Lokal', 'Nasional', 'Internasional']);
const jabatanAkademikOptions = ref(['Asisten Ahli', 'Lektor', 'Lektor Kepala', 'Guru Besar']);
const pangkatGolonganOptions = ref(['III/a', 'III/b', 'III/c', 'III/d', 'IV/a', 'IV/b', 'IV/c', 'IV/d', 'IV/e']);

// const kategoriDokumenOptions = ref(['FotoProfil', 'KTP', 'KK', 'Ijazah', 'Transkrip', 'SK', 'Sertifikat', 'Lainnya']);
const computedKategoriOptions = computed(() => {
    // 'selectedRecordType' adalah ref yang sudah kita miliki
    if (selectedRecordType.value === 'riwayat-sk') {
        return ['SK', 'Lainnya'];
    }
    if (selectedRecordType.value === 'riwayat-pendidikan') {
        return ['Ijazah', 'Transkrip', 'Lainnya'];
    }
    if (selectedRecordType.value === 'riwayat-sertifikat') {
        return ['Sertifikat', 'Lainnya'];
    }
    if (selectedRecordType.value === 'riwayat-jad') return ['SK', 'Lainnya'];
    if (selectedRecordType.value === 'riwayat-serdos') return ['Sertifikat', 'Lainnya'];
    if (selectedRecordType.value === 'pegawai') {
        // Semua kategori KECUALI yang spesifik untuk pendidikan/SK
        return ['FotoProfil', 'KTP', 'KK', 'Lainnya'];
    }
    return []; // Default
});

onMounted(() => {
    openSertifikatList;
    store.fetchAll();
    prodiStore.fetchProdi();
});

function formatDate(date) {
    if (!date) return null;
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// --- CRUD Functions ---
function openNew() {
    data.value = { is_active: true };
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
    if (data.value.kategori_pegawai === 'Tenaga Pendidik' && (!data.value.nidn || !data.value.prodi_id)) {
        toast.add({ severity: 'warn', summary: 'Perhatian', detail: 'Untuk Tenaga Pendidik, NIDN dan Prodi wajib diisi.', life: 3000 });
        return;
    }

    try {
        const payload = {
            ...data.value,
            // Format semua tanggal sebelum dikirim
            tanggal_lahir: formatDate(data.value.tanggal_lahir),
            tanggal_masuk: formatDate(data.value.tanggal_masuk),
            tanggal_pensiun: formatDate(data.value.tanggal_pensiun)
        };

        if (typeof payload.jenis_kelamin === 'object' && payload.jenis_kelamin !== null) {
            payload.jenis_kelamin = payload.jenis_kelamin.value;
        }

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

function editData(editData) {
    data.value = {
        ...editData,
        tanggal_lahir: editData.tanggal_lahir ? new Date(editData.tanggal_lahir) : null,
        tanggal_masuk: editData.tanggal_masuk ? new Date(editData.tanggal_masuk) : null
    };
    dialog.value = true;
}

function confirmDelete(deleteData) {
    data.value = deleteData;
    deleteDialog.value = true;
}

async function deleteData() {
    try {
        await store.delete(data.value.id);
        deleteDialog.value = false;
        data.value = {};
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Data Pegawai Dihapus', life: 3000 });
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Terjadi kesalahan saat menghapus', life: 3000 });
    }
}

function openCreateUserDialog(pegawai) {
    selectedPegawai.value = pegawai;
    userCreationData.value = { password: '' };
    submitted.value = false; // Reset validation
    createUserDialog.value = true;
}

async function saveUserAccount() {
    submitted.value = true;
    if (!userCreationData.value.password) {
        toast.add({ severity: 'warn', summary: 'Perhatian', detail: 'Password wajib diisi.', life: 3000 });
        return;
    }

    try {
        await store.createUserAccount(selectedPegawai.value.id, userCreationData.value);
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Akun user telah berhasil dibuat.', life: 3000 });
        createUserDialog.value = false;
    } catch (error) {
        const errorMessage = error.response?.data?.error || 'Gagal membuat akun user.';
        toast.add({ severity: 'error', summary: 'Gagal', detail: errorMessage, life: 4000 });
    }
}

async function openPendidikanList(pegawai) {
    selectedPegawai.value = pegawai;
    try {
        await pendidikanStore.fetchByPegawai(pegawai.id);
        pendidikanListDialog.value = true;
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal memuat riwayat pendidikan.', life: 3000 });
    }
}

function openNewPendidikan() {
    pendidikanData.value = {};
    pendidikanSubmitted.value = false;
    pendidikanFormDialog.value = true;
}

function editPendidikan(data) {
    pendidikanData.value = { ...data };
    pendidikanSubmitted.value = false;
    pendidikanFormDialog.value = true;
}

function hidePendidikanDialog() {
    pendidikanFormDialog.value = false;
    pendidikanSubmitted.value = false;
}

async function savePendidikan() {
    pendidikanSubmitted.value = true;
    if (!pendidikanData.value.jenjang?.trim() || !pendidikanData.value.institusi?.trim() || !pendidikanData.value.tahun_lulus) {
        toast.add({ severity: 'warn', summary: 'Perhatian', detail: 'Jenjang, Institusi, dan Tahun Lulus wajib diisi.', life: 3000 });
        return;
    }

    try {
        const payload = { ...pendidikanData.value };
        if (isPendidikanNew.value) {
            await pendidikanStore.create(selectedPegawai.value.id, payload);
            toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Riwayat pendidikan ditambahkan', life: 3000 });
        } else {
            await pendidikanStore.update(pendidikanData.value.id, payload);
            toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Riwayat pendidikan diperbarui', life: 3000 });
        }

        await pendidikanStore.fetchByPegawai(selectedPegawai.value.id); // Refresh list
        pendidikanFormDialog.value = false;
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal menyimpan data', life: 3000 });
    }
}

function confirmDeletePendidikan(data) {
    pendidikanData.value = data;
    deletePendidikanDialog.value = true;
}

async function deletePendidikan() {
    try {
        await pendidikanStore.delete(pendidikanData.value.id);
        await pendidikanStore.fetchByPegawai(selectedPegawai.value.id); // Refresh list
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Riwayat pendidikan dihapus', life: 3000 });
        deletePendidikanDialog.value = false;
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal menghapus data', life: 3000 });
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

function editRiwayatSk(data) {
    riwayatSkData.value = {
        ...data,
        tanggal_sk: new Date(data.tanggal_sk)
    };
    riwayatSkSubmitted.value = false;
    riwayatSkFormDialog.value = true;
}

function hideRiwayatSkDialog() {
    riwayatSkFormDialog.value = false;
    riwayatSkSubmitted.value = false;
}

async function saveRiwayatSk() {
    riwayatSkSubmitted.value = true;
    if (!riwayatSkData.value.nomor_sk?.trim() || !riwayatSkData.value.tanggal_sk || !riwayatSkData.value.jenis_sk) {
        toast.add({ severity: 'warn', summary: 'Perhatian', detail: 'Nomor, Tanggal, dan Jenis SK wajib diisi.', life: 3000 });
        return;
    }

    try {
        const payload = {
            ...riwayatSkData.value,
            tanggal_sk: formatDate(riwayatSkData.value.tanggal_sk)
        };

        if (isRiwayatSkNew.value) {
            await riwayatSkStore.create(selectedPegawai.value.id, payload);
            toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Riwayat SK ditambahkan', life: 3000 });
        } else {
            await riwayatSkStore.update(riwayatSkData.value.id, payload);
            toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Riwayat SK diperbarui', life: 3000 });
        }

        await riwayatSkStore.fetchByPegawai(selectedPegawai.value.id); // Refresh list
        riwayatSkFormDialog.value = false;
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal menyimpan data', life: 3000 });
    }
}

function confirmDeleteRiwayatSk(data) {
    riwayatSkData.value = data;
    deleteRiwayatSkDialog.value = true;
}

async function deleteRiwayatSk() {
    try {
        await riwayatSkStore.delete(riwayatSkData.value.id);
        await riwayatSkStore.fetchByPegawai(selectedPegawai.value.id); // Refresh list
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Riwayat SK dihapus', life: 3000 });
        deleteRiwayatSkDialog.value = false;
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal menghapus data', life: 3000 });
    }
}

async function openDokumenDialog(record, type, pegawaiNama) {
    selectedRecord.value = record;
    selectedRecordType.value = type;
    selectedPegawai.value.nama_lengkap = pegawaiNama; // Untuk judul dialog
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
    if (!fileToUpload.value) {
        toast.add({ severity: 'warn', summary: 'Peringatan', detail: 'Pilih file terlebih dahulu', life: 3000 });
        return;
    }

    // --- PERBAIKAN: Validasi kategori baru ---
    if (!uploadKategori.value) {
        toast.add({ severity: 'warn', summary: 'Peringatan', detail: 'Kategori dokumen wajib dipilih', life: 3000 });
        return;
    }

    const formData = new FormData();
    formData.append('file', fileToUpload.value);
    formData.append('kategori', uploadKategori.value); // <-- Selalu kirim kategori

    try {
        await dokumenStore.upload(selectedRecordType.value, selectedRecord.value.id, formData);
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Dokumen berhasil diupload', life: 3000 });

        fileToUpload.value = null;
        uploadKategori.value = null; // Reset kategori
        if (uploadRef.value) {
            uploadRef.value.clear();
        }
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal mengupload file', life: 3000 });
    }
}

function confirmDeleteDokumen(dokumen) {
    confirm.require({
        message: `Apakah Anda yakin ingin menghapus file ${dokumen.nama_file}?`,
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

function openJatahDialog(pegawai) {
    selectedPegawai.value = pegawai;
    jatahData.value = {
        pegawai_id: pegawai.id,
        tahun: new Date().getFullYear(),
        kuota_total: 12 // Default
    };
    jatahSubmitted.value = false;
    jatahDialog.value = true;
}

async function saveJatahCuti() {
    jatahSubmitted.value = true;
    if (!jatahData.value.tahun || jatahData.value.kuota_total == null) {
        toast.add({ severity: 'warn', summary: 'Perhatian', detail: 'Tahun dan Kuota Total wajib diisi.', life: 3000 });
        return;
    }
    try {
        await cutiStore.setJatahCuti(jatahData.value);
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Jatah cuti berhasil diatur.', life: 3000 });
        jatahDialog.value = false;
    } catch (error) {
        const errorMessage = error.response?.data?.error || 'Gagal menyimpan jatah cuti';
        toast.add({ severity: 'error', summary: 'Gagal', detail: errorMessage, life: 4000 });
    }
}

async function openViewJatahDialog(pegawai) {
    selectedPegawai.value = pegawai;
    viewJatahData.value = null; // Kosongkan data lama
    viewJatahDialog.value = true;

    try {
        const currentYear = new Date().getFullYear();
        // Panggil store untuk mengambil data
        const dataArray = await cutiStore.fetchJatahCutiByPegawai(pegawai.id, currentYear);

        if (dataArray && dataArray.length > 0) {
            // Ambil data pertama dari array
            const jatah = dataArray[0];
            // Hitung sisa cuti di front-end
            viewJatahData.value = {
                ...jatah,
                sisa_cuti: jatah.kuota_total - jatah.kuota_terpakai
            };
        } else {
            viewJatahData.value = { error: `Data jatah cuti tidak ditemukan untuk tahun ${currentYear}.` };
        }
    } catch (error) {
        viewJatahData.value = { error: 'Gagal memuat data jatah cuti.' };
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

function editSertifikat(data) {
    sertifikatData.value = {
        ...data,
        tanggal_pelaksanaan: new Date(data.tanggal_pelaksanaan)
    };
    sertifikatSubmitted.value = false;
    sertifikatFormDialog.value = true;
}

function hideSertifikatDialog() {
    sertifikatFormDialog.value = false;
    sertifikatSubmitted.value = false;
}

async function saveSertifikat() {
    sertifikatSubmitted.value = true;
    if (!sertifikatData.value.jenis_sertifikat || !sertifikatData.value.judul_sertifikat?.trim() || !sertifikatData.value.tanggal_pelaksanaan) {
        toast.add({ severity: 'warn', summary: 'Perhatian', detail: 'Jenis, Judul, dan Tanggal Pelaksanaan wajib diisi.', life: 3000 });
        return;
    }

    try {
        const payload = {
            ...sertifikatData.value,
            tanggal_pelaksanaan: formatDate(sertifikatData.value.tanggal_pelaksanaan)
        };

        if (isSertifikatNew.value) {
            await sertifikatStore.create(selectedPegawai.value.id, payload);
            toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Riwayat sertifikat ditambahkan', life: 3000 });
        } else {
            await sertifikatStore.update(sertifikatData.value.id, payload);
            toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Riwayat sertifikat diperbarui', life: 3000 });
        }

        await sertifikatStore.fetchByPegawai(selectedPegawai.value.id); // Refresh list
        sertifikatFormDialog.value = false;
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal menyimpan data', life: 3000 });
    }
}

function confirmDeleteSertifikat(data) {
    sertifikatData.value = data;
    deleteSertifikatDialog.value = true;
}

async function deleteSertifikat() {
    try {
        await sertifikatStore.delete(sertifikatData.value.id);
        await sertifikatStore.fetchByPegawai(selectedPegawai.value.id); // Refresh list
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Riwayat sertifikat dihapus', life: 3000 });
        deleteSertifikatDialog.value = false;
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal menghapus data', life: 3000 });
    }
}

async function openKarirDosenDialog(pegawai) {
    selectedPegawai.value = pegawai;
    try {
        // Ambil data JAD dan SERDOS sekaligus
        await Promise.all([karirDosenStore.fetchJad(pegawai.id), karirDosenStore.fetchSerdos(pegawai.id)]);
        karirDosenDialog.value = true;
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal memuat data karir dosen.', life: 3000 });
    }
}

// --- FUNGSI JAD ---
function openNewJad() {
    jadData.value = { tmt: new Date() };
    jadSubmitted.value = false;
    jadFormDialog.value = true;
}

function editJad(data) {
    jadData.value = { ...data, tmt: new Date(data.tmt) };
    jadSubmitted.value = false;
    jadFormDialog.value = true;
}

async function saveJad() {
    jadSubmitted.value = true;
    if (!jadData.value.jabatan_akademik || !jadData.value.pangkat_golongan || !jadData.value.nomor_sk?.trim() || !jadData.value.tmt) {
        toast.add({ severity: 'warn', summary: 'Perhatian', detail: 'Semua field wajib diisi.', life: 3000 });
        return;
    }

    try {
        const payload = { ...jadData.value, tmt: formatDate(jadData.value.tmt) };
        if (isJadNew.value) {
            await karirDosenStore.createJad(selectedPegawai.value.id, payload);
            toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Riwayat JAD ditambahkan', life: 3000 });
        } else {
            await karirDosenStore.updateJad(jadData.value.id, payload);
            await karirDosenStore.fetchJad(selectedPegawai.value.id); // Update manual list JAD
            toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Riwayat JAD diperbarui', life: 3000 });
        }
        jadFormDialog.value = false;
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal menyimpan data JAD', life: 3000 });
    }
}

function confirmDeleteJad(data) {
    jadData.value = data;
    deleteJadDialog.value = true;
}

async function deleteJad() {
    try {
        await karirDosenStore.deleteJad(jadData.value.id);
        await karirDosenStore.fetchJad(selectedPegawai.value.id);
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Riwayat JAD dihapus', life: 3000 });
        deleteJadDialog.value = false;
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal menghapus data', life: 3000 });
    }
}

// --- FUNGSI SERDOS ---
function openNewSerdos() {
    serdosData.value = { tanggal_terbit: new Date() };
    serdosSubmitted.value = false;
    serdosFormDialog.value = true;
}

function editSerdos(data) {
    serdosData.value = { ...data, tanggal_terbit: new Date(data.tanggal_terbit) };
    serdosSubmitted.value = false;
    serdosFormDialog.value = true;
}

async function saveSerdos() {
    serdosSubmitted.value = true;
    if (!serdosData.value.nomor_sertifikat?.trim() || !serdosData.value.tanggal_terbit) {
        toast.add({ severity: 'warn', summary: 'Perhatian', detail: 'Nomor Sertifikat dan Tanggal Terbit wajib diisi.', life: 3000 });
        return;
    }

    try {
        const payload = { ...serdosData.value, tanggal_terbit: formatDate(serdosData.value.tanggal_terbit) };
        if (isSerdosNew.value) {
            await karirDosenStore.createSerdos(selectedPegawai.value.id, payload);
            toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Riwayat SERDOS ditambahkan', life: 3000 });
        } else {
            await karirDosenStore.updateSerdos(serdosData.value.id, payload);
            await karirDosenStore.fetchSerdos(selectedPegawai.value.id); // Update manual list SERDOS
            toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Riwayat SERDOS diperbarui', life: 3000 });
        }
        serdosFormDialog.value = false;
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal menyimpan data SERDOS', life: 3000 });
    }
}

function confirmDeleteSerdos(data) {
    serdosData.value = data;
    deleteSerdosDialog.value = true;
}

async function deleteSerdos() {
    try {
        await karirDosenStore.deleteSerdos(serdosData.value.id);
        await karirDosenStore.fetchSerdos(selectedPegawai.value.id);
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Riwayat SERDOS dihapus', life: 3000 });
        deleteSerdosDialog.value = false;
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal menghapus data', life: 3000 });
    }
}
</script>

<template>
    <div>
        <div class="card">
            <Toolbar class="mb-6">
                <template #start>
                    <Button label="Tambah Pegawai" icon="pi pi-plus" severity="secondary" class="mr-2" @click="openNew" />
                </template>
            </Toolbar>

            <DataTable
                ref="dt"
                :value="list"
                :loading="isLoading"
                dataKey="id"
                :paginator="true"
                :rows="10"
                :filters="filters"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                :rowsPerPageOptions="[5, 10, 25]"
                currentPageReportTemplate="Menampilkan {first} sampai {last} dari {totalRecords} pegawai"
            >
                <template #header>
                    <div class="flex flex-wrap gap-2 items-center justify-between">
                        <h4 class="m-0">Manajemen Pegawai</h4>
                        <IconField>
                            <InputIcon> <i class="pi pi-search" /> </InputIcon>
                            <InputText v-model="filters['global'].value" placeholder="Cari..." />
                        </IconField>
                    </div>
                </template>

                <Column field="nik" header="NIK" sortable></Column>
                <Column field="nama_lengkap" header="Nama Lengkap" sortable></Column>
                <Column field="jabatan" header="Jabatan" sortable></Column>
                <Column field="status_pegawai" header="Status" sortable></Column>
                <Column field="nomor_hp" header="No. HP"></Column>
                <Column :exportable="false" style="min-width: 12rem" header="Aksi">
                    <template #body="slotProps">
                        <Button
                            v-if="slotProps.data.kategori_pegawai === 'Tenaga Pendidik'"
                            icon="pi pi-star"
                            outlined
                            rounded
                            severity="success"
                            class="mr-2"
                            @click="openKarirDosenDialog(slotProps.data)"
                            v-tooltip.top="'Karir Dosen (JAD/SERDOS)'"
                        />
                        <Button icon="pi pi-book" outlined rounded severity="info" class="mr-2" @click="openPendidikanList(slotProps.data)" v-tooltip.top="'Riwayat Pendidikan'" />
                        <Button icon="pi pi-file-o" outlined rounded severity="secondary" class="mr-2" @click="openRiwayatSkList(slotProps.data)" v-tooltip.top="'Riwayat SK'" />
                        <Button icon="pi pi-id-card" outlined rounded severity="warning" class="mr-2" @click="openSertifikatList(slotProps.data)" v-tooltip.top="'Riwayat Sertifikat'" />
                        <Button icon="pi pi-address-book" outlined rounded severity="help" class="mr-2" @click="openDokumenDialog(slotProps.data, 'pegawai', slotProps.data.nama_lengkap)" v-tooltip.top="'Dokumen Pegawai (KTP, Foto, dll)'" />
                        <Button icon="pi pi-cog" outlined rounded severity="secondary" class="mr-2" @click="openJatahDialog(slotProps.data)" v-tooltip.top="'Atur Jatah Cuti'" />
                        <Button icon="pi pi-calendar-times" outlined rounded severity="help" class="mr-2" @click="openViewJatahDialog(slotProps.data)" v-tooltip.top="'Cek Jatah Cuti'" />
                        <Button icon="pi pi-pencil" outlined rounded class="mr-2" @click="editData(slotProps.data)" />
                        <Button
                            v-if="!slotProps.data.user_id && authStore.userData?.roles.includes('SUPER_ADMIN')"
                            icon="pi pi-user-plus"
                            outlined
                            rounded
                            severity="success"
                            class="mr-2"
                            @click="openCreateUserDialog(slotProps.data)"
                            v-tooltip.top="'Buat Akun User'"
                        />
                        <Button icon="pi pi-trash" outlined rounded severity="danger" @click="confirmDelete(slotProps.data)" />
                    </template>
                </Column>
            </DataTable>
        </div>

        <Dialog v-model:visible="dialog" :style="{ width: '70vw' }" header="Detail Pegawai" :modal="true">
            <TabView>
                <TabPanel header="Data Pribadi">
                    <div class="grid grid-cols-12 gap-4 mt-4">
                        <div class="col-span-12 md:col-span-4">
                            <label for="gelar_depan" class="block font-bold mb-3">Gelar Depan</label>
                            <InputText id="gelar_depan" v-model.trim="data.gelar_depan" fluid />
                        </div>
                        <div class="col-span-12 md:col-span-4">
                            <label for="nama_lengkap" class="block font-bold mb-3">Nama Lengkap *</label>
                            <InputText id="nama_lengkap" v-model.trim="data.nama_lengkap" required :invalid="submitted && !data.nama_lengkap" fluid />
                        </div>
                        <div class="col-span-12 md:col-span-4">
                            <label for="gelar_belakang" class="block font-bold mb-3">Gelar Belakang</label>
                            <InputText id="gelar_belakang" v-model.trim="data.gelar_belakang" fluid />
                        </div>

                        <div class="col-span-12 md:col-span-6">
                            <label for="tempat_lahir" class="block font-bold mb-3">Tempat Lahir</label>
                            <InputText id="tempat_lahir" v-model.trim="data.tempat_lahir" fluid />
                        </div>
                        <div class="col-span-12 md:col-span-6">
                            <label for="tanggal_lahir" class="block font-bold mb-3">Tanggal Lahir</label>
                            <Calendar id="tanggal_lahir" v-model="data.tanggal_lahir" dateFormat="yy-mm-dd" />
                        </div>

                        <div class="col-span-12 md:col-span-4">
                            <label for="jenis_kelamin" class="block font-bold mb-3">Jenis Kelamin</label>
                            <Dropdown id="jenis_kelamin" v-model="data.jenis_kelamin" :options="jenisKelaminOptions" optionLabel="label" optionValue="value" placeholder="Pilih" fluid />
                        </div>
                        <div class="col-span-12 md:col-span-4">
                            <label for="status_nikah" class="block font-bold mb-3">Status Nikah</label>
                            <Dropdown id="status_nikah" v-model="data.status_nikah" :options="statusNikahOptions" placeholder="Pilih" fluid />
                        </div>
                        <div class="col-span-12 md:col-span-4">
                            <label for="agama" class="block font-bold mb-3">Agama</label>
                            <InputText id="agama" v-model.trim="data.agama" fluid />
                        </div>
                        <div class="col-span-12 md:col-span-4">
                            <label for="gol_darah" class="block font-bold mb-3">Gol. Darah</label>
                            <InputText id="gol_darah" v-model.trim="data.gol_darah" fluid />
                        </div>
                    </div>
                </TabPanel>

                <TabPanel header="Kontak & Alamat">
                    <div class="grid grid-cols-12 gap-4 mt-4">
                        <div class="col-span-12 md:col-span-6">
                            <label for="nomor_hp" class="block font-bold mb-3">No. HP</label>
                            <InputText id="nomor_hp" v-model.trim="data.nomor_hp" fluid />
                        </div>
                        <div class="col-span-12 md:col-span-6">
                            <label for="email" class="block font-bold mb-3">Email</label>
                            <InputText id="email" v-model.trim="data.email" fluid />
                        </div>
                        <div class="col-span-12">
                            <label for="alamat_domisili" class="block font-bold mb-3">Alamat Domisili</label>
                            <Textarea id="alamat_domisili" v-model.trim="data.alamat_domisili" rows="3" fluid />
                        </div>
                        <div class="col-span-12 md:col-span-6">
                            <label for="kota" class="block font-bold mb-3">Kota</label>
                            <InputText id="kota" v-model.trim="data.kota" fluid />
                        </div>
                        <div class="col-span-12 md:col-span-6">
                            <label for="kode_pos" class="block font-bold mb-3">Kode Pos</label>
                            <InputText id="kode_pos" v-model.trim="data.kode_pos" fluid />
                        </div>
                    </div>
                </TabPanel>

                <TabPanel header="Kepegawaian">
                    <div class="grid grid-cols-12 gap-4 mt-4">
                        <div class="col-span-12 md:col-span-6">
                            <label for="nik" class="block font-bold mb-3">NIK *</label>
                            <InputText id="nik" v-model.trim="data.nik" required :invalid="submitted && !data.nik" fluid />
                        </div>
                        <div class="col-span-12 md:col-span-6">
                            <label for="status_pegawai" class="block font-bold mb-3">Status Kepegawaian</label>
                            <Dropdown id="status_pegawai" v-model="data.status_pegawai" :options="statusPegawaiOptions" placeholder="Pilih Status" fluid />
                        </div>
                        <div class="col-span-12 md:col-span-6">
                            <label for="kategori_pegawai" class="block font-bold mb-3">Kategori Pegawai</label>
                            <Dropdown id="kategori_pegawai" v-model="data.kategori_pegawai" :options="kategoriPegawaiOptions" placeholder="Pilih Kategori" fluid />
                        </div>
                        <div class="col-span-12 md:col-span-6">
                            <label for="jabatan" class="block font-bold mb-3">Jabatan</label>
                            <InputText id="jabatan" v-model.trim="data.jabatan" fluid />
                        </div>
                        <div class="col-span-12 md:col-span-6">
                            <label for="unit_kerja" class="block font-bold mb-3">Unit Kerja</label>
                            <InputText id="unit_kerja" v-model.trim="data.unit_kerja" fluid />
                        </div>
                        <div class="col-span-12 md:col-span-6">
                            <label for="bagian" class="block font-bold mb-3">Bagian</label>
                            <InputText id="bagian" v-model.trim="data.bagian" fluid />
                        </div>

                        <template v-if="data.kategori_pegawai === 'Tenaga Pendidik'">
                            <div class="col-span-12 md:col-span-6">
                                <label for="nidn" class="block font-bold mb-3">NIDN *</label>
                                <InputText id="nidn" v-model.trim="data.nidn" fluid :invalid="submitted && !data.nidn" />
                            </div>
                            <div class="col-span-12 md:col-span-6">
                                <label for="prodi" class="block font-bold mb-3">Homebase Prodi *</label>
                                <Dropdown id="prodi" v-model="data.prodi_id" :options="prodiList" optionLabel="nama_prodi" optionValue="id" placeholder="Pilih Prodi" :invalid="submitted && !data.prodi_id" fluid filter />
                            </div>
                        </template>

                        <div class="col-span-12 md:col-span-6">
                            <label for="tanggal_masuk" class="block font-bold mb-3">Tanggal Masuk</label>
                            <Calendar id="tanggal_masuk" v-model="data.tanggal_masuk" dateFormat="yy-mm-dd" />
                        </div>
                        <div class="col-span-12 md:col-span-6">
                            <label for="tanggal_pensiun" class="block font-bold mb-3">Tanggal Pensiun</label>
                            <Calendar id="tanggal_pensiun" v-model="data.tanggal_pensiun" dateFormat="yy-mm-dd" />
                        </div>
                        <div class="col-span-12 flex items-center">
                            <InputSwitch v-model="data.is_active" />
                            <label for="is_active" class="ml-2 font-bold">Status Aktif</label>
                        </div>
                    </div>
                </TabPanel>

                <TabPanel header="Data Lain">
                    <div class="grid grid-cols-12 gap-4 mt-4">
                        <div class="col-span-12 md:col-span-6">
                            <label for="no_ktp" class="block font-bold mb-3">No. KTP</label>
                            <InputText id="no_ktp" v-model.trim="data.no_ktp" fluid />
                        </div>
                        <div class="col-span-12 md:col-span-6">
                            <label for="no_kk" class="block font-bold mb-3">No. KK</label>
                            <InputText id="no_kk" v-model.trim="data.no_kk" fluid />
                        </div>
                        <div class="col-span-12 md:col-span-6">
                            <label for="no_npwp" class="block font-bold mb-3">No. NPWP</label>
                            <InputText id="no_npwp" v-model.trim="data.no_npwp" fluid />
                        </div>
                        <div class="col-span-12 md:col-span-6">
                            <label for="no_bpjs_kesehatan" class="block font-bold mb-3">No. BPJS Kesehatan</label>
                            <InputText id="no_bpjs_kesehatan" v-model.trim="data.no_bpjs_kesehatan" fluid />
                        </div>
                        <div class="col-span-12 md:col-span-6">
                            <label for="no_bpjs_ketenagakerjaan" class="block font-bold mb-3">No. BPJS Ketenagakerjaan</label>
                            <InputText id="no_bpjs_ketenagakerjaan" v-model.trim="data.no_bpjs_ketenagakerjaan" fluid />
                        </div>
                        <div class="col-span-12 md:col-span-6" v-if="!data.id">
                            <label for="password" class="block font-bold mb-3">Password Akun (Opsional)</label>
                            <Password id="password" v-model="data.password" :feedback="false" toggleMask fluid placeholder="Isi untuk membuat akun" />
                        </div>
                    </div>
                </TabPanel>
            </TabView>
            <template #footer>
                <Button label="Batal" icon="pi pi-times" text @click="hideDialog" />
                <Button label="Simpan" icon="pi pi-check" @click="saveData" />
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteDialog" :style="{ width: '450px' }" header="Konfirmasi" :modal="true"> </Dialog>

        <Dialog v-model:visible="createUserDialog" :style="{ width: '450px' }" :header="`Buat Akun untuk ${selectedPegawai.nama_lengkap}`" :modal="true"> </Dialog>

        <Dialog v-model:visible="deleteDialog" :style="{ width: '450px' }" header="Konfirmasi" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl" />
                <span v-if="data"
                    >Apakah Anda yakin ingin menghapus <b>{{ data.nama_lengkap }}</b
                    >?</span
                >
            </div>
            <template #footer>
                <Button label="Tidak" icon="pi pi-times" text @click="deleteDialog = false" />
                <Button label="Ya" icon="pi pi-check" @click="deleteData" />
            </template>
        </Dialog>
        <Dialog v-model:visible="createUserDialog" :style="{ width: '450px' }" :header="`Buat Akun untuk ${selectedPegawai.nama_lengkap}`" :modal="true">
            <div class="field">
                <label for="password_new_user" class="block font-bold mb-3">Password Awal</label>
                <Password id="password_new_user" v-model="userCreationData.password" required autofocus :invalid="submitted && !userCreationData.password" :feedback="false" toggleMask fluid />
                <small v-if="submitted && !userCreationData.password" class="p-error">Password wajib diisi.</small>
            </div>
            <template #footer>
                <Button label="Batal" icon="pi pi-times" text @click="createUserDialog = false" />
                <Button label="Buat Akun" icon="pi pi-check" @click="saveUserAccount" />
            </template>
        </Dialog>
        <Dialog v-model:visible="pendidikanListDialog" :style="{ width: '70vw' }" maximizable :header="`Riwayat Pendidikan: ${selectedPegawai.nama_lengkap}`" :modal="true">
            <Toolbar class="mb-4">
                <template #start>
                    <Button label="Tambah Riwayat" icon="pi pi-plus" severity="secondary" @click="openNewPendidikan" />
                </template>
            </Toolbar>
            <DataTable :value="pendidikanList" :loading="isPendidikanLoading">
                <Column field="jenjang" header="Jenjang" sortable></Column>
                <Column field="institusi" header="Institusi" sortable></Column>
                <Column field="jurusan" header="Jurusan/Prodi" sortable></Column>
                <Column field="tahun_lulus" header="Tahun Lulus" sortable></Column>
                <Column header="Aksi">
                    <template #body="slotProps">
                        <Button icon="pi pi-paperclip" text rounded severity="info" @click="openDokumenDialog(slotProps.data, 'riwayat-pendidikan', selectedPegawai.nama_lengkap)" v-tooltip.top="'Dokumen Ijazah/Transkrip'" />
                        <Button icon="pi pi-pencil" text rounded @click="editPendidikan(slotProps.data)" />
                        <Button icon="pi pi-trash" text rounded severity="danger" @click="confirmDeletePendidikan(slotProps.data)" />
                    </template>
                </Column>
            </DataTable>
        </Dialog>

        <Dialog v-model:visible="pendidikanFormDialog" :style="{ width: '450px' }" :header="isPendidikanNew ? 'Tambah Riwayat' : 'Edit Riwayat'" :modal="true">
            <div class="flex flex-col gap-6">
                <div>
                    <label for="jenjang" class="block font-bold mb-3">Jenjang *</label>
                    <InputText id="jenjang" v-model.trim="pendidikanData.jenjang" required autofocus :invalid="pendidikanSubmitted && !pendidikanData.jenjang" fluid />
                    <small v-if="pendidikanSubmitted && !pendidikanData.jenjang" class="p-error">Jenjang wajib diisi (cth: S1, S2).</small>
                </div>
                <div>
                    <label for="institusi" class="block font-bold mb-3">Institusi *</label>
                    <InputText id="institusi" v-model.trim="pendidikanData.institusi" required :invalid="pendidikanSubmitted && !pendidikanData.institusi" fluid />
                    <small v-if="pendidikanSubmitted && !pendidikanData.institusi" class="p-error">Institusi wajib diisi.</small>
                </div>
                <div>
                    <label for="jurusan" class="block font-bold mb-3">Jurusan</label>
                    <InputText id="jurusan" v-model.trim="pendidikanData.jurusan" fluid />
                </div>
                <div>
                    <label for="tahun_lulus" class="block font-bold mb-3">Tahun Lulus *</label>
                    <InputNumber id="tahun_lulus" v-model="pendidikanData.tahun_lulus" required :useGrouping="false" :invalid="pendidikanSubmitted && !pendidikanData.tahun_lulus" fluid />
                    <small v-if="pendidikanSubmitted && !pendidikanData.tahun_lulus" class="p-error">Tahun lulus wajib diisi.</small>
                </div>
            </div>
            <template #footer>
                <Button label="Batal" icon="pi pi-times" text @click="hidePendidikanDialog" />
                <Button label="Simpan" icon="pi pi-check" @click="savePendidikan" />
            </template>
        </Dialog>

        <Dialog v-model:visible="deletePendidikanDialog" :style="{ width: '450px' }" header="Konfirmasi Hapus" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl" />
                <span v-if="pendidikanData">
                    Apakah Anda yakin ingin menghapus <b>{{ pendidikanData.jenjang }} - {{ pendidikanData.institusi }}</b
                    >?
                </span>
            </div>
            <template #footer>
                <Button label="Tidak" icon="pi pi-times" text @click="deletePendidikanDialog = false" />
                <Button label="Ya, Hapus" icon="pi pi-check" @click="deletePendidikan" />
            </template>
        </Dialog>
        <Dialog v-model:visible="riwayatSkListDialog" :style="{ width: '70vw' }" maximizable :header="`Riwayat SK: ${selectedPegawai.nama_lengkap}`" :modal="true">
            <Toolbar class="mb-4">
                <template #start>
                    <Button label="Tambah Riwayat SK" icon="pi pi-plus" severity="secondary" @click="openNewRiwayatSk" />
                </template>
            </Toolbar>
            <DataTable :value="riwayatSkList" :loading="isRiwayatSkLoading">
                <Column field="nomor_sk" header="Nomor SK" sortable></Column>
                <Column field="tanggal_sk" header="Tanggal SK" sortable></Column>
                <Column field="jenis_sk" header="Jenis SK" sortable></Column>
                <Column field="jabatan" header="Jabatan" sortable></Column>
                <Column header="Aksi">
                    <template #body="slotProps">
                        <Button icon="pi pi-paperclip" text rounded severity="info" @click="openDokumenDialog(slotProps.data, 'riwayat-sk', selectedPegawai.nama_lengkap)" v-tooltip.top="'Dokumen SK'" />
                        <Button icon="pi pi-pencil" text rounded @click="editRiwayatSk(slotProps.data)" />
                        <Button icon="pi pi-trash" text rounded severity="danger" @click="confirmDeleteRiwayatSk(slotProps.data)" />
                    </template>
                </Column>
            </DataTable>
        </Dialog>
        <Dialog v-model:visible="riwayatSkFormDialog" :style="{ width: '450px' }" :header="isRiwayatSkNew ? 'Tambah Riwayat SK' : 'Edit Riwayat SK'" :modal="true">
            <div class="flex flex-col gap-6">
                <div>
                    <label for="nomor_sk" class="block font-bold mb-3">Nomor SK *</label>
                    <InputText id="nomor_sk" v-model.trim="riwayatSkData.nomor_sk" required autofocus :invalid="riwayatSkSubmitted && !riwayatSkData.nomor_sk" fluid />
                </div>
                <div>
                    <label for="tanggal_sk" class="block font-bold mb-3">Tanggal SK *</label>
                    <Calendar id="tanggal_sk" v-model="riwayatSkData.tanggal_sk" dateFormat="yy-mm-dd" required :invalid="riwayatSkSubmitted && !riwayatSkData.tanggal_sk" />
                </div>
                <div>
                    <label for="jenis_sk" class="block font-bold mb-3">Jenis SK *</label>
                    <InputText id="jenis_sk" v-model.trim="riwayatSkData.jenis_sk" required :invalid="riwayatSkSubmitted && !riwayatSkData.jenis_sk" fluid />
                </div>
                <div>
                    <label for="jabatan_sk" class="block font-bold mb-3">Jabatan</label>
                    <InputText id="jabatan_sk" v-model.trim="riwayatSkData.jabatan" fluid />
                </div>
                <div>
                    <label for="keterangan_sk" class="block font-bold mb-3">Keterangan</label>
                    <Textarea id="keterangan_sk" v-model.trim="riwayatSkData.keterangan" rows="3" fluid />
                </div>
            </div>
            <template #footer>
                <Button label="Batal" icon="pi pi-times" text @click="hideRiwayatSkDialog" />
                <Button label="Simpan" icon="pi pi-check" @click="saveRiwayatSk" />
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteRiwayatSkDialog" :style="{ width: '450px' }" header="Konfirmasi Hapus" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl" />
                <span v-if="riwayatSkData">
                    Apakah Anda yakin ingin menghapus SK Nomor <b>{{ riwayatSkData.nomor_sk }}</b
                    >?
                </span>
            </div>
            <template #footer>
                <Button label="Tidak" icon="pi pi-times" text @click="deleteRiwayatSkDialog = false" />
                <Button label="Ya, Hapus" icon="pi pi-check" @click="deleteRiwayatSk" />
            </template>
        </Dialog>

        <Dialog v-model:visible="dokumenListDialog" :style="{ width: '70vw' }" maximizable :header="`Manajemen Dokumen: ${selectedPegawai.nama_lengkap}`" :modal="true">
            <Toolbar class="mb-4">
                <template #start>
                    <div class="flex flex-wrap gap-2">
                        <Dropdown v-model="uploadKategori" :options="computedKategoriOptions" placeholder="Pilih Kategori Dokumen" class="w-full md:w-auto" />

                        <FileUpload ref="uploadRef" mode="basic" name="dokumen" @select="onFileSelect" :auto="false" :customUpload="true" chooseLabel="Pilih File" accept="image/*,application/pdf" />
                        <Button label="Upload" icon="pi pi-upload" @click="handleUploadDokumen" :disabled="!fileToUpload || isDokumenLoading" :loading="isDokumenLoading" />
                    </div>
                </template>
            </Toolbar>

            <DataTable :value="dokumenList" :loading="isDokumenLoading" responsiveLayout="scroll">
                <Column field="nama_file_asli" header="Nama File" sortable></Column>
                <Column field="kategori" header="Kategori" sortable></Column>
                <Column header="Aksi">
                    <template #body="slotProps">
                        <Button icon="pi pi-eye" text rounded severity="info" @click="viewDokumen(slotProps.data.path_file)" :loading="isBuktiLoading" v-tooltip.top="'Lihat Dokumen'" />
                        <Button icon="pi pi-trash" text rounded severity="danger" @click="confirmDeleteDokumen(slotProps.data)" v-tooltip.top="'Hapus Dokumen'" />
                    </template>
                </Column>
            </DataTable>
        </Dialog>

        <Dialog v-model:visible="jatahDialog" :style="{ width: '450px' }" :header="`Atur Jatah Cuti: ${selectedPegawai.nama_lengkap}`" :modal="true">
            <div class="flex flex-col gap-6">
                <div>
                    <label for="jatah_tahun" class="block font-bold mb-3">Tahun *</label>
                    <InputNumber id="jatah_tahun" v-model="jatahData.tahun" :useGrouping="false" :invalid="jatahSubmitted && !jatahData.tahun" />
                </div>
                <div>
                    <label for="jatah_kuota" class="block font-bold mb-3">Kuota Total *</label>
                    <InputNumber id="jatah_kuota" v-model="jatahData.kuota_total" :invalid="jatahSubmitted && !jatahData.kuota_total" />
                </div>
            </div>
            <template #footer>
                <Button label="Batal" icon="pi pi-times" text @click="jatahDialog = false" />
                <Button label="Simpan" icon="pi pi-check" @click="saveJatahCuti" />
            </template>
        </Dialog>

        <Dialog v-model:visible="viewJatahDialog" :style="{ width: '450px' }" :header="`Jatah Cuti: ${selectedPegawai.nama_lengkap}`" :modal="true">
            <div v-if="isCutiLoading" class="text-center">
                <i class="pi pi-spin pi-spinner" style="font-size: 2rem"></i>
                <p>Memuat data...</p>
            </div>

            <div v-else-if="viewJatahData && !viewJatahData.error" class="flex flex-col gap-4">
                <div class="text-center font-bold text-xl mb-2">Tahun {{ viewJatahData.tahun }}</div>
                <div class="surface-ground p-3 border-round">
                    <div class="text-500 font-medium mb-1">Total Kuota</div>
                    <div class="text-900 font-medium text-xl">{{ viewJatahData.kuota_total }} Hari</div>
                </div>
                <div class="surface-ground p-3 border-round">
                    <div class="text-500 font-medium mb-1">Kuota Terpakai</div>
                    <div class="text-900 font-medium text-xl">{{ viewJatahData.kuota_terpakai }} Hari</div>
                </div>
                <div class="surface-ground p-3 border-round">
                    <div class="text-500 font-medium mb-1">Sisa Cuti</div>
                    <div class="text-900 font-medium text-xl">{{ viewJatahData.sisa_cuti }} Hari</div>
                </div>
            </div>

            <div v-else>
                <p>{{ viewJatahData?.error || 'Gagal memuat data.' }}</p>
            </div>

            <template #footer>
                <Button label="Tutup" icon="pi pi-times" @click="viewJatahDialog = false" class="p-button-text" />
            </template>
        </Dialog>
        <Dialog v-model:visible="sertifikatListDialog" :style="{ width: '70vw' }" maximizable :header="`Riwayat Sertifikat: ${selectedPegawai.nama_lengkap}`" :modal="true">
            <Toolbar class="mb-4">
                <template #start>
                    <Button label="Tambah Sertifikat" icon="pi pi-plus" severity="secondary" @click="openNewSertifikat" />
                </template>
            </Toolbar>
            <DataTable :value="sertifikatList" :loading="isSertifikatLoading">
                <Column field="judul_sertifikat" header="Judul Sertifikat" sortable></Column>
                <Column field="jenis_sertifikat" header="Jenis" sortable></Column>
                <Column field="tanggal_pelaksanaan" header="Tanggal" sortable></Column>
                <Column field="tingkat" header="Tingkat" sortable></Column>
                <Column header="Aksi">
                    <template #body="slotProps">
                        <Button icon="pi pi-paperclip" text rounded severity="info" @click="openDokumenDialog(slotProps.data, 'riwayat-sertifikat', selectedPegawai.nama_lengkap)" v-tooltip.top="'Dokumen Sertifikat'" />
                        <Button icon="pi pi-pencil" text rounded @click="editSertifikat(slotProps.data)" />
                        <Button icon="pi pi-trash" text rounded severity="danger" @click="confirmDeleteSertifikat(slotProps.data)" />
                    </template>
                </Column>
            </DataTable>
        </Dialog>

        <Dialog v-model:visible="sertifikatFormDialog" :style="{ width: '450px' }" :header="isSertifikatNew ? 'Tambah Sertifikat' : 'Edit Sertifikat'" :modal="true">
            <div class="flex flex-col gap-6">
                <div>
                    <label for="jenis_sertifikat" class="block font-bold mb-3">Jenis Sertifikat *</label>
                    <Dropdown id="jenis_sertifikat" v-model="sertifikatData.jenis_sertifikat" :options="kategoriSertifikatOptions" placeholder="Pilih Jenis" :invalid="sertifikatSubmitted && !sertifikatData.jenis_sertifikat" fluid />
                </div>
                <div>
                    <label for="judul_sertifikat" class="block font-bold mb-3">Judul Sertifikat/Kegiatan *</label>
                    <InputText id="judul_sertifikat" v-model.trim="sertifikatData.judul_sertifikat" required autofocus :invalid="sertifikatSubmitted && !sertifikatData.judul_sertifikat" fluid />
                </div>
                <div>
                    <label for="tanggal_pelaksanaan" class="block font-bold mb-3">Tanggal Pelaksanaan *</label>
                    <Calendar id="tanggal_pelaksanaan" v-model="sertifikatData.tanggal_pelaksanaan" dateFormat="yy-mm-dd" required :invalid="sertifikatSubmitted && !sertifikatData.tanggal_pelaksanaan" />
                </div>
                <div>
                    <label for="tingkat" class="block font-bold mb-3">Tingkat</label>
                    <Dropdown id="tingkat" v-model="sertifikatData.tingkat" :options="tingkatSertifikatOptions" placeholder="Pilih Tingkat" fluid />
                </div>
                <div>
                    <label for="penyelenggara" class="block font-bold mb-3">Penyelenggara</label>
                    <InputText id="penyelenggara" v-model.trim="sertifikatData.penyelenggara" fluid />
                </div>
                <div>
                    <label for="nomor_sertifikat" class="block font-bold mb-3">Nomor Sertifikat</label>
                    <InputText id="nomor_sertifikat" v-model.trim="sertifikatData.nomor_sertifikat" fluid />
                </div>
                <div>
                    <label for="keterangan_sertifikat" class="block font-bold mb-3">Keterangan</label>
                    <Textarea id="keterangan_sertifikat" v-model.trim="sertifikatData.keterangan" rows="3" fluid />
                </div>
            </div>
            <template #footer>
                <Button label="Batal" icon="pi pi-times" text @click="hideSertifikatDialog" />
                <Button label="Simpan" icon="pi pi-check" @click="saveSertifikat" />
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteSertifikatDialog" :style="{ width: '450px' }" header="Konfirmasi Hapus" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl" />
                <span v-if="sertifikatData">
                    Apakah Anda yakin ingin menghapus <b>{{ sertifikatData.judul_sertifikat }}</b
                    >?
                </span>
            </div>
            <template #footer>
                <Button label="Tidak" icon="pi pi-times" text @click="deleteSertifikatDialog = false" />
                <Button label="Ya, Hapus" icon="pi pi-check" @click="deleteSertifikat" />
            </template>
        </Dialog>

        <Dialog v-model:visible="karirDosenDialog" :style="{ width: '80vw' }" maximizable :header="`Karir Dosen: ${selectedPegawai.nama_lengkap}`" :modal="true">
            <TabView>
                <TabPanel header="Riwayat Jabatan Akademik (JAD)">
                    <Toolbar class="mb-4">
                        <template #start>
                            <Button label="Tambah JAD" icon="pi pi-plus" severity="secondary" @click="openNewJad" />
                        </template>
                    </Toolbar>
                    <DataTable :value="jadList" :loading="isKarirDosenLoading">
                        <Column field="jabatan_akademik" header="Jabatan Akademik" sortable></Column>
                        <Column field="pangkat_golongan" header="Pangkat/Gol" sortable></Column>
                        <Column field="nomor_sk" header="Nomor SK"></Column>
                        <Column field="tmt" header="TMT" sortable></Column>
                        <Column header="Aksi">
                            <template #body="slotProps">
                                <Button icon="pi pi-paperclip" text rounded severity="info" @click="openDokumenDialog(slotProps.data, 'riwayat-jad', selectedPegawai.nama_lengkap)" v-tooltip.top="'Dokumen SK JAD'" />
                                <Button icon="pi pi-pencil" text rounded @click="editJad(slotProps.data)" />
                                <Button icon="pi pi-trash" text rounded severity="danger" @click="confirmDeleteJad(slotProps.data)" />
                            </template>
                        </Column>
                    </DataTable>
                </TabPanel>
                <TabPanel header="Riwayat Sertifikasi Dosen (SERDOS)">
                    <Toolbar class="mb-4">
                        <template #start>
                            <Button label="Tambah SERDOS" icon="pi pi-plus" severity="secondary" @click="openNewSerdos" />
                        </template>
                    </Toolbar>
                    <DataTable :value="serdosList" :loading="isKarirDosenLoading">
                        <Column field="nomor_sertifikat" header="Nomor Sertifikat" sortable></Column>
                        <Column field="tanggal_terbit" header="Tanggal Terbit" sortable></Column>
                        <Column field="keterangan" header="Keterangan"></Column>
                        <Column header="Aksi">
                            <template #body="slotProps">
                                <Button icon="pi pi-paperclip" text rounded severity="info" @click="openDokumenDialog(slotProps.data, 'riwayat-serdos', selectedPegawai.nama_lengkap)" v-tooltip.top="'Dokumen Sertifikat'" />
                                <Button icon="pi pi-pencil" text rounded @click="editSerdos(slotProps.data)" />
                                <Button icon="pi pi-trash" text rounded severity="danger" @click="confirmDeleteSerdos(slotProps.data)" />
                            </template>
                        </Column>
                    </DataTable>
                </TabPanel>
            </TabView>
        </Dialog>

        <Dialog v-model:visible="jadFormDialog" :style="{ width: '450px' }" :header="isJadNew ? 'Tambah Riwayat JAD' : 'Edit Riwayat JAD'" :modal="true">
            <div class="flex flex-col gap-6">
                <div>
                    <label class="block font-bold mb-3">Jabatan Akademik *</label>
                    <Dropdown v-model="jadData.jabatan_akademik" :options="jabatanAkademikOptions" placeholder="Pilih Jabatan" :invalid="jadSubmitted && !jadData.jabatan_akademik" fluid />
                </div>
                <div>
                    <label class="block font-bold mb-3">Pangkat / Golongan *</label>
                    <Dropdown v-model="jadData.pangkat_golongan" :options="pangkatGolonganOptions" placeholder="Pilih Pangkat" :invalid="jadSubmitted && !jadData.pangkat_golongan" fluid />
                </div>
                <div>
                    <label class="block font-bold mb-3">Nomor SK *</label>
                    <InputText v-model.trim="jadData.nomor_sk" required :invalid="jadSubmitted && !jadData.nomor_sk" fluid />
                </div>
                <div>
                    <label class="block font-bold mb-3">TMT (Tanggal Mulai Tugas) *</label>
                    <Calendar v-model="jadData.tmt" dateFormat="yy-mm-dd" required :invalid="jadSubmitted && !jadData.tmt" />
                </div>
                <div>
                    <label class="block font-bold mb-3">Kompetensi MK</label>
                    <InputText v-model.trim="jadData.kompetensi_mk" fluid />
                </div>
            </div>
            <template #footer>
                <Button label="Batal" icon="pi pi-times" text @click="jadFormDialog = false" />
                <Button label="Simpan" icon="pi pi-check" @click="saveJad" />
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteJadDialog" :style="{ width: '450px' }" header="Konfirmasi Hapus" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl" />
                <span v-if="jadData"
                    >Apakah Anda yakin ingin menghapus <b>{{ jadData.jabatan_akademik }} ({{ jadData.nomor_sk }})</b>?</span
                >
            </div>
            <template #footer>
                <Button label="Tidak" icon="pi pi-times" text @click="deleteJadDialog = false" />
                <Button label="Ya, Hapus" icon="pi pi-check" @click="deleteJad" />
            </template>
        </Dialog>

        <Dialog v-model:visible="serdosFormDialog" :style="{ width: '450px' }" :header="isSerdosNew ? 'Tambah Riwayat SERDOS' : 'Edit Riwayat SERDOS'" :modal="true">
            <div class="flex flex-col gap-6">
                <div>
                    <label class="block font-bold mb-3">Nomor Sertifikat *</label>
                    <InputText v-model.trim="serdosData.nomor_sertifikat" required autofocus :invalid="serdosSubmitted && !serdosData.nomor_sertifikat" fluid />
                </div>
                <div>
                    <label class="block font-bold mb-3">Tanggal Terbit *</label>
                    <Calendar v-model="serdosData.tanggal_terbit" dateFormat="yy-mm-dd" required :invalid="serdosSubmitted && !serdosData.tanggal_terbit" />
                </div>
                <div>
                    <label class="block font-bold mb-3">Keterangan</label>
                    <Textarea v-model.trim="serdosData.keterangan" rows="3" fluid />
                </div>
            </div>
            <template #footer>
                <Button label="Batal" icon="pi pi-times" text @click="serdosFormDialog = false" />
                <Button label="Simpan" icon="pi pi-check" @click="saveSerdos" />
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteSerdosDialog" :style="{ width: '450px' }" header="Konfirmasi Hapus" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl" />
                <span v-if="serdosData"
                    >Apakah Anda yakin ingin menghapus <b>{{ serdosData.nomor_sertifikat }}</b
                    >?</span
                >
            </div>
            <template #footer>
                <Button label="Tidak" icon="pi pi-times" text @click="deleteSerdosDialog = false" />
                <Button label="Ya, Hapus" icon="pi pi-check" @click="deleteSerdos" />
            </template>
        </Dialog>
    </div>
</template>
