<script setup>
import { useProdiStore } from '@/stores/prodi';
import { storeToRefs } from 'pinia';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';

// --- Setup Store dan State ---
const toast = useToast();
const prodiStore = useProdiStore();
const { prodiList, isLoading } = storeToRefs(prodiStore); // Ambil state dari store secara reaktif

const prodiDialog = ref(false);
const deleteProdiDialog = ref(false);
const prodi = ref({}); // Untuk menampung data prodi yang akan dibuat/diedit
const submitted = ref(false);

// Panggil data saat komponen pertama kali dimuat
onMounted(() => {
    prodiStore.fetchProdi();
});

// --- Fungsi-fungsi CRUD ---

function openNew() {
    prodi.value = {}; // Reset form
    submitted.value = false;
    prodiDialog.value = true;
}

function hideDialog() {
    prodiDialog.value = false;
    submitted.value = false;
}

async function saveProdi() {
    submitted.value = true;

    if (!prodi.value.nama_prodi?.trim() || !prodi.value.kode_prodi?.trim()) {
        return; // Validasi sederhana
    }

    try {
        if (prodi.value.id) {
            // Jika ada ID, berarti ini mode Update
            await prodiStore.updateProdi(prodi.value.id, {
                kode_prodi: prodi.value.kode_prodi,
                nama_prodi: prodi.value.nama_prodi
            });
            toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Data Prodi Diperbarui', life: 3000 });
        } else {
            // Jika tidak ada ID, berarti ini mode Create
            await prodiStore.createProdi({
                kode_prodi: prodi.value.kode_prodi,
                nama_prodi: prodi.value.nama_prodi
            });
            toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Prodi Baru Dibuat', life: 3000 });
        }
        prodiDialog.value = false;
        prodi.value = {};
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Terjadi kesalahan saat menyimpan', life: 3000 });
    }
}

function editProdi(data) {
    prodi.value = { ...data }; // Salin data ke form
    prodiDialog.value = true;
}

function confirmDeleteProdi(data) {
    prodi.value = data;
    deleteProdiDialog.value = true;
}

async function deleteProdi() {
    try {
        await prodiStore.deleteProdi(prodi.value.id);
        deleteProdiDialog.value = false;
        prodi.value = {};
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Data Prodi Dihapus', life: 3000 });
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Terjadi kesalahan saat menghapus', life: 3000 });
    }
}
</script>

<template>
    <div>
        <div class="card">
            <Toolbar class="mb-4">
                <template #start>
                    <Button label="Tambah Prodi" icon="pi pi-plus" @click="openNew" />
                </template>
            </Toolbar>

            <DataTable :value="prodiList" :loading="isLoading" dataKey="id" responsiveLayout="scroll">
                <template #header>
                    <h4 class="m-0">Manajemen Program Studi</h4>
                </template>

                <Column field="kode_prodi" header="Kode Prodi" :sortable="true"></Column>
                <Column field="nama_prodi" header="Nama Program Studi" :sortable="true"></Column>
                <Column headerStyle="min-width:10rem;" header="Aksi">
                    <template #body="slotProps">
                        <Button icon="pi pi-pencil" class="p-button-rounded p-button-success mr-2" @click="editProdi(slotProps.data)" />
                        <Button icon="pi pi-trash" class="p-button-rounded p-button-warning" @click="confirmDeleteProdi(slotProps.data)" />
                    </template>
                </Column>
            </DataTable>
        </div>

        <Dialog v-model:visible="prodiDialog" :style="{ width: '450px' }" header="Detail Program Studi" :modal="true" class="p-fluid">
            <div class="field">
                <label for="kode_prodi">Kode Prodi</label>
                <InputText id="kode_prodi" v-model.trim="prodi.kode_prodi" required="true" autofocus :invalid="submitted && !prodi.kode_prodi" />
                <small class="p-error" v-if="submitted && !prodi.kode_prodi">Kode Prodi harus diisi.</small>
            </div>
            <div class="field">
                <label for="nama_prodi">Nama Prodi</label>
                <InputText id="nama_prodi" v-model.trim="prodi.nama_prodi" required="true" :invalid="submitted && !prodi.nama_prodi" />
                <small class="p-error" v-if="submitted && !prodi.nama_prodi">Nama Prodi harus diisi.</small>
            </div>
            <template #footer>
                <Button label="Batal" icon="pi pi-times" text @click="hideDialog" />
                <Button label="Simpan" icon="pi pi-check" text @click="saveProdi" />
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteProdiDialog" :style="{ width: '450px' }" header="Konfirmasi" :modal="true">
            <div class="flex align-items-center">
                <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                <span v-if="prodi"
                    >Apakah Anda yakin ingin menghapus <b>{{ prodi.nama_prodi }}</b
                    >?</span
                >
            </div>
            <template #footer>
                <Button label="Tidak" icon="pi pi-times" text @click="deleteProdiDialog = false" />
                <Button label="Ya" icon="pi pi-check" text @click="deleteProdi" />
            </template>
        </Dialog>
    </div>
</template>
