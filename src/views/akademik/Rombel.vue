<script setup>
import { useDosenStore } from '@/stores/dosen';
import { useDosenPaStore } from '@/stores/dosenPa';
import { useProdiStore } from '@/stores/prodi';
import { useRombelStore } from '@/stores/rombel';
import { storeToRefs } from 'pinia';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref, watch } from 'vue';

const toast = useToast();
const rombelStore = useRombelStore();
const prodiStore = useProdiStore();
const dosenStore = useDosenStore();
const dosenPaStore = useDosenPaStore();

const { rombelList, mahasiswaList, isLoading } = storeToRefs(rombelStore);
const { prodiList } = storeToRefs(prodiStore);
const { dosenList } = storeToRefs(dosenStore);

// --- Filter ---
const selectedProdi = ref(null);
const selectedAngkatan = ref(new Date().getFullYear());
const angkatanOptions = ref(Array.from({ length: 15 }, (_, i) => new Date().getFullYear() - i));

// --- State UI ---
const selectedRombel = ref(null);
const selectedMahasiswa = ref([]);
const moveDialog = ref(false);
const renameDialog = ref(false);
const paDialog = ref(false);

const newRombelName = ref('');
const renameData = ref({ old: '', new: '' });
const selectedDosenPaId = ref(null);

onMounted(() => {
    prodiStore.fetchProdi();
    dosenStore.fetchDosen();
});

async function loadRombelSummary() {
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

// --- Logic Pindah Rombel ---
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
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Mahasiswa dipindahkan', life: 3000 });
        moveDialog.value = false;
        await loadRombelSummary();
        if (selectedRombel.value) await viewDetail(selectedRombel.value);
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal memindahkan mahasiswa', life: 3000 });
    }
}

// --- Logic Rename ---
function openRenameDialog(rombel) {
    renameData.value = { old: rombel.kode_rombel, new: rombel.kode_rombel };
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
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Nama rombel diperbarui', life: 3000 });
        renameDialog.value = false;
        loadRombelSummary();
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal mengubah nama', life: 3000 });
    }
}

// --- Logic Assign Dosen PA Baru ---
function openPaDialog() {
    selectedDosenPaId.value = selectedRombel.value?.dosen_pa_id;
    paDialog.value = true;
}

async function handleAssignPa() {
    if (!selectedDosenPaId.value) return;
    try {
        await dosenPaStore.batchAssign({
            prodi_id: selectedProdi.value,
            angkatan: selectedAngkatan.value,
            kode_rombel: selectedRombel.value.kode_rombel,
            dosen_pa_id: selectedDosenPaId.value
        });
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Dosen PA berhasil ditetapkan', life: 3000 });
        paDialog.value = false;
        loadRombelSummary();
        // Update local state agar tampilan langsung berubah
        if (selectedRombel.value) {
            const dosenObj = dosenList.value.find(d => d.id === selectedDosenPaId.value);
            selectedRombel.value.nama_dosen_pa = dosenObj?.nama_dosen;
        }
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal menetapkan Dosen PA', life: 3000 });
    }
}
</script>

<template>
    <div class="grid gap-4">
        <!-- Filter Bar -->
        <div class="col-12">
            <div class="card shadow-sm border-0">
                <div class="flex flex-wrap gap-4 items-end">
                    <div class="flex flex-col gap-2">
                        <label class="font-bold text-sm text-gray-600">Program Studi</label>
                        <Dropdown v-model="selectedProdi" :options="prodiList" optionLabel="nama_prodi" optionValue="id"
                            placeholder="Pilih Prodi" class="w-72" filter />
                    </div>
                    <div class="flex flex-col gap-2">
                        <label class="font-bold text-sm text-gray-600">Angkatan</label>
                        <Dropdown v-model="selectedAngkatan" :options="angkatanOptions" placeholder="Pilih Angkatan"
                            class="w-40" />
                    </div>
                    <Button icon="pi pi-refresh" outlined severity="success" @click="loadRombelSummary" />
                </div>
            </div>
        </div>

        <!-- Rombel Cards (Kiri) -->
        <div class="col-12 md:col-4">
            <div class="flex flex-col gap-3">
                <h5 class="m-0 font-bold text-gray-700 flex items-center gap-2">
                    <i class="pi pi-th-large text-success"></i> Rombongan Belajar
                </h5>

                <div v-if="!selectedProdi"
                    class="p-8 text-center bg-gray-50 rounded-xl border border-dashed text-gray-400">
                    <i class="pi pi-filter text-3xl mb-2 block opacity-30"></i>
                    <span>Pilih Prodi & Angkatan</span>
                </div>

                <div v-for="rombel in rombelList" :key="rombel.kode_rombel || 'null'"
                    class="card p-4 shadow-sm border-2 transition-all cursor-pointer hover:border-success/50"
                    :class="selectedRombel?.kode_rombel === rombel.kode_rombel ? 'border-success bg-green-50/20' : 'border-gray-100 bg-white'"
                    @click="viewDetail(rombel)">

                    <div class="flex justify-between items-start mb-2">
                        <span class="font-bold text-lg"
                            :class="!rombel.kode_rombel ? 'text-red-500 italic' : 'text-gray-800'">
                            {{ rombel.kode_rombel || 'Belum Diatur Rombel' }}
                        </span>
                        <Button v-if="rombel.kode_rombel" icon="pi pi-pencil" text rounded severity="secondary"
                            size="small" @click.stop="openRenameDialog(rombel)" />
                    </div>

                    <div class="flex flex-col gap-1">
                        <div class="text-sm text-gray-500 flex items-center gap-2">
                            <i class="pi pi-users text-xs"></i> {{ rombel.jumlah_mahasiswa }} Mahasiswa
                        </div>
                        <!-- INFO DOSEN PA PADA KARTU -->
                        <div class="text-xs mt-2 p-2 bg-gray-50 rounded border border-gray-100 flex items-center gap-2"
                            :class="rombel.nama_dosen_pa ? 'text-blue-700' : 'text-gray-400 italic'">
                            <i class="pi pi-user text-[10px]"></i>
                            <span>PA: {{ rombel.nama_dosen_pa || 'Dosen PA belum diatur' }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Mahasiswa List (Kanan) -->
        <div class="col-12 md:col-8">
            <div class="card shadow-sm border-0 h-full min-h-[550px]">
                <template v-if="selectedRombel">
                    <div class="flex flex-wrap justify-between items-start mb-6 gap-4">
                        <div>
                            <h5 class="m-0 font-bold text-xl text-gray-800">
                                {{ selectedRombel.kode_rombel || 'Tanpa Rombel' }}</h5>
                            <div class="flex items-center gap-2 mt-1">
                                <span class="text-sm px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-bold">
                                    PA: {{ selectedRombel.nama_dosen_pa || 'Belum Ada' }}
                                </span>
                                <Button v-if="selectedRombel.kode_rombel" label="Ubah PA" icon="pi pi-user-edit"
                                    size="small" text severity="info" @click="openPaDialog" class="p-0 h-7" />
                            </div>
                        </div>
                        <Button label="Pindahkan Mahasiswa" icon="pi pi-directions" severity="success"
                            @click="openMoveDialog" :disabled="selectedMahasiswa.length === 0" />
                    </div>

                    <DataTable v-model:selection="selectedMahasiswa" :value="mahasiswaList" :loading="isLoading"
                        dataKey="registrasi_id" stripedRows class="p-datatable-sm overflow-hidden rounded-lg border">
                        <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
                        <Column field="nim" header="NIM" sortable class="font-mono font-bold text-primary"></Column>
                        <Column field="nama_mahasiswa" header="Nama Mahasiswa" sortable></Column>
                        <Column field="kode_rombel" header="Rombel">
                            <template #body="slotProps">
                                <span
                                    :class="!slotProps.data.kode_rombel ? 'text-red-400 italic text-xs' : 'text-gray-600'">
                                    {{ slotProps.data.kode_rombel || 'Kosong' }}
                                </span>
                            </template>
                        </Column>
                        <template #empty>
                            <div class="text-center p-4">Tidak ada data mahasiswa.</div>
                        </template>
                    </DataTable>
                </template>
                <div v-else class="flex flex-col items-center justify-center h-full text-gray-300 opacity-50">
                    <i class="pi pi-users text-8xl mb-4"></i>
                    <span class="text-xl">Pilih rombel untuk mengelola mahasiswa</span>
                </div>
            </div>
        </div>
    </div>

    <!-- Dialog Assign Dosen PA -->
    <Dialog v-model:visible="paDialog" header="Tetapkan Dosen Pembimbing Akademik" :style="{ width: '450px' }" modal
        class="p-fluid">
        <div class="flex flex-col gap-4 mt-2">
            <div class="p-3 bg-blue-50 text-blue-800 rounded text-sm mb-2 border border-blue-100">
                <i class="pi pi-info-circle mr-2"></i>
                Dosen yang dipilih akan membimbing seluruh mahasiswa di rombel <b>{{ selectedRombel?.kode_rombel }}</b>.
            </div>
            <div class="flex flex-col gap-2">
                <label class="font-bold text-sm text-gray-600">Pilih Dosen PA</label>
                <Dropdown v-model="selectedDosenPaId" :options="dosenList" optionLabel="nama_dosen" optionValue="id"
                    placeholder="Cari Nama Dosen" filter autofocus />
            </div>
        </div>
        <template #footer>
            <div class="flex justify-end gap-2 mt-4">
                <Button label="Batal" icon="pi pi-times" text severity="secondary" @click="paDialog = false" />
                <Button label="Simpan Dosen PA" icon="pi pi-check" severity="success" @click="handleAssignPa" />
            </div>
        </template>
    </Dialog>

    <!-- Dialog Rename Rombel -->
    <Dialog v-model:visible="renameDialog" header="Ubah Nama Rombel" :style="{ width: '450px' }" modal class="p-fluid">
        <div class="flex flex-col gap-4 mt-2">
            <div class="flex flex-col gap-2">
                <label class="font-bold text-sm text-gray-600">Nama Rombel Baru *</label>
                <InputText v-model="renameData.new" placeholder="Masukkan nama baru..." autofocus />
            </div>
        </div>
        <template #footer>
            <Button label="Batal" text severity="success" @click="renameDialog = false" />
            <Button label="Simpan Perubahan" icon="pi pi-check" severity="success" @click="handleRename" />
        </template>
    </Dialog>

    <!-- Dialog Pindahkan Mahasiswa -->
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
                    <span class="text-[10px] text-gray-400 italic w-32 leading-tight">Kosongkan jika ingin menghapus
                        dari
                        rombel.</span>
                </div>
            </div>
        </div>
        <template #footer>
            <Button label="Batal" text severity="success" @click="moveDialog = false" />
            <Button label="Proses Pindah" icon="pi pi-check" severity="success" @click="handleMove" class="font-bold" />
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