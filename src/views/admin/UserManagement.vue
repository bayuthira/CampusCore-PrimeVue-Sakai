<script setup>
import { useRoleStore } from '@/stores/role';
import { useUserStore } from '@/stores/user';
import { FilterMatchMode } from '@primevue/core/api';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import autoTable from 'jspdf-autotable';
import { storeToRefs } from 'pinia';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';
import { exportToCsv } from '@/utils/exportCsv';

// --- Setup Store dan State ---
const toast = useToast();
const userStore = useUserStore();
const roleStore = useRoleStore();
const { roleList } = storeToRefs(roleStore);
const { userList, isLoading } = storeToRefs(userStore);

// State untuk Dialogs
const userDialog = ref(false);
const deleteUserDialog = ref(false);
const resetPasswordDialog = ref(false);
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    roles: { value: null, matchMode: FilterMatchMode.CONTAINS },
    is_active: { value: null, matchMode: FilterMatchMode.EQUALS }
});

const statuses = ref([
    { label: 'Aktif', value: true },
    { label: 'TIDAK', value: false }
]);

// Model untuk tombol SplitButton Export
const exportItems = ref([
    { label: 'CSV', icon: 'pi pi-file', command: () => dt.value.exportCSV() },
    { label: 'CSV', icon: 'pi pi-file-excel', command: exportExcel },
    { label: 'PDF', icon: 'pi pi-file-pdf', command: exportPDF }
]);

const user = ref({});
const submitted = ref(false);
const newPassword = ref('');

// State untuk Search
const dt = ref();

onMounted(() => {
    userStore.fetchUsers();
    roleStore.fetchRoles();
});

const filterStatus = (value, filter) => {
    // 'value' adalah data dari baris (true atau false)
    // 'filter' adalah data dari dropdown (true, false, atau null)
    if (filter === null || filter === undefined) {
        return true; // Jangan filter jika dropdown kosong
    }
    return value === filter;
};

function exportExcel() {
    const data = userList.value.map((user) => ({
        Username: user.username,
        'Nama Lengkap': user.full_name,
        Email: user.email,
        Roles: user.roles.join(', '),
        Status: user.is_active ? 'Aktif' : 'Non-Aktif'
    }));
    exportToCsv(data, 'data-pengguna.csv');
}

function exportPDF() {
    const doc = new jsPDF();
    const tableHead = [['Username', 'Nama Lengkap', 'Email', 'Roles', 'Status']];
    const tableBody = userList.value.map((item) => [item.username, item.full_name, item.email || '-', item.roles.join(', '), item.is_active ? 'Aktif' : 'Non-Aktif']);
    autoTable(doc, {
        head: tableHead,
        body: tableBody
    });
    doc.save('data-pengguna.pdf');
}

// Fungsi kustom untuk filter kolom 'Roles'
const filterRole = (value, filter) => {
    if (filter === null || filter === undefined) {
        return true;
    }
    if (value === null || value === undefined) {
        return false;
    }
    // value adalah array roles user, misal ["DOSEN", "KAPRODI"]
    // filter adalah string role yang dipilih, misal "DOSEN"
    return value.includes(filter);
};
// --- Fungsi-fungsi ---
const isNewUser = computed(() => !user.value.id);

function openNew() {
    user.value = { is_active: true, role_ids: [] };
    submitted.value = false;
    userDialog.value = true;
}

function openEdit(userData) {
    // Ambil nama role dari user yang dipilih (contoh: ["DOSEN", "KAPRODI"])
    const userRoleNames = userData.roles;

    // "Terjemahkan" nama-nama role tersebut menjadi ID-nya
    // dengan mencocokkannya ke daftar semua role yang kita punya (roleList)
    const roleIds = roleList.value.filter((role) => userRoleNames.includes(role.name)).map((role) => role.id);

    // Siapkan data untuk form, sekarang dengan role_ids yang benar
    user.value = { ...userData, role_ids: roleIds };

    submitted.value = false;
    userDialog.value = true;
}
function openResetPassword(userData) {
    user.value = { ...userData };
    newPassword.value = '';
    resetPasswordDialog.value = true;
}

function openConfirmDelete(userData) {
    user.value = userData;
    deleteUserDialog.value = true;
}

function hideDialogs() {
    userDialog.value = false;
    deleteUserDialog.value = false;
    resetPasswordDialog.value = false;
    submitted.value = false;
}

async function saveUser() {
    submitted.value = true;

    // Validasi untuk user baru
    if (isNewUser.value && (!user.value.username?.trim() || !user.value.full_name?.trim() || !user.value.password?.trim() || !user.value.role_ids?.length)) {
        toast.add({ severity: 'warn', summary: 'Perhatian', detail: 'Username, Nama, Password, dan Role wajib diisi', life: 3000 });
        return;
    }
    // Validasi untuk user lama
    if (!isNewUser.value && !user.value.full_name?.trim()) {
        toast.add({ severity: 'warn', summary: 'Perhatian', detail: 'Nama Lengkap wajib diisi', life: 3000 });
        return;
    }

    try {
        if (isNewUser.value) {
            // CREATE USER
            // Langsung kirim user.value karena sudah berisi role_ids yang benar
            await userStore.createUser(user.value);
            toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Pengguna Baru Dibuat', life: 3000 });
        } else {
            // UPDATE USER
            const payload = {
                full_name: user.value.full_name,
                email: user.value.email,
                is_active: user.value.is_active,
                role_ids: user.value.role_ids // <-- PERBAIKAN UTAMA: Selalu kirim daftar role_ids terbaru
            };
            await userStore.updateUser(user.value.id, payload);
            toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Data Pengguna Diperbarui', life: 3000 });
        }
        hideDialogs();
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

async function saveNewPassword() {
    if (!newPassword.value) {
        toast.add({ severity: 'warn', summary: 'Perhatian', detail: 'Password baru tidak boleh kosong', life: 3000 });
        return;
    }
    try {
        await userStore.resetPassword(user.value.id, newPassword.value);
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Password telah direset', life: 3000 });
        hideDialogs();
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal mereset password', life: 3000 });
    }
}

async function deleteUser() {
    try {
        await userStore.deleteUser(user.value.id);
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Pengguna telah dihapus', life: 3000 });
        hideDialogs();
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal menghapus pengguna', life: 3000 });
    }
}
</script>

<template>
    <div>
        <div class="card">
            <Toolbar class="mb-6">
                <template #start>
                    <Button label="Tambah User" icon="pi pi-plus" severity="secondary" class="mr-2" @click="openNew" />
                </template>
                <template #end>
                    <SplitButton label="Export" icon="pi pi-upload" :model="exportItems" severity="secondary"></SplitButton>
                </template>
            </Toolbar>

            <DataTable
                export-filename="data-pengguna"
                :global-filter-fields="['username', 'full_name', 'email', 'roles', 'status_label']"
                ref="dt"
                :value="userList"
                :loading="isLoading"
                dataKey="id"
                :paginator="true"
                :rows="10"
                :filters="filters"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                :rowsPerPageOptions="[5, 10, 25]"
                currentPageReportTemplate="Menampilkan {first} sampai {last} dari {totalRecords} pengguna"
            >
                <template #header>
                    <div class="flex flex-wrap gap-2 items-center justify-between">
                        <h4 class="m-0">Manajemen Pengguna</h4>
                        <IconField>
                            <InputIcon> <i class="pi pi-search" /> </InputIcon>
                            <InputText v-model="filters['global'].value" placeholder="Cari..." />
                        </IconField>
                    </div>
                </template>

                <Column field="username" header="Username" sortable></Column>
                <Column field="full_name" header="Nama Lengkap" sortable></Column>
                <Column field="email" header="Email" sortable></Column>
                <Column field="roles" header="Roles" :showFilterMatchModes="false" style="min-width: 16rem" :filter-function="filterRole">
                    <template #body="slotProps">
                        <div class="flex flex-wrap gap-2">
                            <Chip v-for="role in slotProps.data.roles" :key="role" :label="role" />
                        </div>
                    </template>
                    <template #filter="{ filterModel }">
                        <Dropdown v-model="filterModel.value" :options="roleList" optionLabel="name" optionValue="name" placeholder="Pilih Role" class="p-column-filter" showClear />
                    </template>
                </Column>
                <Column field="is_active" header="Aktif" :showFilterMatchModes="false" style="min-width: 10rem" :filter-function="filterStatus">
                    <template #body="slotProps">
                        <Tag :value="slotProps.data.is_active ? 'AKTIF' : 'TIDAK'" :severity="slotProps.data.is_active ? 'success' : 'danger'" />
                    </template>
                    <template #filter="{ filterModel }">
                        <Dropdown v-model="filterModel.value" :options="statuses" optionLabel="label" optionValue="value" placeholder="Pilih Status" class="p-column-filter" showClear />
                    </template>
                </Column>
                <Column :exportable="false" style="min-width: 12rem" header="Aksi">
                    <template #body="slotProps">
                        <Button icon="pi pi-pencil" outlined rounded class="mr-2" @click="openEdit(slotProps.data)" v-tooltip.top="'Edit User'" />
                        <Button icon="pi pi-key" outlined rounded severity="secondary" class="mr-2" @click="openResetPassword(slotProps.data)" v-tooltip.top="'Reset Password'" />
                        <Button icon="pi pi-trash" outlined rounded severity="danger" @click="openConfirmDelete(slotProps.data)" v-tooltip.top="'Hapus User'" />
                    </template>
                </Column>
            </DataTable>
        </div>

        <Dialog v-model:visible="userDialog" :style="{ width: '450px' }" :header="isNewUser ? 'Tambah Pengguna Baru' : 'Edit Pengguna'" :modal="true">
            <div class="flex flex-col gap-6">
                <div>
                    <label for="username" class="block font-bold mb-3">Username</label>
                    <InputText id="username" v-model.trim="user.username" required :disabled="!isNewUser" :invalid="submitted && !user.username" fluid />
                </div>
                <div>
                    <label for="full_name" class="block font-bold mb-3">Nama Lengkap</label>
                    <InputText id="full_name" v-model.trim="user.full_name" required :invalid="submitted && !user.full_name" fluid />
                </div>
                <div>
                    <label for="email" class="block font-bold mb-3">Email</label>
                    <InputText id="email" v-model.trim="user.email" fluid />
                </div>
                <div v-if="isNewUser">
                    <label for="password" class="block font-bold mb-3">Password</label>
                    <Password id="password" v-model="user.password" required :invalid="submitted && !user.password" :feedback="false" toggleMask fluid />
                </div>
                <div>
                    <label for="roles" class="block font-bold mb-3">Roles</label>
                    <MultiSelect id="roles" v-model="user.role_ids" :options="roleList" optionLabel="name" optionValue="id" placeholder="Pilih Role" class="w-full" />
                </div>
                <div v-if="!isNewUser">
                    <label for="status" class="block font-bold mb-3">Status</label>
                    <div class="flex items-center">
                        <InputSwitch v-model="user.is_active" />
                        <span class="ml-2">{{ user.is_active ? 'Aktif' : 'Non-Aktif' }}</span>
                    </div>
                </div>
            </div>
            <template #footer>
                <Button label="Batal" icon="pi pi-times" text @click="hideDialogs" />
                <Button label="Simpan" icon="pi pi-check" @click="saveUser" />
            </template>
        </Dialog>

        <Dialog v-model:visible="resetPasswordDialog" :style="{ width: '450px' }" :header="`Reset Password untuk ${user.full_name}`" :modal="true">
            <div class="field">
                <label for="new_password" class="block font-bold mb-3">Password Baru</label>
                <Password id="new_password" v-model="newPassword" :feedback="false" toggleMask fluid />
            </div>
            <template #footer>
                <Button label="Batal" icon="pi pi-times" text @click="hideDialogs" />
                <Button label="Simpan Password" icon="pi pi-check" @click="saveNewPassword" />
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteUserDialog" :style="{ width: '450px' }" header="Konfirmasi" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl" />
                <span v-if="user"
                    >Apakah Anda yakin ingin menghapus <b>{{ user.full_name }}</b
                    >?</span
                >
            </div>
            <template #footer>
                <Button label="Tidak" icon="pi pi-times" text @click="hideDialogs" />
                <Button label="Ya" icon="pi pi-check" @click="deleteUser" />
            </template>
        </Dialog>
    </div>
</template>
