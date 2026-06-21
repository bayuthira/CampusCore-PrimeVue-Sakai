<script setup>
import { useAsetHabisPakaiStore } from '@/stores/asetHabisPakai';
import { FilterMatchMode } from '@primevue/core/api';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import autoTable from 'jspdf-autotable';
import { storeToRefs } from 'pinia';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';
import { exportToCsv } from '@/utils/exportCsv';

// --- Setup ---
const toast = useToast();
const store = useAsetHabisPakaiStore();
// PERUBAHAN: Mengambil 'asetHabisPakaiList' dan menamainya 'list' untuk digunakan di template
const { asetHabisPakaiList: list, isLoading } = storeToRefs(store);
const stokDialog = ref(false);
const stokData = ref({});
const stokAction = ref(''); // Untuk membedakan 'tambah' atau 'ambil'
const historiDialog = ref(false);
const historiList = ref([]);
const selectedBarang = ref({});
const opnameDialog = ref(false);
const opnameData = ref({});

const dialog = ref(false);
const deleteDialog = ref(false);
const barang = ref({});
const submitted = ref(false);
const dt = ref();
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

onMounted(() => {
    // PERUBAHAN: Memanggil nama fungsi baru
    store.fetchAsetHabisPakai();
});

// --- Export Functions ---
const exportItems = ref([
    { label: 'CSV', icon: 'pi pi-file', command: () => dt.value.exportCSV() },
    { label: 'CSV', icon: 'pi pi-file-excel', command: exportExcel },
    { label: 'PDF', icon: 'pi pi-file-pdf', command: exportPDF }
]);

function exportExcel() {
    const data = list.value;
    exportToCsv(data, 'data-aset-habis-pakai.csv');
}

function exportPDF() {
    const doc = new jsPDF();
    const tableHead = [['Nama Barang', 'Satuan', 'Stok', 'Batas Min. Stok', 'Deskripsi']];
    const tableBody = list.value.map((item) => [item.nama_barang, item.satuan, item.stok, item.batas_minimum_stok, item.deskripsi]);
    autoTable(doc, { head: tableHead, body: tableBody });
    doc.save('data-aset-habis-pakai.pdf');
}

// --- CRUD Functions ---
function openNew() {
    barang.value = {};
    submitted.value = false;
    dialog.value = true;
}

function hideDialog() {
    dialog.value = false;
    submitted.value = false;
}

async function saveData() {
    submitted.value = true;
    if (!barang.value.nama_barang?.trim() || !barang.value.satuan?.trim() || barang.value.batas_minimum_stok == null) {
        return;
    }

    try {
        const payload = {
            nama_barang: barang.value.nama_barang,
            deskripsi: barang.value.deskripsi,
            satuan: barang.value.satuan,
            batas_minimum_stok: barang.value.batas_minimum_stok
        };
        if (barang.value.id) {
            // PERUBAHAN: Memanggil nama fungsi baru
            await store.updateAsetHabisPakai(barang.value.id, payload);
            toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Data Diperbarui', life: 3000 });
        } else {
            // PERUBAHAN: Memanggil nama fungsi baru
            await store.createAsetHabisPakai(payload);
            toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Data Baru Dibuat', life: 3000 });
        }
        dialog.value = false;
        barang.value = {};
    } catch (error) {
        const errorMessage = error.response?.data?.error || 'Terjadi kesalahan saat menyimpan';
        toast.add({ severity: 'error', summary: 'Gagal', detail: errorMessage, life: 4000 });
    }
}

function editData(data) {
    barang.value = { ...data };
    dialog.value = true;
}

function confirmDelete(data) {
    barang.value = data;
    deleteDialog.value = true;
}

async function deleteData() {
    try {
        // PERUBAHAN: Memanggil nama fungsi baru
        await store.deleteAsetHabisPakai(barang.value.id);
        deleteDialog.value = false;
        barang.value = {};
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Data Dihapus', life: 3000 });
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Terjadi kesalahan saat menghapus', life: 3000 });
    }
}

function openStokDialog(data, action) {
    stokAction.value = action;
    stokData.value = {
        id: data.id,
        nama_barang: data.nama_barang,
        jumlah: null,
        catatan: '',
        tanggal_dan_jam: new Date() // <-- Nilai default: waktu sekarang
    };
    stokDialog.value = true;
}

async function saveStok() {
    if (!stokData.value.jumlah || stokData.value.jumlah <= 0) {
        toast.add({ severity: 'warn', summary: 'Perhatian', detail: 'Jumlah harus lebih besar dari 0.', life: 3000 });
        return;
    }

    try {
        const payload = {
            jumlah: stokData.value.jumlah,
            catatan: stokData.value.catatan,
            tanggal_dan_jam: stokData.value.tanggal_dan_jam // <-- Kirim data tanggal
        };

        if (stokAction.value === 'tambah') {
            await store.tambahStok(stokData.value.id, payload);
            toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Stok berhasil ditambahkan', life: 3000 });
        } else {
            await store.ambilStok(stokData.value.id, payload);
            toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Stok berhasil diambil', life: 3000 });
        }
        stokDialog.value = false;
    } catch (error) {
        const errorMessage = error.response?.data?.error || 'Terjadi kesalahan';
        toast.add({ severity: 'error', summary: 'Gagal', detail: errorMessage, life: 4000 });
    }
}

async function openHistoriDialog(data) {
    selectedBarang.value = data;
    try {
        historiList.value = await store.fetchHistori(data.id);
        historiDialog.value = true;
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Tidak dapat memuat histori.', life: 3000 });
    }
}

function formatDateTime(value) {
    if (!value) return '';
    return new Date(value).toLocaleString('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short'
    });
}

function openOpnameDialog(data) {
    opnameData.value = {
        id: data.id,
        nama_barang: data.nama_barang,
        stok_fisik: null,
        catatan: ''
    };
    opnameDialog.value = true;
}

async function saveOpname() {
    if (opnameData.value.stok_fisik == null || opnameData.value.stok_fisik < 0) {
        toast.add({ severity: 'warn', summary: 'Perhatian', detail: 'Stok fisik harus diisi dan tidak boleh negatif.', life: 3000 });
        return;
    }

    try {
        const payload = {
            stok_fisik: opnameData.value.stok_fisik,
            catatan: opnameData.value.catatan
        };
        await store.stokOpname(opnameData.value.id, payload);
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Stok opname berhasil disimpan', life: 3000 });
        opnameDialog.value = false;
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
                    <Button label="Tambah Barang" icon="pi pi-plus" severity="secondary" class="mr-2" @click="openNew" />
                </template>
                <template #end>
                    <SplitButton label="Export" icon="pi pi-upload" :model="exportItems" severity="secondary"></SplitButton>
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
                export-filename="data-aset-habis-pakai"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                :rowsPerPageOptions="[5, 10, 25]"
                currentPageReportTemplate="Menampilkan {first} sampai {last} dari {totalRecords} data"
            >
                <template #header>
                    <div class="flex flex-wrap gap-2 items-center justify-between">
                        <h4 class="m-0">Manajemen Aset Habis Pakai</h4>
                        <IconField>
                            <InputIcon> <i class="pi pi-search" /> </InputIcon>
                            <InputText v-model="filters['global'].value" placeholder="Cari..." />
                        </IconField>
                    </div>
                </template>

                <Column field="nama_barang" header="Nama Barang" sortable style="min-width: 16rem"></Column>
                <Column field="stok" header="Stok" sortable style="min-width: 8rem"></Column>
                <Column field="satuan" header="Satuan" sortable style="min-width: 10rem"></Column>
                <Column field="batas_minimum_stok" header="Batas Min. Stok" sortable style="min-width: 10rem"></Column>
                <Column field="deskripsi" header="Deskripsi" sortable style="min-width: 20rem"></Column>
                <Column :exportable="false" style="min-width: 12rem" header="Aksi">
                    <template #body="slotProps">
                        <Button icon="pi pi-plus" outlined rounded severity="success" class="mr-2" @click="openStokDialog(slotProps.data, 'tambah')" v-tooltip.top="'Tambah Stok'" />
                        <Button icon="pi pi-minus" outlined rounded severity="warning" class="mr-2" @click="openStokDialog(slotProps.data, 'ambil')" v-tooltip.top="'Ambil Stok'" />
                        <Button icon="pi pi-check-square" outlined rounded severity="help" class="mr-2" @click="openOpnameDialog(slotProps.data)" v-tooltip.top="'Stok Opname'" />
                        <Button icon="pi pi-history" outlined rounded severity="info" class="mr-2" @click="openHistoriDialog(slotProps.data)" v-tooltip.top="'Lihat Histori'" />
                        <Button icon="pi pi-pencil" outlined rounded class="mr-2" @click="editData(slotProps.data)" v-tooltip.top="'Edit Data'" />
                        <Button icon="pi pi-trash" outlined rounded severity="danger" @click="confirmDelete(slotProps.data)" v-tooltip.top="'Hapus Data'" />
                    </template>
                </Column>
            </DataTable>
        </div>

        <Dialog v-model:visible="dialog" :style="{ width: '450px' }" header="Detail Barang" :modal="true">
            <div class="flex flex-col gap-6">
                <div>
                    <label for="nama_barang" class="block font-bold mb-3">Nama Barang</label>
                    <InputText id="nama_barang" v-model.trim="barang.nama_barang" required autofocus :invalid="submitted && !barang.nama_barang" fluid />
                    <small v-if="submitted && !barang.nama_barang" class="text-red-500">Harus diisi !</small>
                </div>
                <div>
                    <label for="satuan" class="block font-bold mb-3">Satuan</label>
                    <InputText id="satuan" v-model.trim="barang.satuan" required :invalid="submitted && !barang.satuan" fluid />
                    <small v-if="submitted && !barang.satuan" class="text-red-500">Harus diisi !</small>
                </div>
                <div>
                    <label for="batas_minimum_stok" class="block font-bold mb-3">Batas Minimum Stok</label>
                    <InputNumber id="batas_minimum_stok" v-model="barang.batas_minimum_stok" required :invalid="submitted && barang.batas_minimum_stok == null" />
                    <small v-if="submitted && !barang.batas_minimum_stok" class="text-red-500">Harus diisi !</small>
                </div>
                <div>
                    <label for="deskripsi" class="block font-bold mb-3">Deskripsi</label>
                    <Textarea id="deskripsi" v-model.trim="barang.deskripsi" rows="3" fluid />
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
                <span v-if="barang"
                    >Apakah Anda yakin ingin menghapus <b>{{ barang.nama_barang }}</b
                    >?</span
                >
            </div>
            <template #footer>
                <Button label="Tidak" icon="pi pi-times" text @click="deleteDialog = false" />
                <Button label="Ya" icon="pi pi-check" @click="deleteData" />
            </template>
        </Dialog>
        <Dialog v-model:visible="stokDialog" :style="{ width: '450px' }" :header="`${stokAction === 'tambah' ? 'Tambah' : 'Ambil'} Stok: ${stokData.nama_barang}`" :modal="true">
            <div class="flex flex-col gap-6">
                <div>
                    <label for="jumlah_stok" class="block font-bold mb-3">Jumlah</label>
                    <InputNumber id="jumlah_stok" v-model="stokData.jumlah" required autofocus />
                </div>

                <div>
                    <label for="tanggal_dan_jam" class="block font-bold mb-3">Tanggal & Jam Transaksi</label>
                    <Calendar id="tanggal_dan_jam" v-model="stokData.tanggal_dan_jam" showTime hourFormat="24" dateFormat="dd/mm/yy" />
                </div>

                <div>
                    <label for="catatan_stok" class="block font-bold mb-3">Catatan</label>
                    <Textarea id="catatan_stok" v-model.trim="stokData.catatan" rows="3" fluid />
                </div>
            </div>
            <template #footer>
                <Button label="Batal" icon="pi pi-times" text @click="stokDialog = false" />
                <Button label="Simpan" icon="pi pi-check" @click="saveStok" />
            </template>
        </Dialog>
        <Dialog v-model:visible="historiDialog" :style="{ width: '75vw' }" maximizable :header="`Histori Stok: ${selectedBarang.nama_barang}`" :modal="true">
            <DataTable :value="historiList" :paginator="true" :rows="5" responsiveLayout="scroll">
                <Column field="tanggal_transaksi" header="Tanggal" sortable>
                    <template #body="slotProps">
                        {{ formatDateTime(slotProps.data.tanggal_transaksi) }}
                    </template>
                </Column>
                <Column field="tipe_transaksi" header="Tipe" sortable></Column>
                <Column field="jumlah" header="Jumlah" sortable>
                    <template #body="slotProps">
                        <Tag :severity="slotProps.data.jumlah > 0 ? 'success' : 'danger'" :value="slotProps.data.jumlah > 0 ? `+${slotProps.data.jumlah}` : slotProps.data.jumlah"></Tag>
                    </template>
                </Column>
                <Column field="saldo_sebelum" header="Saldo Sebelum" sortable></Column>
                <Column field="saldo_setelah" header="Saldo Setelah" sortable></Column>
                <Column field="nama_user_aksi" header="Oleh" sortable></Column>
                <Column field="catatan" header="Catatan"></Column>
            </DataTable>
            <template #footer>
                <Button label="Tutup" icon="pi pi-times" @click="historiDialog = false" class="p-button-text" />
            </template>
        </Dialog>
        <Dialog v-model:visible="opnameDialog" :style="{ width: '450px' }" :header="`Stok Opname: ${opnameData.nama_barang}`" :modal="true">
            <div class="flex flex-col gap-6">
                <div>
                    <label for="stok_fisik" class="block font-bold mb-3">Stok Fisik (Hasil Hitungan)</label>
                    <InputNumber id="stok_fisik" v-model="opnameData.stok_fisik" required autofocus />
                </div>
                <div>
                    <label for="catatan_opname" class="block font-bold mb-3">Catatan</label>
                    <Textarea id="catatan_opname" v-model.trim="opnameData.catatan" rows="3" fluid />
                </div>
            </div>
            <template #footer>
                <Button label="Batal" icon="pi pi-times" text @click="opnameDialog = false" />
                <Button label="Simpan" icon="pi pi-check" @click="saveOpname" />
            </template>
        </Dialog>
    </div>
</template>
