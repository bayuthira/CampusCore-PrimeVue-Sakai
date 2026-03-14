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
                    meta: { requiresAuth: true, roles: ['SUPER_ADMIN'], title: 'Tahun Akademik' }
                },
                {
                    path: '/akademik/kurikulum',
                    name: 'kurikulum',
                    component: () => import('@/views/akademik/Kurikulum.vue'),
                    meta: { requiresAuth: true, roles: ['SUPER_ADMIN', 'KAPRODI'], title: 'Kurikulum' }
                },
                {
                    path: '/akademik/krs-mahasiswa',
                    name: 'krs-mahasiswa',
                    component: () => import('@/views/akademik/KrsMahasiswa.vue'),
                    meta: { requiresAuth: true, roles: ['MAHASISWA'], title: 'KRS Mahasiswa' }
                },
                {
                    path: '/akademik/persetujuan-krs',
                    name: 'persetujuan-krs',
                    component: () => import('@/views/akademik/PersetujuanKrs.vue'),
                    meta: { requiresAuth: true, roles: ['DOSEN'], title: 'Persetujuan KRS' }
                },
                {
                    path: '/akademik/pengaturan-dosen-pa',
                    name: 'pengaturan-dosen-pa',
                    component: () => import('@/views/akademik/PengaturanDosenPa.vue'),
                    meta: {
                        roles: ['SUPER_ADMIN', 'STAF_AKADEMIK', 'KAPRODI'],
                        title: 'Pengaturan Dosen PA'
                    }
                },
                {
                    path: '/akademik/rombel',
                    name: 'manajemen-rombel',
                    component: () => import('@/views/akademik/Rombel.vue'),
                    meta: { requiresAuth: true, roles: ['SUPER_ADMIN', 'STAF_AKADEMIK'], title: 'Manajemen Rombel' }
                },
                {
                    path: '/fasilitas/jadwal-ruangan',
                    name: 'jadwal-ruangan',
                    component: () => import('@/views/fasilitas/JadwalRuangan.vue'),
                    meta: { requiresAuth: true, roles: ['SUPER_ADMIN', 'STAF_BAUM'], title: 'Jadwal Ruangan' }
                },
                {
                    path: '/fleet/kendaraan',
                    name: 'manajemen-kendaraan',
                    component: () => import('@/views/fleet/ManajemenKendaraan.vue'),
                    meta: { requiresAuth: true, roles: ['SUPER_ADMIN', 'STAF_BAUM'], title: 'Manajemen Kendaraan' }
                },
                {
                    path: '/fleet/jadwal-kendaraan',
                    name: 'jadwal-kendaraan',
                    component: () => import('@/views/fleet/JadwalKendaraan.vue'),
                    meta: { requiresAuth: true, title: 'Jadwal Kendaraan' }
                },
                {
                    path: '/dashboard-baum',
                    name: 'dashboard-baum',
                    component: () => import('@/views/dashboards/DashboardBaum.vue'),
                    meta: { requiresAuth: true, roles: ['SUPER_ADMIN', 'STAF_BAUM'], title: 'Dashboard BAUM' }
                },
                {
                    path: '/sdm/pegawai',
                    name: 'manajemen-pegawai',
                    component: () => import('@/views/sdm/ManajemenPegawai.vue'),
                    meta: { requiresAuth: true, roles: ['SUPER_ADMIN', 'STAF_BASDM'], title: 'Manajemen Pegawai' }
                },
                {
                    path: '/admin/manajemen-file',
                    name: 'manajemen-file',
                    component: () => import('@/views/admin/ManajemenFile.vue'),
                    meta: { requiresAuth: true, roles: ['SUPER_ADMIN', 'STAF_BASDM'], title: 'Manajemen File' }
                },
                {
                    path: '/sdm/cuti-saya',
                    name: 'cuti-saya',
                    component: () => import('@/views/sdm/CutiSaya.vue'),
                    meta: { requiresAuth: true, title: 'Manajemen Cuti', roles: ['KARYAWAN'] }
                },
                {
                    path: '/sdm/persetujuan-cuti',
                    name: 'persetujuan-cuti',
                    component: () => import('@/views/sdm/PersetujuanCuti.vue'),
                    meta: { requiresAuth: true, roles: ['SUPER_ADMIN', 'STAF_BASDM'], title: 'Persetujuan Cuti' }
                },
                {
                    path: '/sdm/ijin-saya',
                    name: 'ijin-saya',
                    component: () => import('@/views/sdm/IjinSaya.vue'),
                    meta: { requiresAuth: true, title: 'Manajemen Ijin', roles: ['KARYAWAN'] }
                },
                {
                    path: '/sdm/persetujuan-ijin',
                    name: 'persetujuan-ijin',
                    component: () => import('@/views/sdm/PersetujuanIjin.vue'),
                    meta: { requiresAuth: true, roles: ['SUPER_ADMIN', 'STAF_BASDM'], title: 'Persetujuan Ijin' }
                },
                {
                    path: '/sdm/absensi',
                    name: 'rekap-absensi',
                    component: () => import('@/views/sdm/RekapAbsensi.vue'),
                    meta: { requiresAuth: true, roles: ['SUPER_ADMIN', 'STAF_BASDM'], title: 'Rekap Absensi' }
                },
                {
                    path: '/sdm/laporan-absensi',
                    name: 'laporan-absensi',
                    component: () => import('@/views/sdm/LaporanAbsensi.vue'),
                    meta: { requiresAuth: true, roles: ['SUPER_ADMIN', 'STAF_BASDM'], title: 'Laporan Absensi' }
                },
                {
                    path: '/sdm/unit-kerja',
                    name: 'manajemen-unit-kerja',
                    component: () => import('@/views/sdm/UnitKerja.vue'),
                    meta: { requiresAuth: true, roles: ['SUPER_ADMIN', 'STAF_BASDM'], title: 'Unit Kerja' }
                },
                {
                    path: '/sdm/surat-tugas',
                    name: 'manajemen-surat-tugas',
                    component: () => import('@/views/sdm/SuratTugas.vue'),
                    meta: { requiresAuth: true, roles: ['SUPER_ADMIN', 'STAF_BASDM'], title: 'Surat Tugas / SPPD' }
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
    const defaultTitle = import.meta.env.VITE_APP_NAME || 'Sistem Informasi Kampus Terpadu';
    document.title = to.meta.title ? `${to.meta.title} | ${defaultTitle}` : defaultTitle;
    const authStore = useAuthStore();
    const isLoggedIn = authStore.isLoggedIn;
    const userRoles = authStore.userData?.roles || [];

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
    // Jika user sudah login dan mencoba ke halaman utama
    if (to.name === 'dashboard' && isLoggedIn) {
        if (userRoles.includes('STAF_BAUM')) {
            return next({ name: 'dashboard-baum' }); // Arahkan ke dashboard BAUM
        }
    }

    // Jika semua kondisi aman, izinkan pengguna melanjutkan.
    next();
});

export default router;
