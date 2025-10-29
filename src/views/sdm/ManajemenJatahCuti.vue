<script setup>
import { useCutiStore } from '@/stores/cuti';
import { usePegawaiStore } from '@/stores/pegawai';
import { storeToRefs } from 'pinia';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';

const toast = useToast();
const pegawaiStore = usePegawaiStore();
const cutiStore = useCutiStore();
const { list: pegawaiList, isLoading } = storeToRefs(pegawaiStore);

const dialog = ref(false);
const data = ref({});
const submitted = ref(false);

onMounted(() => {
    pegawaiStore.fetchAll();
});

function openDialog(pegawai) {
    data.value = {
        pegawai_id: pegawai.id,
        nama_pegawai: pegawai.nama_lengkap,
        tahun: new Date().getFullYear(),
        kuota_total: 12 // Default
    };
    submitted.value = false;
    dialog.value = true;
}

async function saveData() {
    submitted.value = true;
    if (!data.value.tahun || !data.value.kuota_total) return;

    try {
        await cutiStore.setJatahCuti(data.value);
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Jatah cuti berhasil diatur', life: 3000 });
        dialog.value = false;
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal menyimpan jatah cuti', life: 4000 });
    }
}
</script>

<template>
    <div class="card">
        <DataTable :value="pegawaiList" :loading="isLoading" dataKey="id" :paginator="true" :rows="10">
            <template #header><h4 class="m-0">Manajemen Jatah Cuti Pegawai</h4></template>
            <Column field="nik" header="NIK" sortable></Column>
            <Column field="nama_lengkap" header="Nama Pegawai" sortable></Column>
            <Column field="jabatan" header="Jabatan" sortable></Column>
            <Column header="Aksi">
                <template #body="slotProps">
                    <Button label="Atur Jatah" icon="pi pi-cog" @click="openDialog(slotProps.data)" />
                </template>
            </Column>
        </DataTable>
    </div>

    <Dialog v-model:visible="dialog" :style="{ width: '450px' }" :header="`Atur Jatah Cuti: ${data.nama_pegawai}`" :modal="true">
        <div class="flex flex-col gap-6">
            <div>
                <label class="block font-bold mb-3">Tahun *</label>
                <InputNumber v-model="data.tahun" :useGrouping="false" :invalid="submitted && !data.tahun" />
            </div>
            <div>
                <label class="block font-bold mb-3">Kuota Total *</label>
                <InputNumber v-model="data.kuota_total" :invalid="submitted && !data.kuota_total" />
            </div>
        </div>
        <template #footer>
            <Button label="Batal" text @click="dialog = false" />
            <Button label="Simpan" @click="saveData" />
        </template>
    </Dialog>
</template>
