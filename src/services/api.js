// src/services/api.js
import { useAuthStore } from '@/stores/auth';
import axios from 'axios';

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Interceptor ini akan berjalan SETIAP KALI ada request dibuat menggunakan apiClient
apiClient.interceptors.request.use(
    (config) => {
        // Panggil useAuthStore di dalam interceptor, ini cara yang aman
        const authStore = useAuthStore();
        const token = authStore.token;

        if (token) {
            // Jika ada token, tambahkan ke header Authorization
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default apiClient;
