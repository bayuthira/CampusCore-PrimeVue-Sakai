import AppLayout from '@/layout/AppLayout.vue';
import { useAuthStore } from '@/stores/auth';
import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/',
            component: AppLayout,
            children: [
                {
                    path: '/',
                    name: 'dashboard',
                    component: () => import('@/views/Dashboard.vue'),
                    meta: { requiresAuth: true, title: 'Dashboard' } // Hanya butuh login, semua role boleh akses
                },
                {
                    path: '/prodi',
                    name: 'prodi',
                    component: () => import('@/views/akademik/Prodi.vue'),
                    meta: { requiresAuth: true, roles: ['SUPER_ADMIN'], title: 'Prodi' } // Hanya SUPER_ADMIN
                },
                {
                    path: '/dosen',
                    name: 'dosen',
                    component: () => import('@/views/akademik/Dosen.vue'),
                    meta: { requiresAuth: true, roles: ['SUPER_ADMIN', 'STAF_AKADEMIK'], title: 'Dosen' }
                },
                {
                    path: '/mahasiswa',
                    name: 'mahasiswa',
                    component: () => import('@/views/akademik/Mahasiswa.vue'),
                    meta: { requiresAuth: true, roles: ['SUPER_ADMIN', 'STAF_AKADEMIK'], title: 'Mahasiswa' }
                },
                {
                    path: '/matakuliah',
                    name: 'matakuliah',
                    component: () => import('@/views/akademik/MataKuliah.vue'),
                    meta: { requiresAuth: true, roles: ['SUPER_ADMIN', 'KAPRODI'], title: 'Mata Kuliah' }
                },
                {
                    path: '/admin/users',
                    name: 'user-management',
                    component: () => import('@/views/admin/UserManagement.vue'),
                    meta: { requiresAuth: true, roles: ['SUPER_ADMIN'], title: 'User' }
                },
                {
                    path: '/aset/ruangan',
                    name: 'manajemen-ruangan',
                    component: () => import('@/views/fasilitas/Ruangan.vue'),
                    meta: { requiresAuth: true, roles: ['SUPER_ADMIN', 'STAF_BAUM'], title: 'Ruangan' }
                },
                {
                    path: '/aset/jenis',
                    name: 'manajemen-jenis-aset',
                    component: () => import('@/views/aset/JenisAset.vue'),
                    meta: { requiresAuth: true, roles: ['SUPER_ADMIN', 'STAF_BAUM'], title: 'Jenis Aset' }
                },
                {
                    path: '/aset/item',
                    name: 'manajemen-aset',
                    component: () => import('@/views/aset/ManajemenAset.vue'),
                    meta: { requiresAuth: true, roles: ['SUPER_ADMIN', 'STAF_BAUM'], title: 'Aset' }
                },
                {
                    path: '/aset/konsumsi',
                    name: 'manajemen-aset-habis-pakai',
                    component: () => import('@/views/aset/AsetHabisPakai.vue'),
                    meta: { requiresAuth: true, roles: ['SUPER_ADMIN', 'STAF_BAUM'], title: 'Aset Habis Pakai' }
                },
                {
                    path: '/akademik/jadwal-kuliah',
                    name: 'jadwal-kuliah',
                    component: () => import('@/views/akademik/JadwalKuliah.vue'),
                    meta: { requiresAuth: true, roles: ['SUPER_ADMIN', 'STAF_AKADEMIK', 'STAF_BAUM'], title: 'Jadwal Kuliah' }
                },
                {
                    path: '/akademik/tahun-akademik',
                    name: 'tahun-akademik',
                    component: () => import('@/views/akademik/TahunAkademik.vue'),
                    meta: { requiresAuth: true, roles: ['SUPER_ADMIN'] }
                },
                {
                    path: '/fasilitas/jadwal-ruangan',
                    name: 'jadwal-ruangan',
                    component: () => import('@/views/fasilitas/JadwalRuangan.vue'),
                    meta: { requiresAuth: true, roles: ['SUPER_ADMIN', 'STAF_BAUM'] }
                }
            ]
        },
        {
            path: '/login',
            name: 'login',
            component: () => import('@/views/pages/auth/Login.vue'),
            meta: { title: 'Login' }
        },
        {
            path: '/access-denied',
            name: 'accessDenied',
            component: () => import('@/views/pages/auth/AccessDenied.vue'),
            meta: { title: 'Akses Ditolak' }
        },
        {
            path: '/:pathMatch(.*)*',
            name: 'notfound',
            component: () => import('@/views/pages/NotFound.vue'),
            meta: { title: 'Halaman Tidak Ditemukan' }
        }
    ]
});

// Navigation Guard (Satpam Router)
router.beforeEach(async (to, from, next) => {
    const defaultTitle = import.meta.env.VITE_APP_NAME || 'SIKT';
    document.title = to.meta.title ? `${to.meta.title} | ${defaultTitle}` : defaultTitle;
    const authStore = useAuthStore();
    const isLoggedIn = authStore.isLoggedIn;

    // Cek apakah halaman tujuan butuh otentikasi
    if (to.meta.requiresAuth) {
        if (!isLoggedIn) {
            // Jika butuh login tapi belum login, lempar ke halaman login
            return next({ name: 'login' });
        }

        // Cek apakah halaman butuh role tertentu
        const requiredRoles = to.meta.roles;
        if (requiredRoles && requiredRoles.length > 0) {
            const userRoles = authStore.userData?.roles || [];
            // Cek apakah user memiliki salah satu role yang dibutuhkan
            const hasPermission = requiredRoles.some((role) => userRoles.includes(role));

            if (!hasPermission) {
                // Jika tidak punya izin, lempar ke halaman Access Denied
                return next({ name: 'accessDenied' });
            }
        }
    } else if (to.name === 'login' && isLoggedIn) {
        // Jika sudah login tapi mencoba akses halaman login, lempar ke dashboard
        return next({ name: 'dashboard' });
    }

    // Jika semua kondisi aman, izinkan pengguna melanjutkan.
    next();
});

export default router;
