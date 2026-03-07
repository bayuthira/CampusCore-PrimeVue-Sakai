<script setup>
import { useTahunAkademikStore } from '@/stores/tahunAkademik';
import { FilterMatchMode } from '@primevue/core/api';
import { storeToRefs } from 'pinia';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';

const toast = useToast();
const store = useTahunAkademikStore();
const { list, isLoading } = storeToRefs(store);

const dialog = ref(false);
const data = ref({});
const submitted = ref(false);
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

onMounted(() => {
    store.fetchAll();
});

function formatDate(date) {
    if (!date) return null;
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

async function saveData() {
    submitted.value = true;
    if (!data.value.nama?.trim() || !data.value.tanggal_mulai) return;

    try {
        const payload = {
            ...data.value,
            tanggal_mulai: formatDate(data.value.tanggal_mulai),
            tanggal_selesai: formatDate(data.value.tanggal_selesai),
            krs_mulai: formatDate(data.value.krs_mulai),
            krs_selesai: formatDate(data.value.krs_selesai)
        };

        if (data.value.id) {
            await store.update(data.value.id, payload);
            toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Tahun Akademik Diperbarui', life: 3000 });
        } else {
            await store.create(payload);
            toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Tahun Akademik Baru Dibuat', life: 3000 });
        }
        dialog.value = false;
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Terjadi kesalahan saat menyimpan', life: 4000 });
    }
}

function openNew() {
    data.value = { is_active: false };
    submitted.value = false;
    dialog.value = true;
}

function editData(row) {
    data.value = {
        ...row,
        tanggal_mulai: row.tanggal_mulai ? new Date(row.tanggal_mulai) : null,
        tanggal_selesai: row.tanggal_selesai ? new Date(row.tanggal_selesai) : null,
        krs_mulai: row.krs_mulai ? new Date(row.krs_mulai) : null,
        krs_selesai: row.krs_selesai ? new Date(row.krs_selesai) : null
    };
    dialog.value = true;
}
</script>

<template>
    <div class="card shadow-sm border-0">
        <Toolbar class="mb-6">
            <template #start>
                <Button label="Tambah Tahun Akademik" icon="pi pi-plus" severity="primary" @click="openNew" />
            </template>
        </Toolbar>

        <DataTable :value="list" :loading="isLoading" :filters="filters" paginator :rows="10" class="p-datatable-sm"
            stripedRows>
            <template #header>
                <div class="flex flex-wrap gap-2 items-center justify-between">
                    <h4 class="m-0 font-bold text-gray-700">Data Tahun Akademik</h4>
                    <IconField>
                        <InputIcon><i class="pi pi-search" /></InputIcon>
                        <InputText v-model="filters['global'].value" placeholder="Cari..." />
                    </IconField>
                </div>
            </template>
            <Column field="nama" header="Nama Periode" sortable></Column>
            <Column field="tanggal_mulai" header="Mulai" sortable></Column>
            <Column field="tanggal_selesai" header="Selesai" sortable></Column>
            <Column field="is_active" header="Status">
                <template #body="slotProps">
                    <Tag :value="slotProps.data.is_active ? 'AKTIF' : 'NON-AKTIF'"
                        :severity="slotProps.data.is_active ? 'success' : 'secondary'" />
                </template>
            </Column>
            <Column header="Aksi">
                <template #body="slotProps">
                    <Button icon="pi pi-pencil" outlined rounded severity="info" @click="editData(slotProps.data)"
                        v-tooltip.top="'Ubah Data'" />
                </template>
            </Column>
        </DataTable>

        <Dialog v-model:visible="dialog" :style="{ width: '550px' }" header="Detail Tahun Akademik" :modal="true"
            class="p-fluid">
            <div class="flex flex-col gap-4 mt-2">
                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-8 flex flex-col gap-2">
                        <label class="font-bold text-sm text-gray-600">Nama Tahun Akademik *</label>
                        <InputText v-model.trim="data.nama" required placeholder="Contoh: Ganjil 2024/2025"
                            :invalid="submitted && !data.nama" />
                    </div>
                    <div class="col-span-4 flex flex-col gap-2">
                        <label class="font-bold text-sm text-gray-600">ID Feeder</label>
                        <InputText v-model.trim="data.id_semester_feeder" placeholder="20241" />
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4 border-t pt-4">
                    <div class="col-span-2 text-xs font-bold text-success uppercase tracking-wider mb-2">Periode
                        Perkuliahan
                    </div>
                    <div class="flex flex-col gap-2">
                        <label class="font-bold text-sm text-gray-600">Tanggal Mulai *</label>
                        <DatePicker v-model="data.tanggal_mulai" dateFormat="yy-mm-dd" showIcon
                            :invalid="submitted && !data.tanggal_mulai" />
                    </div>
                    <div class="flex flex-col gap-2">
                        <label class="font-bold text-sm text-gray-600">Tanggal Selesai *</label>
                        <DatePicker v-model="data.tanggal_selesai" dateFormat="yy-mm-dd" showIcon
                            :invalid="submitted && !data.tanggal_selesai" />
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4 border-t pt-4">
                    <div class="col-span-2 text-xs font-bold text-success uppercase tracking-wider mb-2">Masa Pengisian
                        KRS
                    </div>
                    <div class="flex flex-col gap-2">
                        <label class="font-bold text-sm text-gray-600">KRS Mulai *</label>
                        <DatePicker v-model="data.krs_mulai" dateFormat="yy-mm-dd" showIcon
                            :invalid="submitted && !data.krs_mulai" />
                    </div>
                    <div class="flex flex-col gap-2">
                        <label class="font-bold text-sm text-gray-600">KRS Selesai *</label>
                        <DatePicker v-model="data.krs_selesai" dateFormat="yy-mm-dd" showIcon
                            :invalid="submitted && !data.krs_selesai" />
                    </div>
                </div>

                <div class="flex items-center gap-3 mt-2 bg-gray-50 p-3 rounded border border-gray-100">
                    <ToggleSwitch v-model="data.is_active" id="is_active" />
                    <label for="is_active" class="font-bold text-sm text-gray-700">Set sebagai Semester Berjalan
                        (Aktif)</label>
                </div>
            </div>

            <template #footer>
                <div class="flex justify-end gap-3 mt-4">
                    <Button label="Batal" icon="pi pi-times" text severity="success" @click="dialog = false" />
                    <Button label="Simpan Perubahan" icon="pi pi-check" severity="success" @click="saveData" />
                </div>
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
:deep(.p-dialog-footer) {
    padding: 0 1.5rem 1.5rem 1.5rem;
}
</style>