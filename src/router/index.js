import AppLayout from '@/layout/AppLayout.vue';
import { useAuthStore } from '@/stores/auth'; // <-- 1. IMPORT AUTH STORE
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
                    component: () => import('@/views/Dashboard.vue')
                },
                {
                    path: '/prodi',
                    name: 'prodi',
                    component: () => import('@/views/akademik/Prodi.vue')
                },
                {
                    path: '/dosen',
                    name: 'dosen',
                    component: () => import('@/views/akademik/Dosen.vue')
                },
                {
                    path: '/mahasiswa',
                    name: 'mahasiswa',
                    component: () => import('@/views/akademik/Mahasiswa.vue')
                }
            ]
        },
        {
            path: '/login',
            name: 'login',
            component: () => import('@/views/pages/auth/Login.vue')
        },
        {
            path: '/:pathMatch(.*)*',
            name: 'notfound',
            component: () => import('@/views/pages/NotFound.vue')
        }
    ]
});

// --- 2. TAMBAHKAN BLOK NAVIGATIONAL GUARD DI SINI ---
router.beforeEach(async (to, from, next) => {
    // Daftar halaman yang tidak memerlukan login
    const publicPages = ['login', 'notfound'];
    const authRequired = !publicPages.includes(to.name);

    // Panggil auth store
    const authStore = useAuthStore();

    // Logika Satpam:
    if (authRequired && !authStore.isLoggedIn) {
        // Jika halaman butuh login, TAPI pengguna belum login...
        // ...lempar dia kembali ke halaman login.
        return next('/login');
    } else if (!authRequired && authStore.isLoggedIn && to.name === 'login') {
        // Jika pengguna sudah login, TAPI mencoba mengakses halaman login...
        // ...arahkan dia ke dashboard.
        return next('/');
    }

    // Jika semua kondisi aman, izinkan pengguna melanjutkan.
    next();
});

export default router;
