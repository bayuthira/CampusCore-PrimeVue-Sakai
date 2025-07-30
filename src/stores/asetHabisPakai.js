// src/stores/asetHabisPakai.js
import apiClient from '@/services/api';
import { defineStore } from 'pinia';

export const useAsetHabisPakaiStore = defineStore('asetHabisPakai', {
    state: () => ({
        asetHabisPakaiList: [], // Nama variabel diubah untuk konsistensi
        isLoading: false,
        error: null
    }),
    actions: {
        async fetchAsetHabisPakai() {
            // Nama fungsi diubah
            this.isLoading = true;
            this.error = null;
            try {
                const response = await apiClient.get('/aset/konsumsi');
                this.asetHabisPakaiList = response.data; // Mengisi variabel baru
            } catch (e) {
                this.error = 'Gagal mengambil data Aset Habis Pakai.';
            } finally {
                this.isLoading = false;
            }
        },
        async createAsetHabisPakai(data) {
            // Nama fungsi diubah
            this.isLoading = true;
            this.error = null;
            try {
                await apiClient.post('/aset/konsumsi', data);
                await this.fetchAsetHabisPakai();
            } catch (e) {
                this.error = 'Gagal membuat Aset Habis Pakai baru.';
                throw e;
            } finally {
                this.isLoading = false;
            }
        },
        async updateAsetHabisPakai(id, data) {
            // Nama fungsi diubah
            this.isLoading = true;
            this.error = null;
            try {
                await apiClient.put(`/aset/konsumsi/${id}`, data);
                await this.fetchAsetHabisPakai();
            } catch (e) {
                this.error = 'Gagal memperbarui Aset Habis Pakai.';
                throw e;
            } finally {
                this.isLoading = false;
            }
        },
        async deleteAsetHabisPakai(id) {
            // Nama fungsi diubah
            this.isLoading = true;
            this.error = null;
            try {
                await apiClient.delete(`/aset/konsumsi/${id}`);
                await this.fetchAsetHabisPakai();
            } catch (e) {
                this.error = 'Gagal menghapus Aset Habis Pakai.';
                throw e;
            } finally {
                this.isLoading = false;
            }
        },
        async tambahStok(id, data) {
            this.isLoading = true;
            this.error = null;
            try {
                await apiClient.post(`/aset/konsumsi/${id}/tambah-stok`, data);
                await this.fetchAsetHabisPakai();
            } catch (e) {
                this.error = 'Gagal menambah stok.';
                throw e;
            } finally {
                this.isLoading = false;
            }
        },

        async ambilStok(id, data) {
            this.isLoading = true;
            this.error = null;
            try {
                await apiClient.post(`/aset/konsumsi/${id}/ambil-stok`, data);
                await this.fetchAsetHabisPakai();
            } catch (e) {
                this.error = 'Gagal mengambil stok.';
                throw e;
            } finally {
                this.isLoading = false;
            }
        },
        async fetchHistori(id) {
            this.isLoading = true;
            this.error = null;
            try {
                const response = await apiClient.get(`/aset/konsumsi/${id}/histori`);
                return response.data; // Langsung kembalikan data histori
            } catch (e) {
                this.error = 'Gagal mengambil data histori.';
                throw e;
            } finally {
                this.isLoading = false;
            }
        },
        async stokOpname(id, data) {
            this.isLoading = true;
            this.error = null;
            try {
                await apiClient.post(`/aset/konsumsi/${id}/stok-opname`, data);
                await this.fetchAsetHabisPakai();
            } catch (e) {
                this.error = 'Gagal melakukan stok opname.';
                throw e;
            } finally {
                this.isLoading = false;
            }
        }
    }
});
