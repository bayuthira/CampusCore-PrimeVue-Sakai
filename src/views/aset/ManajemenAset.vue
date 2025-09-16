<script setup>
import { useAsetStore } from '@/stores/aset';
import { useJenisAsetStore } from '@/stores/jenisAset';
import { useLookupStore } from '@/stores/lookup';
import { useRuanganStore } from '@/stores/ruangan';
import { FilterMatchMode } from '@primevue/core/api';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import autoTable from 'jspdf-autotable';
import { storeToRefs } from 'pinia';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';
import * as XLSX from 'xlsx';

// --- Setup ---
const toast = useToast();
const asetStore = useAsetStore();
const jenisAsetStore = useJenisAsetStore();
const lookupStore = useLookupStore();
const ruanganStore = useRuanganStore();
const historiDialog = ref(false);
const asetHistori = ref([]);
const selectedAset = ref({});
const filteredUsers = ref([]);
const biayaDialog = ref(false);
const biayaData = ref({});
const buktiFile = ref(null);
const daftarBiayaDialog = ref(false);
const daftarBiayaList = ref([]);
const deleteBiayaDialog = ref(false);
const biayaToDelete = ref({});
const isBuktiLoading = ref(false);

const { asetList, isLoading } = storeToRefs(asetStore);
const { jenisAsetList } = storeToRefs(jenisAsetStore);
const { kondisiAset, asetHistoriStatuses, tipeBiaya } = storeToRefs(lookupStore);
const { ruanganList } = storeToRefs(ruanganStore);

const historiUpdateDialog = ref(false);
const historiData = ref({});
const dialog = ref(false);
const deleteDialog = ref(false);
const aset = ref({});
const submitted = ref(false);
const dt = ref();
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

onMounted(() => {
    asetStore.fetchAset();
    jenisAsetStore.fetchJenisAset();
    lookupStore.fetchKondisiAset();
    ruanganStore.fetchRuangan();
    lookupStore.fetchAsetHistoriStatuses();
    lookupStore.fetchTipeBiaya();
});

function formatDate(date) {
    if (!date) return null;
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
}

// --- CRUD Functions ---
function openNew() {
    aset.value = {};
    submitted.value = false;
    dialog.value = true;
}

function hideDialog() {
    dialog.value = false;
    submitted.value = false;
}

async function saveData() {
    submitted.value = true;
    if (!aset.value.nama_aset?.trim() || !aset.value.kode_aset?.trim() || !aset.value.jenis_aset_id || !aset.value.kondisi) {
        return;
    }

    try {
        const payload = { ...aset.value, tanggal_pembelian: formatDate(aset.value.tanggal_pembelian) };
        // Pastikan jenis_aset_id adalah string, bukan objek
        if (typeof payload.jenis_aset_id === 'object' && payload.jenis_aset_id !== null) {
            payload.jenis_aset_id = payload.jenis_aset_id.id;
        }

        if (aset.value.id) {
            await asetStore.updateAset(aset.value.id, payload);
            toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Data Aset Diperbarui', life: 3000 });
        } else {
            await asetStore.createAset(payload);
            toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Aset Baru Dibuat', life: 3000 });
        }
        dialog.value = false;
        aset.value = {};
    } catch (error) {
        // --- PERBAIKAN DI SINI ---
        // Ambil pesan error spesifik dari backend, jika tidak ada, gunakan pesan default.
        const errorMessage = error.response?.data?.error || 'Terjadi kesalahan saat menyimpan';

        toast.add({
            severity: 'error',
            summary: 'Gagal',
            detail: errorMessage, // Gunakan pesan dari backend
            life: 4000 // Durasi sedikit lebih lama agar bisa dibaca
        });
    }
}

function editData(data) {
    aset.value = { ...data };
    dialog.value = true;
}

function confirmDelete(data) {
    aset.value = data;
    deleteDialog.value = true;
}

async function deleteData() {
    try {
        await asetStore.deleteAset(aset.value.id);
        deleteDialog.value = false;
        aset.value = {};
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Data Aset Dihapus', life: 3000 });
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Terjadi kesalahan saat menghapus', life: 3000 });
    }
}

function openHistoriUpdateDialog(data) {
    historiData.value = {
        id: data.id,
        nama_aset: data.nama_aset,
        status: null,
        ke_ruangan_id: null,
        catatan: '',
        peminjam: null // Kita gunakan 'peminjam' untuk menampung objek user
    };
    historiUpdateDialog.value = true;
}

async function saveHistoriUpdate() {
    const status = historiData.value.status;
    if (!status) {
        toast.add({ severity: 'warn', summary: 'Perhatian', detail: 'Status histori harus dipilih.', life: 3000 });
        return;
    }

    try {
        let promise;
        let payload = { catatan: historiData.value.catatan };

        if (status === 'Dipinjam') {
            if (!historiData.value.peminjam || !historiData.value.estimasi_tanggal_kembali) {
                toast.add({ severity: 'warn', summary: 'Perhatian', detail: 'Peminjam dan tanggal kembali harus diisi.', life: 3000 });
                return;
            }
            payload.user_peminjam_id = historiData.value.peminjam.id;
            payload.estimasi_tanggal_kembali = historiData.value.estimasi_tanggal_kembali;
            promise = asetStore.pinjamAset(historiData.value.id, payload);
        } else if (status === 'Dikembalikan') {
            promise = asetStore.kembalikanAset(aset.value.peminjaman_id, payload);
        } else {
            payload.status = status;
            if (['Dipindahkan', 'Ditempatkan'].includes(status)) {
                if (!historiData.value.ke_ruangan_id) {
                    toast.add({ severity: 'warn', summary: 'Perhatian', detail: 'Ruangan tujuan harus dipilih.', life: 3000 });
                    return;
                }
                payload.ke_ruangan_id = historiData.value.ke_ruangan_id;
            }
            promise = asetStore.tambahHistori(historiData.value.id, payload);
        }

        await promise;
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Histori aset berhasil diperbarui', life: 3000 });
        historiUpdateDialog.value = false;
    } catch (error) {
        const errorMessage = error.response?.data?.error || 'Gagal memperbarui histori';
        toast.add({ severity: 'error', summary: 'Gagal', detail: errorMessage, life: 3000 });
    }
}

async function openHistoriDialog(data) {
    selectedAset.value = data;
    try {
        asetHistori.value = await asetStore.fetchAsetHistori(data.id);
        historiDialog.value = true;
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Tidak dapat memuat histori aset.', life: 3000 });
    }
}

function formatDateTime(value) {
    if (!value) return '';
    return new Date(value).toLocaleString('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short'
    });
}

// --- Export Functions ---
const exportItems = ref([
    { label: 'CSV', icon: 'pi pi-file', command: () => dt.value.exportCSV() },
    { label: 'Excel', icon: 'pi pi-file-excel', command: exportExcel },
    { label: 'PDF', icon: 'pi pi-file-pdf', command: exportPDF }
]);

function exportExcel() {
    const data = asetList.value.map((item) => ({
        'Kode Aset': item.kode_aset,
        'Nama Aset': item.nama_aset,
        'Jenis Aset': item.nama_jenis,
        Lokasi: item.nama_ruangan || '-',
        Kondisi: item.kondisi,
        'Tanggal Pembelian': item.tanggal_pembelian
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Aset');
    XLSX.writeFile(workbook, 'data-aset.xlsx');
}

function exportPDF() {
    const doc = new jsPDF();
    const tableHead = [['Kode Aset', 'Nama Aset', 'Jenis Aset', 'Lokasi', 'Kondisi', 'Tgl. Pembelian']];
    const tableBody = asetList.value.map((item) => [item.kode_aset, item.nama_aset, item.nama_jenis, item.nama_ruangan || '-', item.kondisi, item.tanggal_pembelian]);
    autoTable(doc, { head: tableHead, body: tableBody });
    doc.save('data-aset.pdf');
}

async function searchUser(event) {
    // Menunggu sebentar sebelum mencari untuk efisiensi
    setTimeout(async () => {
        if (!event.query.trim().length) {
            filteredUsers.value = [];
        } else {
            filteredUsers.value = await lookupStore.searchUsers(event.query);
        }
    }, 250);
}

function openBiayaDialog(data) {
    // Simpan konteks aset yang dipilih
    selectedAset.value = data;

    // Siapkan 'biayaData' sebagai objek baru yang kosong
    biayaData.value = {
        tipe_biaya: null,
        deskripsi: '',
        jumlah: null,
        tanggal_transaksi: new Date(),
        vendor: ''
    };

    buktiFile.value = null;
    submitted.value = false;
    biayaDialog.value = true;
}
// Fungsi untuk menangani pemilihan file
function onFileSelect(event) {
    buktiFile.value = event.files[0];
}

// Fungsi untuk menyimpan data biaya

async function saveBiaya() {
    submitted.value = true;
    if (!biayaData.value.tipe_biaya || !biayaData.value.jumlah || !biayaData.value.tanggal_transaksi) {
        toast.add({ severity: 'warn', summary: 'Perhatian', detail: 'Tipe Biaya, Jumlah, dan Tanggal wajib diisi.', life: 3000 });
        return;
    }

    try {
        const formData = new FormData();

        // AMBIL ID ASET DARI KONTEKS YANG BENAR
        formData.append('aset_id', selectedAset.value.id);

        formData.append('tipe_biaya', biayaData.value.tipe_biaya);
        formData.append('deskripsi', biayaData.value.deskripsi || '');
        formData.append('jumlah', biayaData.value.jumlah);
        formData.append('tanggal_transaksi', formatDate(biayaData.value.tanggal_transaksi));
        formData.append('vendor', biayaData.value.vendor || '');

        if (buktiFile.value) {
            formData.append('bukti', buktiFile.value);
        }

        if (biayaData.value.id) {
            // Mode Edit Biaya
            await asetStore.updateBiaya(biayaData.value.id, formData);
            toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Biaya aset berhasil diperbarui', life: 3000 });
        } else {
            // Mode Tambah Biaya Baru
            await asetStore.tambahBiaya(selectedAset.value.id, formData);
            toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Biaya aset berhasil ditambahkan', life: 3000 });
        }

        biayaDialog.value = false;
        submitted.value = false;
    } catch (error) {
        const errorMessage = error.response?.data?.error || 'Terjadi kesalahan';
        toast.add({ severity: 'error', summary: 'Gagal', detail: errorMessage, life: 4000 });
    }
}

async function openDaftarBiayaDialog(data) {
    selectedAset.value = data;
    try {
        daftarBiayaList.value = await asetStore.fetchBiaya(data.id);
        daftarBiayaDialog.value = true;
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: error.message, life: 3000 });
    }
}

function editBiaya(data) {
    // Menggunakan kembali dialog dan state 'tambah biaya'
    biayaData.value = { ...data };

    // Konversi string tanggal kembali menjadi objek Date untuk komponen Calendar
    if (data.tanggal_transaksi) {
        biayaData.value.tanggal_transaksi = new Date(data.tanggal_transaksi);
    }

    biayaDialog.value = true;
}

function confirmDeleteBiaya(data) {
    biayaToDelete.value = data;
    deleteBiayaDialog.value = true;
}

async function deleteBiaya() {
    try {
        await asetStore.deleteBiaya(biayaToDelete.value.id);
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Data Biaya Dihapus', life: 3000 });

        // Refresh daftar biaya di dialog
        daftarBiayaList.value = await asetStore.fetchBiaya(selectedAset.value.id);
        deleteBiayaDialog.value = false;
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal menghapus biaya', life: 3000 });
    }
}

async function lihatBukti(buktiUrl) {
    if (!buktiUrl) return;
    isBuktiLoading.value = true;
    try {
        // Panggil store untuk mengambil file blob
        const blob = await asetStore.getBuktiFile(buktiUrl);

        // Buat URL sementara dari blob
        const fileURL = URL.createObjectURL(blob);

        // Buka URL di tab baru
        window.open(fileURL, '_blank');
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: error.message, life: 3000 });
    } finally {
        isBuktiLoading.value = false;
    }
}

const totalBiaya = computed(() => {
    if (!daftarBiayaList.value) return 'Rp 0,00';

    const total = daftarBiayaList.value.reduce((sum, item) => {
        return sum + parseFloat(item.jumlah);
    }, 0);

    // Format sebagai mata uang Rupiah
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 2
    }).format(total);
});
</script>

<template>
    <div>
        <div class="card">
            <Toolbar class="mb-6">
                <template #start>
                    <Button label="Tambah Aset" icon="pi pi-plus" severity="secondary" class="mr-2" @click="openNew" />
                </template>
                <template #end>
                    <SplitButton label="Export" icon="pi pi-upload" :model="exportItems" severity="secondary"></SplitButton>
                </template>
            </Toolbar>

            <DataTable
                ref="dt"
                export-filename="data-aset"
                :value="asetList"
                :loading="isLoading"
                dataKey="id"
                :paginator="true"
                :rows="10"
                :filters="filters"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                :rowsPerPageOptions="[5, 10, 25]"
                currentPageReportTemplate="Menampilkan {first} sampai {last} dari {totalRecords} aset"
            >
                <template #header>
                    <div class="flex flex-wrap gap-2 items-center justify-between">
                        <h4 class="m-0">Manajemen Aset</h4>
                        <IconField>
                            <InputIcon> <i class="pi pi-search" /> </InputIcon>
                            <InputText v-model="filters['global'].value" placeholder="Cari..." />
                        </IconField>
                    </div>
                </template>

                <Column field="kode_aset" header="Kode Aset" sortable style="min-width: 12rem"></Column>
                <Column field="nama_aset" header="Nama Aset" sortable style="min-width: 16rem"></Column>
                <Column field="nama_jenis" header="Jenis Aset" sortable style="min-width: 12rem"></Column>
                <Column field="kondisi" header="Kondisi" sortable style="min-width: 10rem"></Column>
                <Column field="tanggal_pembelian" header="Tgl. Pembelian" sortable style="min-width: 10rem"></Column>
                <Column field="nama_ruangan" header="Lokasi Ruangan" sortable style="min-width: 12rem">
                    <template #body="slotProps">
                        <span>{{ slotProps.data.nama_ruangan || '-' }}</span>
                    </template>
                </Column>
                <Column :exportable="false" style="min-width: 12rem" header="Aksi">
                    <template #body="slotProps">
                        <Button icon="pi pi-pencil" outlined rounded class="mr-2" @click="editData(slotProps.data)" v-tooltip.top="'Edit Data'" />
                        <Button icon="pi pi-dollar" outlined rounded severity="success" class="mr-2" @click="openBiayaDialog(slotProps.data)" v-tooltip.top="'Tambah Biaya'" />
                        <Button icon="pi pi-list" outlined rounded severity="contrast" class="mr-2" @click="openDaftarBiayaDialog(slotProps.data)" v-tooltip.top="'Lihat Daftar Biaya'" />
                        <Button icon="pi pi-book" outlined rounded severity="secondary" class="mr-2" @click="openHistoriUpdateDialog(slotProps.data)" v-tooltip.top="'Update Histori'" />
                        <Button icon="pi pi-history" outlined rounded severity="info" class="mr-2" @click="openHistoriDialog(slotProps.data)" v-tooltip.top="'Lihat Histori'" />
                        <Button icon="pi pi-trash" outlined rounded severity="danger" @click="confirmDelete(slotProps.data)" v-tooltip.top="'Hapus Data'" />
                    </template>
                </Column>
            </DataTable>
        </div>

        <Dialog v-model:visible="dialog" :style="{ width: '450px' }" header="Detail Aset" :modal="true">
            <div class="flex flex-col gap-6">
                <div>
                    <label for="kode_aset" class="block font-bold mb-3">Kode Aset</label>
                    <InputText id="kode_aset" v-model.trim="aset.kode_aset" required :invalid="submitted && !aset.kode_aset" fluid />
                </div>
                <div>
                    <label for="nama_aset" class="block font-bold mb-3">Nama Aset</label>
                    <InputText id="nama_aset" v-model.trim="aset.nama_aset" required :invalid="submitted && !aset.nama_aset" fluid />
                </div>
                <div>
                    <label for="jenis_aset_id" class="block font-bold mb-3">Jenis Aset</label>
                    <Dropdown id="jenis_aset_id" v-model="aset.jenis_aset_id" :options="jenisAsetList" optionLabel="nama_jenis" optionValue="id" placeholder="Pilih Jenis Aset" :invalid="submitted && !aset.jenis_aset_id" fluid />
                </div>
                <div>
                    <label for="kondisi" class="block font-bold mb-3">Kondisi</label>
                    <Dropdown id="kondisi" v-model="aset.kondisi" :options="kondisiAset" placeholder="Pilih Kondisi" :invalid="submitted && !aset.kondisi" fluid />
                </div>
                <div>
                    <label for="tanggal_pembelian" class="block font-bold mb-3">Tanggal Pembelian</label>
                    <Calendar id="tanggal_pembelian" v-model="aset.tanggal_pembelian" dateFormat="yy-mm-dd" />
                </div>
                <div>
                    <label for="deskripsi" class="block font-bold mb-3">Deskripsi</label>
                    <Textarea id="deskripsi" v-model.trim="aset.deskripsi" rows="3" fluid />
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
                <span v-if="aset"
                    >Apakah Anda yakin ingin menghapus <b>{{ aset.nama_aset }}</b
                    >?</span
                >
            </div>
            <template #footer>
                <Button label="Tidak" icon="pi pi-times" text @click="deleteDialog = false" />
                <Button label="Ya" icon="pi pi-check" @click="deleteData" />
            </template>
        </Dialog>

        <Dialog v-model:visible="historiUpdateDialog" :style="{ width: '450px' }" :header="`Update Histori: ${historiData.nama_aset}`" :modal="true">
            <div class="flex flex-col gap-6">
                <div>
                    <label for="status_histori" class="block font-bold mb-3">Status Baru</label>
                    <Dropdown id="status_histori" v-model="historiData.status" :options="asetHistoriStatuses" placeholder="Pilih Status" fluid />
                </div>

                <div v-if="['Dipindahkan', 'Ditempatkan'].includes(historiData.status)">
                    <label for="ruangan_tujuan" class="block font-bold mb-3">Pindahkan Ke Ruangan</label>
                    <Dropdown id="ruangan_tujuan" v-model="historiData.ke_ruangan_id" :options="ruanganList" optionLabel="nama_ruangan" optionValue="id" placeholder="Pilih Ruangan Tujuan" fluid />
                </div>

                <div v-if="historiData.status === 'Dipinjam'" class="flex flex-col gap-6">
                    <div>
                        <label for="user_peminjam" class="block font-bold mb-3">Peminjam</label>
                        <AutoComplete v-model="historiData.peminjam" :suggestions="filteredUsers" @complete="searchUser" field="full_name" placeholder="Ketik untuk mencari user..." forceSelection>
                            <template #option="slotProps">
                                <div>({{ slotProps.option.username }}) {{ slotProps.option.full_name }}</div>
                            </template>
                        </AutoComplete>
                    </div>
                    <div>
                        <label for="estimasi_kembali" class="block font-bold mb-3">Estimasi Tanggal Kembali</label>
                        <Calendar id="estimasi_kembali" v-model="historiData.estimasi_tanggal_kembali" dateFormat="yy-mm-dd" showTime hourFormat="24" />
                    </div>
                </div>

                <div>
                    <label for="catatan_histori" class="block font-bold mb-3">Catatan</label>
                    <Textarea id="catatan_histori" v-model.trim="historiData.catatan" rows="3" fluid />
                </div>
            </div>
            <template #footer>
                <Button label="Batal" icon="pi pi-times" text @click="historiUpdateDialog = false" />
                <Button label="Simpan" icon="pi pi-check" @click="saveHistoriUpdate" />
            </template>
        </Dialog>

        <Dialog v-model:visible="historiDialog" :style="{ width: '600px' }" :header="`Histori Aset: ${selectedAset.nama_aset}`" :modal="true">
            <Timeline :value="asetHistori" align="alternate" class="customized-timeline">
                <template #marker="slotProps">
                    <span class="flex w-8 h-8 items-center justify-center text-white rounded-full z-10 shadow-sm" style="background-color: #607d8b">
                        <i class="pi pi-bookmark"></i>
                    </span>
                </template>
                <template #content="slotProps">
                    <Card class="mt-3">
                        <template #title>
                            {{ slotProps.item.status }}
                        </template>
                        <template #subtitle> {{ formatDateTime(slotProps.item.tanggal_kejadian) }} oleh {{ slotProps.item.nama_user_aksi }} </template>
                        <template #content>
                            <div v-if="slotProps.item.status === 'Dipindahkan'">
                                <p>
                                    <i class="pi pi-arrow-right-arrow-left mr-2"></i>
                                    Dari <strong>{{ slotProps.item.dari_ruangan || '-' }}</strong> ke <strong>{{ slotProps.item.ke_ruangan }}</strong>
                                </p>
                            </div>
                            <div v-else-if="slotProps.item.status === 'Ditempatkan'">
                                <p>
                                    <i class="pi pi-map-marker mr-2"></i>
                                    Ditempatkan di <strong>{{ slotProps.item.ke_ruangan }}</strong>
                                </p>
                            </div>
                            <p v-if="slotProps.item.catatan">
                                <i class="pi pi-align-left mr-2"></i>
                                Catatan: {{ slotProps.item.catatan }}
                            </p>
                        </template>
                    </Card>
                </template>
            </Timeline>
            <template #footer>
                <Button label="Tutup" icon="pi pi-times" @click="historiDialog = false" class="p-button-text" />
            </template>
        </Dialog>
        <Dialog v-model:visible="biayaDialog" :style="{ width: '450px' }" :header="`Tambah Biaya untuk: ${biayaData.nama_aset}`" :modal="true">
            <div class="flex flex-col gap-6">
                <div>
                    <label for="tipe_biaya" class="block font-bold mb-3">Tipe Biaya</label>
                    <Dropdown id="tipe_biaya" v-model="biayaData.tipe_biaya" :options="tipeBiaya" required autofocus :invalid="submitted && !biayaData.tipe_biaya" placeholder="Pilih Tipe Biaya" fluid />
                    <small v-if="submitted && !biayaData.tipe_biaya" class="text-red-500">Tipe Biaya harus diisi.</small>
                </div>
                <div>
                    <label for="jumlah" class="block font-bold mb-3">Jumlah (Rp)</label>
                    <InputNumber id="jumlah" v-model="biayaData.jumlah" required :invalid="submitted && !biayaData.jumlah" mode="currency" currency="IDR" locale="id-ID" fluid />
                    <small v-if="submitted && !biayaData.jumlah" class="text-red-500">Jumlah harus diisi.</small>
                </div>
                <div>
                    <label for="tanggal_transaksi_biaya" class="block font-bold mb-3">Tanggal Transaksi</label>
                    <Calendar id="tanggal_transaksi_biaya" v-model="biayaData.tanggal_transaksi" required :invalid="submitted && !biayaData.tanggal_transaksi" dateFormat="yy-mm-dd" />
                    <small v-if="submitted && !biayaData.tanggal_transaksi" class="text-red-500">Tanggal Transaksi harus diisi.</small>
                </div>
                <div>
                    <label for="vendor" class="block font-bold mb-3">Vendor/Pihak Ketiga</label>
                    <InputText id="vendor" v-model.trim="biayaData.vendor" fluid />
                </div>
                <div>
                    <label for="deskripsi_biaya" class="block font-bold mb-3">Deskripsi</label>
                    <Textarea id="deskripsi_biaya" v-model.trim="biayaData.deskripsi" rows="3" fluid />
                </div>
                <div v-if="!biayaData.id">
                    <label for="bukti" class="block font-bold mb-3">Upload Bukti (Opsional)</label>
                    <FileUpload name="bukti" @select="onFileSelect" :showUploadButton="false" :showCancelButton="false" chooseLabel="Pilih File" />
                </div>
            </div>
            <template #footer>
                <Button label="Batal" icon="pi pi-times" text @click="biayaDialog = false" />
                <Button label="Simpan Biaya" icon="pi pi-check" @click="saveBiaya" />
            </template>
        </Dialog>

        <Dialog v-model:visible="daftarBiayaDialog" :style="{ width: '75vw' }" maximizable :header="`Daftar Biaya untuk: ${selectedAset.nama_aset}`" :modal="true">
            <DataTable :value="daftarBiayaList" responsiveLayout="scroll">
                <Column field="tanggal_transaksi" header="Tanggal" sortable></Column>
                <Column field="tipe_biaya" header="Tipe Biaya" sortable></Column>
                <Column field="jumlah" header="Jumlah" sortable>
                    <template #body="slotProps">
                        {{ new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(slotProps.data.jumlah) }}
                    </template>
                </Column>
                <Column field="vendor" header="Vendor"></Column>
                <Column field="deskripsi" header="Deskripsi"></Column>
                <Column field="nama_pencatat" header="Dicatat Oleh" sortable></Column>
                <Column header="Bukti">
                    <template #body="slotProps">
                        <Button v-if="slotProps.data.bukti_url" icon="pi pi-eye" text rounded severity="info" @click="lihatBukti(slotProps.data.bukti_url)" :loading="isBuktiLoading" v-tooltip.top="'Lihat Bukti'" />
                        <span v-else>-</span>
                    </template>
                </Column>
                <Column header="Aksi">
                    <template #body="slotProps">
                        <Button icon="pi pi-pencil" text rounded class="mr-2" @click="editBiaya(slotProps.data)" v-tooltip.top="'Edit Biaya'" />
                        <Button icon="pi pi-trash" text rounded severity="danger" @click="confirmDeleteBiaya(slotProps.data)" v-tooltip.top="'Hapus Biaya'" />
                    </template>
                </Column>
            </DataTable>
            <template #footer>
                <div class="flex justify-between items-center w-full">
                    <span class="text-lg font-bold">Total Biaya: {{ totalBiaya }}</span>
                    <Button label="Tutup" icon="pi pi-times" @click="daftarBiayaDialog = false" class="p-button-text" />
                </div>
            </template>
        </Dialog>
        <Dialog v-model:visible="deleteBiayaDialog" :style="{ width: '450px' }" header="Konfirmasi Hapus Biaya" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl" />
                <span v-if="biayaToDelete">
                    Apakah Anda yakin ingin menghapus biaya <b>{{ biayaToDelete.tipe_biaya }}</b> sejumlah <b>{{ new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(biayaToDelete.jumlah) }}</b
                    >?
                </span>
            </div>
            <template #footer>
                <Button label="Tidak" icon="pi pi-times" text @click="deleteBiayaDialog = false" />
                <Button label="Ya, Hapus" icon="pi pi-check" @click="deleteBiaya" />
            </template>
        </Dialog>
    </div>
</template>
