<script setup>
import { useCutiStore } from '@/stores/cuti';
import { usePegawaiStore } from '@/stores/pegawai';
// ...
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import FullCalendar from '@fullcalendar/vue3';
import { storeToRefs } from 'pinia';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';

const toast = useToast();
const store = useCutiStore();
const { allLeaveList, isLoading } = storeToRefs(store);
const pegawaiStore = usePegawaiStore();
const { list: pegawaiList } = storeToRefs(pegawaiStore);

const dialog = ref(false);
const data = ref({});
const action = ref('');
const detailDialog = ref(false);
const selectedCuti = ref(null);

const calendarEvents = computed(() => {
    return allLeaveList.value
        .filter((cuti) => ['Disetujui', 'Diajukan'].includes(cuti.status))
        .map((cuti) => {
            const pegawai = pegawaiList.value.find((p) => p.id === cuti.pegawai_id);
            const nama = pegawai ? pegawai.nama_lengkap : cuti.nama_pegawai || 'Nama Pegawai?';

            return {
                id: cuti.id,
                title: `${nama} (${cuti.status})`,
                start: cuti.tanggal_mulai,
                end: new Date(new Date(cuti.tanggal_selesai).setDate(new Date(cuti.tanggal_selesai).getDate() + 1)),
                backgroundColor: getCalendarColor(cuti.status),
                borderColor: getCalendarColor(cuti.status),
                extendedProps: cuti // <-- PERBAIKAN PENTING ADA DI SINI
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
    store.fetchAllLeave();
    pegawaiStore.fetchAll();
});

function openActionDialog(cutiData, act) {
    data.value = { ...cutiData, catatan: '' };
    action.value = act;
    dialog.value = true;
}

async function saveAction() {
    try {
        if (action.value === 'Setujui') {
            await store.approveCuti(data.value.id, { catatan: data.value.catatan });
            toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Cuti disetujui', life: 3000 });
        } else if (action.value === 'Tolak') {
            await store.rejectCuti(data.value.id, { catatan: data.value.catatan });
            toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Cuti ditolak', life: 3000 });
        }
        dialog.value = false;
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal memproses aksi', life: 4000 });
    }
}

function getCalendarColor(status) {
    if (status === 'Disetujui') return '#22C55E'; // Hijau
    if (status === 'Diajukan') return '#64748B'; // Abu-abu
    return 'red'; // Error
}

function getNamaPegawai(pegawaiId) {
    const pegawai = pegawaiList.value.find((p) => p.id === pegawaiId);
    return pegawai ? pegawai.nama_lengkap : 'Nama Tidak Ditemukan';
}

function handleEventClick(clickInfo) {
    const cutiData = clickInfo.event.extendedProps;

    // PERBAIKAN: Buka dialog untuk 'Diajukan' ATAU 'Disetujui'
    if (cutiData.status === 'Diajukan' || cutiData.status === 'Disetujui') {
        selectedCuti.value = cutiData;
        detailDialog.value = true;
    }
}

function handleApproveFromDialog() {
    openActionDialog(selectedCuti.value, 'Setujui');
    closeDetailDialog();
}

function handleRejectFromDialog() {
    openActionDialog(selectedCuti.value, 'Tolak');
    closeDetailDialog();
}

function closeDetailDialog() {
    detailDialog.value = false;
    selectedCuti.value = null; // Ini adalah perbaikan kuncinya
}
</script>

<template>
    <div class="grid">
        <div class="col-12">
            <div class="card">
                <h5>Kalender Cuti Pegawai (Disetujui dan Diajukan)</h5>
                <FullCalendar :options="calendarOptions" />
            </div>
        </div>
        <div class="col-12">
            <div class="card">
                <DataTable :value="allLeaveList" :loading="isLoading" dataKey="id" :paginator="true" :rows="10" responsiveLayout="scroll">
                    <template #header><h4 class="m-0">Daftar Pengajuan Cuti (Semua Status)</h4></template>

                    <Column field="pegawai_id" header="Nama Pegawai" sortable>
                        <template #body="slotProps">
                            {{ getNamaPegawai(slotProps.data.pegawai_id) }}
                        </template>
                    </Column>
                    <Column field="tanggal_mulai" header="Tanggal Mulai" sortable></Column>
                    <Column field="tanggal_selesai" header="Tgl. Selesai" sortable></Column>

                    <Column field="kategori" header="Kategori" sortable></Column>
                    <Column field="tipe_cuti" header="Tipe" sortable></Column>

                    <Column field="jumlah_hari" header="Jumlah Hari"></Column>
                    <Column field="alasan" header="Alasan"></Column>
                    <Column field="status" header="Status" sortable>
                        <template #body="slotProps">
                            <Tag :value="slotProps.data.status" :severity="slotProps.data.status === 'Disetujui' ? 'success' : slotProps.data.status === 'Ditolak' ? 'danger' : 'info'" />
                        </template>
                    </Column>

                    <Column field="catatan_approval" header="Catatan Admin"></Column>

                    <Column header="Aksi">
                        <template #body="slotProps">
                            <div v-if="slotProps.data.status === 'Diajukan'">
                                <Button icon="pi pi-check" severity="success" text rounded @click="openActionDialog(slotProps.data, 'Setujui')" class="mr-2" v-tooltip.top="'Setujui'" />
                                <Button icon="pi pi-times" severity="danger" text rounded @click="openActionDialog(slotProps.data, 'Tolak')" v-tooltip.top="'Tolak'" />
                            </div>
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

    <Dialog v-model:visible="detailDialog" :style="{ width: '450px' }" header="Detail Pengajuan Cuti" :modal="true">
        <div v-if="selectedCuti" class="flex flex-col gap-4">
            <div>
                <span class="font-bold block">Pegawai:</span>
                <span>{{ getNamaPegawai(selectedCuti.pegawai_id) }}</span>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div class="col-span-1">
                    <span class="font-bold block">Kategori Cuti:</span>
                    <span>{{ selectedCuti.kategori }}</span>
                </div>
                <div class="col-span-1">
                    <span class="font-bold block">Tipe Cuti:</span>
                    <span>{{ selectedCuti.tipe_cuti }}</span>
                </div>
            </div>
            <div>
                <span class="font-bold block">Tanggal:</span>
                <span>{{ selectedCuti.tanggal_mulai }} s/d {{ selectedCuti.tanggal_selesai }} ({{ selectedCuti.jumlah_hari }} hari)</span>
            </div>
            <div>
                <span class="font-bold block">Alasan:</span>
                <p class="m-0">{{ selectedCuti.alasan || '-' }}</p>
            </div>
            <div v-if="selectedCuti.catatan_approval">
                <span class="font-bold block">Catatan Admin:</span>
                <p class="m-0">{{ selectedCuti.catatan_approval }}</p>
            </div>
        </div>
        <template #footer>
            <div class="flex justify-end w-full">
                <Button label="Tutup" icon="pi pi-times" text @click="closeDetailDialog" />

                <div v-if="selectedCuti && selectedCuti.status === 'Diajukan'" class="ml-2">
                    <Button label="Tolak" icon="pi pi-times" severity="danger" class="mr-2" @click="handleRejectFromDialog" />
                    <Button label="Setujui" icon="pi pi-check" severity="success" @click="handleApproveFromDialog" />
                </div>
            </div>
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
