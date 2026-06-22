<script setup>
import { useAsesmenStore } from '@/stores/asesmen';
import { useAuthStore } from '@/stores/auth';
import { useTahunAkademikStore } from '@/stores/tahunAkademik';
import { storeToRefs } from 'pinia';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref, watch } from 'vue';

const store = useAsesmenStore();
const auth = useAuthStore();
const tahunStore = useTahunAkademikStore();
const toast = useToast();
const { list, schedules, detail, isLoading, error } = storeToRefs(store);
const { list: tahunList } = storeToRefs(tahunStore);

const selectedTahun = ref(null);
const selectedRow = ref(null);
const detailDialog = ref(false);
const formDialog = ref(false);
const form = ref({});
const documentType = ref('Soal');
const reviewForm = ref({ aksi: 'Disetujui', catatan: '' });
const productionForm = ref({ jumlah_utama: 0, jumlah_cadangan: 2, status: 'Diajukan', catatan: '' });
const finishForm = ref({ versi_soal: '', jumlah_lembar_diterima: null, bap: '', insiden: '' });

const roles = computed(() => auth.userData?.roles || []);
const canCreate = computed(() => roles.value.some(role => ['DOSEN', 'STAF_AKADEMIK', 'SUPER_ADMIN'].includes(role)) && schedules.value.some(item => item.can_create));
const canContent = computed(() => selectedRow.value?.can_edit && roles.value.some(role => ['DOSEN', 'SUPER_ADMIN'].includes(role)));
const scheduleOptions = computed(() => schedules.value.filter(item => item.can_create).map(item => ({ ...item, label: `${item.kode_mk} - ${item.nama_mk} (${item.kelas})` })));
const editableStatuses = ['Draft', 'PerluRevisi'];
const jenisOptions = ['Kuis', 'Tugas', 'UTS', 'UAS', 'Praktik'];
const modeOptions = ['Manual', 'Online'];
const attendanceOptions = ['Hadir', 'Terlambat', 'Izin', 'Sakit', 'Alpa'];
const productionStatuses = ['Diajukan', 'Diproses', 'Selesai', 'Diserahkan'];

onMounted(async () => {
    await tahunStore.fetchAll();
    selectedTahun.value = tahunList.value.find(item => item.is_active)?.id || tahunList.value[0]?.id || null;
});

watch(selectedTahun, async id => {
    if (!id) return;
    try {
        await Promise.all([store.fetchAll(id), store.fetchSchedules(id)]);
    } catch (requestError) {
        notifyError();
    }
});

function notifyError() {
    toast.add({ severity: 'error', summary: 'Gagal', detail: store.error || 'Operasi gagal.', life: 4000 });
}

function newForm() {
    selectedRow.value = null;
    form.value = {
        jadwal_kuliah_id: schedules.value.find(item => item.can_create)?.id || null,
        jenis: 'UTS', judul: 'Ujian Tengah Semester', mode: 'Manual', bobot: 20,
        durasi_menit: 90, mulai_terjadwal: new Date(),
        selesai_terjadwal: new Date(Date.now() + 90 * 60000), online_url: '',
        instruksi: '', sifat_ujian: 'Tutup Buku', hitung_sebagai_pertemuan: true
    };
    formDialog.value = true;
}

function editForm() {
    const a = detail.value.asesmen;
    form.value = { ...a, mulai_terjadwal: new Date(a.mulai_terjadwal), selesai_terjadwal: new Date(a.selesai_terjadwal) };
    formDialog.value = true;
}

function apiPayload() {
    return {
        ...form.value,
        bobot: Number(form.value.bobot),
        mulai_terjadwal: form.value.mulai_terjadwal.toISOString(),
        selesai_terjadwal: form.value.selesai_terjadwal.toISOString(),
        online_url: form.value.mode === 'Online' ? form.value.online_url : null
    };
}

async function save() {
    try {
        await store.save(apiPayload(), selectedRow.value?.id);
        formDialog.value = false;
        await reload();
        toast.add({ severity: 'success', summary: 'Tersimpan', detail: 'Asesmen berhasil disimpan.', life: 2500 });
    } catch (requestError) { notifyError(); }
}

async function openDetail(row) {
    selectedRow.value = row;
    try {
        await store.fetchDetail(row.id);
        productionForm.value = detail.value.penggandaan || { jumlah_utama: detail.value.jumlah_peserta, jumlah_cadangan: 2, status: 'Diajukan', catatan: '' };
        finishForm.value = { versi_soal: '', jumlah_lembar_diterima: null, bap: '', insiden: '' };
        detailDialog.value = true;
    } catch (requestError) { notifyError(); }
}

async function reload() {
    await store.fetchAll(selectedTahun.value);
    if (selectedRow.value) {
        selectedRow.value = list.value.find(item => item.id === selectedRow.value.id) || selectedRow.value;
        await store.fetchDetail(selectedRow.value.id);
    }
}

async function action(name, payload) {
    try {
        await store.action(selectedRow.value.id, name, payload);
        await reload();
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Workflow asesmen diperbarui.', life: 2500 });
    } catch (requestError) { notifyError(); }
}

async function upload(event) {
    const data = new FormData();
    data.append('file', event.files[0]);
    try {
        await store.upload(selectedRow.value.id, documentType.value, data);
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Dokumen asesmen diunggah.', life: 2500 });
    } catch (requestError) { notifyError(); }
}

async function saveProduction() {
    try {
        await store.production(selectedRow.value.id, productionForm.value);
        await reload();
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Status penggandaan diperbarui.', life: 2500 });
    } catch (requestError) { notifyError(); }
}

async function updateAttendance(row) {
    try {
        await store.attendance(selectedRow.value.id, row.enrollment_id, { status: row.status_presensi, catatan: null });
        await store.fetchDetail(selectedRow.value.id);
    } catch (requestError) { notifyError(); }
}

async function saveGrade(row) {
    try {
        await store.grade(selectedRow.value.id, row.enrollment_id, { attempt: row.attempt || 1, nilai: row.nilai, umpan_balik: row.umpan_balik });
        await reload();
        toast.add({ severity: 'success', summary: 'Nilai Tersimpan', life: 1800 });
    } catch (requestError) { notifyError(); }
}

function statusSeverity(status) {
    return { Draft: 'secondary', Diajukan: 'warn', PerluRevisi: 'danger', Disetujui: 'info', SiapDilaksanakan: 'success', Berlangsung: 'success', Selesai: 'info', Dinilai: 'help', Dikunci: 'contrast' }[status] || 'secondary';
}

function formatDate(value) {
    return new Date(value).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
}
</script>

<template>
    <div class="card">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div><h1 class="text-2xl font-semibold m-0">Ujian & Asesmen</h1><p class="text-muted-color mt-2 mb-0">Pengajuan soal, review, penggandaan, pelaksanaan, dan nilai.</p></div>
            <div class="flex gap-2"><Select v-model="selectedTahun" :options="tahunList" optionLabel="nama" optionValue="id" class="w-56" /><Button v-if="canCreate" label="Buat Asesmen" icon="pi pi-plus" @click="newForm" /></div>
        </div>
        <Message v-if="error" severity="error" class="mb-4">{{ error }}</Message>
        <DataTable :value="list" :loading="isLoading" paginator :rows="15" stripedRows>
            <Column field="kode_mk" header="Kode" /><Column field="nama_mk" header="Mata Kuliah" /><Column field="kelas" header="Kelas" />
            <Column field="jenis" header="Jenis"><template #body="{ data }"><Tag :value="data.jenis" /></template></Column>
            <Column field="judul" header="Judul" /><Column field="mode" header="Mode" />
            <Column header="Jadwal"><template #body="{ data }">{{ formatDate(data.mulai_terjadwal) }}</template></Column>
            <Column header="Status"><template #body="{ data }"><Tag :value="data.status" :severity="statusSeverity(data.status)" /></template></Column>
            <Column header="Aksi"><template #body="{ data }"><Button label="Buka" icon="pi pi-eye" size="small" text @click="openDetail(data)" /></template></Column>
            <template #empty><div class="text-center p-8">Belum ada asesmen pada periode ini.</div></template>
        </DataTable>
    </div>

    <Dialog v-model:visible="formDialog" :header="selectedRow ? 'Ubah Asesmen' : 'Buat Asesmen'" modal :style="{ width: '720px' }">
        <div class="grid grid-cols-12 gap-4">
            <div class="col-span-12"><label class="font-bold block mb-2">Kelas</label><Select v-model="form.jadwal_kuliah_id" :options="scheduleOptions" optionValue="id" optionLabel="label" fluid :disabled="!!selectedRow" /></div>
            <div class="col-span-6"><label class="font-bold block mb-2">Jenis</label><Select v-model="form.jenis" :options="jenisOptions" fluid /></div>
            <div class="col-span-6"><label class="font-bold block mb-2">Mode</label><Select v-model="form.mode" :options="modeOptions" fluid /></div>
            <div class="col-span-12"><label class="font-bold block mb-2">Judul</label><InputText v-model="form.judul" fluid /></div>
            <div class="col-span-6"><label class="font-bold block mb-2">Bobot (%)</label><InputNumber v-model="form.bobot" :min="0" :max="100" fluid /></div>
            <div class="col-span-6"><label class="font-bold block mb-2">Durasi (menit)</label><InputNumber v-model="form.durasi_menit" :min="1" fluid /></div>
            <div class="col-span-6"><label class="font-bold block mb-2">Mulai</label><DatePicker v-model="form.mulai_terjadwal" showTime hourFormat="24" fluid /></div>
            <div class="col-span-6"><label class="font-bold block mb-2">Selesai</label><DatePicker v-model="form.selesai_terjadwal" showTime hourFormat="24" fluid /></div>
            <div v-if="form.mode === 'Online'" class="col-span-12"><label class="font-bold block mb-2">Link Ujian</label><InputText v-model="form.online_url" placeholder="https://..." fluid /></div>
            <div class="col-span-6"><label class="font-bold block mb-2">Sifat Ujian</label><InputText v-model="form.sifat_ujian" placeholder="Tutup Buku" fluid /></div>
            <div class="col-span-6 flex items-end gap-2"><Checkbox v-model="form.hitung_sebagai_pertemuan" binary inputId="countMeeting" /><label for="countMeeting">Hitung sebagai pertemuan</label></div>
            <div class="col-span-12"><label class="font-bold block mb-2">Instruksi</label><Textarea v-model="form.instruksi" rows="3" fluid /></div>
        </div>
        <template #footer><Button label="Batal" text @click="formDialog = false" /><Button label="Simpan" icon="pi pi-save" :loading="isLoading" @click="save" /></template>
    </Dialog>

    <Dialog v-model:visible="detailDialog" :header="`${selectedRow?.jenis || ''} - ${selectedRow?.judul || ''}`" modal maximizable :style="{ width: '94vw' }">
        <div v-if="detail">
            <div class="flex flex-wrap items-center justify-between gap-3 mb-4"><div class="flex items-center gap-2"><Tag :value="detail.asesmen.status" :severity="statusSeverity(detail.asesmen.status)" /><span>{{ selectedRow?.kode_mk }} · {{ selectedRow?.nama_mk }} · {{ selectedRow?.kelas }}</span></div><div class="flex flex-wrap gap-2"><Button v-if="selectedRow?.can_edit && editableStatuses.includes(detail.asesmen.status)" label="Ubah" icon="pi pi-pencil" outlined @click="editForm" /><Button v-if="canContent && editableStatuses.includes(detail.asesmen.status)" label="Ajukan" icon="pi pi-send" @click="action('submit')" /><Button v-if="selectedRow?.can_execute && detail.asesmen.status === 'SiapDilaksanakan'" label="Mulai Ujian" icon="pi pi-play" severity="success" @click="action('mulai')" /><Button v-if="selectedRow?.can_grade && detail.asesmen.status === 'Dinilai'" label="Kunci Nilai" icon="pi pi-lock" severity="contrast" @click="action('kunci')" /><Button v-if="selectedRow?.can_grade && detail.asesmen.status === 'Dikunci'" label="Buka untuk Revisi" icon="pi pi-lock-open" severity="warn" outlined @click="action('buka-nilai')" /></div></div>
            <TabView>
                <TabPanel header="Informasi & Dokumen">
                    <div class="grid grid-cols-12 gap-5">
                        <div class="col-span-12 lg:col-span-5"><div class="card border border-surface"><p><b>Mode:</b> {{ detail.asesmen.mode }}</p><p><b>Bobot:</b> {{ detail.asesmen.bobot }}%</p><p><b>Jadwal:</b> {{ formatDate(detail.asesmen.mulai_terjadwal) }} – {{ formatDate(detail.asesmen.selesai_terjadwal) }}</p><p><b>Sifat:</b> {{ detail.asesmen.sifat_ujian || '-' }}</p><p><b>Instruksi:</b> {{ detail.asesmen.instruksi || '-' }}</p><p v-if="detail.asesmen.online_url && selectedRow?.can_edit"><b>Link:</b> {{ detail.asesmen.online_url }}</p></div></div>
                        <div class="col-span-12 lg:col-span-7"><div v-if="canContent && editableStatuses.includes(detail.asesmen.status)" class="flex gap-2 mb-4"><Select v-model="documentType" :options="['Soal', 'Lampiran', 'KunciJawaban']" /><FileUpload mode="basic" customUpload auto chooseLabel="Unggah Dokumen" :maxFileSize="10000000" @uploader="upload" /></div><DataTable :value="detail.dokumen" size="small"><Column field="jenis" header="Jenis" /><Column field="versi" header="Versi" /><Column field="nama_file_asli" header="File" /><Column header="Aksi"><template #body="{ data }"><Button icon="pi pi-download" text @click="store.download(selectedRow.id, data)" /></template></Column></DataTable></div>
                    </div>
                </TabPanel>
                <TabPanel header="Review Prodi">
                    <div v-if="selectedRow?.can_review && detail.asesmen.status === 'Diajukan'" class="card border border-surface mb-4"><div class="flex gap-3 mb-3"><Select v-model="reviewForm.aksi" :options="['Disetujui', 'PerluRevisi']" /><InputText v-model="reviewForm.catatan" placeholder="Catatan review" class="flex-1" /><Button label="Simpan Review" @click="action('review', reviewForm)" /></div></div>
                    <DataTable :value="detail.review" size="small"><Column field="aksi" header="Keputusan" /><Column field="catatan" header="Catatan" /><Column field="reviewer" header="Reviewer" /><Column header="Waktu"><template #body="{ data }">{{ formatDate(data.created_at) }}</template></Column></DataTable>
                </TabPanel>
                <TabPanel header="Penggandaan" :disabled="detail.asesmen.mode !== 'Manual'">
                    <div v-if="selectedRow?.can_production" class="grid grid-cols-12 gap-4"><div class="col-span-3"><label class="block mb-2">Jumlah Utama</label><InputNumber v-model="productionForm.jumlah_utama" fluid /></div><div class="col-span-3"><label class="block mb-2">Cadangan</label><InputNumber v-model="productionForm.jumlah_cadangan" fluid /></div><div class="col-span-3"><label class="block mb-2">Status</label><Select v-model="productionForm.status" :options="productionStatuses" fluid /></div><div class="col-span-12"><Textarea v-model="productionForm.catatan" placeholder="Catatan penggandaan/serah terima" fluid /><Button label="Simpan Penggandaan" icon="pi pi-save" class="mt-3" @click="saveProduction" /></div></div><Message v-else severity="info">Status: {{ detail.penggandaan?.status || 'Belum diajukan' }}</Message>
                </TabPanel>
                <TabPanel header="Pelaksanaan & Presensi">
                    <div v-if="detail.sesi_presensi" class="p-4 mb-4 text-center rounded border border-primary"><div class="text-sm">Kode Presensi Ujian</div><div class="text-4xl font-bold tracking-widest text-primary">{{ detail.sesi_presensi.kode }}</div><small>Berlaku sampai {{ formatDate(detail.sesi_presensi.berlaku_sampai) }}</small></div>
                    <div v-if="selectedRow?.can_execute && detail.asesmen.status === 'Berlangsung'" class="card border border-surface mb-4"><Textarea v-model="finishForm.bap" placeholder="Berita acara pelaksanaan ujian *" rows="3" fluid /><div class="grid grid-cols-12 gap-3 mt-3"><InputText v-model="finishForm.versi_soal" placeholder="Versi soal" class="col-span-3" /><InputNumber v-model="finishForm.jumlah_lembar_diterima" placeholder="Lembar diterima" class="col-span-3" /><InputText v-model="finishForm.insiden" placeholder="Insiden/kendala" class="col-span-4" /><Button label="Tutup Ujian" severity="danger" class="col-span-2" @click="action('selesai', finishForm)" /></div></div>
                    <DataTable :value="detail.roster" paginator :rows="15" size="small"><Column field="nim" header="NIM" /><Column field="nama_mahasiswa" header="Nama" /><Column header="Presensi"><template #body="{ data }"><Select v-model="data.status_presensi" :options="attendanceOptions" :disabled="!selectedRow?.can_execute || detail.asesmen.status !== 'Berlangsung'" @change="updateAttendance(data)" /></template></Column><Column field="sumber" header="Sumber" /></DataTable>
                </TabPanel>
                <TabPanel header="Penilaian">
                    <DataTable :value="detail.roster" paginator :rows="15" size="small"><Column field="nim" header="NIM" /><Column field="nama_mahasiswa" header="Nama" /><Column header="Attempt"><template #body="{ data }"><InputNumber v-model="data.attempt" :min="1" :disabled="!selectedRow?.can_grade || !['Selesai', 'Dinilai'].includes(detail.asesmen.status)" /></template></Column><Column header="Nilai"><template #body="{ data }"><InputNumber v-model="data.nilai" :min="0" :max="100" :disabled="!selectedRow?.can_grade || !['Selesai', 'Dinilai'].includes(detail.asesmen.status)" /></template></Column><Column header="Umpan Balik"><template #body="{ data }"><InputText v-model="data.umpan_balik" :disabled="!selectedRow?.can_grade || !['Selesai', 'Dinilai'].includes(detail.asesmen.status)" /></template></Column><Column header="Aksi"><template #body="{ data }"><Button icon="pi pi-save" text :disabled="!selectedRow?.can_grade || data.nilai == null || !['Selesai', 'Dinilai'].includes(detail.asesmen.status)" @click="saveGrade(data)" /></template></Column></DataTable>
                </TabPanel>
            </TabView>
        </div>
    </Dialog>
</template>
