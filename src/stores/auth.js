// src/stores/auth.js

import router from '@/router';
import apiClient from '@/services/api';
import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', {
    // STATE: Data yang akan kita simpan
    state: () => {
        const storedUser = localStorage.getItem('user');
        let user = null;

        // Coba parse hanya jika storedUser ada dan isinya bukan string "undefined"
        if (storedUser && storedUser !== 'undefined') {
            try {
                // Jika berhasil di-parse, jadikan data user
                user = JSON.parse(storedUser);
            } catch (e) {
                console.error('Gagal mem-parsing data user dari localStorage:', e);
                // Jika gagal, biarkan user null dan hapus data yang rusak
                localStorage.removeItem('user');
                localStorage.removeItem('token'); // Hapus token juga untuk konsistensi
            }
        }

        return {
            token: localStorage.getItem('token') || null,
            user: user, // Gunakan hasil parsing yang aman
            error: null
        };
    },

    // GETTERS: Cara kita mendapatkan data dari state (misal: untuk mengecek apakah user sudah login)
    getters: {
        isLoggedIn: (state) => !!state.token,
        userData: (state) => state.user,
        authError: (state) => state.error
    },

    // ACTIONS: Fungsi-fungsi yang akan mengubah state (misal: fungsi untuk login)
    actions: {
        async login(username, password) {
            this.error = null; // Reset error sebelum mencoba login

            try {
                // 1. Kirim request POST ke endpoint login di backend
                const response = await apiClient.post('/auth/login', {
                    username: username,
                    password: password
                });

                // 2. Jika berhasil, ambil token dan data user dari response
                const { token, user } = response.data;

                // 3. Simpan token dan data user ke state Pinia
                this.token = token;
                this.user = user;

                // 4. Simpan juga ke localStorage agar tidak hilang saat refresh
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(user));

                // 5. Atur header Authorization untuk request axios selanjutnya
                apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;

                // 6. Arahkan pengguna ke halaman Dashboard
                router.push('/');
            } catch (err) {
                // Jika terjadi error (misal: password salah)
                const errorMessage = err.response?.data?.error || 'Terjadi kesalahan saat login.';
                this.error = errorMessage;
                console.error('Login failed:', errorMessage);
            }
        },

        logout() {
            // Hapus semua data otentikasi
            this.token = null;
            this.user = null;
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            delete apiClient.defaults.headers.common['Authorization'];

            // Arahkan pengguna kembali ke halaman login
            router.push('/login');
        }
    }
});
