<script setup>
import { useDosenStore } from '@/stores/dosen';
import { usePegawaiStore } from '@/stores/pegawai';
import { useProdiStore } from '@/stores/prodi';
import { FilterMatchMode } from '@primevue/core/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { storeToRefs } from 'pinia';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';
import * as XLSX from 'xlsx';

const toast = useToast();
const dosenStore = useDosenStore();
const prodiStore = useProdiStore();
const pegawaiStore = usePegawaiStore();

const { dosenList, isLoading } = storeToRefs(dosenStore);
const { prodiList } = storeToRefs(prodiStore);
const { list: allPegawaiList } = storeToRefs(pegawaiStore);

const dosenDialog = ref(false);
const deleteDosenDialog = ref(false);
const dosen = ref({});
const submitted = ref(false);

const dt = ref();
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

const ikatanKerjaOptions = ref([
    { label: 'Dosen Tetap (A)', value: 'A' },
    { label: 'Dosen Dpk (B)', value: 'B' },
    { label: 'Dosen LB (C)', value: 'C' }
]);

// Filter pegawai yang hanya berkategori "Tenaga Pendidik"
const pendidikList = computed(() => {
    return allPegawaiList.value.filter(p => p.kategori_pegawai === 'Tenaga Pendidik');
});

onMounted(() => {
    dosenStore.fetchDosen();
    prodiStore.fetchProdi();
    pegawaiStore.fetchAll();
});

function exportCSV() {
    dt.value.exportCSV();
}

function exportExcel() {
    const data = dosenList.value;
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Dosen');
    XLSX.writeFile(workbook, 'data-dosen.xlsx');
}

function exportPDF() {
    const doc = new jsPDF();
    const tableHead = [['NIDN', 'Nama Dosen', 'Email', 'Program Studi']];
    const tableBody = dosenList.value.map((item) => [item.nidn, item.nama_dosen, item.email || '-', item.nama_prodi]);
    autoTable(doc, { head: tableHead, body: tableBody });
    doc.save('data-dosen.pdf');
}

const exportItems = ref([
    { label: 'CSV', icon: 'pi pi-file', command: exportCSV },
    { label: 'Excel', icon: 'pi pi-file-excel', command: exportExcel },
    { label: 'PDF', icon: 'pi pi-file-pdf', command: exportPDF }
]);

function openNew() {
    dosen.value = { ikatan_kerja: 'A' };
    submitted.value = false;
    dosenDialog.value = true;
}

function hideDialog() {
    dosenDialog.value = false;
    submitted.value = false;
}

async function saveDosen() {
    submitted.value = true;

    // Nama dan Email tidak lagi dikirim karena ambil dari master Pegawai
    if (!dosen.value.nidn?.trim() || !dosen.value.prodi_id || (!dosen.value.id && !dosen.value.pegawai_id)) {
        return;
    }

    try {
        if (dosen.value.id) {
            // Partial Update: Hanya kirim yang relevan
            const payload = {
                nidn: dosen.value.nidn,
                prodi_id: dosen.value.prodi_id.id || dosen.value.prodi_id,
                ikatan_kerja: dosen.value.ikatan_kerja,
                id_penugasan_feeder: dosen.value.id_penugasan_feeder
            };
            await dosenStore.updateDosen(dosen.value.id, payload);
            toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Data Dosen Diperbarui', life: 3000 });
        } else {
            // Create: Wajib kirim pegawai_id
            const payload = {
                nidn: dosen.value.nidn,
                pegawai_id: dosen.value.pegawai_id,
                prodi_id: dosen.value.prodi_id.id || dosen.value.prodi_id,
                ikatan_kerja: dosen.value.ikatan_kerja,
                id_penugasan_feeder: dosen.value.id_penugasan_feeder
            };
            await dosenStore.createDosen(payload);
            toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Dosen Berhasil Ditambahkan', life: 3000 });
        }
        dosenDialog.value = false;
        dosen.value = {};
    } catch (error) {
        const errorMessage = error.response?.data?.error || 'Terjadi kesalahan saat menyimpan';
        toast.add({ severity: 'error', summary: 'Gagal', detail: errorMessage, life: 4000 });
    }
}

function editDosen(data) {
    dosen.value = { ...data };
    dosenDialog.value = true;
}

function confirmDeleteDosen(data) {
    dosen.value = data;
    deleteDosenDialog.value = true;
}

async function deleteDosen() {
    try {
        await dosenStore.deleteDosen(dosen.value.id);
        deleteDosenDialog.value = false;
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Dosen Berhasil Dihapus', life: 3000 });
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Terjadi kesalahan saat menghapus', life: 3000 });
    }
}
</script>

<template>
    <div>
        <div class="card shadow-sm border-0">
            <Toolbar class="mb-6">
                <template #start>
                    <Button label="Tambah Dosen" icon="pi pi-plus" severity="primary" class="mr-2" @click="openNew" />
                </template>
                <template #end>
                    <SplitButton label="Ekspor Data" icon="pi pi-upload" :model="exportItems" severity="secondary">
                    </SplitButton>
                </template>
            </Toolbar>

            <DataTable ref="dt" :value="dosenList" :loading="isLoading" dataKey="id" :paginator="true" :rows="10"
                :filters="filters" stripedRows class="p-datatable-sm">
                <template #header>
                    <div class="flex flex-wrap gap-2 items-center justify-between">
                        <h4 class="m-0 font-bold text-gray-700">Data Master Dosen</h4>
                        <IconField>
                            <InputIcon> <i class="pi pi-search" /> </InputIcon>
                            <InputText v-model="filters['global'].value" placeholder="Cari..." />
                        </IconField>
                    </div>
                </template>

                <Column field="nidn" header="NIDN" sortable></Column>
                <Column field="nama_dosen" header="Nama Dosen" sortable style="min-width: 14rem"></Column>
                <Column field="email" header="Email" sortable></Column>
                <Column field="nama_prodi" header="Program Studi" sortable></Column>
                <Column :exportable="false" style="min-width: 8rem" header="Aksi">
                    <template #body="slotProps">
                        <Button icon="pi pi-pencil" outlined rounded severity="info" class="mr-2"
                            @click="editDosen(slotProps.data)" v-tooltip.top="'Ubah'" />
                        <Button icon="pi pi-trash" outlined rounded severity="danger"
                            @click="confirmDeleteDosen(slotProps.data)" v-tooltip.top="'Hapus'" />
                    </template>
                </Column>
            </DataTable>
        </div>

        <!-- Modal Detail Dosen -->
        <Dialog v-model:visible="dosenDialog" :style="{ width: '550px' }" header="Detail Data Dosen" :modal="true"
            class="p-fluid">
            <div class="flex flex-col gap-4 mt-2">
                <!-- Dropdown Pegawai hanya untuk input baru -->
                <div v-if="!dosen.id" class="flex flex-col gap-2">
                    <label for="pegawai" class="font-bold text-sm text-gray-600">Pilih Pegawai *</label>
                    <Dropdown id="pegawai" v-model="dosen.pegawai_id" :options="pendidikList" optionLabel="nama_lengkap"
                        optionValue="id" placeholder="Cari Nama Pegawai (Pendidik)" filter
                        :invalid="submitted && !dosen.pegawai_id" />
                    <small class="text-gray-400">Data nama, email, dan biodata akan diambil dari profil Pegawai.</small>
                </div>

                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                        <label for="nidn" class="font-bold text-sm text-gray-600">NIDN / NIDK *</label>
                        <InputText id="nidn" v-model.trim="dosen.nidn" required :invalid="submitted && !dosen.nidn" />
                    </div>
                    <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                        <label for="ikatan" class="font-bold text-sm text-gray-600">Ikatan Kerja</label>
                        <Dropdown id="ikatan" v-model="dosen.ikatan_kerja" :options="ikatanKerjaOptions"
                            optionLabel="label" optionValue="value" placeholder="Pilih Ikatan" />
                    </div>
                </div>

                <div class="flex flex-col gap-2">
                    <label for="prodi" class="font-bold text-sm text-gray-600">Program Studi (Homebase) *</label>
                    <Dropdown id="prodi" v-model="dosen.prodi_id" :options="prodiList" optionLabel="nama_prodi"
                        optionValue="id" placeholder="Pilih Prodi" filter :invalid="submitted && !dosen.prodi_id" />
                </div>

                <div class="flex flex-col gap-2">
                    <label for="feeder" class="font-bold text-sm text-gray-600 text-xs">ID Penugasan (Neo
                        Feeder)</label>
                    <InputText id="feeder" v-model.trim="dosen.id_penugasan_feeder" placeholder="UUID dari Feeder" />
                </div>
            </div>

            <template #footer>
                <div class="flex justify-end gap-3 mt-4">
                    <Button label="Batal" icon="pi pi-times" text severity="success" @click="hideDialog" />
                    <Button label="Simpan Perubahan" icon="pi pi-check" severity="success" @click="saveDosen" />
                </div>
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteDosenDialog" :style="{ width: '450px' }" header="Konfirmasi" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle text-3xl text-red-500" />
                <span v-if="dosen">Yakin ingin menghapus ikatan dosen <b>{{ dosen.nama_dosen }}</b>?</span>
            </div>
            <template #footer>
                <Button label="Batal" icon="pi pi-times" text @click="deleteDosenDialog = false" />
                <Button label="Ya, Hapus" icon="pi pi-check" severity="danger" @click="deleteDosen" />
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
:deep(.p-dialog-footer) {
    padding: 0 1.5rem 1.5rem 1.5rem;
}
</style>