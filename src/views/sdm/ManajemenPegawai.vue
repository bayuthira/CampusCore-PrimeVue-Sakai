<script setup>
import { usePegawaiStore } from '@/stores/pegawai';
import { useProdiStore } from '@/stores/prodi';
import { FilterMatchMode } from '@primevue/core/api';
import { storeToRefs } from 'pinia';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';

// --- Setup ---
const toast = useToast();
const store = usePegawaiStore();
const prodiStore = useProdiStore();
const { list, isLoading } = storeToRefs(store);
const { prodiList } = storeToRefs(prodiStore);

const dialog = ref(false);
const deleteDialog = ref(false);
const data = ref({});
const submitted = ref(false);
const dt = ref();
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

// Opsi untuk dropdown
const jenisKelaminOptions = ref(['L', 'P']);
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
                        <Button icon="pi pi-pencil" outlined rounded class="mr-2" @click="editData(slotProps.data)" />
                        <Button icon="pi pi-trash" outlined rounded severity="danger" @click="confirmDelete(slotProps.data)" />
                    </template>
                </Column>
            </DataTable>
        </div>

        <Dialog v-model:visible="dialog" :style="{ width: '750px' }" header="Detail Pegawai" :modal="true">
            <div class="grid grid-cols-12 gap-4">
                <div class="col-span-12 md:col-span-6 flex flex-col gap-6">
                    <div>
                        <label for="nik" class="block font-bold mb-3">NIK / Username *</label>
                        <InputText id="nik" v-model.trim="data.nik" required autofocus :invalid="submitted && !data.nik" fluid />
                    </div>
                    <div>
                        <label for="nama_lengkap" class="block font-bold mb-3">Nama Lengkap *</label>
                        <InputText id="nama_lengkap" v-model.trim="data.nama_lengkap" required :invalid="submitted && !data.nama_lengkap" fluid />
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label for="gelar_depan" class="block font-bold mb-3">Gelar Depan</label>
                            <InputText id="gelar_depan" v-model.trim="data.gelar_depan" fluid />
                        </div>
                        <div>
                            <label for="gelar_belakang" class="block font-bold mb-3">Gelar Belakang</label>
                            <InputText id="gelar_belakang" v-model.trim="data.gelar_belakang" fluid />
                        </div>
                    </div>
                    <div>
                        <label for="email" class="block font-bold mb-3">Email</label>
                        <InputText id="email" v-model.trim="data.email" fluid />
                    </div>
                    <div>
                        <label for="no_ktp" class="block font-bold mb-3">No. KTP</label>
                        <InputText id="no_ktp" v-model.trim="data.no_ktp" fluid />
                    </div>
                    <div>
                        <label for="status_nikah" class="block font-bold mb-3">Status Nikah</label>
                        <Dropdown id="status_nikah" v-model="data.status_nikah" :options="statusNikahOptions" placeholder="Pilih Status" fluid />
                    </div>
                    <div>
                        <label for="jenis_kelamin" class="block font-bold mb-3">Jenis Kelamin</label>
                        <Dropdown id="jenis_kelamin" v-model="data.jenis_kelamin" :options="jenisKelaminOptions" placeholder="Pilih" fluid />
                    </div>
                    <div v-if="!data.id">
                        <label for="password" class="block font-bold mb-3">Password Akun</label>
                        <Password id="password" v-model="data.password" :feedback="false" toggleMask fluid placeholder="Isi untuk membuat akun" />
                    </div>
                </div>
                <div class="col-span-12 md:col-span-6 flex flex-col gap-6">
                    <div>
                        <label for="kategori_pegawai" class="block font-bold mb-3">Kategori Pegawai</label>
                        <Dropdown id="kategori_pegawai" v-model="data.kategori_pegawai" :options="kategoriPegawaiOptions" placeholder="Pilih Kategori" fluid />
                    </div>
                    <template v-if="data.kategori_pegawai === 'Tenaga Pendidik'">
                        <div>
                            <label for="nidn" class="block font-bold mb-3">NIDN *</label>
                            <InputText id="nidn" v-model.trim="data.nidn" fluid :invalid="submitted && !data.nidn" />
                        </div>
                        <div>
                            <label for="prodi" class="block font-bold mb-3">Homebase Prodi *</label>
                            <Dropdown id="prodi" v-model="data.prodi_id" :options="prodiList" optionLabel="nama_prodi" optionValue="id" placeholder="Pilih Prodi" :invalid="submitted && !data.prodi_id" fluid filter />
                        </div>
                    </template>
                    <div>
                        <label for="status_pegawai" class="block font-bold mb-3">Status Kepegawaian</label>
                        <Dropdown id="status_pegawai" v-model="data.status_pegawai" :options="statusPegawaiOptions" placeholder="Pilih Status" fluid />
                    </div>
                    <div>
                        <label for="jabatan" class="block font-bold mb-3">Jabatan</label>
                        <InputText id="jabatan" v-model.trim="data.jabatan" fluid />
                    </div>
                    <div>
                        <label for="tanggal_masuk" class="block font-bold mb-3">Tanggal Masuk</label>
                        <Calendar id="tanggal_masuk" v-model="data.tanggal_masuk" dateFormat="yy-mm-dd" />
                    </div>
                </div>
            </div>
            <template #footer>
                <Button label="Batal" icon="pi pi-times" text @click="hideDialog" />
                <Button label="Simpan" icon="pi pi-check" @click="saveData" />
            </template>
        </Dialog>

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
    </div>
</template>
