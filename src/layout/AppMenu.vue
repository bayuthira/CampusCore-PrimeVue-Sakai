<script setup>
import { useAuthStore } from '@/stores/auth';
import { computed, ref } from 'vue';
import AppMenuItem from './AppMenuItem.vue';

const authStore = useAuthStore();
const userName = computed(() => authStore.userData?.full_name || 'User');

const model = ref([
    {
        // Ini adalah item untuk menampilkan info user
        // Tidak punya 'to' jadi tidak bisa diklik
        label: userName, // Labelnya kita ambil dari computed property
        icon: 'pi pi-fw pi-user',
        class: 'user-info-menu' // Kita beri class khusus untuk styling
    },
    {
        label: 'Home',
        items: [{ label: 'Dashboard', icon: 'pi pi-fw pi-home', to: '/' }]
    },
    {
        label: 'Master Data',
        items: [
            { label: 'Program Studi', icon: 'pi pi-fw pi-book', to: '/prodi' },
            { label: 'Dosen', icon: 'pi pi-fw pi-users', to: '/dosen' },
            { label: 'Mahasiswa', icon: 'pi pi-fw pi-user-edit', to: '/mahasiswa' }
            // { label: 'Mata Kuliah', icon: 'pi pi-fw pi-th-large', to: '/matakuliah' }
        ]
    }
    // Tambahkan menu lain di sini nanti
]);
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
