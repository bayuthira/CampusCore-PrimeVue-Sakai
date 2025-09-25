<script setup>
import { useDosenStore } from '@/stores/dosen';
import { useJadwalKuliahStore } from '@/stores/jadwalKuliah';
import { useLookupStore } from '@/stores/lookup';
import { useMataKuliahStore } from '@/stores/matakuliah';
import { useProdiStore } from '@/stores/prodi';
import { useTahunAkademikStore } from '@/stores/tahunAkademik';
import { storeToRefs } from 'pinia';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref, watch } from 'vue';

// --- Setup ---
const toast = useToast();
const jadwalStore = useJadwalKuliahStore();
const prodiStore = useProdiStore();
const tahunAkademikStore = useTahunAkademikStore();
const matakuliahStore = useMataKuliahStore();
const dosenStore = useDosenStore();
const lookupStore = useLookupStore();

const { list: jadwalList, isLoading } = storeToRefs(jadwalStore);
const { prodiList } = storeToRefs(prodiStore);
const { list: tahunAkademikList } = storeToRefs(tahunAkademikStore);
const { mataKuliahList } = storeToRefs(matakuliahStore);
const { dosenList } = storeToRefs(dosenStore);
const { peranDosen } = storeToRefs(lookupStore);

const dialog = ref(false);
const jadwal = ref({});
const filterProdi = ref(null);
const filterTahunAkademik = ref(null);

const hariOptions = ref(['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']);

onMounted(() => {
    prodiStore.fetchProdi();
    tahunAkademikStore.fetchAll();
    lookupStore.fetchPeranDosen();
    dosenStore.fetchDosen(); // Ambil semua dosen
    matakuliahStore.fetchMataKuliah(); // Ambil semua matkul
    jadwalStore.fetchAll();
});

// --- Functions ---
function openNew() {
    jadwal.value = {
        dosen_pengampu: [{ dosen_id: null, peran: null }]
    };
    dialog.value = true;
}

function addDosenPengampu() {
    jadwal.value.dosen_pengampu.push({ dosen_id: null, peran: null });
}

function removeDosenPengampu(index) {
    jadwal.value.dosen_pengampu.splice(index, 1);
}

async function saveData() {
    try {
        const payload = {
            ...jadwal.value,
            jam_mulai: jadwal.value.jam_mulai.toTimeString().substring(0, 5),
            jam_selesai: jadwal.value.jam_selesai.toTimeString().substring(0, 5)
        };
        await jadwalStore.create(payload);
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Jadwal kuliah berhasil dibuat', life: 3000 });
        dialog.value = false;
    } catch (error) {
        const errorMessage = error.response?.data?.error || 'Gagal menyimpan jadwal';
        toast.add({ severity: 'error', summary: 'Gagal', detail: errorMessage, life: 4000 });
    }
}

function applyFilter() {
    const filters = {};
    if (filterProdi.value) filters.prodi_id = filterProdi.value;
    if (filterTahunAkademik.value) filters.tahun_akademik_id = filterTahunAkademik.value;
    jadwalStore.fetchAll(filters);
}

watch([filterProdi, filterTahunAkademik], applyFilter);
</script>

<template>
    <div class="card">
        <Toolbar class="mb-4">
            <template #start>
                <Button label="Tambah Jadwal" icon="pi pi-plus" severity="secondary" @click="openNew" />
            </template>
        </Toolbar>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
                <label for="filterProdi" class="font-bold block mb-2">Filter Program Studi</label>
                <Dropdown v-model="filterProdi" :options="prodiList" optionLabel="nama_prodi" optionValue="id" placeholder="Semua Prodi" showClear fluid />
            </div>
            <div>
                <label for="filterTahun" class="font-bold block mb-2">Filter Tahun Akademik</label>
                <Dropdown v-model="filterTahunAkademik" :options="tahunAkademikList" optionLabel="nama" optionValue="id" placeholder="Semua Tahun" showClear fluid />
            </div>
        </div>

        <DataTable :value="jadwalList" :loading="isLoading" responsiveLayout="scroll">
            <Column field="nama_mk" header="Mata Kuliah" sortable></Column>
            <Column field="kelas" header="Kelas" sortable></Column>
            <Column field="hari" header="Hari" sortable></Column>
            <Column header="Jam">
                <template #body="slotProps"> {{ slotProps.data.jam_mulai }} - {{ slotProps.data.jam_selesai }} </template>
            </Column>
            <Column field="nama_prodi" header="Program Studi" sortable></Column>
            <Column header="Dosen Pengampu">
                <template #body="slotProps">
                    <ul class="list-none p-0 m-0">
                        <li v-for="dosen in slotProps.data.dosen_pengampu" :key="dosen.dosen_id">
                            <Tag v-if="dosen.peran === 'Koordinator'" severity="info" class="mr-1"></Tag>
                            {{ dosen.nama_dosen }} ({{ dosen.peran }})
                        </li>
                    </ul>
                </template>
            </Column>
        </DataTable>

        <Dialog v-model:visible="dialog" header="Tambah Jadwal Kuliah" :modal="true" :style="{ width: '450px' }">
            <div class="flex flex-col gap-6">
                <div>
                    <label class="block font-bold mb-3">Tahun Akademik</label>
                    <Dropdown v-model="jadwal.tahun_akademik_id" :options="tahunAkademikList" optionLabel="nama" optionValue="id" fluid />
                </div>
                <div>
                    <label class="block font-bold mb-3">Mata Kuliah</label>
                    <Dropdown v-model="jadwal.matakuliah_id" :options="mataKuliahList" optionLabel="nama_mk" optionValue="id" fluid filter />
                </div>
                <div>
                    <label class="block font-bold mb-3">Kelas</label>
                    <InputText v-model="jadwal.kelas" fluid />
                </div>
                <div>
                    <label class="block font-bold mb-3">Hari</label>
                    <Dropdown v-model="jadwal.hari" :options="hariOptions" fluid />
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block font-bold mb-3">Jam Mulai</label>
                        <Calendar v-model="jadwal.jam_mulai" timeOnly />
                    </div>
                    <div>
                        <label class="block font-bold mb-3">Jam Selesai</label>
                        <Calendar v-model="jadwal.jam_selesai" timeOnly />
                    </div>
                </div>
                <div>
                    <label class="block font-bold mb-3">Dosen Pengampu</label>
                    <div v-for="(dosen, index) in jadwal.dosen_pengampu" :key="index" class="grid grid-cols-12 gap-2 mb-2">
                        <div class="col-span-6">
                            <Dropdown v-model="dosen.dosen_id" :options="dosenList" optionLabel="nama_dosen" optionValue="id" placeholder="Pilih Dosen" fluid filter />
                        </div>
                        <div class="col-span-5">
                            <Dropdown v-model="dosen.peran" :options="peranDosen" placeholder="Peran" fluid />
                        </div>
                        <div class="col-span-1">
                            <Button icon="pi pi-trash" severity="danger" text @click="removeDosenPengampu(index)" />
                        </div>
                    </div>
                    <Button label="Tambah Dosen" icon="pi pi-plus" severity="secondary" text @click="addDosenPengampu" />
                </div>
            </div>
            <template #footer>
                <Button label="Batal" text @click="dialog = false" />
                <Button label="Simpan" @click="saveData" />
            </template>
        </Dialog>
    </div>
</template>
