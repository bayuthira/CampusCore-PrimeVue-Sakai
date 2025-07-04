// src/stores/prodi.js
import axios from 'axios';
import { defineStore } from 'pinia';
import { useAuthStore } from './auth';

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    headers: { 'Content-Type': 'application/json' }
});

// Menambahkan token ke setiap request
apiClient.interceptors.request.use((config) => {
    const authStore = useAuthStore();
    if (authStore.token) {
        config.headers.Authorization = `Bearer ${authStore.token}`;
    }
    return config;
});

export const useProdiStore = defineStore('prodi', {
    state: () => ({
        prodiList: [],
        isLoading: false,
        error: null
    }),
    actions: {
        async fetchProdi() {
            this.isLoading = true;
            this.error = null;
            try {
                const response = await apiClient.get('/prodi');
                this.prodiList = response.data;
            } catch (e) {
                this.error = 'Gagal mengambil data prodi.';
                console.error(e);
            } finally {
                this.isLoading = false;
            }
        },
        async createProdi(prodiData) {
            this.isLoading = true;
            this.error = null;
            try {
                await apiClient.post('/prodi', prodiData);
                await this.fetchProdi(); // Refresh data setelah berhasil
            } catch (e) {
                this.error = 'Gagal membuat prodi baru.';
                console.error(e);
                throw e; // Lemparkan error agar bisa ditangkap di komponen
            } finally {
                this.isLoading = false;
            }
        },
        async updateProdi(id, prodiData) {
            this.isLoading = true;
            this.error = null;
            try {
                await apiClient.put(`/prodi/${id}`, prodiData);
                await this.fetchProdi(); // Refresh data
            } catch (e) {
                this.error = 'Gagal memperbarui prodi.';
                console.error(e);
                throw e;
            } finally {
                this.isLoading = false;
            }
        },
        async deleteProdi(id) {
            this.isLoading = true;
            this.error = null;
            try {
                await apiClient.delete(`/prodi/${id}`);
                await this.fetchProdi(); // Refresh data
            } catch (e) {
                this.error = 'Gagal menghapus prodi.';
                console.error(e);
                throw e;
            } finally {
                this.isLoading = false;
            }
        }
    }
});
