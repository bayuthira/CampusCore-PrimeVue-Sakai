<script setup>
import { useJadwalRuanganStore } from '@/stores/jadwalRuangan';
import { useRuanganStore } from '@/stores/ruangan';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import FullCalendar from '@fullcalendar/vue3';
import { storeToRefs } from 'pinia';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref, watch } from 'vue';

// --- Setup ---
const toast = useToast();
const jadwalRuanganStore = useJadwalRuanganStore();
const ruanganStore = useRuanganStore();

const { events } = storeToRefs(jadwalRuanganStore);
const { ruanganList } = storeToRefs(ruanganStore);

const dialog = ref(false);
const eventData = ref({});
const selectedRuangan = ref(null);
const calendarRef = ref(null);

const tipePerulanganOptions = ref(['Mingguan', 'Harian']);
const calendarOptions = ref({
    // Dibuat menjadi ref agar bisa diupdate
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    editable: false,
    selectable: true,
    selectMirror: true,
    dayMaxEvents: true,
    weekends: true,
    select: handleDateSelect,
    eventClick: handleEventClick,
    events: [], // Awalnya kosong, akan diisi oleh store
    datesSet: handleDatesSet
});

// --- Functions ---
onMounted(() => {
    ruanganStore.fetchRuangan();
});

function handleDatesSet(dateInfo) {
    if (selectedRuangan.value) {
        jadwalRuanganStore.fetchEvents(selectedRuangan.value, dateInfo.startStr, dateInfo.endStr);
    }
}

function handleDateSelect(selectInfo) {
    eventData.value = {
        waktu_mulai: selectInfo.start,
        waktu_selesai: selectInfo.end,
        ruangan_id: selectedRuangan.value
    };
    dialog.value = true;
}

function handleEventClick(clickInfo) {
    if (confirm(`Apakah Anda yakin ingin menghapus kegiatan "${clickInfo.event.title}"?`)) {
        jadwalRuanganStore
            .deleteEvent(clickInfo.event.id)
            .then(() => {
                clickInfo.event.remove();
                toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Jadwal dihapus', life: 3000 });
            })
            .catch((err) => {
                toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal menghapus jadwal', life: 3000 });
            });
    }
}

async function saveData() {
    try {
        const payload = { ...eventData.value };
        payload.jam_mulai = payload.waktu_mulai.toTimeString().substring(0, 5);
        payload.jam_selesai = payload.waktu_selesai.toTimeString().substring(0, 5);
        await jadwalRuanganStore.createEvent(payload);

        // Langsung panggil fetchEvents setelah berhasil menyimpan
        if (selectedRuangan.value && calendarRef.value) {
            const calendarApi = calendarRef.value.getApi();
            const view = calendarApi.view;
            await jadwalRuanganStore.fetchEvents(selectedRuangan.value, view.activeStart.toISOString(), view.activeEnd.toISOString());
        }

        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Jadwal berhasil dibuat', life: 3000 });
        dialog.value = false;
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal menyimpan jadwal', life: 4000 });
    }
}

// PERBAIKAN UTAMA ADA DI SINI
watch(selectedRuangan, (newRuanganId) => {
    if (newRuanganId && calendarRef.value) {
        // Jangan panggil refetchEvents(), panggil fetchEvents dari store secara manual
        const calendarApi = calendarRef.value.getApi();
        const view = calendarApi.view;
        jadwalRuanganStore.fetchEvents(newRuanganId, view.activeStart.toISOString(), view.activeEnd.toISOString());
    } else {
        // Jika tidak ada ruangan dipilih, kosongkan events di store
        jadwalRuanganStore.events = [];
    }
});

// Hubungkan events dari store ke kalender secara reaktif
watch(events, (newEvents) => {
    calendarOptions.value.events = newEvents;
});

// Fungsi pencarian untuk dropdown
const ruanganFilterTimeout = ref(null);
function onRuanganFilter(event) {
    clearTimeout(ruanganFilterTimeout.value);
    ruanganFilterTimeout.value = setTimeout(() => {
        ruanganStore.fetchRuangan(event.value);
    }, 500);
}
</script>
<template>
    <div class="card">
        <h5>Jadwal Penggunaan Ruangan</h5>
        <div class="grid">
            <div class="col-12 md:col-4">
                <label for="ruangan" class="font-bold block mb-2">Pilih Ruangan</label>
                <Dropdown v-model="selectedRuangan" :options="ruanganList" optionLabel="nama_ruangan" optionValue="id" placeholder="Ketik untuk mencari ruangan..." fluid filter @filter="onRuanganFilter" />
            </div>
        </div>

        <FullCalendar v-if="selectedRuangan" ref="calendarRef" :options="calendarOptions" class="mt-4" />
        <div v-else class="text-center p-4 border-dashed border-2 border-surface-200 rounded-md mt-4">
            <i class="pi pi-map-marker text-4xl text-surface-400"></i>
            <p class="text-surface-500 mt-2">Silakan pilih ruangan terlebih dahulu untuk menampilkan kalender.</p>
        </div>
    </div>

    <Dialog v-model:visible="dialog" header="Tambah Kegiatan" :modal="true" :style="{ width: '450px' }">
        <div class="flex flex-col gap-6">
            <div>
                <label class="block font-bold mb-3">Ruangan</label>
                <Dropdown v-model="eventData.ruangan_id" :options="ruanganList" optionLabel="nama_ruangan" optionValue="id" fluid disabled :placeholder="ruanganList.find((r) => r.id === selectedRuangan)?.nama_ruangan" />
            </div>
            <div>
                <label class="block font-bold mb-3">Judul Kegiatan</label>
                <InputText v-model="eventData.judul_kegiatan" fluid />
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block font-bold mb-3">Waktu Mulai</label>
                    <Calendar v-model="eventData.waktu_mulai" showTime hourFormat="24" />
                </div>
                <div>
                    <label class="block font-bold mb-3">Waktu Selesai</label>
                    <Calendar v-model="eventData.waktu_selesai" showTime hourFormat="24" />
                </div>
            </div>
            <div>
                <label class="block font-bold mb-3">Perulangan (Opsional)</label>
                <Dropdown v-model="eventData.tipe_perulangan" :options="tipePerulanganOptions" placeholder="Tanpa perulangan" showClear fluid />
            </div>
            <div v-if="eventData.tipe_perulangan">
                <label class="block font-bold mb-3">Berulang Sampai Tanggal</label>
                <Calendar v-model="eventData.tanggal_akhir_perulangan" dateFormat="yy-mm-dd" />
            </div>
            <div>
                <label class="block font-bold mb-3">Deskripsi</label>
                <Textarea v-model="eventData.deskripsi" rows="3" fluid />
            </div>
        </div>
        <template #footer>
            <Button label="Batal" text @click="dialog = false" />
            <Button label="Simpan" @click="saveData" />
        </template>
    </Dialog>
</template>

<style>
/* CSS Override untuk FullCalendar agar sesuai tema Sakai */
.fc .fc-button-primary {
    background-color: var(--primary-color);
    border-color: var(--primary-color);
}
.fc .fc-daygrid-day.fc-day-today {
    background-color: var(--primary-100);
}
</style>

<style>
/* Perhatikan: style ini tidak 'scoped' agar bisa menargetkan komponen FullCalendar */

/* Memaksa judul event di tampilan timeGrid (mingguan/harian) agar selalu terlihat */
.fc-timegrid-event .fc-event-main-frame {
    overflow: visible !important;
}

.fc-timegrid-event .fc-event-title {
    display: block !important;
    white-space: normal !important; /* Memungkinkan teks untuk wrap jika terlalu panjang */
    overflow: visible !important;
    font-size: 0.8em; /* Sedikit sesuaikan ukuran font jika perlu */
    padding: 2px;
}
</style>
