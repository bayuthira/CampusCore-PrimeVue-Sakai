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
import { onMounted, ref } from 'vue';
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

const { asetList, isLoading } = storeToRefs(asetStore);
const { jenisAsetList } = storeToRefs(jenisAsetStore);
const { kondisiAset, asetHistoriStatuses } = storeToRefs(lookupStore);
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
    aset.value = data;
    historiData.value = {
        id: data.id,
        nama_aset: data.nama_aset,
        status: null,
        ke_ruangan_id: null,
        catatan: '',
        peminjam: null, // Gunakan 'peminjam' untuk menampung objek
        estimasi_tanggal_kembali: null
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
            // AMBIL .id DARI OBJEK 'peminjam'
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
    setTimeout(async () => {
        if (!event.query.trim().length) {
            filteredUsers.value = [];
        } else {
            const users = await lookupStore.searchUsers(event.query);
            // Tambahkan properti baru 'display_label' ke setiap objek user
            filteredUsers.value = users.map((user) => ({
                ...user,
                display_label: `(${user.username}) ${user.full_name}`
            }));
        }
    }, 250);
}

function onUserSelect(event) {
    console.log('EVENT @item-select:', event);
    console.log('Nilai yang dipilih (event.value):', event.value);
}

function checkVModel() {
    console.log('Isi v-model (historiData.peminjam):', historiData.value.peminjam);
}
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
                :global-filter-fields="['kode_aset', 'nama_aset', 'nama_jenis', 'kondisi', 'info_lokasi']"
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
                <Column header="Status & Lokasi" sortable style="min-width: 16rem">
                    <template #body="slotProps">
                        <div v-if="slotProps.data.peminjaman_id">
                            <i class="pi pi-user mr-2 text-orange-500"></i>
                            <span
                                >Dipinjam: <strong>{{ slotProps.data.nama_peminjam }}</strong></span
                            >
                        </div>
                        <div v-else>
                            <i class="pi pi-building mr-2 text-cyan-500"></i>
                            <span>{{ slotProps.data.nama_ruangan || 'Gudang' }}</span>
                        </div>
                    </template>
                </Column>
                <Column :exportable="false" style="min-width: 12rem" header="Aksi">
                    <template #body="slotProps">
                        <Button icon="pi pi-pencil" outlined rounded class="mr-2" @click="editData(slotProps.data)" v-tooltip.top="'Edit Data'" />
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
                        <AutoComplete v-model="historiData.peminjam" :suggestions="filteredUsers" @complete="searchUser" optionLabel="display_label" placeholder="Ketik untuk mencari user..." forceSelection>
                            <template #option="slotProps">
                                <div>{{ slotProps.option.display_label }}</div>
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
                            <div v-if="slotProps.item.status === 'Dipinjam' && slotProps.item.nama_peminjam">
                                <p>
                                    <i class="pi pi-user mr-2"></i>
                                    Dipinjam oleh: <strong>{{ slotProps.item.nama_peminjam }}</strong>
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
    </div>
</template>
