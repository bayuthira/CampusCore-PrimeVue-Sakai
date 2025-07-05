// src/stores/matakuliah.js
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

export const useMataKuliahStore = defineStore('matakuliah', {
    state: () => ({
        mataKuliahList: [],
        isLoading: false,
        error: null
    }),
    actions: {
        async fetchMataKuliah() {
            this.isLoading = true;
            this.error = null;
            try {
                const response = await apiClient.get('/matakuliah');
                this.mataKuliahList = response.data;
            } catch (e) {
                this.error = 'Gagal mengambil data mata kuliah.';
                console.error(e);
            } finally {
                this.isLoading = false;
            }
        },
        async createMataKuliah(data) {
            this.isLoading = true;
            this.error = null;
            try {
                await apiClient.post('/matakuliah', data);
                await this.fetchMataKuliah();
            } catch (e) {
                this.error = 'Gagal membuat mata kuliah baru.';
                console.error(e);
                throw e;
            } finally {
                this.isLoading = false;
            }
        },
        async updateMataKuliah(id, data) {
            this.isLoading = true;
            this.error = null;
            try {
                await apiClient.put(`/matakuliah/${id}`, data);
                await this.fetchMataKuliah();
            } catch (e) {
                this.error = 'Gagal memperbarui mata kuliah.';
                console.error(e);
                throw e;
            } finally {
                this.isLoading = false;
            }
        },
        async deleteMataKuliah(id) {
            this.isLoading = true;
            this.error = null;
            try {
                await apiClient.delete(`/matakuliah/${id}`);
                await this.fetchMataKuliah();
            } catch (e) {
                this.error = 'Gagal menghapus mata kuliah.';
                console.error(e);
                throw e;
            } finally {
                this.isLoading = false;
            }
        }
    }
});
