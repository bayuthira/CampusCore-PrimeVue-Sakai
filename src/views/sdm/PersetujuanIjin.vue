<script setup>
import { useDokumenStore } from '@/stores/dokumen';
import { useIjinStore } from '@/stores/ijin';
import { usePegawaiStore } from '@/stores/pegawai';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import FullCalendar from '@fullcalendar/vue3';
import { storeToRefs } from 'pinia';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';

const toast = useToast();
const store = useIjinStore();
const pegawaiStore = usePegawaiStore();
const { allIjinList, isLoading } = storeToRefs(store);
const { list: pegawaiList } = storeToRefs(pegawaiStore);

const dialog = ref(false); // Dialog Aksi
const detailDialog = ref(false); // Dialog Info
const data = ref({});
const selectedIjin = ref(null);
const action = ref('');

const dokumenStore = useDokumenStore();
const { list: dokumenList, isLoading: isDokumenLoading } = storeToRefs(dokumenStore);

const dokumenListDialog = ref(false);
const isBuktiLoading = ref(false);

const calendarEvents = computed(() => {
    return allIjinList.value
        .filter((ijin) => ['Disetujui', 'Diajukan'].includes(ijin.status))
        .map((ijin) => {
            const pegawai = pegawaiList.value.find((p) => p.id === ijin.pegawai_id);
            const nama = pegawai ? pegawai.nama_lengkap : '...';

            // --- PERBAIKAN LOGIKA TANGGAL (Timezone Safe) ---
            // Kita memecah string "YYYY-MM-DD" agar dikonversi ke Local Date, bukan UTC.
            const [y, m, d] = ijin.tanggal_selesai.split('-').map(Number);
            // Tambahkan 1 hari untuk 'end' date (eksklusif di FullCalendar)
            const endDateObj = new Date(y, m - 1, d + 1);

            // Format kembali ke string YYYY-MM-DD agar FullCalendar tidak bingung dengan jam
            const endYear = endDateObj.getFullYear();
            const endMonth = String(endDateObj.getMonth() + 1).padStart(2, '0');
            const endDay = String(endDateObj.getDate()).padStart(2, '0');
            const endDateStr = `${endYear}-${endMonth}-${endDay}`;

            return {
                id: ijin.id,
                title: `${nama} (${ijin.kategori}) - ${ijin.status}`,
                start: ijin.tanggal_mulai, // "2025-11-03"
                end: endDateStr, // "2025-11-05"
                backgroundColor: getCalendarColor(ijin.status),
                borderColor: getCalendarColor(ijin.status),
                allDay: true,
                extendedProps: ijin
            };
        });
});

const calendarOptions = ref({
    plugins: [dayGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    locale: 'id',
    headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth'
    },
    weekends: true,
    displayEventTime: false,
    eventClick: handleEventClick,
    events: calendarEvents
});

onMounted(() => {
    store.fetchAllIjin();
    pegawaiStore.fetchAll();
});

function getNamaPegawai(pegawaiId) {
    const pegawai = pegawaiList.value.find((p) => p.id === pegawaiId);
    return pegawai ? pegawai.nama_lengkap : 'Nama Tidak Ditemukan';
}

function getCalendarColor(status) {
    if (status === 'Disetujui') return '#22C55E';
    if (status === 'Diajukan') return '#64748B';
    return 'red';
}

function handleEventClick(clickInfo) {
    const ijinData = clickInfo.event.extendedProps;
    selectedIjin.value = ijinData;
    detailDialog.value = true;
}

function openActionDialog(ijinData, act) {
    data.value = { ...ijinData, catatan: '' };
    action.value = act;
    dialog.value = true;
    detailDialog.value = false; // Tutup dialog detail
}

function closeDetailDialog() {
    detailDialog.value = false;
    selectedIjin.value = null;
}

async function saveAction() {
    try {
        if (action.value === 'Setujui') {
            await store.approveIjin(data.value.id, { catatan: data.value.catatan });
            toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Ijin disetujui', life: 3000 });
        } else if (action.value === 'Tolak') {
            await store.rejectIjin(data.value.id, { catatan: data.value.catatan });
            toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Ijin ditolak', life: 3000 });
        }
        dialog.value = false;
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal memproses aksi', life: 4000 });
    }
}

async function openDokumenDialog(ijinData) {
    try {
        // Panggil store untuk mengambil daftar file terkait pengajuan ijin ini
        await dokumenStore.fetchList('pengajuan-ijin', ijinData.id);
        dokumenListDialog.value = true;
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal memuat dokumen.', life: 3000 });
    }
}

async function viewDokumen(path) {
    if (!path) return;
    isBuktiLoading.value = true;
    try {
        const blob = await dokumenStore.viewFile(path);
        const fileURL = URL.createObjectURL(blob);
        window.open(fileURL, '_blank');
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: error.message, life: 3000 });
    } finally {
        isBuktiLoading.value = false;
    }
}
</script>

<template>
    <div class="grid">
        <div class="col-12">
            <div class="card">
                <h5>Kalender Ijin Pegawai (Disetujui dan Diajukan)</h5>
                <FullCalendar :options="calendarOptions" />
            </div>
        </div>
        <div class="col-12">
            <div class="card">
                <DataTable :value="allIjinList" :loading="isLoading" dataKey="id" :paginator="true" :rows="10">
                    <template #header>
                        <h4 class="m-0">Daftar Pengajuan Ijin (Semua Status)</h4>
                    </template>
                    <Column field="pegawai_id" header="Nama Pegawai" sortable>
                        <template #body="slotProps">
                            {{ getNamaPegawai(slotProps.data.pegawai_id) }}
                        </template>
                    </Column>
                    <Column field="tanggal_mulai" header="Tgl. Mulai" sortable></Column>
                    <Column field="tanggal_selesai" header="Tgl. Selesai" sortable></Column>
                    <Column field="kategori" header="Kategori" sortable></Column>
                    <Column field="alasan" header="Alasan"></Column>
                    <Column field="status" header="Status" sortable>
                        <template #body="slotProps">
                            <Tag :value="slotProps.data.status"
                                :severity="slotProps.data.status === 'Disetujui' ? 'success' : slotProps.data.status === 'Ditolak' ? 'danger' : 'info'" />
                        </template>
                    </Column>
                    <Column field="catatan_approval" header="Catatan Admin"></Column>
                    <Column header="Aksi">
                        <template #body="slotProps">
                            <Button icon="pi pi-paperclip" text rounded severity="info"
                                @click="openDokumenDialog(slotProps.data)" v-tooltip.top="'Lihat Dokumen Pendukung'"
                                class="mr-2" />

                            <template v-if="slotProps.data.status === 'Diajukan'">
                                <Button icon="pi pi-check" severity="success" text rounded
                                    @click="openActionDialog(slotProps.data, 'Setujui')" class="mr-2"
                                    v-tooltip.top="'Setujui'" />
                                <Button icon="pi pi-times" severity="danger" text rounded
                                    @click="openActionDialog(slotProps.data, 'Tolak')" v-tooltip.top="'Tolak'" />
                            </template>
                        </template>
                    </Column>
                </DataTable>
            </div>
        </div>
    </div>

    <Dialog v-model:visible="dialog" :style="{ width: '450px' }" :header="`Konfirmasi Aksi: ${action}`" :modal="true">
        <div class="field">
            <label class="block font-bold mb-3">Catatan (Opsional)</label>
            <Textarea v-model.trim="data.catatan" rows="3" fluid />
        </div>
        <template #footer>
            <Button label="Batal" text @click="dialog = false" />
            <Button :label="action" @click="saveAction" />
        </template>
    </Dialog>

    <Dialog v-model:visible="detailDialog" :style="{ width: '450px' }" header="Detail Pengajuan Ijin" :modal="true">
        <div v-if="selectedIjin" class="flex flex-col gap-4">
            <div>
                <span class="font-bold block">Pegawai:</span>
                <span>{{ getNamaPegawai(selectedIjin.pegawai_id) }}</span>
            </div>
            <div>
                <span class="font-bold block">Kategori:</span>
                <span>{{ selectedIjin.kategori }}</span>
            </div>
            <div>
                <span class="font-bold block">Tanggal:</span>
                <span>{{ selectedIjin.tanggal_mulai }} s/d {{ selectedIjin.tanggal_selesai }}</span>
            </div>
            <div>
                <span class="font-bold block">Alasan:</span>
                <p class="m-0">{{ selectedIjin.alasan || '-' }}</p>
            </div>
            <div v-if="selectedIjin.catatan_approval">
                <span class="font-bold block">Catatan Admin:</span>
                <p class="m-0">{{ selectedIjin.catatan_approval }}</p>
            </div>
            <div>
                <span class="font-bold block">Dokumen Pendukung:</span>
                <Button label="Lihat Dokumen" icon="pi pi-paperclip" @click="openDokumenDialog(selectedIjin)"
                    class="p-button-text p-button-info p-0" />
            </div>
        </div>
        <template #footer>
            <div class="flex justify-end w-full">
                <Button label="Tutup" icon="pi pi-times" text @click="closeDetailDialog" />
                <div v-if="selectedIjin && selectedIjin.status === 'Diajukan'" class="ml-2">
                    <Button label="Tolak" icon="pi pi-times" severity="danger" class="mr-2"
                        @click="openActionDialog(selectedIjin, 'Tolak')" />
                    <Button label="Setujui" icon="pi pi-check" severity="success"
                        @click="openActionDialog(selectedIjin, 'Setujui')" />
                </div>
            </div>
        </template>
    </Dialog>

    <Dialog v-model:visible="dokumenListDialog" :style="{ width: '50vw' }" header="Dokumen Pendukung" :modal="true">
        <DataTable :value="dokumenList" :loading="isDokumenLoading" responsiveLayout="scroll">
            <Column field="nama_file_asli" header="Nama File" sortable></Column>
            <Column field="kategori" header="Kategori" sortable></Column>
            <Column header="Aksi">
                <template #body="slotProps">
                    <Button icon="pi pi-eye" text rounded severity="info" @click="viewDokumen(slotProps.data.path_file)"
                        :loading="isBuktiLoading" v-tooltip.top="'Lihat Dokumen'" />
                </template>
            </Column>
        </DataTable>
        <template #footer>
            <Button label="Tutup" icon="pi pi-times" @click="dokumenListDialog = false" class="p-button-text" />
        </template>
    </Dialog>
</template>

<style>
.fc .fc-button-primary {
    background-color: var(--primary-color);
    border-color: var(--primary-color);
}

.fc .fc-daygrid-day.fc-day-today {
    background-color: var(--primary-100);
}
</style>