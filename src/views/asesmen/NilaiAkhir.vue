<script setup>
import { useAsesmenStore } from '@/stores/asesmen';
import { useAkhirSemesterStore } from '@/stores/akhirSemester';
import { useAuthStore } from '@/stores/auth';
import { useTahunAkademikStore } from '@/stores/tahunAkademik';
import { storeToRefs } from 'pinia';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref, watch } from 'vue';

const store = useAsesmenStore();
const akhirStore = useAkhirSemesterStore();
const auth = useAuthStore();
const tahunStore = useTahunAkademikStore();
const toast = useToast();
const confirm = useConfirm();
const { finalGradeClasses: classes, finalGradeDetail: detail, isLoading, error } = storeToRefs(store);
const { list: academicYears } = storeToRefs(tahunStore);

const selectedYear = ref(null);
const selectedClass = ref(null);
const detailVisible = ref(false);
const scaleVisible = ref(false);
const scaleRows = ref([]);
const review = ref({ aksi: 'Disetujui', catatan: '' });
const correctionVisible = ref(false);
const correctionListVisible = ref(false);
const correctionForm = ref({ enrollment_id: null, mahasiswa: '', nilai_angka_baru: null, alasan: '' });
const { corrections } = storeToRefs(akhirStore);
const roles = computed(() => auth.userData?.roles || []);

const totalWeightValid = computed(() => Number(detail.value?.kelas.total_bobot || 0) === 100);
const allAssessmentsLocked = computed(() => detail.value?.kelas.jumlah_asesmen > 0 && detail.value.kelas.jumlah_asesmen === detail.value.kelas.jumlah_asesmen_dikunci);
const allStudentsComplete = computed(() => (detail.value?.mahasiswa.length || 0) > 0 && detail.value.mahasiswa.every(item => item.lengkap && item.nilai_huruf));
const readyToSubmit = computed(() => totalWeightValid.value && allAssessmentsLocked.value && allStudentsComplete.value && detail.value?.skala_tersedia);

onMounted(async () => {
    await tahunStore.fetchAll();
    selectedYear.value = academicYears.value.find(item => item.is_active)?.id || academicYears.value[0]?.id || null;
});

watch(selectedYear, async id => {
    if (!id) return;
    try {
        await store.fetchFinalGradeClasses(id);
    } catch (requestError) {
        notifyError();
    }
});

function statusSeverity(status) {
    return { Draft: 'secondary', Diajukan: 'warn', PerluRevisi: 'danger', Disetujui: 'info', Dipublikasikan: 'success' }[status] || 'secondary';
}

function componentScore(student, componentId) {
    return student.komponen.find(item => item.asesmen_id === componentId)?.nilai ?? '-';
}

function notifyError() {
    toast.add({ severity: 'error', summary: 'Gagal', detail: store.error || 'Operasi nilai akhir gagal.', life: 4500 });
}

async function openDetail(row) {
    selectedClass.value = row;
    try {
        await store.fetchFinalGradeDetail(row.jadwal_kuliah_id);
        review.value = { aksi: 'Disetujui', catatan: '' };
        detailVisible.value = true;
    } catch (requestError) {
        notifyError();
    }
}

async function reload() {
    await Promise.all([store.fetchFinalGradeClasses(selectedYear.value), store.fetchFinalGradeDetail(selectedClass.value.jadwal_kuliah_id)]);
    selectedClass.value = classes.value.find(item => item.jadwal_kuliah_id === selectedClass.value.jadwal_kuliah_id) || selectedClass.value;
}

async function execute(action, payload, successMessage) {
    try {
        await store.finalGradeAction(selectedClass.value.jadwal_kuliah_id, action, payload);
        await reload();
        toast.add({ severity: 'success', summary: 'Berhasil', detail: successMessage, life: 3000 });
    } catch (requestError) {
        notifyError();
    }
}

function submitGrades() {
    confirm.require({
        message: 'Ajukan nilai akhir kepada Kaprodi? Nilai komponen harus diperbaiki sebelum diajukan ulang jika ditolak.',
        header: 'Ajukan Nilai Akhir',
        icon: 'pi pi-send',
        acceptLabel: 'Ajukan',
        rejectLabel: 'Batal',
        accept: () => execute('ajukan', undefined, 'Nilai akhir diajukan kepada Kaprodi.')
    });
}

function reviewGrades() {
    if (review.value.aksi === 'PerluRevisi' && !review.value.catatan.trim()) {
        toast.add({ severity: 'warn', summary: 'Catatan wajib', detail: 'Jelaskan nilai yang perlu diperbaiki.', life: 3000 });
        return;
    }
    execute('review', review.value, 'Keputusan Kaprodi tersimpan.');
}

function publishGrades() {
    confirm.require({
        message: 'Publikasikan nilai ke KHS mahasiswa? Setelah dipublikasikan, rekap ini menjadi final.',
        header: 'Publikasikan Nilai',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Publikasikan',
        rejectLabel: 'Batal',
        accept: () => execute('publikasikan', undefined, 'Nilai akhir sudah tampil pada KHS mahasiswa.')
    });
}

function defaultScales() {
    const effectiveDate = `${new Date().getFullYear()}-01-01`;
    return [
        ['A', 4, 80, 100],
        ['B', 3, 70, 79.99],
        ['C', 2, 60, 69.99],
        ['D', 1, 50, 59.99],
        ['E', 0, 0, 49.99]
    ].map(([nilai_huruf, nilai_indeks, bobot_minimum, bobot_maksimum]) => ({ nilai_huruf, nilai_indeks, bobot_minimum, bobot_maksimum, tanggal_mulai_efektif: effectiveDate, tanggal_akhir_efektif: null }));
}

async function openScales() {
    try {
        const rows = await store.fetchGradeScales(detail.value.kelas.prodi_id);
        scaleRows.value = rows.filter(item => !item.dari_feeder).map(item => ({ ...item }));
        if (!scaleRows.value.length && !rows.some(item => item.dari_feeder)) scaleRows.value = defaultScales();
        scaleVisible.value = true;
    } catch (requestError) {
        notifyError();
    }
}

function addScale() {
    scaleRows.value.push({ nilai_huruf: '', nilai_indeks: 0, bobot_minimum: 0, bobot_maksimum: 0, tanggal_mulai_efektif: `${new Date().getFullYear()}-01-01`, tanggal_akhir_efektif: null });
}

async function saveScales() {
    try {
        await store.saveGradeScales(detail.value.kelas.prodi_id, scaleRows.value);
        scaleVisible.value = false;
        await reload();
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Skala nilai Prodi tersimpan.', life: 3000 });
    } catch (requestError) {
        notifyError();
    }
}

function requestCorrection(student) {
    correctionForm.value = { enrollment_id: student.enrollment_id, mahasiswa: `${student.nim} · ${student.nama_mahasiswa}`, nilai_angka_baru: student.nilai_akhir, alasan: '' };
    correctionVisible.value = true;
}
async function saveCorrection() {
    try {
        await akhirStore.submitCorrection({ enrollment_id: correctionForm.value.enrollment_id, nilai_angka_baru: correctionForm.value.nilai_angka_baru, alasan: correctionForm.value.alasan });
        correctionVisible.value = false;
        toast.add({ severity: 'success', summary: 'Diajukan', detail: 'Koreksi nilai dikirim kepada Kaprodi.', life: 3000 });
    } catch { toast.add({ severity: 'error', summary: 'Gagal', detail: akhirStore.error, life: 4000 }); }
}
async function openCorrections() { try { await akhirStore.fetchCorrections(); correctionListVisible.value = true; } catch { toast.add({ severity: 'error', summary: 'Gagal', detail: akhirStore.error, life: 4000 }); } }
async function reviewCorrection(row, aksi) { try { await akhirStore.reviewCorrection(row.id, { aksi, catatan: null }); await akhirStore.fetchCorrections(); } catch { toast.add({ severity: 'error', summary: 'Gagal', detail: akhirStore.error, life: 4000 }); } }
async function applyCorrection(row) { try { await akhirStore.applyCorrection(row.id); await akhirStore.fetchCorrections(); toast.add({ severity: 'success', summary: 'Diterapkan', detail: 'Nilai, AKM, dan outbox Feeder diperbarui.', life: 3000 }); } catch { toast.add({ severity: 'error', summary: 'Gagal', detail: akhirStore.error, life: 4000 }); } }
</script>

<template>
    <div class="card">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
                <h1 class="text-2xl font-semibold m-0">Nilai Akhir Mata Kuliah</h1>
                <p class="text-muted-color mt-2 mb-0">Rekap asesmen berbobot, validasi Prodi, dan publikasi nilai ke KHS.</p>
            </div>
            <div class="flex gap-2"><Button label="Koreksi Nilai" icon="pi pi-history" outlined @click="openCorrections" /><Select v-model="selectedYear" :options="academicYears" optionLabel="nama" optionValue="id" class="w-60" /></div>
        </div>

        <Message v-if="error" severity="error" class="mb-4">{{ error }}</Message>
        <DataTable :value="classes" :loading="isLoading" paginator :rows="15" stripedRows>
            <Column field="kode_mk" header="Kode" />
            <Column field="nama_mk" header="Mata Kuliah" />
            <Column field="kelas" header="Kelas" />
            <Column field="nama_prodi" header="Program Studi" />
            <Column header="Komponen">
                <template #body="{ data }">{{ data.jumlah_asesmen_dikunci }}/{{ data.jumlah_asesmen }} dikunci</template>
            </Column>
            <Column header="Bobot">
                <template #body="{ data }"><Tag :value="`${data.total_bobot}%`" :severity="Number(data.total_bobot) === 100 ? 'success' : 'danger'" /></template>
            </Column>
            <Column header="Status">
                <template #body="{ data }"><Tag :value="data.status" :severity="statusSeverity(data.status)" /></template>
            </Column>
            <Column header="Aksi">
                <template #body="{ data }"><Button label="Buka Rekap" icon="pi pi-table" size="small" text @click="openDetail(data)" /></template>
            </Column>
            <template #empty><div class="text-center p-8">Belum ada kelas pada periode ini.</div></template>
        </DataTable>
    </div>

    <Dialog v-model:visible="detailVisible" modal maximizable :style="{ width: '96vw' }" :header="detail ? `${detail.kelas.kode_mk} · ${detail.kelas.nama_mk} · ${detail.kelas.kelas}` : 'Rekap Nilai'">
        <div v-if="detail">
            <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div class="flex flex-wrap items-center gap-2">
                    <Tag :value="detail.kelas.status" :severity="statusSeverity(detail.kelas.status)" />
                    <Tag :value="`Bobot ${detail.kelas.total_bobot}%`" :severity="totalWeightValid ? 'success' : 'danger'" />
                    <Tag :value="`${detail.kelas.jumlah_asesmen_dikunci}/${detail.kelas.jumlah_asesmen} komponen dikunci`" :severity="allAssessmentsLocked ? 'success' : 'warn'" />
                </div>
                <div class="flex gap-2">
                    <Button v-if="detail.kelas.can_review" label="Atur Skala Nilai" icon="pi pi-sliders-h" outlined @click="openScales" />
                    <Button v-if="detail.kelas.can_submit && ['Draft', 'PerluRevisi'].includes(detail.kelas.status)" label="Ajukan ke Kaprodi" icon="pi pi-send" :disabled="!readyToSubmit" @click="submitGrades" />
                    <Button v-if="detail.kelas.can_publish && detail.kelas.status === 'Disetujui'" label="Publikasikan ke KHS" icon="pi pi-check-circle" severity="success" @click="publishGrades" />
                </div>
            </div>

            <Message v-if="!totalWeightValid" severity="error" class="mb-3">Total bobot seluruh asesmen harus tepat 100%.</Message>
            <Message v-else-if="!allAssessmentsLocked" severity="warn" class="mb-3">Semua asesmen harus selesai dinilai dan dikunci.</Message>
            <Message v-else-if="!detail.skala_tersedia" severity="error" class="mb-3">Skala nilai untuk Program Studi dan periode ini belum tersedia.</Message>
            <Message v-else-if="!allStudentsComplete" severity="warn" class="mb-3">Masih ada peserta dengan nilai komponen atau konversi huruf yang belum lengkap.</Message>

            <div v-if="detail.kelas.can_review && detail.kelas.status === 'Diajukan'" class="card border border-surface mb-4">
                <h3 class="mt-0">Validasi Kaprodi</h3>
                <div class="flex flex-col md:flex-row gap-3">
                    <Select v-model="review.aksi" :options="['Disetujui', 'PerluRevisi']" class="md:w-48" />
                    <InputText v-model="review.catatan" placeholder="Catatan validasi" class="flex-1" />
                    <Button label="Simpan Keputusan" icon="pi pi-save" @click="reviewGrades" />
                </div>
            </div>

            <DataTable :value="detail.mahasiswa" :loading="isLoading" paginator :rows="20" size="small" scrollable>
                <Column field="nim" header="NIM" frozen style="min-width: 130px" />
                <Column field="nama_mahasiswa" header="Nama Mahasiswa" frozen style="min-width: 220px" />
                <Column v-for="component in detail.komponen" :key="component.id" :header="`${component.judul} (${component.bobot}%)`" style="min-width: 150px">
                    <template #body="{ data }">{{ componentScore(data, component.id) }}</template>
                </Column>
                <Column header="Nilai Akhir" style="min-width: 110px">
                    <template #body="{ data }"><b>{{ data.nilai_akhir ?? '-' }}</b></template>
                </Column>
                <Column header="Huruf" style="min-width: 90px">
                    <template #body="{ data }"><Tag :value="data.nilai_huruf || '-'" :severity="data.nilai_huruf ? 'success' : 'warn'" /></template>
                </Column>
                <Column field="nilai_indeks" header="Indeks" style="min-width: 90px" />
                <Column v-if="detail.kelas.status === 'Dipublikasikan' && detail.kelas.can_submit" header="Koreksi" style="min-width: 90px"><template #body="{ data }"><Button icon="pi pi-pencil" text severity="warn" @click="requestCorrection(data)" /></template></Column>
            </DataTable>

            <h3 class="mt-6">Riwayat Workflow</h3>
            <DataTable :value="detail.riwayat" size="small">
                <Column field="aksi" header="Aksi" />
                <Column field="catatan" header="Catatan" />
                <Column field="dilakukan_oleh" header="Oleh" />
                <Column header="Waktu"><template #body="{ data }">{{ new Date(data.created_at).toLocaleString('id-ID') }}</template></Column>
                <template #empty><div class="text-center p-4">Belum ada riwayat workflow.</div></template>
            </DataTable>
        </div>
    </Dialog>

    <Dialog v-model:visible="scaleVisible" modal header="Skala Nilai Program Studi" :style="{ width: '820px' }">
        <Message severity="info" class="mb-4">Contoh A–E hanya rancangan awal di form. Sesuaikan dengan pedoman akademik sebelum menyimpan.</Message>
        <DataTable :value="scaleRows" size="small">
            <Column header="Huruf"><template #body="{ data }"><InputText v-model="data.nilai_huruf" class="w-20" /></template></Column>
            <Column header="Indeks"><template #body="{ data }"><InputNumber v-model="data.nilai_indeks" :min="0" :max="4" :minFractionDigits="0" :maxFractionDigits="2" class="w-24" /></template></Column>
            <Column header="Minimum"><template #body="{ data }"><InputNumber v-model="data.bobot_minimum" :min="0" :max="100" :maxFractionDigits="2" class="w-28" /></template></Column>
            <Column header="Maksimum"><template #body="{ data }"><InputNumber v-model="data.bobot_maksimum" :min="0" :max="100" :maxFractionDigits="2" class="w-28" /></template></Column>
            <Column header="Mulai Efektif"><template #body="{ data }"><InputText v-model="data.tanggal_mulai_efektif" placeholder="YYYY-MM-DD" class="w-32" /></template></Column>
            <Column header="Akhir Efektif"><template #body="{ data }"><InputText v-model="data.tanggal_akhir_efektif" placeholder="Opsional" class="w-32" /></template></Column>
            <Column header="Aksi"><template #body="{ index }"><Button icon="pi pi-trash" text severity="danger" @click="scaleRows.splice(index, 1)" /></template></Column>
        </DataTable>
        <Button label="Tambah Rentang" icon="pi pi-plus" text class="mt-3" @click="addScale" />
        <template #footer><Button label="Batal" text @click="scaleVisible = false" /><Button label="Simpan Skala" icon="pi pi-save" :loading="isLoading" @click="saveScales" /></template>
    </Dialog>

    <Dialog v-model:visible="correctionVisible" modal header="Ajukan Koreksi Nilai" :style="{ width: '520px' }">
        <p><b>{{ correctionForm.mahasiswa }}</b></p>
        <label class="block font-bold mb-2">Nilai Angka Baru</label><InputNumber v-model="correctionForm.nilai_angka_baru" :min="0" :max="100" fluid />
        <label class="block font-bold mt-4 mb-2">Alasan Koreksi</label><Textarea v-model="correctionForm.alasan" rows="4" fluid placeholder="Minimal 10 karakter" />
        <template #footer><Button label="Batal" text @click="correctionVisible = false" /><Button label="Ajukan" icon="pi pi-send" :disabled="correctionForm.alasan.trim().length < 10" @click="saveCorrection" /></template>
    </Dialog>

    <Dialog v-model:visible="correctionListVisible" modal maximizable header="Workflow Koreksi Nilai" :style="{ width: '90vw' }">
        <DataTable :value="corrections" paginator :rows="15" size="small">
            <Column field="nim" header="NIM" /><Column field="nama_mahasiswa" header="Mahasiswa" /><Column field="kode_mk" header="MK" />
            <Column header="Perubahan"><template #body="{ data }">{{ data.nilai_angka_lama }} ({{ data.nilai_huruf_lama }}) → {{ data.nilai_angka_baru }} ({{ data.nilai_huruf_baru }})</template></Column>
            <Column field="alasan" header="Alasan" /><Column header="Status"><template #body="{ data }"><Tag :value="data.status" /></template></Column>
            <Column header="Aksi"><template #body="{ data }"><div class="flex gap-1"><Button v-if="roles.some(r => ['KAPRODI','SUPER_ADMIN'].includes(r)) && data.status === 'Diajukan'" icon="pi pi-check" text severity="success" @click="reviewCorrection(data, 'Disetujui')" /><Button v-if="roles.some(r => ['KAPRODI','SUPER_ADMIN'].includes(r)) && data.status === 'Diajukan'" icon="pi pi-times" text severity="danger" @click="reviewCorrection(data, 'Ditolak')" /><Button v-if="roles.some(r => ['STAF_AKADEMIK','SUPER_ADMIN'].includes(r)) && data.status === 'Disetujui'" label="Terapkan" size="small" @click="applyCorrection(data)" /></div></template></Column>
        </DataTable>
    </Dialog>
</template>
