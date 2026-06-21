<script setup>
import { useAsesmenStore } from '@/stores/asesmen';
import { useTahunAkademikStore } from '@/stores/tahunAkademik';
import { storeToRefs } from 'pinia';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref, watch } from 'vue';

const store = useAsesmenStore();
const tahunStore = useTahunAkademikStore();
const toast = useToast();
const { studentList, isLoading, error } = storeToRefs(store);
const { list: tahunList } = storeToRefs(tahunStore);
const selectedTahun = ref(null);
const code = ref('');

onMounted(async () => {
    await tahunStore.fetchAll();
    selectedTahun.value = tahunList.value.find(item => item.is_active)?.id || tahunList.value[0]?.id || null;
});

watch(selectedTahun, async id => {
    if (id) await store.fetchStudent(id);
});

async function checkIn() {
    if (code.value.trim().length !== 8) return;
    try {
        const response = await store.checkIn(code.value.trim().toUpperCase());
        toast.add({ severity: 'success', summary: 'Berhasil', detail: response.message, life: 3500 });
        code.value = '';
        await store.fetchStudent(selectedTahun.value);
    } catch (requestError) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: store.error, life: 4000 });
    }
}

function formatDate(value) {
    return new Date(value).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
}

function statusSeverity(status) {
    return { SiapDilaksanakan: 'info', Berlangsung: 'success', Selesai: 'secondary', Dinilai: 'help', Dikunci: 'contrast' }[status] || 'secondary';
}
</script>

<template>
    <div class="grid grid-cols-12 gap-6">
        <div class="col-span-12">
            <div class="card">
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div><h1 class="text-2xl font-semibold m-0">Ujian Saya</h1><p class="text-muted-color mt-2 mb-0">Jadwal, presensi, link ujian online, dan nilai yang telah dipublikasikan.</p></div>
                    <Select v-model="selectedTahun" :options="tahunList" optionLabel="nama" optionValue="id" class="w-56" />
                </div>
                <Message v-if="error" severity="error" class="mb-4">{{ error }}</Message>
                <DataTable :value="studentList" :loading="isLoading" paginator :rows="10" stripedRows>
                    <Column field="kode_mk" header="Kode" /><Column field="nama_mk" header="Mata Kuliah" /><Column field="jenis" header="Jenis" /><Column field="judul" header="Ujian" />
                    <Column header="Jadwal"><template #body="{ data }">{{ formatDate(data.mulai_terjadwal) }}</template></Column>
                    <Column header="Status"><template #body="{ data }"><Tag :value="data.status" :severity="statusSeverity(data.status)" /></template></Column>
                    <Column header="Presensi"><template #body="{ data }"><Tag :value="data.status_presensi || 'Belum'" :severity="data.status_presensi ? 'success' : 'secondary'" /></template></Column>
                    <Column header="Akses/Nilai"><template #body="{ data }"><Button v-if="data.online_url" label="Buka Ujian" icon="pi pi-external-link" size="small" as="a" :href="data.online_url" target="_blank" rel="noopener noreferrer" /><Tag v-else-if="data.nilai != null" :value="`Nilai: ${data.nilai}`" severity="success" /><span v-else>-</span></template></Column>
                    <template #empty><div class="text-center p-8">Belum ada ujian yang dipublikasikan.</div></template>
                </DataTable>
            </div>
        </div>
        <div class="col-span-12 md:col-span-6 md:col-start-4">
            <div class="card text-center"><i class="pi pi-id-card text-primary !text-4xl"></i><h2>Presensi Ujian</h2><p class="text-muted-color">Masukkan kode 8 karakter yang diberikan pengawas.</p><InputText v-model="code" maxlength="8" class="w-full text-center !text-2xl tracking-widest uppercase mb-3" @keyup.enter="checkIn" /><Button label="Check-in Ujian" icon="pi pi-check" class="w-full" :loading="isLoading" :disabled="code.trim().length !== 8" @click="checkIn" /></div>
        </div>
    </div>
</template>
