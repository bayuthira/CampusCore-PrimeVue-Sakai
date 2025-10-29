<script setup>
import { useCutiStore } from '@/stores/cuti';
import { storeToRefs } from 'pinia';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';

const toast = useToast();
const store = useCutiStore();
// Ambil myQuota dari store
const { myLeaveList, isLoading, myQuota } = storeToRefs(store);

const dialog = ref(false);
const data = ref({});
const submitted = ref(false);

// Opsi untuk dropdown Tipe Cuti
const tipeCutiOptions = ref(['Paid', 'Unpaid']);

onMounted(() => {
    store.fetchMyLeave();
    // Ambil kuota untuk tahun ini
    store.fetchMyQuota(new Date().getFullYear());
});

const jumlahHariCuti = computed(() => {
    if (data.value.tanggal_mulai && data.value.tanggal_selesai) {
        const start = new Date(data.value.tanggal_mulai);
        const end = new Date(data.value.tanggal_selesai);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return diffDays;
    }
    return 0;
});

function formatDate(date) {
    if (!date) return null;
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function openNew() {
    data.value = {
        tipe_cuti: 'Paid' // Set 'Paid' sebagai default
    };
    submitted.value = false;
    dialog.value = true;
}

async function saveData() {
    submitted.value = true;
    // Tambahkan validasi untuk tipe_cuti
    if (!data.value.tanggal_mulai || !data.value.tanggal_selesai || !data.value.alasan?.trim() || !data.value.tipe_cuti) {
        toast.add({ severity: 'warn', summary: 'Perhatian', detail: 'Semua field wajib diisi', life: 3000 });
        return;
    }

    try {
        const payload = {
            alasan: data.value.alasan,
            jumlah_hari: jumlahHariCuti.value,
            tanggal_mulai: formatDate(data.value.tanggal_mulai),
            tanggal_selesai: formatDate(data.value.tanggal_selesai),
            tipe_cuti: data.value.tipe_cuti // Tambahkan tipe_cuti ke payload
        };

        await store.ajukanCuti(payload);
        await store.fetchMyQuota(new Date().getFullYear()); // Refresh data kuota setelah submit

        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Pengajuan cuti berhasil dikirim', life: 3000 });
        dialog.value = false;
    } catch (error) {
        const errorMessage = error.response?.data?.error || 'Gagal mengajukan cuti';
        toast.add({ severity: 'error', summary: 'Gagal', detail: errorMessage, life: 4000 });
    }
}

function getSeverity(status) {
    if (status === 'Disetujui') return 'success';
    if (status === 'Ditolak') return 'danger';
    if (status === 'Diajukan') return 'info';
    return 'secondary';
}
</script>

<template>
    <div class="grid grid-cols-12 gap-4 mb-4">
        <div class="col-span-12 md:col-span-4">
            <div class="surface-card shadow-md rounded-md p-4">
                <div class="flex justify-between mb-3">
                    <div>
                        <span class="block text-500 font-medium mb-3">Sisa Cuti ({{ myQuota?.tahun || new Date().getFullYear() }})</span>
                        <div class="text-900 font-medium text-xl">{{ myQuota?.sisa_cuti ?? '...' }} Hari</div>
                    </div>
                    <div class="flex items-center justify-center bg-blue-100 rounded-md" style="width: 2.5rem; height: 2.5rem">
                        <i class="pi pi-inbox text-blue-500 text-xl"></i>
                    </div>
                </div>
            </div>
        </div>

        <div class="col-span-12 md:col-span-4">
            <div class="surface-card shadow-md rounded-md p-4">
                <div class="flex justify-between mb-3">
                    <div>
                        <span class="block text-500 font-medium mb-3">Cuti Terpakai</span>
                        <div class="text-900 font-medium text-xl">{{ myQuota?.kuota_terpakai ?? '...' }} Hari</div>
                    </div>
                    <div class="flex items-center justify-center bg-orange-100 rounded-md" style="width: 2.5rem; height: 2.5rem">
                        <i class="pi pi-arrow-up text-orange-500 text-xl"></i>
                    </div>
                </div>
            </div>
        </div>

        <div class="col-span-12 md:col-span-4">
            <div class="surface-card shadow-md rounded-md p-4">
                <div class="flex justify-between mb-3">
                    <div>
                        <span class="block text-500 font-medium mb-3">Total Kuota</span>
                        <div class="text-900 font-medium text-xl">{{ myQuota?.kuota_total ?? '...' }} Hari</div>
                    </div>
                    <div class="flex items-center justify-center bg-cyan-100 rounded-md" style="width: 2.5rem; height: 2.5rem">
                        <i class="pi pi-database text-cyan-500 text-xl"></i>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="card">
        <Toolbar class="mb-6">
            <template #start>
                <Button label="Ajukan Cuti Baru" icon="pi pi-plus" severity="secondary" @click="openNew" />
            </template>
        </Toolbar>

        <DataTable :value="myLeaveList" :loading="isLoading" responsiveLayout="scroll">
            <template #header><h4 class="m-0">Riwayat Pengajuan Cuti Saya</h4></template>
            <Column field="tanggal_mulai" header="Tanggal Mulai" sortable></Column>
            <Column field="tanggal_selesai" header="Tanggal Selesai" sortable></Column>
            <Column field="tipe_cuti" header="Tipe" sortable></Column>
            <Column field="jumlah_hari" header="Jumlah Hari"></Column>
            <Column field="alasan" header="Alasan"></Column>
            <Column field="status" header="Status" sortable>
                <template #body="slotProps">
                    <Tag :value="slotProps.data.status" :severity="getSeverity(slotProps.data.status)" />
                </template>
            </Column>
            <Column field="catatan_approval" header="Catatan Admin"></Column>
        </DataTable>
    </div>

    <Dialog v-model:visible="dialog" :style="{ width: '450px' }" header="Form Pengajuan Cuti" :modal="true">
        <div class="flex flex-col gap-6">
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block font-bold mb-3">Tanggal Mulai *</label>
                    <Calendar v-model="data.tanggal_mulai" dateFormat="yy-mm-dd" :invalid="submitted && !data.tanggal_mulai" />
                </div>
                <div>
                    <label class="block font-bold mb-3">Tanggal Selesai *</label>
                    <Calendar v-model="data.tanggal_selesai" dateFormat="yy-mm-dd" :invalid="submitted && !data.tanggal_selesai" />
                </div>
            </div>
            <div>
                <label class="block font-bold mb-3">Total Hari Cuti</label>
                <InputNumber v-model="jumlahHariCuti" fluid disabled />
            </div>
            <div>
                <label class="block font-bold mb-3">Tipe Cuti *</label>
                <Dropdown v-model="data.tipe_cuti" :options="tipeCutiOptions" placeholder="Pilih Tipe Cuti" :invalid="submitted && !data.tipe_cuti" fluid />
            </div>
            <div>
                <label class="block font-bold mb-3">Alasan *</label>
                <Textarea v-model.trim="data.alasan" rows="3" fluid :invalid="submitted && !data.alasan" />
            </div>
        </div>
        <template #footer>
            <Button label="Batal" icon="pi pi-times" text @click="dialog = false" />
            <Button label="Ajukan" icon="pi pi-check" @click="saveData" />
        </template>
    </Dialog>
</template>
