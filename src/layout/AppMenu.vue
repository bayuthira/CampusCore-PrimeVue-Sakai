<script setup>
import { useAuthStore } from '@/stores/auth';
import { computed } from 'vue';
import AppMenuItem from './AppMenuItem.vue';

const authStore = useAuthStore();

// --- DIKEMBALIKAN: Computed property untuk nama user ---
const userName = computed(() => authStore.userData?.full_name || 'User');

// Definisikan semua kemungkinan menu beserta role yang dibutuhkan
const fullMenu = [
    // --- DIKEMBALIKAN: Item menu untuk info user ---
    {
        label: userName,
        icon: 'pi pi-fw pi-user',
        class: 'user-info-menu' // Class ini agar tidak bisa diklik
    },
    {
        label: 'Home',
        items: [{ label: 'Dashboard', icon: 'pi pi-fw pi-home', to: '/' }]
    },
    {
        label: 'Master Data',
        roles: ['SUPER_ADMIN', 'STAF_AKADEMIK', 'KAPRODI'],
        items: [
            { label: 'Program Studi', icon: 'pi pi-fw pi-book', to: '/prodi', roles: ['SUPER_ADMIN'] },
            { label: 'Dosen', icon: 'pi pi-fw pi-users', to: '/dosen', roles: ['SUPER_ADMIN', 'STAF_AKADEMIK'] },
            { label: 'Mahasiswa', icon: 'pi pi-fw pi-user-edit', to: '/mahasiswa', roles: ['SUPER_ADMIN', 'STAF_AKADEMIK'] },
            { label: 'Mata Kuliah', icon: 'pi pi-fw pi-th-large', to: '/matakuliah', roles: ['SUPER_ADMIN', 'KAPRODI'] }
        ]
    },
    {
        label: 'Aset & Fasilitas', // Nama kategori bisa disesuaikan
        roles: ['SUPER_ADMIN', 'STAF_BAUM'],
        items: [
            { label: 'Manajemen Ruangan', icon: 'pi pi-fw pi-building', to: '/aset/ruangan', roles: ['SUPER_ADMIN', 'STAF_BAUM'] },
            { label: 'Manajemen Jenis Aset', icon: 'pi pi-fw pi-tags', to: '/aset/jenis', roles: ['SUPER_ADMIN', 'STAF_BAUM'] },
            { label: 'Manajemen Aset', icon: 'pi pi-fw pi-box', to: '/aset/item', roles: ['SUPER_ADMIN', 'STAF_BAUM'] },
            { label: 'Manajemen Aset Habis Pakai', icon: 'pi pi-fw pi-box', to: '/aset/konsumsi', roles: ['SUPER_ADMIN', 'STAF_BAUM'] },
            { label: 'Jadwal Ruangan', icon: 'pi pi-fw pi-calendar-clock', to: '/fasilitas/jadwal-ruangan', roles: ['SUPER_ADMIN', 'STAF_BAUM'] },
            { label: 'Manajemen Kendaraan', icon: 'pi pi-fw pi-car', to: '/fleet/kendaraan', roles: ['SUPER_ADMIN', 'STAF_BAUM'] },
            { label: 'Jadwal Kendaraan', icon: 'pi pi-fw pi-calendar', to: '/fleet/jadwal-kendaraan' }
        ]
    },
    {
        label: 'Administrasi',
        roles: ['SUPER_ADMIN'], // Kategori menu ini hanya untuk SUPER_ADMIN
        items: [{ label: 'Manajemen User', icon: 'pi pi-fw pi-users', to: '/admin/users', roles: ['SUPER_ADMIN'] }]
    },
    {
        label: 'Perkuliahan',
        roles: ['SUPER_ADMIN', 'STAF_AKADEMIK', 'STAF_BAUM'],
        items: [
            { label: 'Jadwal Kuliah', icon: 'pi pi-fw pi-calendar', to: '/akademik/jadwal-kuliah', roles: ['SUPER_ADMIN', 'STAF_AKADEMIK', 'STAF_BAUM'] },
            { label: 'Tahun Akademik', icon: 'pi pi-fw pi-sitemap', to: '/akademik/tahun-akademik', roles: ['SUPER_ADMIN'] }
        ]
    }
];

// 'model' sekarang adalah computed property yang menyaring menu
const model = computed(() => {
    const userRoles = authStore.userData?.roles || [];

    const filterMenu = (menuItems) => {
        return menuItems
            .filter((item) => {
                if (!item.roles) {
                    return true;
                }
                const hasPermission = item.roles.some((role) => userRoles.includes(role));
                return hasPermission;
            })
            .map((item) => {
                if (item.items) {
                    return { ...item, items: filterMenu(item.items) };
                }
                return item;
            });
    };

    return filterMenu(fullMenu);
});
</script>

<template>
    <ul class="layout-menu">
        <template v-for="(item, i) in model" :key="item">
            <app-menu-item v-if="!item.separator" :item="item" :index="i"></app-menu-item>
            <li v-if="item.separator" class="menu-separator"></li>
        </template>
    </ul>
</template>

<style lang="scss" scoped></style>
