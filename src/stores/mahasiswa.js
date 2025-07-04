// src/stores/mahasiswa.js
import axios from 'axios';
import { defineStore } from 'pinia';
import { useAuthStore } from './auth';

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    headers: { 'Content-Type': 'application/json' }
});

apiClient.interceptors.request.use((config) => {
    const authStore = useAuthStore();
    if (authStore.token) {
        config.headers.Authorization = `Bearer ${authStore.token}`;
    }
    return config;
});

export const useMahasiswaStore = defineStore('mahasiswa', {
    state: () => ({
        mahasiswaList: [],
        isLoading: false,
        error: null
    }),
    actions: {
        async fetchMahasiswa() {
            this.isLoading = true;
            this.error = null;
            try {
                // Asumsi endpoint backend Anda adalah /api/mahasiswa
                const response = await apiClient.get('/mahasiswa');
                this.mahasiswaList = response.data;
            } catch (e) {
                this.error = 'Gagal mengambil data mahasiswa.';
                console.error(e);
            } finally {
                this.isLoading = false;
            }
        },
        async createMahasiswa(mahasiswaData) {
            this.isLoading = true;
            this.error = null;
            try {
                await apiClient.post('/mahasiswa', mahasiswaData);
                await this.fetchMahasiswa(); // Refresh data setelah berhasil
            } catch (e) {
                this.error = 'Gagal membuat mahasiswa baru.';
                console.error(e);
                throw e;
            } finally {
                this.isLoading = false;
            }
        },
        async updateMahasiswa(id, mahasiswaData) {
            this.isLoading = true;
            this.error = null;
            try {
                await apiClient.put(`/mahasiswa/${id}`, mahasiswaData);
                await this.fetchMahasiswa();
            } catch (e) {
                this.error = 'Gagal memperbarui mahasiswa.';
                console.error(e);
                throw e;
            } finally {
                this.isLoading = false;
            }
        },
        async deleteMahasiswa(id) {
            this.isLoading = true;
            this.error = null;
            try {
                await apiClient.delete(`/mahasiswa/${id}`);
                await this.fetchMahasiswa();
            } catch (e) {
                this.error = 'Gagal menghapus mahasiswa.';
                console.error(e);
                throw e;
            } finally {
                this.isLoading = false;
            }
        }
    }
});
