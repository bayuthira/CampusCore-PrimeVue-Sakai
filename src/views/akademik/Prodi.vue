<script setup>
import { useAuthStore } from '@/stores/auth';
import { useProdiStore } from '@/stores/prodi';
import { FilterMatchMode } from '@primevue/core/api';
import { storeToRefs } from 'pinia';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';

const toast = useToast();
const prodiStore = useProdiStore();
const authStore = useAuthStore();
const { prodiList, isLoading } = storeToRefs(prodiStore);

// State lokal
const prodiDialog = ref(false);
const deleteProdiDialog = ref(false);
const prodi = ref({});
const submitted = ref(false);
const dt = ref();

const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

// Opsi Dropdown
const jenjangOptions = ['D3', 'D4', 'S1', 'S2', 'Profesi'];
const statusOptions = ['Aktif', 'Tutup', 'Hibernasi', 'Alih Bentuk'];

// Cek Role SUPER_ADMIN untuk proteksi Kode Prodi
const isSuperAdmin = computed(() => {
    return authStore.userData?.roles?.includes('SUPER_ADMIN');
});

onMounted(() => {
    prodiStore.fetchProdi();
});

function exportCSV() {
    dt.value.exportCSV();
}

function openNew() {
    prodi.value = {
        status_prodi: 'Aktif',
        jenjang: 'S1'
    };
    submitted.value = false;
    prodiDialog.value = true;
}

function hideDialog() {
    prodiDialog.value = false;
    submitted.value = false;
}

async function saveProdi() {
    submitted.value = true;

    // Validasi minimal field wajib
    if (!prodi.value.nama_prodi?.trim()) return;
    if (!prodi.value.id && !prodi.value.kode_prodi?.trim()) return;

    try {
        if (prodi.value.id) {
            // Skenario Update: Gunakan Partial Update
            const payload = {
                nama_prodi: prodi.value.nama_prodi,
                jenjang: prodi.value.jenjang,
                status_prodi: prodi.value.status_prodi,
                id_prodi_feeder: prodi.value.id_prodi_feeder
            };

            // Kode Prodi hanya dikirim jika user adalah Super Admin
            if (isSuperAdmin.value) {
                payload.kode_prodi = prodi.value.kode_prodi;
            }

            await prodiStore.updateProdi(prodi.value.id, payload);
            toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Data Prodi Diperbarui', life: 3000 });
        } else {
            // Skenario Create Baru
            await prodiStore.createProdi(prodi.value);
            toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Prodi Baru Dibuat', life: 3000 });
        }
        prodiDialog.value = false;
        prodi.value = {};
    } catch (error) {
        const errorMessage = error.response?.data?.error || 'Terjadi kesalahan saat menyimpan';
        toast.add({ severity: 'error', summary: 'Gagal', detail: errorMessage, life: 4000 });
    }
}

function editProdi(data) {
    prodi.value = { ...data };
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

function getStatusSeverity(status) {
    switch (status) {
        case 'Aktif': return 'success';
        case 'Tutup': return 'danger';
        case 'Hibernasi': return 'warn';
        default: return 'info';
    }
}
</script>

<template>
    <div>
        <div class="card shadow-sm border-0">
            <Toolbar class="mb-6">
                <template #start>
                    <Button label="Tambah Prodi" icon="pi pi-plus" severity="primary" class="mr-2" @click="openNew" />
                </template>
                <template #end>
                    <Button label="Export CSV" icon="pi pi-download" severity="secondary" @click="exportCSV" />
                </template>
            </Toolbar>

            <DataTable ref="dt" :value="prodiList" :loading="isLoading" dataKey="id" :paginator="true" :rows="10"
                :filters="filters" responsiveLayout="scroll" class="p-datatable-sm" stripedRows>
                <template #header>
                    <div class="flex flex-wrap gap-2 items-center justify-between">
                        <h4 class="m-0 font-bold">Data Program Studi</h4>
                        <IconField>
                            <InputIcon><i class="pi pi-search" /></InputIcon>
                            <InputText v-model="filters['global'].value" placeholder="Cari prodi..." />
                        </IconField>
                    </div>
                </template>

                <Column field="kode_prodi" header="Kode" sortable></Column>
                <Column field="nama_prodi" header="Nama Program Studi" sortable style="min-width: 14rem"></Column>
                <Column field="jenjang" header="Jenjang" sortable></Column>
                <Column field="status_prodi" header="Status" sortable>
                    <template #body="slotProps">
                        <Tag :value="slotProps.data.status_prodi"
                            :severity="getStatusSeverity(slotProps.data.status_prodi)" />
                    </template>
                </Column>
                <Column field="id_prodi_feeder" header="ID Feeder" class="text-xs font-mono text-gray-500"></Column>

                <Column :exportable="false" header="Aksi" style="min-width: 8rem">
                    <template #body="slotProps">
                        <Button icon="pi pi-pencil" outlined rounded severity="info" class="mr-2"
                            @click="editProdi(slotProps.data)" v-tooltip.top="'Edit'" />
                        <Button icon="pi pi-trash" outlined rounded severity="danger"
                            @click="confirmDeleteProdi(slotProps.data)" v-tooltip.top="'Hapus'" />
                    </template>
                </Column>
            </DataTable>
        </div>

        <Dialog v-model:visible="prodiDialog" :style="{ width: '500px' }" header="Detail Program Studi" :modal="true"
            class="p-fluid">
            <div class="flex flex-col gap-4 mt-2">
                <!-- Info Alert -->
                <div v-if="prodi.id && !isSuperAdmin"
                    class="p-3 bg-yellow-50 text-yellow-700 text-xs rounded border border-yellow-100 flex items-start gap-2">
                    <i class="pi pi-info-circle mt-0.5"></i>
                    <span>Perubahan Kode Prodi hanya diperbolehkan untuk <b>Super Admin</b>.</span>
                </div>

                <!-- Row 1: Kode & Jenjang -->
                <div class="grid grid-cols-2 gap-4">
                    <div class="flex flex-col gap-2">
                        <label for="kode_prodi" class="font-bold text-sm">Kode Prodi *</label>
                        <InputText id="kode_prodi" v-model.trim="prodi.kode_prodi" required placeholder="Contoh: S1AK"
                            :disabled="prodi.id && !isSuperAdmin" :invalid="submitted && !prodi.kode_prodi" />
                        <small v-if="submitted && !prodi.kode_prodi" class="p-error">Wajib diisi.</small>
                    </div>
                    <div class="flex flex-col gap-2">
                        <label for="jenjang" class="font-bold text-sm">Jenjang</label>
                        <Dropdown id="jenjang" v-model="prodi.jenjang" :options="jenjangOptions"
                            placeholder="Pilih Jenjang" />
                    </div>
                </div>

                <!-- Row 2: Nama Prodi -->
                <div class="flex flex-col gap-2">
                    <label for="nama_prodi" class="font-bold text-sm">Nama Prodi *</label>
                    <InputText id="nama_prodi" v-model.trim="prodi.nama_prodi" required
                        placeholder="Masukkan nama program studi" :invalid="submitted && !prodi.nama_prodi" />
                    <small v-if="submitted && !prodi.nama_prodi" class="p-error">Wajib diisi.</small>
                </div>

                <!-- Row 3: Status & ID Feeder -->
                <div class="grid grid-cols-2 gap-4">
                    <div class="flex flex-col gap-2">
                        <label for="status_prodi" class="font-bold text-sm">Status Prodi</label>
                        <Dropdown id="status_prodi" v-model="prodi.status_prodi" :options="statusOptions"
                            placeholder="Pilih Status" />
                    </div>
                    <div class="flex flex-col gap-2">
                        <label for="id_feeder" class="font-bold text-sm">ID Prodi Feeder (DIKTI)</label>
                        <InputText id="id_feeder" v-model.trim="prodi.id_prodi_feeder" placeholder="Optional" />
                    </div>
                </div>
            </div>

            <template #footer>
                <div class="flex justify-end gap-2 mt-4">
                    <Button label="Batal" icon="pi pi-times" text severity="danger" @click="hideDialog" />
                    <Button label="Simpan Perubahan" icon="pi pi-check" severity="success" @click="saveProdi" />
                </div>
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteProdiDialog" :style="{ width: '450px' }" header="Konfirmasi Hapus" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle text-3xl text-red-500" />
                <span v-if="prodi">Apakah Anda yakin ingin menghapus prodi <b>{{ prodi.nama_prodi }}</b>?</span>
            </div>
            <template #footer>
                <Button label="Batal" icon="pi pi-times" text @click="deleteProdiDialog = false" />
                <Button label="Ya, Hapus" icon="pi pi-check" severity="danger" @click="deleteProdi" />
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
/* Opsional: Menyesuaikan tampilan agar lebih mirip dengan gambar */
:deep(.p-dialog-footer) {
    padding: 1.5rem;
}

:deep(.p-error) {
    font-size: 0.75rem;
}
</style>