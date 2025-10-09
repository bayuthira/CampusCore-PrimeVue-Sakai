<script setup>
import { useAuthStore } from '@/stores/auth';
import { useJadwalKendaraanStore } from '@/stores/jadwalKendaraan';
import { useKendaraanStore } from '@/stores/kendaraan';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import FullCalendar from '@fullcalendar/vue3';
import { storeToRefs } from 'pinia';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref, watch } from 'vue';

// --- Setup ---
const toast = useToast();
const authStore = useAuthStore();
const jadwalKendaraanStore = useJadwalKendaraanStore();
const kendaraanStore = useKendaraanStore();
const myBookingsDialog = ref(false);
const myBookingsList = ref([]);
const bookingSearch = ref('');

const { events } = storeToRefs(jadwalKendaraanStore);
const { list: kendaraanList } = storeToRefs(kendaraanStore);

const selectedKendaraan = ref(null);
const calendarRef = ref(null);

// State untuk Dialogs
const bookingDialog = ref(false);
const detailDialog = ref(false);
const actionDialog = ref(false);

const bookingData = ref({});
const selectedEvent = ref(null);
const actionType = ref('');

const isAdmin = computed(() => authStore.userData?.roles.includes('SUPER_ADMIN') || authStore.userData?.roles.includes('STAF_BAUM'));

const calendarOptions = ref({
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    locale: 'id',
    headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    buttonText: { today: 'Hari Ini', month: 'Bulan', week: 'Minggu', day: 'Hari' },
    editable: false,
    selectable: true,
    dayMaxEvents: true,
    weekends: true,
    events: [],
    select: handleDateSelect,
    eventClick: handleEventClick,
    datesSet: handleDatesSet,
    eventTimeFormat: {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    }
});

const filteredMyBookings = computed(() => {
    if (!bookingSearch.value) {
        return myBookingsList.value;
    }
    return myBookingsList.value.filter((booking) => Object.values(booking).some((val) => String(val).toLowerCase().includes(bookingSearch.value.toLowerCase())));
});

onMounted(() => {
    kendaraanStore.fetchAll();
});

function formatDateTimeWithTimezone(date) {
    if (!date) return null;
    const d = new Date(date);
    const tzOffset = -d.getTimezoneOffset();
    const sign = tzOffset >= 0 ? '+' : '-';
    const offsetHours = String(Math.floor(Math.abs(tzOffset) / 60)).padStart(2, '0');
    const offsetMinutes = String(Math.abs(tzOffset) % 60).padStart(2, '0');

    return (
        d.getFullYear() +
        '-' +
        String(d.getMonth() + 1).padStart(2, '0') +
        '-' +
        String(d.getDate()).padStart(2, '0') +
        'T' +
        String(d.getHours()).padStart(2, '0') +
        ':' +
        String(d.getMinutes()).padStart(2, '0') +
        ':' +
        String(d.getSeconds()).padStart(2, '0') +
        sign +
        offsetHours +
        ':' +
        offsetMinutes
    );
}

function handleDatesSet(dateInfo) {
    if (selectedKendaraan.value) {
        const start = formatDateTimeWithTimezone(dateInfo.start);
        const end = formatDateTimeWithTimezone(dateInfo.end);
        jadwalKendaraanStore.fetchBookings(selectedKendaraan.value, start, end);
    }
}

watch(selectedKendaraan, (newKendaraanId) => {
    if (newKendaraanId && calendarRef.value) {
        const calendarApi = calendarRef.value.getApi();
        const view = calendarApi.view;
        const start = formatDateTimeWithTimezone(view.activeStart);
        const end = formatDateTimeWithTimezone(view.activeEnd);
        jadwalKendaraanStore.fetchBookings(newKendaraanId, start, end);
    } else {
        jadwalKendaraanStore.events = [];
    }
});

watch(events, (newEvents) => {
    if (calendarOptions.value) {
        calendarOptions.value.events = newEvents;
    }
});

function handleDateSelect(selectInfo) {
    bookingData.value = {
        kendaraan_id: selectedKendaraan.value,
        waktu_berangkat: selectInfo.start,
        estimasi_waktu_kembali: selectInfo.end,
        tujuan: ''
    };
    bookingDialog.value = true;
}

function handleEventClick(clickInfo) {
    selectedEvent.value = clickInfo.event;
    detailDialog.value = true;
}

async function saveBooking() {
    if (!bookingData.value.tujuan?.trim()) {
        toast.add({ severity: 'warn', summary: 'Perhatian', detail: 'Tujuan wajib diisi.', life: 3000 });
        return;
    }
    try {
        const payload = {
            ...bookingData.value,
            waktu_berangkat: formatDateTimeWithTimezone(bookingData.value.waktu_berangkat),
            estimasi_waktu_kembali: formatDateTimeWithTimezone(bookingData.value.estimasi_waktu_kembali)
        };
        await jadwalKendaraanStore.createBooking(payload);
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Booking berhasil diajukan.', life: 3000 });

        if (selectedKendaraan.value && calendarRef.value) {
            calendarRef.value.getApi().refetchEvents();
        }
        bookingDialog.value = false;
    } catch (error) {
        const errorMessage = error.response?.data?.error || 'Gagal menyimpan booking.';
        toast.add({ severity: 'error', summary: 'Gagal', detail: errorMessage, life: 4000 });
    }
}

function openActionDialog(type) {
    actionType.value = type;
    bookingData.value = {
        catatan: '',
        odometer_awal: null,
        waktu_aktual_berangkat: new Date(),
        odometer_akhir: null,
        bahan_bakar_diisi: null,
        catatan_kondisi_kembali: '',
        waktu_aktual_kembali: new Date()
    };
    actionDialog.value = true;
}

async function executeAction() {
    try {
        let promise;
        let successMessage = 'Aksi berhasil dijalankan.';
        const bookingId = selectedEvent.value.id;

        switch (actionType.value) {
            case 'approve':
                promise = jadwalKendaraanStore.approveBooking(bookingId, { catatan: bookingData.value.catatan });
                successMessage = 'Booking telah disetujui.';
                break;
            case 'reject':
                promise = jadwalKendaraanStore.rejectBooking(bookingId, { catatan: bookingData.value.catatan });
                successMessage = 'Booking telah ditolak.';
                break;
            case 'start':
                promise = jadwalKendaraanStore.startTrip(bookingId, {
                    odometer_awal: bookingData.value.odometer_awal,
                    waktu_aktual_berangkat: formatDateTimeWithTimezone(bookingData.value.waktu_aktual_berangkat)
                });
                successMessage = 'Perjalanan telah dimulai.';
                break;
            case 'end':
                promise = jadwalKendaraanStore.endTrip(bookingId, {
                    odometer_akhir: bookingData.value.odometer_akhir,
                    bahan_bakar_diisi: bookingData.value.bahan_bakar_diisi,
                    catatan_kondisi_kembali: bookingData.value.catatan_kondisi_kembali,
                    waktu_aktual_kembali: formatDateTimeWithTimezone(bookingData.value.waktu_aktual_kembali)
                });
                successMessage = 'Perjalanan telah selesai.';
                break;
        }

        await promise;
        toast.add({ severity: 'success', summary: 'Berhasil', detail: successMessage, life: 3000 });

        detailDialog.value = false;
        actionDialog.value = false;
        if (selectedKendaraan.value && calendarRef.value) {
            const calendarApi = calendarRef.value.getApi();
            const view = calendarApi.view;
            const start = formatDateTimeWithTimezone(view.activeStart);
            const end = formatDateTimeWithTimezone(view.activeEnd);
            await jadwalKendaraanStore.fetchBookings(selectedKendaraan.value, start, end);
        }
    } catch (error) {
        const errorMessage = error.response?.data?.error || `Gagal menjalankan aksi ${actionType.value}.`;
        toast.add({ severity: 'error', summary: 'Gagal', detail: errorMessage, life: 4000 });
    }
}

function getSeverityForStatus(status) {
    switch (status) {
        case 'Disetujui':
        case 'Selesai':
            return 'success';
        case 'Berlangsung':
            return 'warning';
        case 'Diajukan':
            return 'info';
        case 'Ditolak':
            return 'danger';
        default:
            return 'secondary';
    }
}

async function openMyBookingsDialog() {
    try {
        myBookingsList.value = await jadwalKendaraanStore.fetchMyBookings();
        myBookingsDialog.value = true;
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Tidak dapat memuat daftar booking.', life: 3000 });
    }
}
</script>

<template>
    <div class="card">
        <h5>Jadwal Penggunaan Kendaraan</h5>
        <Toolbar class="mb-6">
            <template #start>
                <Button label="Booking Saya" icon="pi pi-book" severity="info" class="mr-2" @click="openMyBookingsDialog" />
            </template>
        </Toolbar>
        <div class="grid">
            <div class="col-12 md:col-4">
                <label for="kendaraan" class="font-bold block mb-2">Pilih Kendaraan</label>
                <Dropdown v-model="selectedKendaraan" :options="kendaraanList" optionLabel="display_label" optionValue="id" placeholder="Pilih kendaraan untuk melihat jadwal" fluid filter />
            </div>
        </div>

        <FullCalendar v-if="selectedKendaraan" ref="calendarRef" :options="calendarOptions" class="mt-4" />
        <div v-else class="text-center p-4 border-dashed border-2 border-surface-200 rounded-md mt-4">
            <i class="pi pi-car text-4xl text-surface-400"></i>
            <p class="text-surface-500 mt-2">Silakan pilih kendaraan terlebih dahulu untuk menampilkan kalender.</p>
        </div>
    </div>

    <Dialog v-model:visible="bookingDialog" :style="{ width: '450px' }" header="Ajukan Booking Kendaraan" :modal="true">
        <div class="flex flex-col gap-6">
            <div>
                <label for="tujuan" class="block font-bold mb-3">Tujuan</label>
                <Textarea id="tujuan" v-model.trim="bookingData.tujuan" required autofocus rows="3" fluid />
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label for="waktu_berangkat" class="block font-bold mb-3">Waktu Berangkat</label>
                    <Calendar id="waktu_berangkat" v-model="bookingData.waktu_berangkat" showTime hourFormat="24" dateFormat="dd/mm/yy" />
                </div>
                <div>
                    <label for="estimasi_kembali" class="block font-bold mb-3">Estimasi Kembali</label>
                    <Calendar id="estimasi_kembali" v-model="bookingData.estimasi_waktu_kembali" showTime hourFormat="24" dateFormat="dd/mm/yy" />
                </div>
            </div>
        </div>
        <template #footer>
            <Button label="Batal" icon="pi pi-times" text @click="bookingDialog = false" />
            <Button label="Ajukan Booking" icon="pi pi-check" @click="saveBooking" />
        </template>
    </Dialog>

    <Dialog v-model:visible="detailDialog" :style="{ width: '500px' }" header="Detail Booking" :modal="true" v-if="selectedEvent">
        <div class="p-fluid">
            <ul class="list-none p-0 m-0">
                <li class="flex items-center mb-3">
                    <i class="pi pi-car mr-2"></i>
                    <div>
                        <span class="font-bold">Kendaraan:</span>
                        <div class="text-color-secondary">{{ selectedEvent.extendedProps.nama_kendaraan }}</div>
                    </div>
                </li>
                <li class="flex items-center mb-3">
                    <i class="pi pi-user mr-2"></i>
                    <div>
                        <span class="font-bold">Pemesan:</span>
                        <div class="text-color-secondary">{{ selectedEvent.extendedProps.nama_pemesan }}</div>
                    </div>
                </li>
                <li class="flex items-center mb-3">
                    <i class="pi pi-flag mr-2"></i>
                    <div>
                        <span class="font-bold">Tujuan:</span>
                        <div class="text-color-secondary">{{ selectedEvent.title }}</div>
                    </div>
                </li>
                <li class="flex items-center mb-3">
                    <i class="pi pi-clock mr-2"></i>
                    <div>
                        <span class="font-bold">Jadwal:</span>
                        <div class="text-color-secondary">{{ new Date(selectedEvent.start).toLocaleString('id-ID') }} - {{ new Date(selectedEvent.end).toLocaleString('id-ID') }}</div>
                    </div>
                </li>
                <li class="flex items-center mb-3">
                    <i class="pi pi-check-circle mr-2"></i>
                    <div>
                        <span class="font-bold">Status:</span>
                        <Tag :value="selectedEvent.extendedProps.status" :severity="getSeverityForStatus(selectedEvent.extendedProps.status)" />
                    </div>
                </li>
            </ul>
        </div>
        <template #footer>
            <Button label="Tutup" icon="pi pi-times" text @click="detailDialog = false" />
            <template v-if="isAdmin">
                <div v-if="selectedEvent.extendedProps.status === 'Diajukan'">
                    <Button label="Tolak" icon="pi pi-times" severity="danger" class="mr-2" @click="openActionDialog('reject')" />
                    <Button label="Setujui" icon="pi pi-check" severity="success" @click="openActionDialog('approve')" />
                </div>
                <Button v-if="selectedEvent.extendedProps.status === 'Disetujui'" label="Start Trip" icon="pi pi-play" @click="openActionDialog('start')" />
                <Button v-if="selectedEvent.extendedProps.status === 'Berlangsung'" label="End Trip" icon="pi pi-stop-circle" @click="openActionDialog('end')" />
            </template>
        </template>
    </Dialog>

    <Dialog v-model:visible="actionDialog" :style="{ width: '450px' }" :header="`Aksi: ${actionType}`" :modal="true">
        <div v-if="actionType === 'approve' || actionType === 'reject'">
            <label for="catatan_aksi" class="block font-bold mb-3">Catatan (Opsional)</label>
            <Textarea id="catatan_aksi" v-model="bookingData.catatan" rows="3" fluid />
        </div>
        <div v-if="actionType === 'start'" class="flex flex-col gap-6">
            <div>
                <label for="odometer_awal" class="block font-bold mb-3">Odometer Awal (KM)</label>
                <InputNumber id="odometer_awal" v-model="bookingData.odometer_awal" />
            </div>
            <div>
                <label for="waktu_aktual_berangkat" class="block font-bold mb-3">Waktu Aktual Berangkat</label>
                <Calendar id="waktu_aktual_berangkat" v-model="bookingData.waktu_aktual_berangkat" showTime hourFormat="24" dateFormat="dd/mm/yy" />
            </div>
        </div>
        <div v-if="actionType === 'end'" class="flex flex-col gap-6">
            <div>
                <label for="odometer_akhir" class="block font-bold mb-3">Odometer Akhir (KM)</label>
                <InputNumber id="odometer_akhir" v-model="bookingData.odometer_akhir" />
            </div>
            <div>
                <label for="bbm" class="block font-bold mb-3">Bahan Bakar Diisi (Liter)</label>
                <InputNumber id="bbm" v-model="bookingData.bahan_bakar_diisi" mode="decimal" />
            </div>
            <div>
                <label for="waktu_aktual_kembali" class="block font-bold mb-3">Waktu Aktual Kembali</label>
                <Calendar id="waktu_aktual_kembali" v-model="bookingData.waktu_aktual_kembali" showTime hourFormat="24" dateFormat="dd/mm/yy" />
            </div>
            <div>
                <label for="catatan_kembali" class="block font-bold mb-3">Catatan Kondisi Kembali</label>
                <Textarea id="catatan_kembali" v-model="bookingData.catatan_kondisi_kembali" rows="3" fluid />
            </div>
        </div>
        <template #footer>
            <Button label="Batal" icon="pi pi-times" text @click="actionDialog = false" />
            <Button label="Simpan" icon="pi pi-check" @click="executeAction" />
        </template>
    </Dialog>
    <Dialog v-model:visible="myBookingsDialog" :style="{ width: '75vw' }" maximizable header="Riwayat Booking Kendaraan Saya" :modal="true">
        <DataTable :value="filteredMyBookings" :loading="isLoading" responsiveLayout="scroll" :paginator="true" :rows="10">
            <template #header>
                <div class="flex justify-end">
                    <IconField>
                        <InputIcon> <i class="pi pi-search" /> </InputIcon>
                        <InputText v-model="bookingSearch" placeholder="Cari di riwayat..." />
                    </IconField>
                </div>
            </template>

            <Column field="nama_kendaraan" header="Kendaraan" sortable></Column>
            <Column field="tujuan" header="Tujuan" sortable></Column>
            <Column header="Jadwal Berangkat" sortable field="waktu_berangkat">
                <template #body="slotProps">
                    {{ new Date(slotProps.data.waktu_berangkat).toLocaleString('id-ID') }}
                </template>
            </Column>
            <Column header="Estimasi Kembali" sortable field="estimasi_waktu_kembali">
                <template #body="slotProps">
                    {{ new Date(slotProps.data.estimasi_waktu_kembali).toLocaleString('id-ID') }}
                </template>
            </Column>
            <Column field="status" header="Status" sortable>
                <template #body="slotProps">
                    <Tag :value="slotProps.data.status" :severity="getSeverityForStatus(slotProps.data.status)" />
                </template>
            </Column>
        </DataTable>
        <template #footer>
            <Button label="Tutup" icon="pi pi-times" @click="myBookingsDialog = false" class="p-button-text" />
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
