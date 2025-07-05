// src/stores/dosen.js
import apiClient from '@/services/api';
import { defineStore } from 'pinia';
import { useAuthStore } from './auth';

apiClient.interceptors.request.use((config) => {
    const authStore = useAuthStore();
    if (authStore.token) {
        config.headers.Authorization = `Bearer ${authStore.token}`;
    }
    return config;
});

export const useDosenStore = defineStore('dosen', {
    state: () => ({
        dosenList: [],
        isLoading: false,
        error: null
    }),
    actions: {
        async fetchDosen() {
            this.isLoading = true;
            this.error = null;
            try {
                // Asumsi endpoint backend Anda adalah /api/dosen
                const response = await apiClient.get('/dosen');
                this.dosenList = response.data;
            } catch (e) {
                this.error = 'Gagal mengambil data dosen.';
                console.error(e);
            } finally {
                this.isLoading = false;
            }
        },
        async createDosen(dosenData) {
            this.isLoading = true;
            this.error = null;
            try {
                await apiClient.post('/dosen', dosenData);
                await this.fetchDosen();
            } catch (e) {
                this.error = 'Gagal membuat dosen baru.';
                console.error(e);
                throw e;
            } finally {
                this.isLoading = false;
            }
        },
        async updateDosen(id, dosenData) {
            this.isLoading = true;
            this.error = null;
            try {
                await apiClient.put(`/dosen/${id}`, dosenData);
                await this.fetchDosen();
            } catch (e) {
                this.error = 'Gagal memperbarui dosen.';
                console.error(e);
                throw e;
            } finally {
                this.isLoading = false;
            }
        },
        async deleteDosen(id) {
            this.isLoading = true;
            this.error = null;
            try {
                await apiClient.delete(`/dosen/${id}`);
                await this.fetchDosen();
            } catch (e) {
                this.error = 'Gagal menghapus dosen.';
                console.error(e);
                throw e;
            } finally {
                this.isLoading = false;
            }
        }
    }
});
