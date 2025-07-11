<script setup>
import { useDosenStore } from '@/stores/dosen';
import { useProdiStore } from '@/stores/prodi';
import { FilterMatchMode } from '@primevue/core/api'; // <-- DITAMBAHKAN
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { storeToRefs } from 'pinia';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';
import * as XLSX from 'xlsx';

// --- Setup Store dan State ---
const toast = useToast();
const dosenStore = useDosenStore();
const prodiStore = useProdiStore();

const { dosenList, isLoading } = storeToRefs(dosenStore);
const { prodiList } = storeToRefs(prodiStore);

const dosenDialog = ref(false);
const deleteDosenDialog = ref(false);
const dosen = ref({});
const submitted = ref(false);

// --- DITAMBAHKAN: State untuk Search dan Export ---
const dt = ref();
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

onMounted(() => {
    dosenStore.fetchDosen();
    prodiStore.fetchProdi();
});

// --- DITAMBAHKAN: Fungsi untuk Export ---
function exportCSV() {
    dt.value.exportCSV();
}

// --- DITAMBAHKAN: Fungsi untuk Export Excel ---
function exportExcel() {
    const data = dosenList.value;
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Dosen');
    XLSX.writeFile(workbook, 'data-dosen.xlsx');
}

// --- DITAMBAHKAN: Fungsi untuk Export PDF ---
function exportPDF() {
    const doc = new jsPDF();
    const tableHead = [['NIDN', 'Nama Dosen', 'Email', 'Program Studi']];
    const tableBody = dosenList.value.map((item) => [item.nidn, item.nama_dosen, item.email || '-', item.nama_prodi]);

    autoTable(doc, {
        head: tableHead,
        body: tableBody
    });

    doc.save('data-dosen.pdf');
}

const exportItems = ref([
    {
        label: 'CSV',
        icon: 'pi pi-file',
        command: () => {
            exportCSV();
        }
    },
    {
        label: 'Excel',
        icon: 'pi pi-file-excel',
        command: () => {
            exportExcel();
        }
    },
    {
        label: 'PDF',
        icon: 'pi pi-file-pdf',
        command: () => {
            exportPDF();
        }
    }
]);

// --- Fungsi-fungsi CRUD ---

function openNew() {
    dosen.value = {};
    submitted.value = false;
    dosenDialog.value = true;
}

function hideDialog() {
    dosenDialog.value = false;
    submitted.value = false;
}

async function saveDosen() {
    submitted.value = true;

    if (!dosen.value.nama_dosen?.trim() || !dosen.value.nidn?.trim() || !dosen.value.prodi_id || (!dosen.value.id && !dosen.value.password)) {
        return;
    }

    try {
        if (dosen.value.id) {
            const payload = {
                nidn: dosen.value.nidn,
                nama_dosen: dosen.value.nama_dosen,
                prodi_id: dosen.value.prodi_id.id || dosen.value.prodi_id,
                email: dosen.value.email
            };
            await dosenStore.updateDosen(dosen.value.id, payload);
            toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Data Dosen Diperbarui', life: 3000 });
        } else {
            const payload = {
                nidn: dosen.value.nidn,
                nama_dosen: dosen.value.nama_dosen,
                prodi_id: dosen.value.prodi_id.id || dosen.value.prodi_id,
                email: dosen.value.email,
                password: dosen.value.password
            };
            await dosenStore.createDosen(payload);
            toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Dosen Baru Dibuat', life: 3000 });
        }
        dosenDialog.value = false;
        dosen.value = {};
    } catch (error) {
        // --- PERBAIKAN DI SINI ---
        // Ambil pesan error spesifik dari backend, jika tidak ada, gunakan pesan default.
        const errorMessage = error.response?.data?.error || 'Terjadi kesalahan saat menyimpan';

        toast.add({
            severity: 'error',
            summary: 'Gagal',
            detail: errorMessage, // Gunakan pesan dari backend
            life: 4000 // Durasi sedikit lebih lama agar bisa dibaca
        });
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
        dosen.value = {};
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Data Dosen Dihapus', life: 3000 });
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Terjadi kesalahan saat menghapus', life: 3000 });
    }
}
</script>

<template>
    <div>
        <div class="card">
            <Toolbar class="mb-6">
                <template #start>
                    <Button label="Tambah Dosen" icon="pi pi-plus" severity="secondary" class="mr-2" @click="openNew" />
                </template>
                <template #end>
                    <SplitButton label="Export" icon="pi pi-upload" :model="exportItems" severity="secondary"></SplitButton>
                </template>
            </Toolbar>

            <DataTable
                ref="dt"
                :value="dosenList"
                :loading="isLoading"
                dataKey="id"
                :paginator="true"
                :rows="10"
                :filters="filters"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                :rowsPerPageOptions="[5, 10, 25]"
                currentPageReportTemplate="Menampilkan {first} sampai {last} dari {totalRecords} dosen"
            >
                <template #header>
                    <div class="flex flex-wrap gap-2 items-center justify-between">
                        <h4 class="m-0">Manajemen Dosen</h4>
                        <IconField>
                            <InputIcon>
                                <i class="pi pi-search" />
                            </InputIcon>
                            <InputText v-model="filters['global'].value" placeholder="Cari..." />
                        </IconField>
                    </div>
                </template>

                <Column field="nidn" header="NIDN" sortable style="min-width: 12rem"></Column>
                <Column field="nama_dosen" header="Nama Dosen" sortable style="min-width: 16rem"></Column>
                <Column field="email" header="Email" sortable style="min-width: 16rem"></Column>
                <Column field="nama_prodi" header="Program Studi" sortable style="min-width: 16rem"></Column>
                <Column :exportable="false" style="min-width: 12rem" header="Aksi">
                    <template #body="slotProps">
                        <Button icon="pi pi-pencil" outlined rounded class="mr-2" @click="editDosen(slotProps.data)" />
                        <Button icon="pi pi-trash" outlined rounded severity="danger" @click="confirmDeleteDosen(slotProps.data)" />
                    </template>
                </Column>
            </DataTable>
        </div>

        <Dialog v-model:visible="dosenDialog" :style="{ width: '450px' }" header="Detail Dosen" :modal="true">
            <div class="flex flex-col gap-6">
                <div>
                    <label for="nidn" class="block font-bold mb-3">NIDN</label>
                    <InputText id="nidn" v-model.trim="dosen.nidn" required="true" autofocus :invalid="submitted && !dosen.nidn" fluid />
                    <small v-if="submitted && !dosen.nidn" class="text-red-500">NIDN harus diisi.</small>
                </div>
                <div>
                    <label for="nama_dosen" class="block font-bold mb-3">Nama Dosen</label>
                    <InputText id="nama_dosen" v-model.trim="dosen.nama_dosen" required="true" :invalid="submitted && !dosen.nama_dosen" fluid />
                    <small v-if="submitted && !dosen.nama_dosen" class="text-red-500">Nama Dosen harus diisi.</small>
                </div>
                <div>
                    <label for="email" class="block font-bold mb-3">Email</label>
                    <InputText id="email" v-model.trim="dosen.email" fluid />
                </div>
                <div>
                    <label for="prodi_id" class="block font-bold mb-3">Program Studi</label>
                    <Dropdown id="prodi_id" v-model="dosen.prodi_id" :options="prodiList" optionLabel="nama_prodi" optionValue="id" placeholder="Pilih Program Studi" :invalid="submitted && !dosen.prodi_id" fluid />
                    <small v-if="submitted && !dosen.prodi_id" class="text-red-500">Program Studi harus dipilih.</small>
                </div>
                <div v-if="!dosen.id">
                    <label for="password" class="block font-bold mb-3">Password</label>
                    <Password id="password" v-model="dosen.password" required="true" :invalid="submitted && !dosen.password" :feedback="false" toggleMask fluid />
                    <small v-if="submitted && !dosen.password" class="text-red-500">Password harus diisi saat membuat dosen baru.</small>
                </div>
            </div>
            <template #footer>
                <Button label="Batal" icon="pi pi-times" text @click="hideDialog" />
                <Button label="Simpan" icon="pi pi-check" @click="saveDosen" />
            </template>
        </Dialog>
        <Dialog v-model:visible="deleteDosenDialog" :style="{ width: '450px' }" header="Confirm" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl" />
                <span v-if="dosen"
                    >Apakah Anda yakin ingin menghapus <b>{{ dosen.nama_dosen }}</b
                    >?</span
                >
            </div>
            <template #footer>
                <Button label="Tidak" icon="pi pi-times" text @click="deleteDosenDialog = false" />
                <Button label="Ya" icon="pi pi-check" @click="deleteDosen" />
            </template>
        </Dialog>
    </div>
</template>
