<script setup>
import { useProdiStore } from '@/stores/prodi';
import { useRombelStore } from '@/stores/rombel';
import { storeToRefs } from 'pinia';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref, watch } from 'vue';

const toast = useToast();
const confirm = useConfirm();
const rombelStore = useRombelStore();
const prodiStore = useProdiStore();

const { rombelList, mahasiswaList, isLoading } = storeToRefs(rombelStore);
const { prodiList } = storeToRefs(prodiStore);

// --- Filter ---
const selectedProdi = ref(null);
const selectedAngkatan = ref(new Date().getFullYear());
const angkatanOptions = ref(Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i));

// --- State UI ---
const selectedRombel = ref(null);
const selectedMahasiswa = ref([]);
const moveDialog = ref(false);
const renameDialog = ref(false);
const newRombelName = ref('');
const renameData = ref({ old: '', new: '' });

onMounted(() => {
    prodiStore.fetchProdi();
});

async function loadRombelSummary() {
    // Reset state mahasiswa dan rombel terpilih saat filter berubah
    selectedRombel.value = null;
    selectedMahasiswa.value = [];
    rombelStore.$patch({ mahasiswaList: [] });

    if (!selectedProdi.value) {
        rombelStore.$patch({ rombelList: [] });
        return;
    }

    await rombelStore.fetchSummary({
        prodi_id: selectedProdi.value,
        angkatan: selectedAngkatan.value
    });
}

// Watch perubahan filter untuk memicu pembersihan list dan fetching ulang summary
watch([selectedProdi, selectedAngkatan], loadRombelSummary);

async function viewDetail(rombel) {
    selectedRombel.value = rombel;
    selectedMahasiswa.value = [];
    await rombelStore.fetchMahasiswa({
        prodi_id: selectedProdi.value,
        angkatan: selectedAngkatan.value,
        kode_rombel: rombel.kode_rombel
    });
}

function openMoveDialog() {
    if (selectedMahasiswa.value.length === 0) {
        toast.add({ severity: 'warn', summary: 'Peringatan', detail: 'Pilih mahasiswa terlebih dahulu', life: 3000 });
        return;
    }
    newRombelName.value = '';
    moveDialog.value = true;
}

async function handleMove() {
    try {
        await rombelStore.moveStudents({
            registrasi_ids: selectedMahasiswa.value.map(m => m.registrasi_id),
            kode_rombel_baru: newRombelName.value || null
        });
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Mahasiswa berhasil dipindahkan', life: 3000 });
        moveDialog.value = false;

        // Refresh data summary dan detail
        const currentRombel = selectedRombel.value;
        await loadRombelSummary();

        // Jika sebelumnya sedang melihat rombel tertentu, coba buka lagi jika masih ada
        if (currentRombel) {
            await viewDetail(currentRombel);
        }
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal memindahkan mahasiswa', life: 3000 });
    }
}

function openRenameDialog(rombel) {
    renameData.value = {
        old: rombel.kode_rombel,
        new: rombel.kode_rombel
    };
    renameDialog.value = true;
}

async function handleRename() {
    try {
        await rombelStore.renameRombel({
            prodi_id: selectedProdi.value,
            angkatan: selectedAngkatan.value,
            kode_rombel_lama: renameData.value.old,
            kode_rombel_baru: renameData.value.new
        });
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Nama rombel berhasil diubah', life: 3000 });
        renameDialog.value = false;
        loadRombelSummary();
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal mengubah nama rombel', life: 3000 });
    }
}
</script>

<template>
    <div class="grid gap-4">
        <!-- Filter Card -->
        <div class="col-12">
            <div class="card shadow-sm border-0">
                <div class="flex flex-wrap gap-4 items-end">
                    <div class="flex flex-col gap-2">
                        <label class="font-bold text-sm text-gray-600">Program Studi</label>
                        <Dropdown v-model="selectedProdi" :options="prodiList" optionLabel="nama_prodi" optionValue="id"
                            placeholder="Pilih Prodi" class="w-64" filter />
                    </div>
                    <div class="flex flex-col gap-2">
                        <label class="font-bold text-sm text-gray-600">Angkatan</label>
                        <Dropdown v-model="selectedAngkatan" :options="angkatanOptions" placeholder="Pilih Angkatan"
                            class="w-40" />
                    </div>
                    <Button icon="pi pi-refresh" outlined severity="success" @click="loadRombelSummary"
                        v-tooltip.top="'Refresh Data'" />
                </div>
            </div>
        </div>

        <!-- Layout Master-Detail -->
        <div class="col-12 md:col-4">
            <div class="flex flex-col gap-3">
                <h5 class="m-0 font-bold text-gray-700 flex items-center gap-2">
                    <i class="pi pi-th-large text-success"></i> Daftar Rombel
                </h5>
                <div v-if="!selectedProdi"
                    class="p-8 text-center bg-gray-50 rounded-xl border border-dashed text-gray-400">
                    <i class="pi pi-filter text-4xl mb-3 block opacity-20"></i>
                    <span>Silakan pilih Program Studi & Angkatan.</span>
                </div>
                <div v-else-if="rombelList.length === 0 && !isLoading"
                    class="p-8 text-center bg-gray-50 rounded-xl border border-dashed text-gray-400">
                    <i class="pi pi-box text-4xl mb-3 block opacity-20"></i>
                    <span>Data tidak ditemukan.</span>
                </div>

                <div v-for="rombel in rombelList" :key="rombel.kode_rombel || 'null'"
                    class="card p-4 shadow-sm border-2 transition-all cursor-pointer hover:border-success/50"
                    :class="selectedRombel?.kode_rombel === rombel.kode_rombel ? 'border-success bg-green-50/30' : 'border-gray-100 bg-white'"
                    @click="viewDetail(rombel)">
                    <div class="flex justify-between items-start">
                        <div class="flex flex-col gap-1">
                            <span class="font-bold text-lg leading-tight"
                                :class="!rombel.kode_rombel ? 'text-red-500 italic' : 'text-gray-800'">
                                {{ rombel.kode_rombel || 'Belum Diatur Rombel' }}
                            </span>
                            <span class="text-sm text-gray-500 font-medium">{{ rombel.jumlah_mahasiswa }}
                                Mahasiswa</span>
                        </div>
                        <Button v-if="rombel.kode_rombel" icon="pi pi-pencil" text rounded severity="secondary"
                            size="small" @click.stop="openRenameDialog(rombel)" v-tooltip.top="'Ubah Nama Rombel'" />
                    </div>
                </div>
            </div>
        </div>

        <!-- Mahasiswa List Detail -->
        <div class="col-12 md:col-8">
            <div class="card shadow-sm border-0 h-full min-h-[500px]">
                <template v-if="selectedRombel">
                    <div class="flex flex-wrap justify-between items-center mb-6 gap-3">
                        <div>
                            <h5 class="m-0 font-bold text-xl text-gray-800">
                                {{ selectedRombel.kode_rombel || 'Tanpa Rombel' }}
                            </h5>
                            <span class="text-sm text-gray-500">Angkatan {{ selectedAngkatan }}</span>
                        </div>
                        <Button label="Pindahkan Mahasiswa" icon="pi pi-directions" severity="success"
                            @click="openMoveDialog" :disabled="selectedMahasiswa.length === 0" class="font-bold" />
                    </div>

                    <DataTable v-model:selection="selectedMahasiswa" :value="mahasiswaList" :loading="isLoading"
                        dataKey="registrasi_id" stripedRows
                        class="p-datatable-sm overflow-hidden rounded-lg border border-gray-100 shadow-inner">
                        <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
                        <Column field="nim" header="NIM" sortable class="font-mono font-bold text-primary"></Column>
                        <Column field="nama_mahasiswa" header="Nama Mahasiswa" sortable></Column>
                        <Column field="kode_rombel" header="Rombel Saat Ini">
                            <template #body="slotProps">
                                <span
                                    :class="!slotProps.data.kode_rombel ? 'text-red-400 italic text-xs' : 'text-gray-600'">
                                    {{ slotProps.data.kode_rombel || 'Kosong' }}
                                </span>
                            </template>
                        </Column>
                        <template #empty>
                            <div class="text-center p-4 text-gray-400">Tidak ada mahasiswa dalam filter ini.</div>
                        </template>
                    </DataTable>
                </template>
                <div v-else class="flex flex-col items-center justify-center h-full text-gray-300 opacity-50">
                    <i class="pi pi-users text-8xl mb-4"></i>
                    <span class="text-xl font-medium">Pilih rombel di sebelah kiri untuk mengelola mahasiswa</span>
                </div>
            </div>
        </div>
    </div>

    <!-- Dialog Ubah Nama Rombel -->
    <Dialog v-model:visible="renameDialog" header="Detail Program Studi" :style="{ width: '450px' }" modal
        class="p-fluid">
        <div class="flex flex-col gap-4 mt-2">
            <div class="flex flex-col gap-2">
                <label class="font-bold text-sm text-gray-600">Nama Rombel Saat Ini</label>
                <InputText :value="renameData.old" disabled class="bg-gray-50" />
            </div>
            <div class="flex flex-col gap-2">
                <label class="font-bold text-sm text-gray-600">Nama Rombel Baru *</label>
                <InputText v-model="renameData.new" placeholder="Masukkan nama baru..." autofocus />
            </div>
        </div>
        <template #footer>
            <div class="flex justify-end gap-2 mt-4">
                <Button label="Batal" icon="pi pi-times" text severity="success" @click="renameDialog = false" />
                <Button label="Simpan Perubahan" icon="pi pi-check" severity="success" @click="handleRename" />
            </div>
        </template>
    </Dialog>

    <!-- Dialog Pindahkan Mahasiswa (Sesuai image_86c8c6.png) -->
    <Dialog v-model:visible="moveDialog" header="Pindahkan Mahasiswa" :style="{ width: '500px' }" modal class="p-fluid">
        <div class="flex flex-col gap-6 mt-2">
            <p class="text-gray-600 m-0 leading-relaxed">
                Pindahkan <b class="text-gray-800">{{ selectedMahasiswa.length }}</b> mahasiswa terpilih ke:
            </p>

            <div class="flex flex-col gap-2">
                <label for="rombel_baru" class="font-bold text-sm text-gray-700">Kode Rombel Baru</label>
                <div class="flex items-center gap-2">
                    <InputText id="rombel_baru" v-model="newRombelName"
                        placeholder="Contoh: Kelas A, Kelas B, atau kosongkan" class="flex-1" />
                    <span class="text-[10px] text-gray-400 italic w-32 leading-tight">
                        Kosongkan jika ingin menghapus mahasiswa dari rombel saat ini.
                    </span>
                </div>
            </div>
        </div>
        <template #footer>
            <div class="flex justify-end gap-3 mt-4">
                <Button label="Batal" icon="pi pi-times" text severity="success" @click="moveDialog = false" />
                <Button label="Proses Pindah" icon="pi pi-check" severity="success" @click="handleMove"
                    class="font-bold" />
            </div>
        </template>
    </Dialog>
</template>

<style scoped>
:deep(.p-dialog-footer) {
    padding: 0 1.5rem 1.5rem 1.5rem;
}

.card {
    transition: all 0.2s ease;
}
</style>