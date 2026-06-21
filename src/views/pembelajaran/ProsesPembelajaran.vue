<script setup>
import { usePembelajaranStore } from '@/stores/pembelajaran';
import { storeToRefs } from 'pinia';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';

const store = usePembelajaranStore();
const toast = useToast();
const { kelas, pertemuan, detail, sesiPresensi, isLoading, error: storeError } = storeToRefs(store);

const kelasDialog = ref(false);
const formDialog = ref(false);
const detailDialog = ref(false);
const selectedKelas = ref(null);
const selectedPertemuan = ref(null);
const formPertemuan = ref({});
const bapForm = ref({});

const statusOptions = ['Hadir', 'Terlambat', 'Izin', 'Sakit', 'Alpa'];

onMounted(() => reloadKelas());

function showError(error, fallback = 'Operasi gagal.') {
    toast.add({ severity: 'error', summary: 'Gagal', detail: store.error || fallback, life: 4000 });
}

async function reloadKelas() {
    try {
        await store.fetchKelas();
    } catch (error) {
        showError(error, 'Gagal mengambil kelas pembelajaran.');
    }
}

async function openKelas(row) {
    if (!row.pembelajaran_aktif) {
        toast.add({ severity: 'warn', summary: 'Pembelajaran Terkunci', detail: `RPS masih berstatus ${row.status_rps}.`, life: 4000 });
        return;
    }
    selectedKelas.value = row;
    try {
        await store.fetchPertemuan(row.jadwal_kuliah_id);
        kelasDialog.value = true;
    } catch (error) {
        showError(error);
    }
}

function openCreateForm() {
    const nextMeeting = Math.min((pertemuan.value.at(-1)?.pertemuan_ke || 0) + 1, 32);
    formPertemuan.value = {
        pertemuan_ke: nextMeeting,
        tanggal: new Date(),
        topik_rencana: '',
        metode_pembelajaran: ''
    };
    formDialog.value = true;
}

function formatDateForApi(date) {
    if (typeof date === 'string') return date.slice(0, 10);
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
}

async function createPertemuan() {
    try {
        await store.createPertemuan(selectedKelas.value.jadwal_kuliah_id, {
            ...formPertemuan.value,
            tanggal: formatDateForApi(formPertemuan.value.tanggal)
        });
        formDialog.value = false;
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Pertemuan ditambahkan.', life: 2500 });
    } catch (error) {
        showError(error);
    }
}

async function openDetail(row) {
    selectedPertemuan.value = row;
    store.sesiPresensi = null;
    try {
        await store.fetchDetail(row.id);
        bapForm.value = {
            topik_realisasi: detail.value.pertemuan.topik_realisasi || '',
            metode_pembelajaran: detail.value.pertemuan.metode_pembelajaran || '',
            bap: detail.value.pertemuan.bap || ''
        };
        detailDialog.value = true;
    } catch (error) {
        showError(error);
    }
}

async function saveBap(showToast = true) {
    try {
        await store.saveBap(selectedPertemuan.value.id, bapForm.value);
        if (showToast) toast.add({ severity: 'success', summary: 'Tersimpan', detail: 'BAP diperbarui.', life: 2500 });
        return true;
    } catch (error) {
        showError(error);
        return false;
    }
}

async function openSession() {
    try {
        await store.openPertemuan(selectedPertemuan.value.id);
        await store.fetchPertemuan(selectedKelas.value.jadwal_kuliah_id);
        toast.add({ severity: 'success', summary: 'Pertemuan Dibuka', detail: 'Kode presensi aktif selama 10 menit.', life: 3000 });
    } catch (error) {
        showError(error);
    }
}

async function closeSession() {
    if (!(await saveBap(false))) return;
    try {
        await store.closePertemuan(selectedPertemuan.value.id);
        await store.fetchPertemuan(selectedKelas.value.jadwal_kuliah_id);
        await store.fetchKelas();
        toast.add({ severity: 'success', summary: 'Pertemuan Ditutup', detail: 'BAP dan presensi telah dikunci.', life: 3000 });
    } catch (error) {
        showError(error);
    }
}

async function updateAttendance(row, status) {
    try {
        await store.updatePresensi(selectedPertemuan.value.id, row.enrollment_id, status, row.catatan);
    } catch (error) {
        showError(error);
    }
}

function statusSeverity(status) {
    return { Dibuka: 'success', Ditutup: 'info', Dibatalkan: 'danger' }[status] || 'secondary';
}
</script>

<template>
    <div class="card">
        <div class="flex flex-wrap justify-between items-center gap-3 mb-6">
            <div>
                <h1 class="text-2xl font-semibold m-0">Proses Pembelajaran</h1>
                <p class="text-muted-color mt-2 mb-0">Kelola pertemuan, BAP, dan presensi kelas yang Anda ampu.</p>
            </div>
            <Button icon="pi pi-refresh" label="Muat Ulang" outlined :loading="isLoading" @click="reloadKelas" />
        </div>

        <Message v-if="storeError" severity="error" class="mb-4">{{ storeError }}</Message>

        <DataTable :value="kelas" :loading="isLoading" paginator :rows="10" stripedRows>
            <Column field="kode_mk" header="Kode" sortable class="font-mono font-bold" />
            <Column field="nama_mk" header="Mata Kuliah" sortable />
            <Column field="kelas" header="Kelas" />
            <Column field="nama_tahun_akademik" header="Periode" />
            <Column header="Jadwal">
                <template #body="{ data }">{{ data.hari }}, {{ data.jam_mulai }}–{{ data.jam_selesai }}</template>
            </Column>
            <Column header="RPS">
                <template #body="{ data }">
                    <Tag :value="data.status_rps" :severity="data.pembelajaran_aktif ? 'success' : 'warn'" />
                </template>
            </Column>
            <Column field="jumlah_pertemuan" header="Realisasi" class="text-center" />
            <Column header="Aksi" class="text-center">
                <template #body="{ data }">
                    <Button :label="data.pembelajaran_aktif ? 'Buka Kelas' : 'Terkunci'"
                        :icon="data.pembelajaran_aktif ? 'pi pi-book' : 'pi pi-lock'" size="small"
                        :severity="data.pembelajaran_aktif ? 'primary' : 'secondary'" outlined @click="openKelas(data)" />
                </template>
            </Column>
            <template #empty><div class="text-center p-6">Belum ada jadwal mengajar.</div></template>
        </DataTable>
    </div>

    <Dialog v-model:visible="kelasDialog" :header="`${selectedKelas?.kode_mk} - ${selectedKelas?.nama_mk} (${selectedKelas?.kelas})`"
        modal maximizable :style="{ width: '85vw' }">
        <Toolbar class="mb-4">
            <template #start><Button label="Tambah Pertemuan" icon="pi pi-plus" @click="openCreateForm" /></template>
            <template #end><span class="text-muted-color">{{ selectedKelas?.nama_tahun_akademik }}</span></template>
        </Toolbar>
        <DataTable :value="pertemuan" :loading="isLoading" stripedRows>
            <Column field="pertemuan_ke" header="Ke-" class="font-bold text-center" />
            <Column field="tanggal" header="Tanggal" />
            <Column field="topik_rencana" header="Topik Rencana" />
            <Column header="Status">
                <template #body="{ data }"><Tag :value="data.status" :severity="statusSeverity(data.status)" /></template>
            </Column>
            <Column header="Aksi" class="text-center">
                <template #body="{ data }"><Button label="Kelola" icon="pi pi-file-edit" size="small" text @click="openDetail(data)" /></template>
            </Column>
            <template #empty><div class="text-center p-8">Belum ada pertemuan. Tambahkan pertemuan pertama.</div></template>
        </DataTable>
    </Dialog>

    <Dialog v-model:visible="formDialog" header="Tambah Pertemuan" modal :style="{ width: '520px' }">
        <div class="flex flex-col gap-4 mt-2">
            <div><label class="font-bold block mb-2">Pertemuan ke-</label><InputNumber v-model="formPertemuan.pertemuan_ke" :min="1" :max="32" fluid /></div>
            <div><label class="font-bold block mb-2">Tanggal</label><DatePicker v-model="formPertemuan.tanggal" dateFormat="dd/mm/yy" showIcon fluid /></div>
            <div><label class="font-bold block mb-2">Topik Rencana</label><Textarea v-model="formPertemuan.topik_rencana" rows="3" fluid /></div>
            <div><label class="font-bold block mb-2">Metode Pembelajaran</label><InputText v-model="formPertemuan.metode_pembelajaran" fluid /></div>
        </div>
        <template #footer><Button label="Batal" text @click="formDialog = false" /><Button label="Simpan" icon="pi pi-save" :loading="isLoading" @click="createPertemuan" /></template>
    </Dialog>

    <Dialog v-model:visible="detailDialog" :header="`Pertemuan ${detail?.pertemuan?.pertemuan_ke || ''}`" modal maximizable :style="{ width: '90vw' }">
        <div v-if="detail" class="grid grid-cols-12 gap-6">
            <div class="col-span-12 lg:col-span-5">
                <div class="card border border-surface mb-4">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="m-0">BAP / Jurnal Mengajar</h3>
                        <Tag :value="detail.pertemuan.status" :severity="statusSeverity(detail.pertemuan.status)" />
                    </div>
                    <div class="flex flex-col gap-4">
                        <div><label class="font-bold block mb-2">Topik Realisasi *</label><Textarea v-model="bapForm.topik_realisasi" rows="3" fluid :disabled="detail.pertemuan.status === 'Ditutup'" /></div>
                        <div><label class="font-bold block mb-2">Metode Pembelajaran</label><InputText v-model="bapForm.metode_pembelajaran" fluid :disabled="detail.pertemuan.status === 'Ditutup'" /></div>
                        <div><label class="font-bold block mb-2">Berita Acara Pembelajaran *</label><Textarea v-model="bapForm.bap" rows="5" fluid :disabled="detail.pertemuan.status === 'Ditutup'" /></div>
                        <Button v-if="detail.pertemuan.status !== 'Ditutup'" label="Simpan BAP" icon="pi pi-save" outlined :loading="isLoading" @click="saveBap" />
                    </div>
                </div>

                <div class="card border border-surface text-center">
                    <template v-if="detail.pertemuan.status === 'Dijadwalkan'">
                        <Button label="Buka Pertemuan & Presensi Dosen" icon="pi pi-play" severity="success" class="w-full" :loading="isLoading" @click="openSession" />
                    </template>
                    <template v-else-if="detail.pertemuan.status === 'Dibuka'">
                        <div v-if="sesiPresensi" class="mb-5">
                            <span class="block text-muted-color mb-2">Kode Presensi Mahasiswa</span>
                            <div class="text-4xl font-bold tracking-[0.25em] text-primary">{{ sesiPresensi.kode }}</div>
                            <small>Berlaku sampai {{ new Date(sesiPresensi.berlaku_sampai).toLocaleTimeString('id-ID') }}</small>
                        </div>
                        <Button label="Buat Kode Presensi Baru" icon="pi pi-refresh" outlined class="w-full mb-3" @click="openSession" />
                        <Button label="Tutup Pertemuan" icon="pi pi-stop" severity="danger" class="w-full" :loading="isLoading" @click="closeSession" />
                    </template>
                    <Message v-else severity="info">Pertemuan telah ditutup dan data pembelajaran dikunci.</Message>
                </div>
            </div>

            <div class="col-span-12 lg:col-span-7">
                <div class="card border border-surface">
                    <h3 class="mt-0">Presensi Mahasiswa</h3>
                    <DataTable :value="detail.presensi_mahasiswa" :loading="isLoading" paginator :rows="10" stripedRows>
                        <Column field="nim" header="NIM" class="font-mono" />
                        <Column field="nama_mahasiswa" header="Nama" />
                        <Column header="Status" style="min-width: 12rem">
                            <template #body="{ data }">
                                <Select v-model="data.status" :options="statusOptions" fluid
                                    :disabled="detail.pertemuan.status !== 'Dibuka'" @change="updateAttendance(data, data.status)" />
                            </template>
                        </Column>
                        <Column field="sumber" header="Sumber" />
                        <Column header="Check-in">
                            <template #body="{ data }">{{ data.check_in_at ? new Date(data.check_in_at).toLocaleTimeString('id-ID') : '-' }}</template>
                        </Column>
                    </DataTable>
                </div>
            </div>
        </div>
    </Dialog>
</template>
