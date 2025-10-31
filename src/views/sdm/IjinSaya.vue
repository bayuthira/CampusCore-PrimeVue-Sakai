<script setup>
import { useIjinStore } from '@/stores/ijin';
import { storeToRefs } from 'pinia';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';

const toast = useToast();
const store = useIjinStore();

const { myIjinList, isLoading } = storeToRefs(store);
const kategoriIjinOptions = ref(['Sakit', 'Urusan Keluarga', 'Lainnya']);

const dialog = ref(false);
const data = ref({});
const submitted = ref(false);

onMounted(() => {
    store.fetchMyIjin();
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
    data.value = {};
    submitted.value = false;
    dialog.value = true;
}

async function saveData() {
    submitted.value = true;
    if (!data.value.tanggal_mulai || !data.value.tanggal_selesai || !data.value.alasan?.trim() || !data.value.kategori) {
        toast.add({ severity: 'warn', summary: 'Perhatian', detail: 'Semua field wajib diisi', life: 3000 });
        return;
    }

    try {
        const payload = {
            alasan: data.value.alasan,
            tanggal_mulai: formatDate(data.value.tanggal_mulai),
            tanggal_selesai: formatDate(data.value.tanggal_selesai),
            kategori: data.value.kategori
        };

        await store.ajukanIjin(payload);
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Pengajuan ijin berhasil dikirim', life: 3000 });
        dialog.value = false;
    } catch (error) {
        const errorMessage = error.response?.data?.error || 'Gagal mengajukan ijin';
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
    <div class="card">
        <Toolbar class="mb-6">
            <template #start>
                <Button label="Ajukan Ijin Baru" icon="pi pi-plus" severity="secondary" @click="openNew" />
            </template>
        </Toolbar>

        <DataTable :value="myIjinList" :loading="isLoading" responsiveLayout="scroll">
            <template #header><h4 class="m-0">Riwayat Pengajuan Ijin Saya</h4></template>
            <Column field="tanggal_mulai" header="Tanggal Mulai" sortable></Column>
            <Column field="tanggal_selesai" header="Tanggal Selesai" sortable></Column>
            <Column field="kategori" header="Kategori" sortable></Column>
            <Column field="alasan" header="Alasan"></Column>
            <Column field="status" header="Status" sortable>
                <template #body="slotProps">
                    <Tag :value="slotProps.data.status" :severity="getSeverity(slotProps.data.status)" />
                </template>
            </Column>
            <Column field="catatan_approval" header="Catatan Admin"></Column>
        </DataTable>
    </div>

    <Dialog v-model:visible="dialog" :style="{ width: '450px' }" header="Form Pengajuan Ijin" :modal="true">
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
                <label class="block font-bold mb-3">Kategori Ijin *</label>
                <Dropdown v-model="data.kategori" :options="kategoriIjinOptions" placeholder="Pilih Kategori Ijin" :invalid="submitted && !data.kategori" fluid />
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
