// src/services/api.js
import { useAuthStore } from '@/stores/auth';
import axios from 'axios';

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        // Tambahkan header identitas aplikasi agar tidak dianggap bot umum
        'x-app-service': 'Satria-Management-System'
    }
});

// Interceptor untuk MENAMBAHKAN token ke setiap request
apiClient.interceptors.request.use(
    (config) => {
        const authStore = useAuthStore();
        if (authStore.token) {
            config.headers.Authorization = `Bearer ${authStore.token}`;
        }

        // Pastikan User-Agent tetap konsisten atau tambahkan identitas tambahan
        // Cloudflare akan melihat header ini di setiap request (GET, POST, PUT, DELETE)
        config.headers['X-Requested-With'] = 'XMLHttpRequest';

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor untuk MENANGANI response error
apiClient.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response) {
            if (error.response.status === 401) {
                const authStore = useAuthStore();
                authStore.logout();
            }
        }
        return Promise.reject(error);
    }
);

export default apiClient;