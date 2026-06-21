<script setup>
import { useAuthStore } from '@/stores/auth';
import { computed } from 'vue';

const authStore = useAuthStore();
const userName = computed(() => authStore.userData?.full_name || 'Pengguna');

const modules = [
    {
        title: 'Akademik',
        description: 'Kelola mahasiswa, dosen, mata kuliah, kurikulum, jadwal, KRS, dan RPS.',
        icon: 'pi-graduation-cap',
        backgroundClass: 'bg-blue-100 dark:bg-blue-400/10',
        iconClass: 'text-blue-500'
    },
    {
        title: 'Sumber Daya Manusia',
        description: 'Kelola pegawai, unit kerja, cuti, izin, absensi, dan surat tugas.',
        icon: 'pi-users',
        backgroundClass: 'bg-green-100 dark:bg-green-400/10',
        iconClass: 'text-green-500'
    },
    {
        title: 'Aset dan Fasilitas',
        description: 'Pantau aset, barang habis pakai, ruangan, kendaraan, dan jadwal penggunaan.',
        icon: 'pi-building',
        backgroundClass: 'bg-orange-100 dark:bg-orange-400/10',
        iconClass: 'text-orange-500'
    },
    {
        title: 'Administrasi',
        description: 'Atur pengguna, role, dokumen, dan hak akses sistem.',
        icon: 'pi-shield',
        backgroundClass: 'bg-purple-100 dark:bg-purple-400/10',
        iconClass: 'text-purple-500'
    }
];
</script>

<template>
    <div class="grid grid-cols-12 gap-8">
        <div class="col-span-12">
            <div class="card mb-0">
                <span class="block text-muted-color font-medium mb-2">Selamat datang</span>
                <h1 class="text-surface-900 dark:text-surface-0 text-2xl font-semibold m-0">{{ userName }}</h1>
                <p class="text-muted-color mb-0 mt-3">Gunakan menu navigasi untuk membuka modul yang tersedia sesuai hak akses Anda.</p>
            </div>
        </div>

        <div v-for="module in modules" :key="module.title" class="col-span-12 md:col-span-6 xl:col-span-3">
            <div class="card h-full mb-0">
                <div :class="['flex items-center justify-center rounded-border mb-4', module.backgroundClass]" style="width: 3rem; height: 3rem">
                    <i :class="['pi', module.icon, module.iconClass, '!text-xl']"></i>
                </div>
                <h2 class="text-surface-900 dark:text-surface-0 text-lg font-semibold mt-0 mb-2">{{ module.title }}</h2>
                <p class="text-muted-color leading-normal m-0">{{ module.description }}</p>
            </div>
        </div>
    </div>
</template>
