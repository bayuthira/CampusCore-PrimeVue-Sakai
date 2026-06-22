<script setup>
import { useAkhirSemesterStore } from '@/stores/akhirSemester';
import { useTahunAkademikStore } from '@/stores/tahunAkademik';
import { storeToRefs } from 'pinia';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref, watch } from 'vue';

const store = useAkhirSemesterStore();
const tahunStore = useTahunAkademikStore();
const { status, outbox, isLoading, error } = storeToRefs(store);
const { list: years } = storeToRefs(tahunStore);
const selectedYear = ref(null);
const confirm = useConfirm();
const toast = useToast();

onMounted(async () => {
    await Promise.all([tahunStore.fetchAll(), store.fetchOutbox()]);
    selectedYear.value = years.value.find(item => item.is_active)?.id || years.value[0]?.id || null;
});
watch(selectedYear, id => { if (id) store.fetchStatus(id); });
function closeSemester() {
    confirm.require({ message: 'Penutupan menghitung AKM/IPS/IPK dan semester tidak dapat dibuka kembali tanpa proses koreksi resmi. Lanjutkan?', header: 'Tutup Semester', icon: 'pi pi-lock', acceptLabel: 'Tutup Semester', rejectLabel: 'Batal', accept: async () => {
        try { const result = await store.closeSemester(selectedYear.value); await Promise.all([store.fetchStatus(selectedYear.value), store.fetchOutbox()]); toast.add({ severity: 'success', summary: 'Berhasil', detail: result.message, life: 4000 }); }
        catch { toast.add({ severity: 'error', summary: 'Gagal', detail: store.error, life: 4500 }); }
    }});
}
function severity(value) { return { Menunggu: 'warn', Diproses: 'info', Berhasil: 'success', Gagal: 'danger' }[value] || 'secondary'; }
</script>

<template>
    <div class="card">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div><h1 class="text-2xl font-semibold m-0">Administrasi Akhir Semester</h1><p class="text-muted-color mt-2 mb-0">Validasi nilai, kalkulasi AKM, dan antrean sinkronisasi Feeder.</p></div>
            <Select v-model="selectedYear" :options="years" optionLabel="nama" optionValue="id" class="w-60" />
        </div>
        <Message v-if="error" severity="error" class="mb-4">{{ error }}</Message>
        <div v-if="status" class="grid grid-cols-12 gap-4 mb-6">
            <div class="col-span-6 md:col-span-3 rounded border p-4"><small>Kelas</small><div class="text-3xl font-bold">{{ status.jumlah_kelas }}</div></div>
            <div class="col-span-6 md:col-span-3 rounded border p-4"><small>Siap</small><div class="text-3xl font-bold text-green-500">{{ status.kelas_siap }}</div></div>
            <div class="col-span-6 md:col-span-3 rounded border p-4"><small>Belum Siap</small><div class="text-3xl font-bold text-red-500">{{ status.kelas_belum_siap }}</div></div>
            <div class="col-span-6 md:col-span-3 rounded border p-4"><small>Mahasiswa</small><div class="text-3xl font-bold">{{ status.jumlah_mahasiswa }}</div></div>
            <div class="col-span-12 flex items-center justify-between rounded border p-4"><div><Tag :value="status.status_penutupan" :severity="status.status_penutupan === 'Ditutup' ? 'success' : 'warn'" /><span v-if="status.ditutup_oleh" class="ml-3">oleh {{ status.ditutup_oleh }}</span></div><Button v-if="status.status_penutupan !== 'Ditutup'" label="Tutup Semester" icon="pi pi-lock" severity="danger" :disabled="status.kelas_belum_siap > 0" :loading="isLoading" @click="closeSemester" /></div>
        </div>
        <h3>Outbox Neo Feeder</h3>
        <Message severity="info" class="mb-3">Outbox adalah payload siap sinkron. Pengiriman eksternal dilakukan worker/integrasi Feeder; halaman ini tidak mengirim data langsung.</Message>
        <DataTable :value="outbox" :loading="isLoading" paginator :rows="15" size="small">
            <Column field="entity_type" header="Entitas" /><Column field="operation" header="Operasi" /><Column header="Status"><template #body="{ data }"><Tag :value="data.status" :severity="severity(data.status)" /></template></Column><Column field="attempts" header="Percobaan" /><Column field="last_error" header="Error Terakhir" />
        </DataTable>
    </div>
</template>
