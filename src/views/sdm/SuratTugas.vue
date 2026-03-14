<script setup>
import { usePegawaiStore } from '@/stores/pegawai';
import { useSuratTugasStore } from '@/stores/suratTugas';
import { FilterMatchMode } from '@primevue/core/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { storeToRefs } from 'pinia';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';

// --- Setup ---
const toast = useToast();
const store = useSuratTugasStore();
const pegawaiStore = usePegawaiStore();
const { list, isLoading } = storeToRefs(store);
const { list: pegawaiList } = storeToRefs(pegawaiStore);

const dialog = ref(false);
const deleteDialog = ref(false);
const data = ref({
    penerima_tugas: [{}],
    tembusan: []
});
const submitted = ref(false);
const dt = ref();
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});
const isPrinting = ref(false);

const peranPenerimaOptions = ref(['Pelaksana Utama', 'Pengikut']);

// Dropdown Opsi Alasan Perjalanan (Mapping 1-3)
const alasanOptions = ref([
    { label: 'Kunjungan / Undangan', value: 1 },
    { label: 'Tugas Lembaga / Dinas', value: 2 },
    { label: 'Pelatihan / Seminar / Workshop', value: 3 }
]);

const isSPPD = ref(false);
const isNew = computed(() => !data.value.id);

onMounted(() => {
    store.fetchAll();
    pegawaiStore.fetchAll();
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

function formatDateIndonesian(dateString) {
    if (!dateString) return null;
    const date = new Date(dateString);
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function formatDateIndonesianSimple(dateString) {
    if (!dateString) return null;
    const date = new Date(dateString);
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

// --- CRUD Functions ---
function openNew() {
    data.value = {
        penerima_tugas: [{ pegawai_id: null, peran: 'Pelaksana Utama' }],
        tembusan: [],
        alasan_perjalanan: 2 // Default: Tugas Lembaga
    };
    isSPPD.value = false;
    submitted.value = false;
    dialog.value = true;
}

async function editData(dataFromList) {
    try {
        const fullData = await store.fetchById(dataFromList.id);
        data.value = {
            ...fullData,
            tanggal_mulai: new Date(fullData.tanggal_mulai),
            tanggal_selesai: new Date(fullData.tanggal_selesai),
            penerima_tugas: fullData.daftar_penerima.map((p) => ({
                pegawai_id: p.pegawai_id,
                peran: p.peran
            }))
        };
        isSPPD.value = !!fullData.nomor_sppd || !!fullData.alat_angkut || !!fullData.tujuan_kota;
        submitted.value = false;
        dialog.value = true;
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal memuat detail surat.', life: 3000 });
    }
}

function hideDialog() {
    dialog.value = false;
    submitted.value = false;
}

async function saveData() {
    submitted.value = true;
    if (!data.value.dasar_tugas || !data.value.tugas || !data.value.penandatangan_id || !data.value.penerima_tugas.length || !data.value.tanggal_mulai || !data.value.tanggal_selesai) {
        toast.add({ severity: 'warn', summary: 'Perhatian', detail: 'Harap isi semua field wajib.', life: 3000 });
        return;
    }
    try {
        const payload = {
            ...data.value,
            tanggal_mulai: formatDate(data.value.tanggal_mulai),
            tanggal_selesai: formatDate(data.value.tanggal_selesai)
        };

        if (!isSPPD.value) {
            // Null-kan field SPPD jika tidak diaktifkan
            payload.alat_angkut = null;
            payload.tempat_berangkat = null;
            payload.lama_perjalanan = null;
            payload.pembebanan_anggaran_instansi = null;
            payload.pembebanan_anggaran_mak = null;
            payload.ppk_pegawai_id = null;
            payload.kpa_pegawai_id = null;
            payload.keterangan_lain = null;
            payload.tujuan_kota = null;
            payload.alasan_perjalanan = null;
        }

        if (data.value.id) {
            await store.update(data.value.id, payload);
            toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Surat Tugas / SPPD Diperbarui', life: 3000 });
        } else {
            await store.create(payload);
            toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Surat Tugas / SPPD Baru Dibuat', life: 3000 });
        }
        dialog.value = false;
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: error.response?.data?.error || 'Gagal menyimpan', life: 4000 });
    }
}

function confirmDelete(deleteData) {
    data.value = deleteData;
    deleteDialog.value = true;
}

async function deleteData() {
    try {
        await store.delete(data.value.id);
        deleteDialog.value = false;
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Surat Tugas Dihapus', life: 3000 });
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Terjadi kesalahan saat menghapus', life: 3000 });
    }
}

/**
 * Handle Printout & Preview
 */
async function handlePrint(rowData) {
    isPrinting.value = true;
    try {
        const detail = await store.fetchById(rowData.id);
        const isSPPDDoc = !!detail.nomor_sppd;

        if (isSPPDDoc) {
            const blobUrl = await store.fetchPreviewBlob(detail.id);
            window.open(blobUrl, '_blank');
            setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
        } else {
            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [210, 330] });
            generateSuratTugas(doc, detail);
            try {
                const blobUrl = doc.output('bloburl');
                window.open(blobUrl, '_blank');
            } catch (err) {
                doc.save('surat_tugas.pdf');
            }
        }
    } catch (error) {
        console.error('Print Error:', error);
        toast.add({ severity: 'error', summary: 'Gagal', detail: error.message || 'Gagal memproses dokumen.', life: 3000 });
    } finally {
        isPrinting.value = false;
    }
}

function generateSuratTugas(doc, data) {
    doc.setFont('arial');
    const pageWidth = doc.internal.pageSize.getWidth();
    const center = pageWidth / 2;
    let Y = 60;

    doc.setFontSize(11);
    doc.setFont('arial', 'bold');
    doc.text('SURAT TUGAS', center, Y, { align: 'center' });
    doc.line(center - doc.getTextWidth('SURAT TUGAS') / 2, Y + 0.8, center + doc.getTextWidth('SURAT TUGAS') / 2, Y + 0.8);
    Y += 7;
    doc.setFont('arial', 'normal');
    doc.text('Nomor : ' + (data.nomor_surat || '-'), center, Y, { align: 'center' });
    Y += 15;
    doc.text('Ketua,', center, Y, { align: 'center' });
    Y += 5;
    doc.text('Sekolah Tinggi Ilmu Kesehatan Respati', center, Y, { align: 'center' });
    Y += 15;
    doc.text('Tentang,', center, Y, { align: 'center' });
    Y += 5;
    doc.text(data.dasar_tugas || '-', center, Y, { align: 'center' });
    Y += 10;
    doc.setFont('arial', 'bold');
    doc.text('Menugaskan Kepada:', 20, Y);
    Y += 3;

    const tableBody = (data.daftar_penerima || []).map((p, index) => [
        index + 1,
        p.nama_lengkap || '-',
        `${p.jabatan || ''} ${p.unit_kerja || ''}`.trim() || '-',
        p.peran || '-'
    ]);

    autoTable(doc, {
        head: [['No', 'Nama', 'Jabatan', 'Keterangan Tugas']],
        body: tableBody,
        startY: Y,
        theme: 'grid',
        headStyles: { fillColor: [230, 230, 230], textColor: [0, 0, 0] },
        styles: { fontSize: 10 },
        columnStyles: { 2: { cellWidth: 60 } },
        didDrawPage: (dt) => { Y = dt.cursor.y + 10; }
    });

    doc.text('Waktu Pelaksanaan pada :', 20, Y);
    Y += 7;
    doc.setFont('arial', 'normal');
    doc.text(`Hari/Tanggal`, 20, Y);
    doc.text(`: ${formatDateIndonesian(data.tanggal_mulai) || '-'}`, 60, Y);
    Y += 7;
    doc.text(`Tempat`, 20, Y);
    doc.text(': ' + (data.tempat_tugas || '-'), 60, Y);
    Y += 15;

    const ttdX = pageWidth - 80;
    doc.text('Ditetapkan di: Singaparna-Tasikmalaya', ttdX, Y);
    Y += 7;

    const tanggalDitetapkan = new Date(data.tanggal_mulai);
    tanggalDitetapkan.setDate(tanggalDitetapkan.getDate() - 1);
    const ditetapkanFormatted = formatDateIndonesianSimple(tanggalDitetapkan.toISOString().split('T')[0]);

    doc.text(`Pada Tanggal: ${ditetapkanFormatted}`, ttdX, Y);
    Y += 15;
    doc.text('SEKOLAH TINGGI ILMU KESEHATAN RESPATI', center, Y, { align: 'center' });
    Y += 7;
    doc.text(data.jabatan_penandatangan || '-', center, Y, { align: 'center' });
    Y += 25;
    doc.setFont('arial', 'bold');
    doc.text(data.nama_penandatangan || '-', center, Y, { align: 'center' });
    doc.line(center - doc.getTextWidth(data.nama_penandatangan || '-') / 2, Y + 0.8, center + doc.getTextWidth(data.nama_penandatangan || '-') / 2, Y + 0.8);
    Y += 4.5;
    doc.text(`NIK: ${data.nip_penandatangan || '-'}`, center, Y, { align: 'center' });

    if (data.tembusan?.length > 0) {
        Y += 15;
        doc.setFont('arial', 'normal');
        doc.text('Tembusan disampaikan Kepada Yth:', 20, Y);
        data.tembusan.forEach((item, index) => { Y += 5; doc.text(`${index + 1}. ${item}`, 25, Y); });
    }
}

function addPenerimaTugas() { data.value.penerima_tugas.push({ pegawai_id: null, peran: 'Pengikut' }); }
function removePenerimaTugas(index) { data.value.penerima_tugas.splice(index, 1); }
</script>

<template>
    <div>
        <div class="card shadow-sm border-0">
            <Toolbar class="mb-6">
                <template #start>
                    <Button label="Buat Surat Tugas / SPPD" icon="pi pi-plus" severity="primary" class="mr-2"
                        @click="openNew" />
                </template>
            </Toolbar>

            <DataTable ref="dt" :value="list" :loading="isLoading" dataKey="id" :paginator="true" :rows="10"
                :filters="filters" stripedRows class="p-datatable-sm">
                <template #header>
                    <div class="flex flex-wrap gap-2 items-center justify-between">
                        <h4 class="m-0 font-bold text-gray-700">Manajemen Surat Tugas / SPPD</h4>
                        <IconField>
                            <InputIcon> <i class="pi pi-search" /> </InputIcon>
                            <InputText v-model="filters['global'].value" placeholder="Cari..." />
                        </IconField>
                    </div>
                </template>

                <Column field="nomor_surat" header="Nomor Surat" sortable></Column>
                <Column field="nomor_sppd" header="Nomor SPPD" sortable>
                    <template #body="slotProps">
                        <span :class="!slotProps.data.nomor_sppd ? 'text-gray-400' : 'font-bold'">
                            {{ slotProps.data.nomor_sppd || '-' }}
                        </span>
                    </template>
                </Column>
                <Column field="tugas" header="Tugas" style="min-width: 15rem"></Column>
                <Column field="tanggal_mulai" header="Tgl. Mulai" sortable></Column>
                <Column field="tanggal_selesai" header="Tgl. Selesai" sortable></Column>

                <Column :exportable="false" style="min-width: 12rem" header="Aksi">
                    <template #body="slotProps">
                        <div class="flex gap-2">
                            <Button icon="pi pi-print" outlined rounded severity="info"
                                @click="handlePrint(slotProps.data)" v-tooltip.top="'Cetak / Preview'"
                                :loading="isPrinting" />
                            <Button icon="pi pi-pencil" outlined rounded severity="warning"
                                @click="editData(slotProps.data)" v-tooltip.top="'Ubah'" />
                            <Button icon="pi pi-trash" outlined rounded severity="danger"
                                @click="confirmDelete(slotProps.data)" v-tooltip.top="'Hapus'" />
                        </div>
                    </template>
                </Column>
            </DataTable>
        </div>

        <Dialog v-model:visible="dialog" :style="{ width: '75vw' }"
            :header="isNew ? 'Buat Surat Tugas / SPPD Baru' : 'Edit Surat Tugas / SPPD'" :modal="true" maximizable>
            <TabView>
                <TabPanel header="Info Utama">
                    <div class="flex flex-col gap-6 mt-4 p-fluid">
                        <div>
                            <label class="font-bold block mb-2 text-gray-600">Tentang Tugas *</label>
                            <Textarea v-model.trim="data.dasar_tugas" rows="2" required fluid
                                placeholder="Dasar surat atau perihal umum" />
                        </div>
                        <div>
                            <label class="font-bold block mb-2 text-gray-600">Tugas *</label>
                            <Textarea v-model.trim="data.tugas" rows="3" required fluid
                                placeholder="Uraian isi tugas yang harus dilaksanakan" />
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div><label class="font-bold block mb-2 text-gray-600">Tempat Tugas (Detail)</label>
                                <InputText v-model.trim="data.tempat_tugas" fluid
                                    placeholder="Misal: Hotel Royal Bogor" />
                            </div>
                            <div><label class="font-bold block mb-2 text-gray-600">Penandatangan *</label>
                                <Dropdown v-model="data.penandatangan_id" :options="pegawaiList"
                                    optionLabel="nama_lengkap" optionValue="id" filter fluid />
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div><label class="font-bold block mb-2 text-gray-600">Tanggal Mulai *</label>
                                <Calendar v-model="data.tanggal_mulai" dateFormat="yy-mm-dd" />
                            </div>
                            <div><label class="font-bold block mb-2 text-gray-600">Tanggal Selesai *</label>
                                <Calendar v-model="data.tanggal_selesai" dateFormat="yy-mm-dd" />
                            </div>
                        </div>
                    </div>
                </TabPanel>
                <TabPanel header="Penerima & Tembusan">
                    <div class="flex flex-col gap-4 mt-4 p-fluid">
                        <label class="font-bold text-gray-600">Penerima Tugas *</label>
                        <div v-for="(penerima, index) in data.penerima_tugas" :key="index"
                            class="grid grid-cols-12 gap-2 bg-gray-50 p-3 rounded border shadow-inner mb-2">
                            <div class="col-span-12 md:col-span-7">
                                <Dropdown v-model="penerima.pegawai_id" :options="pegawaiList"
                                    optionLabel="nama_lengkap" optionValue="id" filter fluid
                                    placeholder="Cari Pegawai" />
                            </div>
                            <div class="col-span-12 md:col-span-4">
                                <Dropdown v-model="penerima.peran" :options="peranPenerimaOptions" fluid />
                            </div>
                            <div class="col-span-12 md:col-span-1 flex justify-center"><Button icon="pi pi-trash"
                                    severity="danger" text @click="removePenerimaTugas(index)"
                                    v-if="data.penerima_tugas.length > 1" /></div>
                        </div>
                        <Button label="Tambah Penerima" icon="pi pi-plus" severity="secondary" text
                            @click="addPenerimaTugas" />
                        <div class="mt-4"><label class="font-bold block mb-2 text-gray-600">Tembusan</label>
                            <Chips v-model="data.tembusan" separator="," placeholder="Ketik lalu Enter" fluid />
                        </div>
                    </div>
                </TabPanel>
                <TabPanel header="Detail SPPD (Neo Feeder)">
                    <div class="flex items-center mb-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
                        <ToggleSwitch v-model="isSPPD" />
                        <label class="ml-3 font-bold text-blue-800">Aktifkan Detail SPPD (Perjalanan Dinas)</label>
                    </div>
                    <div v-if="isSPPD" class="flex flex-col gap-4 p-fluid">
                        <!-- BARU: Alasan & Tujuan Kota -->
                        <div class="grid grid-cols-12 gap-4">
                            <div class="col-span-12 md:col-span-6">
                                <label class="font-bold block mb-2 text-gray-600">Alasan Perjalanan *</label>
                                <Dropdown v-model="data.alasan_perjalanan" :options="alasanOptions" optionLabel="label"
                                    optionValue="value" placeholder="Pilih Alasan" fluid />
                            </div>
                            <div class="col-span-12 md:col-span-6">
                                <label class="font-bold block mb-2 text-gray-600">Tujuan Kota *</label>
                                <InputText v-model.trim="data.tujuan_kota" fluid placeholder="Misal: Kota Bogor" />
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <div><label class="font-bold block mb-2 text-gray-600">Alat Angkut</label>
                                <InputText v-model.trim="data.alat_angkut" fluid
                                    placeholder="Misal: Kendaraan Dinas / Umum" />
                            </div>
                            <div><label class="font-bold block mb-2 text-gray-600">Tempat Berangkat</label>
                                <InputText v-model.trim="data.tempat_berangkat" fluid
                                    placeholder="Misal: Tasikmalaya" />
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div><label class="font-bold block mb-2 text-gray-600">Lama Perjalanan (Hari)</label>
                                <InputNumber v-model="data.lama_perjalanan" :min="1" fluid />
                            </div>
                            <div><label class="font-bold block mb-2 text-gray-600">Kode MAK / Anggaran</label>
                                <InputText v-model.trim="data.pembebanan_anggaran_mak" fluid
                                    placeholder="Misal: 1.2.3.4" />
                            </div>
                        </div>
                        <div><label class="font-bold block mb-2 text-gray-600">Instansi Pembebanan Anggaran</label>
                            <InputText v-model.trim="data.pembebanan_anggaran_instansi" fluid
                                placeholder="Misal: STIKes Respati" />
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div><label class="font-bold block mb-2 text-gray-600">PPK (Pejabat Pembuat
                                    Komitmen)</label>
                                <Dropdown v-model="data.ppk_pegawai_id" :options="pegawaiList"
                                    optionLabel="nama_lengkap" optionValue="id" filter fluid
                                    placeholder="Cari Pegawai" />
                            </div>
                            <div><label class="font-bold block mb-2 text-gray-600">KPA (Kuasa Pengguna Anggaran)</label>
                                <Dropdown v-model="data.kpa_pegawai_id" :options="pegawaiList"
                                    optionLabel="nama_lengkap" optionValue="id" filter fluid
                                    placeholder="Cari Pegawai" />
                            </div>
                        </div>
                        <div><label class="font-bold block mb-2 text-gray-600">Keterangan Lain</label><Textarea
                                v-model.trim="data.keterangan_lain" rows="3" fluid
                                placeholder="Instruksi tambahan jika ada" />
                        </div>
                    </div>
                </TabPanel>
            </TabView>
            <template #footer>
                <div class="flex justify-end gap-3 mt-4">
                    <Button label="Batal" icon="pi pi-times" text severity="danger" @click="hideDialog" />
                    <Button label="Simpan Surat" icon="pi pi-check" severity="success" @click="saveData" />
                </div>
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteDialog" :style="{ width: '450px' }" header="Konfirmasi" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle text-3xl text-red-500" />
                <span v-if="data">Yakin hapus surat <b>{{ data.nomor_surat }}</b>?</span>
            </div>
            <template #footer>
                <Button label="Tidak" text @click="deleteDialog = false" />
                <Button label="Ya, Hapus" severity="danger" @click="deleteData" />
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
:deep(.p-dialog-footer) {
    padding: 0 1.5rem 1.5rem 1.5rem;
}
</style>