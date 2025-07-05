<script setup>
import { useMahasiswaStore } from '@/stores/mahasiswa';
import { useProdiStore } from '@/stores/prodi';
import { FilterMatchMode } from '@primevue/core/api'; // <-- 1. TAMBAHKAN IMPORT INI
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { storeToRefs } from 'pinia';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';
import * as XLSX from 'xlsx';

// --- Setup Store dan State ---
const toast = useToast();
const mahasiswaStore = useMahasiswaStore();
const prodiStore = useProdiStore();
const dt = ref();
const fileInput = ref(null);
const importResultDialog = ref(false);
const importResult = ref(null);

const { mahasiswaList, isLoading } = storeToRefs(mahasiswaStore);
const { prodiList } = storeToRefs(prodiStore);

const mahasiswaDialog = ref(false);
const deleteMahasiswaDialog = ref(false);
const mahasiswa = ref({});
const submitted = ref(false);

// --- 2. TAMBAHKAN REF UNTUK FILTERS ---
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

onMounted(() => {
    mahasiswaStore.fetchMahasiswa();
    prodiStore.fetchProdi();
});

// --- Fungsi-fungsi CRUD (tidak ada perubahan) ---

function openNew() {
    mahasiswa.value = {};
    submitted.value = false;
    mahasiswaDialog.value = true;
}

function hideDialog() {
    mahasiswaDialog.value = false;
    submitted.value = false;
}

async function saveMahasiswa() {
    submitted.value = true;
    if (!mahasiswa.value.nama_mahasiswa?.trim() || !mahasiswa.value.nim?.trim() || !mahasiswa.value.prodi_id || !mahasiswa.value.angkatan || (!mahasiswa.value.id && !mahasiswa.value.password)) {
        return;
    }

    try {
        if (mahasiswa.value.id) {
            // Mode Update
            const payload = {
                nim: mahasiswa.value.nim,
                nama_mahasiswa: mahasiswa.value.nama_mahasiswa,
                prodi_id: mahasiswa.value.prodi_id.id || mahasiswa.value.prodi_id,
                angkatan: mahasiswa.value.angkatan,
                email: mahasiswa.value.email
            };
            await mahasiswaStore.updateMahasiswa(mahasiswa.value.id, payload);
            toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Data Mahasiswa Diperbarui', life: 3000 });
        } else {
            // Mode Create
            const payload = {
                nim: mahasiswa.value.nim,
                nama_mahasiswa: mahasiswa.value.nama_mahasiswa,
                prodi_id: mahasiswa.value.prodi_id.id || mahasiswa.value.prodi_id,
                angkatan: mahasiswa.value.angkatan,
                email: mahasiswa.value.email,
                password: mahasiswa.value.password
            };
            await mahasiswaStore.createMahasiswa(payload);
            toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Mahasiswa Baru Dibuat', life: 3000 });
        }
        mahasiswaDialog.value = false;
        mahasiswa.value = {};
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Terjadi kesalahan saat menyimpan', life: 3000 });
    }
}

function editMahasiswa(data) {
    mahasiswa.value = { ...data };
    mahasiswaDialog.value = true;
}

function confirmDeleteMahasiswa(data) {
    mahasiswa.value = data;
    deleteMahasiswaDialog.value = true;
}

async function deleteMahasiswa() {
    try {
        await mahasiswaStore.deleteMahasiswa(mahasiswa.value.id);
        deleteMahasiswaDialog.value = false;
        mahasiswa.value = {};
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Data Mahasiswa Dihapus', life: 3000 });
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Terjadi kesalahan saat menghapus', life: 3000 });
    }
}

function exportCSV() {
    dt.value.exportCSV();
}

// --- DITAMBAHKAN: Fungsi untuk Export Excel ---
function exportExcel() {
    const data = mahasiswaList.value; // Ambil data dari store
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Mahasiswa');
    XLSX.writeFile(workbook, 'data-mahasiswa.xlsx');
}

// --- DITAMBAHKAN: Fungsi untuk Export PDF ---
function exportPDF() {
    const doc = new jsPDF();
    const tableHead = [['NIM', 'Nama Mahasiswa', 'Angkatan', 'Program Studi', 'Email']];
    const tableBody = mahasiswaList.value.map((item) => [item.nim, item.nama_mahasiswa, item.angkatan, item.nama_prodi, item.email || '-']);

    // Panggil autoTable sebagai fungsi, bukan method dari doc
    autoTable(doc, {
        head: tableHead,
        body: tableBody
    });

    doc.save('data-mahasiswa.pdf');
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

function triggerFileInput() {
    // Fungsi ini untuk memicu klik pada input file yang tersembunyi
    fileInput.value.click();
}

async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
        const result = await mahasiswaStore.importFromCSV(formData);
        importResult.value = result; // Simpan objek hasil sukses
        importResultDialog.value = true;
    } catch (error) {
        // Backend mengirim data error dalam format JSON yang sama
        importResult.value = error.response?.data || { status: 'ERROR', detail_error: [error.message] };
        importResultDialog.value = true;
    }

    event.target.value = '';
}
</script>

<template>
    <div>
        <div class="card">
            <Toolbar class="mb-6">
                <template #start>
                    <Button label="Tambah Mahasiswa" icon="pi pi-plus" severity="secondary" class="mr-2" @click="openNew" />

                    <Button label="Import" icon="pi pi-download" severity="secondary" class="mr-2" @click="triggerFileInput" />
                    <input type="file" ref="fileInput" @change="handleFileUpload" style="display: none" accept=".csv" />
                </template>

                <template #end>
                    <SplitButton label="Export" icon="pi pi-upload" :model="exportItems" severity="secondary"></SplitButton>
                </template>
            </Toolbar>

            <DataTable
                ref="dt"
                export-filename="data-mahasiswa"
                :value="mahasiswaList"
                :loading="isLoading"
                dataKey="id"
                :paginator="true"
                :rows="10"
                :filters="filters"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                :rowsPerPageOptions="[5, 10, 25]"
                currentPageReportTemplate="Menampilkan {first} sampai {last} dari {totalRecords} mahasiswa"
            >
                <template #header>
                    <div class="flex flex-wrap gap-2 items-center justify-between">
                        <h4 class="m-0">Manajemen Mahasiswa</h4>
                        <IconField>
                            <InputIcon>
                                <i class="pi pi-search" />
                            </InputIcon>
                            <InputText v-model="filters['global'].value" placeholder="Cari..." />
                        </IconField>
                    </div>
                </template>

                <Column field="nim" header="NIM" sortable style="min-width: 12rem"></Column>
                <Column field="nama_mahasiswa" header="Nama Mahasiswa" sortable style="min-width: 16rem"></Column>
                <Column field="angkatan" header="Angkatan" sortable style="min-width: 8rem"></Column>
                <Column field="nama_prodi" header="Program Studi" sortable style="min-width: 16rem"></Column>
                <Column :exportable="false" style="min-width: 12rem" header="Aksi">
                    <template #body="slotProps">
                        <Button icon="pi pi-pencil" outlined rounded class="mr-2" @click="editMahasiswa(slotProps.data)" />
                        <Button icon="pi pi-trash" outlined rounded severity="danger" @click="confirmDeleteMahasiswa(slotProps.data)" />
                    </template>
                </Column>
            </DataTable>
        </div>

        <Dialog v-model:visible="mahasiswaDialog" :style="{ width: '450px' }" header="Detail Mahasiswa" :modal="true">
            <div class="flex flex-col gap-6">
                <div>
                    <label for="nim" class="block font-bold mb-3">NIM</label>
                    <InputText id="nim" v-model.trim="mahasiswa.nim" required="true" autofocus :invalid="submitted && !mahasiswa.nim" fluid />
                    <small v-if="submitted && !mahasiswa.nim" class="text-red-500">NIM harus diisi.</small>
                </div>
                <div>
                    <label for="nama_mahasiswa" class="block font-bold mb-3">Nama Mahasiswa</label>
                    <InputText id="nama_mahasiswa" v-model.trim="mahasiswa.nama_mahasiswa" required="true" :invalid="submitted && !mahasiswa.nama_mahasiswa" fluid />
                    <small v-if="submitted && !mahasiswa.nama_mahasiswa" class="text-red-500">Nama Mahasiswa harus diisi.</small>
                </div>
                <div>
                    <label for="email" class="block font-bold mb-3">Email</label>
                    <InputText id="email" v-model.trim="mahasiswa.email" fluid />
                </div>
                <div>
                    <label for="angkatan" class="block font-bold mb-3">Angkatan</label>
                    <InputNumber id="angkatan" v-model="mahasiswa.angkatan" required="true" :invalid="submitted && !mahasiswa.angkatan" :useGrouping="false" />
                    <small v-if="submitted && !mahasiswa.angkatan" class="text-red-500">Angkatan harus diisi.</small>
                </div>
                <div>
                    <label for="prodi_id" class="block font-bold mb-3">Program Studi</label>
                    <Dropdown id="prodi_id" v-model="mahasiswa.prodi_id" :options="prodiList" optionLabel="nama_prodi" optionValue="id" placeholder="Pilih Program Studi" :invalid="submitted && !mahasiswa.prodi_id" fluid />
                    <small v-if="submitted && !mahasiswa.prodi_id" class="text-red-500">Program Studi harus dipilih.</small>
                </div>
                <div v-if="!mahasiswa.id">
                    <label for="password" class="block font-bold mb-3">Password</label>
                    <Password id="password" v-model="mahasiswa.password" required="true" :invalid="submitted && !mahasiswa.password" :feedback="false" toggleMask fluid />
                    <small v-if="submitted && !mahasiswa.password" class="text-red-500">Password harus diisi saat membuat data baru.</small>
                </div>
            </div>
            <template #footer>
                <Button label="Batal" icon="pi pi-times" text @click="hideDialog" />
                <Button label="Simpan" icon="pi pi-check" @click="saveMahasiswa" />
            </template>
        </Dialog>
        <Dialog v-model:visible="deleteMahasiswaDialog" :style="{ width: '450px' }" header="Confirm" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl" />
                <span v-if="mahasiswa"
                    >Apakah Anda yakin ingin menghapus <b>{{ mahasiswa.nama_mahasiswa }}</b
                    >?</span
                >
            </div>
            <template #footer>
                <Button label="Tidak" icon="pi pi-times" text @click="deleteMahasiswaDialog = false" />
                <Button label="Ya" icon="pi pi-check" @click="deleteMahasiswa" />
            </template>
        </Dialog>
        <Dialog v-model:visible="importResultDialog" :style="{ width: '500px' }" header="Hasil Impor CSV" :modal="true">
            <p></p>
            <div v-if="importResult">
                <Message v-if="importResult.status === 'SUKSES'" severity="success" :closable="false"> Impor Berhasil </Message>
                <Message v-else severity="error" :closable="false">
                    {{ importResult.status }}
                </Message>

                <div class="mt-4 text-lg">
                    <p>
                        <i class="pi pi-file-import mr-2"></i>
                        <strong>Total Baris Dipindai:</strong> {{ importResult.total_baris_dipindai }}
                    </p>
                    <p>
                        <i class="pi pi-check-circle mr-2 text-green-500"></i>
                        <strong>Baris Berhasil Disimpan:</strong> {{ importResult.baris_berhasil_disimpan }}
                    </p>
                </div>

                <div v-if="importResult.detail_error && importResult.detail_error.length > 0" class="mt-4">
                    <strong class="block mb-2">Detail Kesalahan:</strong>
                    <ul class="list-disc pl-5 m-0 bg-red-50 border border-red-200 text-red-700 p-3 rounded-md">
                        <li v-for="(err, index) in importResult.detail_error" :key="index">
                            {{ err }}
                        </li>
                    </ul>
                </div>
            </div>
            <template #footer>
                <Button label="OK" icon="pi pi-check" @click="importResultDialog = false" autofocus />
            </template>
        </Dialog>
    </div>
</template>
