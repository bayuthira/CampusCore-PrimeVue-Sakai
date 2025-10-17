<script setup>
import { useAuthStore } from '@/stores/auth';
import { usePegawaiStore } from '@/stores/pegawai';
import { usePendidikanStore } from '@/stores/pendidikan';
import { useProdiStore } from '@/stores/prodi';
import { useRiwayatSkStore } from '@/stores/riwayatSk';
import { FilterMatchMode } from '@primevue/core/api';
import { storeToRefs } from 'pinia';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';

// --- Setup ---
const toast = useToast();
const store = usePegawaiStore();
const prodiStore = useProdiStore();
const { list, isLoading } = storeToRefs(store);
const { prodiList } = storeToRefs(prodiStore);
const riwayatSkStore = useRiwayatSkStore();
const authStore = useAuthStore();
const pendidikanStore = usePendidikanStore();
const { list: pendidikanList, isLoading: isPendidikanLoading } = storeToRefs(pendidikanStore);
const { list: riwayatSkList, isLoading: isRiwayatSkLoading } = storeToRefs(riwayatSkStore);

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

// Opsi untuk dropdown
const jenisKelaminOptions = ref([
    { label: 'Laki-laki', value: 'L' },
    { label: 'Perempuan', value: 'P' }
]);
const statusNikahOptions = ref(['Menikah', 'Belum Menikah', 'Cerai Hidup', 'Cerai Mati']);
const kategoriPegawaiOptions = ref(['Tenaga Pendidik', 'Tenaga Kependidikan']);
const statusPegawaiOptions = ref(['Tetap', 'Kontrak', 'Honorer']);

onMounted(() => {
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
            tanggal_lahir: formatDate(data.value.tanggal_lahir),
            tanggal_masuk: formatDate(data.value.tanggal_masuk)
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
                        <Button icon="pi pi-book" outlined rounded severity="info" class="mr-2" @click="openPendidikanList(slotProps.data)" v-tooltip.top="'Riwayat Pendidikan'" />
                        <Button icon="pi pi-file-o" outlined rounded severity="secondary" class="mr-2" @click="openRiwayatSkList(slotProps.data)" v-tooltip.top="'Riwayat SK'" />
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
    </div>
</template>
