import apiClient from '@/services/api';
import { defineStore } from 'pinia';
import { useAuthStore } from './auth';

// Interceptor untuk memastikan request standar menyertakan token
apiClient.interceptors.request.use((config) => {
    const authStore = useAuthStore();
    if (authStore.token) {
        config.headers.Authorization = `Bearer ${authStore.token}`;
    }
    return config;
});

export const useSuratTugasStore = defineStore('suratTugas', {
    state: () => ({
        list: [],
        isLoading: false,
        error: null
    }),
    actions: {
        /**
         * Mengambil pratinjau SPPD dalam format HTML sebagai Blob.
         * Menggunakan Axios agar Header Authorization (Token) tetap terkirim secara aman.
         */
        async fetchPreviewBlob(id) {
            try {
                const response = await apiClient.get(`/sdm/surat-tugas/${id}/preview`, {
                    responseType: 'blob'
                });

                // Membuat URL objek dari blob HTML yang diterima
                const blob = new Blob([response.data], { type: 'text/html' });
                return URL.createObjectURL(blob);
            } catch (e) {
                console.error('Gagal memuat pratinjau SPPD:', e);
                throw new Error('Gagal mengambil pratinjau dokumen dari server.');
            }
        },

        async fetchAll() {
            this.isLoading = true;
            this.error = null;
            try {
                const response = await apiClient.get('/sdm/surat-tugas');
                this.list = response.data;
            } catch (e) {
                this.error = 'Gagal mengambil data surat tugas.';
            } finally {
                this.isLoading = false;
            }
        },

        async fetchById(id) {
            this.isLoading = true;
            try {
                const response = await apiClient.get(`/sdm/surat-tugas/${id}`);
                return response.data;
            } finally {
                this.isLoading = false;
            }
        },

        async create(data) {
            this.isLoading = true;
            try {
                await apiClient.post('/sdm/surat-tugas', data);
                await this.fetchAll();
            } finally {
                this.isLoading = false;
            }
        },

        async update(id, data) {
            this.isLoading = true;
            try {
                await apiClient.put(`/sdm/surat-tugas/${id}`, data);
                await this.fetchAll();
            } finally {
                this.isLoading = false;
            }
        },

        async delete(id) {
            this.isLoading = true;
            try {
                await apiClient.delete(`/sdm/surat-tugas/${id}`);
                await this.fetchAll();
            } finally {
                this.isLoading = false;
            }
        }
    }
});