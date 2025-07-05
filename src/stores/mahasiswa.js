// src/stores/mahasiswa.js
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
        },
        async importFromCSV(formData) {
            this.isLoading = true;
            this.error = null;
            try {
                // Penting: tidak perlu set header 'Content-Type', browser akan otomatis menanganinya untuk FormData
                const response = await apiClient.post('/mahasiswa/import-csv', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
                await this.fetchMahasiswa(); // Refresh data tabel setelah impor berhasil
                return response.data; // Kembalikan hasil agar bisa ditampilkan di notifikasi
            } catch (e) {
                // Tangkap error dari backend untuk ditampilkan
                const errorMessage = e.response?.data?.message || e.response?.data?.error || 'Gagal mengimpor data.';
                this.error = errorMessage;
                throw new Error(errorMessage);
            } finally {
                this.isLoading = false;
            }
        }
    }
});
