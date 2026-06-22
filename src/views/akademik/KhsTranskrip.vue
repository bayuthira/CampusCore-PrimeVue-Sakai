<script setup>
import { useAkhirSemesterStore } from '@/stores/akhirSemester';
import { useTahunAkademikStore } from '@/stores/tahunAkademik';
import { storeToRefs } from 'pinia';
import { onMounted, ref, watch } from 'vue';

const store = useAkhirSemesterStore();
const tahunStore = useTahunAkademikStore();
const { khs, transcript, isLoading, error } = storeToRefs(store);
const { list: years } = storeToRefs(tahunStore);
const selectedYear = ref(null);

onMounted(async () => {
    await Promise.all([tahunStore.fetchAll(), store.fetchTranscript()]);
    selectedYear.value = years.value.find(item => item.is_active)?.id || years.value[0]?.id || null;
});
watch(selectedYear, id => { if (id) store.fetchKhs(id); });
</script>

<template>
    <div class="card">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
            <div><h1 class="text-2xl font-semibold m-0">KHS & Transkrip</h1><p class="text-muted-color mt-2 mb-0">Dokumen hasil studi berdasarkan nilai yang telah dipublikasikan.</p></div>
            <Select v-model="selectedYear" :options="years" optionLabel="nama" optionValue="id" class="w-60" />
        </div>
        <Message v-if="error" severity="error" class="mb-4">{{ error }}</Message>
        <TabView>
            <TabPanel header="Kartu Hasil Studi">
                <div v-if="khs">
                    <div class="grid grid-cols-12 gap-3 mb-4">
                        <div class="col-span-12 md:col-span-8"><b>{{ khs.nama_mahasiswa }}</b><div>{{ khs.nim }} · {{ khs.nama_prodi }} · {{ khs.tahun_akademik }}</div></div>
                        <div class="col-span-6 md:col-span-2 text-center rounded border p-3"><small>IPS</small><div class="text-2xl font-bold">{{ khs.ringkasan?.ips ?? '-' }}</div></div>
                        <div class="col-span-6 md:col-span-2 text-center rounded border p-3"><small>IPK</small><div class="text-2xl font-bold text-primary">{{ khs.ringkasan?.ipk ?? '-' }}</div></div>
                    </div>
                    <Message v-if="khs.status_penutupan !== 'Ditutup'" severity="warn" class="mb-3">Semester belum ditutup. IPS/IPK masih bersifat sementara.</Message>
                    <DataTable :value="khs.mata_kuliah" :loading="isLoading" size="small" stripedRows>
                        <Column field="kode_mk" header="Kode" /><Column field="nama_mk" header="Mata Kuliah" /><Column field="sks" header="SKS" />
                        <Column field="nilai_angka" header="Angka" /><Column field="nilai_huruf" header="Huruf" /><Column field="nilai_indeks" header="Indeks" /><Column field="mutu" header="Mutu" />
                        <template #empty><div class="text-center p-6">Belum ada nilai terpublikasi.</div></template>
                    </DataTable>
                </div>
            </TabPanel>
            <TabPanel header="Transkrip Sementara">
                <div v-if="transcript">
                    <div class="flex justify-between gap-4 mb-4"><div><b>{{ transcript.nama_mahasiswa }}</b><div>{{ transcript.nim }} · {{ transcript.nama_prodi }}</div></div><div class="text-right"><div>SKS: <b>{{ transcript.total_sks }}</b></div><div>IPK: <b class="text-primary text-xl">{{ transcript.ipk }}</b></div></div></div>
                    <DataTable :value="transcript.mata_kuliah" :loading="isLoading" paginator :rows="20" size="small" stripedRows>
                        <Column field="kode_mk" header="Kode" /><Column field="nama_mk" header="Mata Kuliah" /><Column field="sks" header="SKS" /><Column field="nilai_angka" header="Angka" /><Column field="nilai_huruf" header="Huruf" /><Column field="nilai_indeks" header="Indeks" /><Column field="mutu" header="Mutu" />
                    </DataTable>
                </div>
            </TabPanel>
        </TabView>
    </div>
</template>
