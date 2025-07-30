// src/services/api.js
import { useAuthStore } from '@/stores/auth';
import axios from 'axios';

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Interceptor untuk MENAMBAHKAN token ke setiap request
apiClient.interceptors.request.use(
    (config) => {
        const authStore = useAuthStore();
        if (authStore.token) {
            config.headers.Authorization = `Bearer ${authStore.token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// --- DITAMBAHKAN ---
// Interceptor untuk MENANGANI response error (misal: 401 Unauthorized)
apiClient.interceptors.response.use(
    (response) => {
        // Jika response sukses (status 2xx), langsung kembalikan
        return response;
    },
    (error) => {
        // Cek jika ada response error dari server
        if (error.response) {
            // Jika statusnya 401 (Token tidak valid/kedaluwarsa)
            if (error.response.status === 401) {
                const authStore = useAuthStore();
                // Panggil aksi logout yang sudah kita buat
                authStore.logout();
            }
        }
        // Kembalikan error agar bisa ditangani juga oleh komponen jika perlu
        return Promise.reject(error);
    }
);

export default apiClient;
