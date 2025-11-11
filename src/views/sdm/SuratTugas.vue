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
    penerima_tugas: [{}], // Inisialisasi penerima tugas
    tembusan: []
});
const submitted = ref(false);
const dt = ref();
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});
const isPrinting = ref(false);

const peranPenerimaOptions = ref(['Pelaksana Utama', 'Pengikut']);

// State baru untuk menandai apakah ini SPPD
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

    const dayName = days[date.getDay()];
    const dayNum = date.getDate();
    const monthName = months[date.getMonth()];
    const year = date.getFullYear();

    return `${dayName}, ${dayNum} ${monthName} ${year}`;
}

function formatDateIndonesianSimple(dateString) {
    if (!dateString) return null;
    const date = new Date(dateString);
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

    const dayNum = date.getDate();
    const monthName = months[date.getMonth()];
    const year = date.getFullYear();

    return `${dayNum} ${monthName} ${year}`;
}

// --- CRUD Functions ---
function openNew() {
    data.value = {
        penerima_tugas: [{ pegawai_id: null, peran: null }],
        tembusan: []
    };
    isSPPD.value = false; // Default bukan SPPD
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
            // Ganti nama field agar sesuai dengan form
            penerima_tugas: fullData.daftar_penerima.map((p) => ({
                pegawai_id: p.pegawai_id,
                peran: p.peran
            }))
        };

        // Cek apakah ini SPPD (berdasarkan field yg ada)
        isSPPD.value = !!fullData.nomor_sppd || !!fullData.alat_angkut;

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
        toast.add({ severity: 'warn', summary: 'Perhatian', detail: 'Harap isi semua field wajib di tab Info Utama.', life: 3000 });
        return;
    }

    try {
        const payload = {
            ...data.value,
            tanggal_mulai: formatDate(data.value.tanggal_mulai),
            tanggal_selesai: formatDate(data.value.tanggal_selesai)
        };

        // Jika toggle SPPD tidak aktif, null-kan semua field SPPD
        if (!isSPPD.value) {
            payload.alat_angkut = null;
            payload.tempat_berangkat = null;
            payload.lama_perjalanan = null;
            payload.pembebanan_anggaran_instansi = null;
            payload.pembebanan_anggaran_mak = null;
            payload.ppk_pegawai_id = null;
            payload.kpa_pegawai_id = null;
            payload.keterangan_lain = null;
        }

        if (data.value.id) {
            await store.update(data.value.id, payload);
            toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Surat Tugas Diperbarui', life: 3000 });
        } else {
            await store.create(payload);
            toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Surat Tugas Baru Dibuat', life: 3000 });
        }
        dialog.value = false;
        data.value = {};
    } catch (error) {
        const errorMessage = error.response?.data?.error || 'Terjadi kesalahan saat menyimpan';
        toast.add({ severity: 'error', summary: 'Gagal', detail: errorMessage, life: 4000 });
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
        data.value = {};
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Surat Tugas Dihapus', life: 3000 });
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Terjadi kesalahan saat menghapus', life: 3000 });
    }
}

// Fungsi helper untuk penerima tugas
function addPenerimaTugas() {
    data.value.penerima_tugas.push({ pegawai_id: null, peran: null });
}
function removePenerimaTugas(index) {
    data.value.penerima_tugas.splice(index, 1);
}

async function handlePrint(data) {
    isPrinting.value = true;
    try {
        // 1. Ambil data detail (termasuk daftar penerima)
        const detail = await store.fetchById(data.id);

        // 2. Buat dokumen PDF baru dengan ukuran F4 (210mm x 330mm)
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: [210, 330]
        });

        // 3. Tentukan apakah ini SPPD atau Surat Tugas biasa
        const isSPPD = !!detail.nomor_sppd;

        if (isSPPD) {
            // generateSPPD(doc, detail); // <- Sangat kompleks
            toast.add({ severity: 'info', summary: 'Info', detail: 'Pratinjau SPPD belum didukung. Silakan hubungi admin.', life: 4000 });
        } else {
            // 4. Panggil generator Surat Tugas
            generateSuratTugas(doc, detail);
            // 5. Tampilkan PDF di tab baru dengan cara yang lebih kompatibel
            // Pastikan nama file aman
            const filename = detail?.nomor_surat ? `${String(detail.nomor_surat).replace(/\//g, '_')}.pdf` : 'surat.pdf';

            // Gunakan blob URL untuk membuka di tab baru (lebih andal daripada opsi kedua argumen pada output)
            try {
                const blobUrl = doc.output('bloburl');
                window.open(blobUrl, '_blank');
            } catch (err) {
                // Fallback: simpan file langsung
                doc.save(filename);
            }
        }
    } catch (error) {
        console.error('PDF Error:', error);
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal membuat dokumen PDF.', life: 3000 });
    } finally {
        isPrinting.value = false;
    }
}

// 4. Tambahkan Fungsi Generator Surat Tugas
function generateSuratTugas(doc, data) {
    // Set default font ke Arial
    doc.setFont('arial');

    const pageWidth = doc.internal.pageSize.getWidth();
    const center = pageWidth / 2;
    const marginTop = 60; // Margin atas 6cm = 60mm
    let Y = marginTop; // Posisi Y vertikal mulai dari margin atas

    // JUDUL
    doc.setFontSize(11);
    doc.setFont('arial', 'bold');
    doc.text('SURAT TUGAS', center, Y, { align: 'center' });
    // Tambah garis underline (dekat dengan text)
    const textWidth = doc.getTextWidth('SURAT TUGAS');
    doc.line(center - textWidth / 2, Y + 0.8, center + textWidth / 2, Y + 0.8);
    Y += 7;
    doc.setFontSize(11);
    doc.setFont('arial', 'normal');
    doc.text('Nomor : ' + data.nomor_surat, center, Y, { align: 'center' });
    Y += 15;

    // PENUGAS
    doc.text('Ketua,', center, Y, { align: 'center' });
    Y += 5;
    doc.text('Sekolah Tinggi Ilmu Kesehatan Respati', center, Y, { align: 'center' });
    Y += 15;
    doc.text('Tentang,', center, Y, { align: 'center' });
    Y += 5;
    doc.text(data.dasar_tugas, center, Y, { align: 'center' });
    Y += 10;
    doc.setFont('arial', 'bold');
    doc.text('Menugaskan Kepada:', 20, Y);
    Y += 3;

    // TABEL PENERIMA TUGAS
    const tableHead = [['No', 'Nama', 'Jabatan', 'Keterangan Tugas']];
    const tableBody = data.daftar_penerima.map((p, index) => [
        index + 1,
        p.nama_lengkap || '-',
        p.jabatan || '-',
        p.peran || '-' // Kita gunakan 'peran' sebagai 'Keterangan Tugas'
    ]);

    autoTable(doc, {
        head: tableHead,
        body: tableBody,
        startY: Y,
        theme: 'grid',
        headStyles: { fillColor: [230, 230, 230], textColor: [0, 0, 0] },

        // TAMBAHKAN BLOK 'didDrawPage' INI
        didDrawPage: function (data) {
            Y = data.cursor.y + 10; // Dapatkan posisi Y setelah tabel selesai
        }
    });

    // DETAIL TUGAS
    doc.text('Waktu Pelaksanaan pada :', 20, Y);
    Y += 7;
    doc.setFont('arial', 'bold');
    //   const tugasText = data.tugas || '';
    //   const tugasLines = doc.splitTextToSize(tugasText, pageWidth - 40);
    //  doc.text(tugasLines, 20, Y);
    //  Y += tugasLines.length * 7 + 7; // perkiraan tinggi baris

    // WAKTU PELAKSANAAN
    doc.setFont('arial', 'normal');
    doc.text(`Hari/Tanggal`, 20, Y);
    //doc.text(`: ${formatDateIndonesian(data.tanggal_mulai) || '-'} s/d ${formatDateIndonesian(data.tanggal_selesai) || '-'}`, 60, Y);
    doc.text(`: ${formatDateIndonesian(data.tanggal_mulai) || '-'}`, 60, Y);
    Y += 7;
    doc.text(`Tempat`, 20, Y);
    doc.text(': ' + data.tempat_tugas || '-', 60, Y);
    Y += 15;

    // TANDA TANGAN
    const ttdX = pageWidth - 80;
    doc.text('Ditetapkan di: Singaparna-Tasikmalaya', ttdX, Y);
    Y += 7;
    // Hitung tanggal ditetapkan = tanggal_mulai - 1 hari
    const tanggalMulaiDate = new Date(data.tanggal_mulai);
    const tanggalDitetapkan = new Date(tanggalMulaiDate);
    tanggalDitetapkan.setDate(tanggalDitetapkan.getDate() - 1);
    const ditetapkanFormatted = formatDateIndonesianSimple(tanggalDitetapkan.toISOString().split('T')[0]);
    doc.text(`Pada Tanggal: ${ditetapkanFormatted}`, ttdX, Y);
    Y += 15;
    doc.text('SEKOLAH TINGGI ILMU KESEHATAN RESPATI', center, Y, { align: 'center' });
    Y += 7;
    doc.text(data.jabatan_penandatangan || '-', center, Y, { align: 'center' });
    Y += 25; // Jarak untuk TTD
    doc.setFont('arial', 'bold');
    doc.text(data.nama_penandatangan || '-', center, Y, { align: 'center' });
    // Tambah garis di bawah nama (dekat dengan text)
    const namaWidth = doc.getTextWidth(data.nama_penandatangan || '-');
    doc.line(center - namaWidth / 2, Y + 0.8, center + namaWidth / 2, Y + 0.8);
    Y += 4.5;
    doc.text(`NIK: ${data.nip_penandatangan || '-'}`, center, Y, { align: 'center' });
    Y += 15;

    // TEMBUSAN
    doc.setFont('arial', 'normal');
    if (data.tembusan && data.tembusan.length > 0) {
        doc.text('Tembusan disampaikan Kepada Yth:', 20, Y);
        Y += 7;
        data.tembusan.forEach((item, index) => {
            doc.text(`${index + 1}. ${item}`, 25, Y);
            Y += 5;
        });
    }
}
</script>

<template>
    <div>
        <div class="card">
            <Toolbar class="mb-6">
                <template #start>
                    <Button label="Buat Surat Tugas" icon="pi pi-plus" severity="secondary" class="mr-2" @click="openNew" />
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
                currentPageReportTemplate="Menampilkan {first} sampai {last} dari {totalRecords} surat"
            >
                <template #header>
                    <div class="flex flex-wrap gap-2 items-center justify-between">
                        <h4 class="m-0">Manajemen Surat Tugas</h4>
                        <IconField>
                            <InputIcon> <i class="pi pi-search" /> </InputIcon>
                            <InputText v-model="filters['global'].value" placeholder="Cari..." />
                        </IconField>
                    </div>
                </template>

                <Column field="nomor_surat" header="Nomor Surat" sortable></Column>
                <Column field="nomor_sppd" header="Nomor SPPD" sortable>
                    <template #body="slotProps">
                        <span>{{ slotProps.data.nomor_sppd || '-' }}</span>
                    </template>
                </Column>
                <Column field="tugas" header="Tugas" style="min-width: 20rem"></Column>
                <Column field="tanggal_mulai" header="Tanggal Mulai" sortable></Column>
                <Column field="tanggal_selesai" header="Tanggal Selesai" sortable></Column>
                <Column :exportable="false" style="min-width: 12rem" header="Aksi">
                    <template #body="slotProps">
                        <Button icon="pi pi-print" outlined rounded severity="info" class="mr-2" @click="handlePrint(slotProps.data)" v-tooltip.top="'Cetak Surat'" :loading="isPrinting" />
                        <Button icon="pi pi-pencil" outlined rounded class="mr-2" @click="editData(slotProps.data)" v-tooltip.top="'Edit Surat'" />
                        <Button icon="pi pi-trash" outlined rounded severity="danger" @click="confirmDelete(slotProps.data)" v-tooltip.top="'Hapus Surat'" />
                    </template>
                </Column>
            </DataTable>
        </div>

        <Dialog v-model:visible="dialog" :style="{ width: '70vw' }" :header="isNew ? 'Buat Surat Tugas Baru' : 'Edit Surat Tugas'" :modal="true">
            <TabView>
                <TabPanel header="Info Utama">
                    <div class="flex flex-col gap-6 mt-4">
                        <div>
                            <label for="dasar_tugas" class="block font-bold mb-3">Dasar Tugas *</label>
                            <Textarea id="dasar_tugas" v-model.trim="data.dasar_tugas" rows="2" required :invalid="submitted && !data.dasar_tugas" fluid />
                        </div>
                        <div>
                            <label for="tugas" class="block font-bold mb-3">Tugas *</label>
                            <Textarea id="tugas" v-model.trim="data.tugas" rows="3" required :invalid="submitted && !data.tugas" fluid />
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label for="tempat_tugas" class="block font-bold mb-3">Tempat Tugas</label>
                                <InputText id="tempat_tugas" v-model.trim="data.tempat_tugas" fluid />
                            </div>
                            <div>
                                <label for="penandatangan" class="block font-bold mb-3">Penandatangan *</label>
                                <Dropdown
                                    id="penandatangan"
                                    v-model="data.penandatangan_id"
                                    :options="pegawaiList"
                                    optionLabel="nama_lengkap"
                                    optionValue="id"
                                    placeholder="Pilih Penandatangan"
                                    :invalid="submitted && !data.penandatangan_id"
                                    fluid
                                    filter
                                />
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label for="tanggal_mulai" class="block font-bold mb-3">Tanggal Mulai *</label>
                                <Calendar id="tanggal_mulai" v-model="data.tanggal_mulai" dateFormat="yy-mm-dd" required :invalid="submitted && !data.tanggal_mulai" />
                            </div>
                            <div>
                                <label for="tanggal_selesai" class="block font-bold mb-3">Tanggal Selesai *</label>
                                <Calendar id="tanggal_selesai" v-model="data.tanggal_selesai" dateFormat="yy-mm-dd" required :invalid="submitted && !data.tanggal_selesai" />
                            </div>
                        </div>
                    </div>
                </TabPanel>
                <TabPanel header="Penerima & Tembusan">
                    <div class="flex flex-col gap-6 mt-4">
                        <div>
                            <label class="block font-bold mb-3">Penerima Tugas *</label>
                            <div v-for="(penerima, index) in data.penerima_tugas" :key="index" class="grid grid-cols-12 gap-2 mb-2">
                                <div class="col-span-7">
                                    <Dropdown v-model="penerima.pegawai_id" :options="pegawaiList" optionLabel="nama_lengkap" optionValue="id" placeholder="Pilih Pegawai" fluid filter />
                                </div>
                                <div class="col-span-4">
                                    <Dropdown v-model="penerima.peran" :options="peranPenerimaOptions" placeholder="Pilih Peran" fluid />
                                </div>
                                <div class="col-span-1 flex items-center">
                                    <Button v-if="data.penerima_tugas.length > 1" icon="pi pi-trash" severity="danger" text @click="removePenerimaTugas(index)" />
                                </div>
                            </div>
                            <Button label="Tambah Penerima" icon="pi pi-plus" severity="secondary" text @click="addPenerimaTugas" class="mt-2" />
                        </div>
                        <div>
                            <label for="tembusan" class="block font-bold mb-3">Tembusan (Opsional)</label>
                            <Chips id="tembusan" v-model="data.tembusan" separator="," />
                        </div>
                    </div>
                </TabPanel>
                <TabPanel header="Detail SPPD (Opsional)">
                    <div class="flex items-center mb-6">
                        <InputSwitch v-model="isSPPD" />
                        <label for="is_sppd" class="ml-2 font-bold">Aktifkan Detail SPPD</label>
                    </div>

                    <div v-if="isSPPD" class="flex flex-col gap-6">
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label for="alat_angkut" class="block font-bold mb-3">Alat Angkut</label>
                                <InputText id="alat_angkut" v-model.trim="data.alat_angkut" fluid />
                            </div>
                            <div>
                                <label for="tempat_berangkat" class="block font-bold mb-3">Tempat Berangkat</label>
                                <InputText id="tempat_berangkat" v-model.trim="data.tempat_berangkat" fluid />
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label for="lama_perjalanan" class="block font-bold mb-3">Lama Perjalanan (Hari)</label>
                                <InputNumber id="lama_perjalanan" v-model="data.lama_perjalanan" />
                            </div>
                            <div>
                                <label for="pembebanan_anggaran_mak" class="block font-bold mb-3">MAK</label>
                                <InputText id="pembebanan_anggaran_mak" v-model.trim="data.pembebanan_anggaran_mak" fluid />
                            </div>
                        </div>
                        <div>
                            <label for="pembebanan_anggaran_instansi" class="block font-bold mb-3">Instansi Pembebanan Anggaran</label>
                            <InputText id="pembebanan_anggaran_instansi" v-model.trim="data.pembebanan_anggaran_instansi" fluid />
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label for="ppk" class="block font-bold mb-3">PPK (Pejabat Pembuat Komitmen)</label>
                                <Dropdown id="ppk" v-model="data.ppk_pegawai_id" :options="pegawaiList" optionLabel="nama_lengkap" optionValue="id" placeholder="Pilih PPK" fluid filter />
                            </div>
                            <div>
                                <label for="kpa" class="block font-bold mb-3">KPA (Kuasa Pengguna Anggaran)</label>
                                <Dropdown id="kpa" v-model="data.kpa_pegawai_id" :options="pegawaiList" optionLabel="nama_lengkap" optionValue="id" placeholder="Pilih KPA" fluid filter />
                            </div>
                        </div>
                        <div>
                            <label for="keterangan_lain" class="block font-bold mb-3">Keterangan Lain</label>
                            <Textarea id="keterangan_lain" v-model.trim="data.keterangan_lain" rows="3" fluid />
                        </div>
                    </div>
                </TabPanel>
            </TabView>
            <template #footer>
                <Button label="Batal" icon="pi pi-times" text @click="hideDialog" />
                <Button label="Simpan" icon="pi pi-check" @click="saveData" />
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteDialog" :style="{ width: '450px' }" header="Konfirmasi" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl" />
                <span v-if="data"
                    >Apakah Anda yakin ingin menghapus <b>{{ data.nomor_surat }}</b
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
