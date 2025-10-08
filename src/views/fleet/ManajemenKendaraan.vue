<script setup>
import { useKendaraanStore } from '@/stores/kendaraan';
import { FilterMatchMode } from '@primevue/core/api';
import { storeToRefs } from 'pinia';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';

// --- Setup ---
const toast = useToast();
const store = useKendaraanStore();
const { list, isLoading } = storeToRefs(store);
const servisDialog = ref(false);
const servisData = ref({});
const selectedKendaraan = ref({});

const dialog = ref(false);
const deleteDialog = ref(false);
const data = ref({});
const submitted = ref(false);
const dt = ref();
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

const jenisOptions = ref(['Mobil', 'Motor']);

onMounted(() => {
    store.fetchAll();
});

// --- CRUD Functions ---
function openNew() {
    data.value = {};
    submitted.value = false;
    dialog.value = true;
}

function hideDialog() {
    dialog.value = false;
    submitted.value = false;
}

async function saveData() {
    submitted.value = true;
    if (!data.value.nama?.trim() || !data.value.nomor_polisi?.trim() || !data.value.jenis) {
        toast.add({ severity: 'warn', summary: 'Perhatian', detail: 'Harap isi semua field yang wajib diisi.', life: 3000 });
        return;
    }

    try {
        const payload = {
            jenis: data.value.jenis,
            nama: data.value.nama,
            nomor_polisi: data.value.nomor_polisi,
            merk: data.value.merk,
            model: data.value.model,
            tahun: data.value.tahun
        };
        if (data.value.id) {
            await store.update(data.value.id, payload);
            toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Data Kendaraan Diperbarui', life: 3000 });
        } else {
            await store.create(payload);
            toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Kendaraan Baru Dibuat', life: 3000 });
        }
        dialog.value = false;
        data.value = {};
    } catch (error) {
        const errorMessage = error.response?.data?.error || 'Terjadi kesalahan saat menyimpan';
        toast.add({ severity: 'error', summary: 'Gagal', detail: errorMessage, life: 4000 });
    }
}

function editData(editData) {
    data.value = { ...editData };
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
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Data Kendaraan Dihapus', life: 3000 });
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Terjadi kesalahan saat menghapus', life: 3000 });
    }
}

// Fungsi untuk format tanggal YYYY-MM-DD
function formatDate(date) {
    if (!date) return null;
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function openServisDialog(data) {
    selectedKendaraan.value = data;
    servisData.value = {
        tanggal_servis: new Date(),
        odometer_saat_servis: null,
        deskripsi: '',
        biaya: null
    };
    submitted.value = false;
    servisDialog.value = true;
}

async function saveServis() {
    submitted.value = true;
    if (!servisData.value.tanggal_servis || !servisData.value.biaya) {
        toast.add({ severity: 'warn', summary: 'Perhatian', detail: 'Tanggal dan Biaya Servis wajib diisi.', life: 3000 });
        return;
    }

    try {
        const payload = {
            ...servisData.value,
            tanggal_servis: formatDate(servisData.value.tanggal_servis)
        };

        await store.tambahServis(selectedKendaraan.value.id, payload);
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Biaya servis berhasil ditambahkan', life: 3000 });
        servisDialog.value = false;
    } catch (error) {
        const errorMessage = error.response?.data?.error || 'Terjadi kesalahan';
        toast.add({ severity: 'error', summary: 'Gagal', detail: errorMessage, life: 4000 });
    }
}
</script>

<template>
    <div>
        <div class="card">
            <Toolbar class="mb-6">
                <template #start>
                    <Button label="Tambah Kendaraan" icon="pi pi-plus" severity="secondary" class="mr-2" @click="openNew" />
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
                currentPageReportTemplate="Menampilkan {first} sampai {last} dari {totalRecords} kendaraan"
            >
                <template #header>
                    <div class="flex flex-wrap gap-2 items-center justify-between">
                        <h4 class="m-0">Manajemen Kendaraan</h4>
                        <IconField>
                            <InputIcon> <i class="pi pi-search" /> </InputIcon>
                            <InputText v-model="filters['global'].value" placeholder="Cari..." />
                        </IconField>
                    </div>
                </template>

                <Column field="nama" header="Nama Kendaraan" sortable style="min-width: 16rem"></Column>
                <Column field="nomor_polisi" header="No. Polisi" sortable style="min-width: 10rem"></Column>
                <Column field="jenis" header="Jenis" sortable style="min-width: 8rem"></Column>
                <Column field="merk" header="Merk" sortable style="min-width: 10rem"></Column>
                <Column field="model" header="Model" sortable style="min-width: 10rem"></Column>
                <Column field="tahun" header="Tahun" sortable></Column>
                <Column field="status" header="Status" sortable>
                    <template #body="slotProps">
                        <Tag :value="slotProps.data.status" />
                    </template>
                </Column>
                <Column :exportable="false" style="min-width: 12rem" header="Aksi">
                    <template #body="slotProps">
                        <Button icon="pi pi-wrench" outlined rounded severity="secondary" class="mr-2" @click="openServisDialog(slotProps.data)" v-tooltip.top="'Tambah Biaya Servis'" />
                        <Button icon="pi pi-pencil" outlined rounded class="mr-2" @click="editData(slotProps.data)" />
                        <Button icon="pi pi-trash" outlined rounded severity="danger" @click="confirmDelete(slotProps.data)" />
                    </template>
                </Column>
            </DataTable>
        </div>

        <Dialog v-model:visible="dialog" :style="{ width: '450px' }" header="Detail Kendaraan" :modal="true">
            <div class="flex flex-col gap-6">
                <div>
                    <label for="nama" class="block font-bold mb-3">Nama Kendaraan</label>
                    <InputText id="nama" v-model.trim="data.nama" required autofocus :invalid="submitted && !data.nama" fluid />
                    <small v-if="submitted && !data.nama" class="text-red-500">Nama Kendaraan wajib diisi.</small>
                </div>
                <div>
                    <label for="nomor_polisi" class="block font-bold mb-3">Nomor Polisi</label>
                    <InputText id="nomor_polisi" v-model.trim="data.nomor_polisi" required :invalid="submitted && !data.nomor_polisi" fluid />
                    <small v-if="submitted && !data.nomor_polisi" class="text-red-500">Nomor Polisi wajib diisi.</small>
                </div>
                <div>
                    <label for="jenis" class="block font-bold mb-3">Jenis</label>
                    <Dropdown id="jenis" v-model="data.jenis" :options="jenisOptions" placeholder="Pilih Jenis" :invalid="submitted && !data.jenis" fluid />
                    <small v-if="submitted && !data.jenis" class="text-red-500">Jenis wajib dipilih.</small>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label for="merk" class="block font-bold mb-3">Merk</label>
                        <InputText id="merk" v-model.trim="data.merk" fluid />
                    </div>
                    <div>
                        <label for="model" class="block font-bold mb-3">Model</label>
                        <InputText id="model" v-model.trim="data.model" fluid />
                    </div>
                </div>
                <div>
                    <label for="tahun" class="block font-bold mb-3">Tahun</label>
                    <InputNumber id="tahun" v-model="data.tahun" :useGrouping="false" />
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
                    >Apakah Anda yakin ingin menghapus <b>{{ data.nama }}</b
                    >?</span
                >
            </div>
            <template #footer>
                <Button label="Tidak" icon="pi pi-times" text @click="deleteDialog = false" />
                <Button label="Ya" icon="pi pi-check" @click="deleteData" />
            </template>
        </Dialog>
        <Dialog v-model:visible="servisDialog" :style="{ width: '450px' }" :header="`Tambah Biaya Servis: ${selectedKendaraan.nama}`" :modal="true">
            <div class="flex flex-col gap-6">
                <div>
                    <label for="tanggal_servis" class="block font-bold mb-3">Tanggal Servis</label>
                    <Calendar id="tanggal_servis" v-model="servisData.tanggal_servis" required dateFormat="yy-mm-dd" :invalid="submitted && !servisData.tanggal_servis" />
                    <small v-if="submitted && !servisData.tanggal_servis" class="text-red-500">Tanggal Servis harus diisi.</small>
                </div>
                <div>
                    <label for="odometer" class="block font-bold mb-3">Odometer (KM)</label>
                    <InputNumber id="odometer" v-model="servisData.odometer_saat_servis" />
                </div>
                <div>
                    <label for="biaya" class="block font-bold mb-3">Biaya (Rp)</label>
                    <InputNumber id="biaya" v-model="servisData.biaya" mode="currency" currency="IDR" locale="id-ID" required :invalid="submitted && !servisData.biaya" />
                    <small v-if="submitted && !servisData.biaya" class="text-red-500">Biaya harus diisi.</small>
                </div>
                <div>
                    <label for="deskripsi_servis" class="block font-bold mb-3">Deskripsi</label>
                    <Textarea id="deskripsi_servis" v-model.trim="servisData.deskripsi" rows="3" fluid />
                </div>
            </div>
            <template #footer>
                <Button label="Batal" icon="pi pi-times" text @click="servisDialog = false" />
                <Button label="Simpan" icon="pi pi-check" @click="saveServis" />
            </template>
        </Dialog>
    </div>
</template>
