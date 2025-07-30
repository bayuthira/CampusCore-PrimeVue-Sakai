// src/stores/aset.js
import apiClient from '@/services/api';
import { defineStore } from 'pinia';

export const useAsetStore = defineStore('aset', {
    state: () => ({
        asetList: [],
        isLoading: false,
        error: null
    }),
    actions: {
        async fetchAset() {
            this.isLoading = true;
            this.error = null;
            try {
                const response = await apiClient.get('/aset/item');
                this.asetList = response.data;
            } catch (e) {
                this.error = 'Gagal mengambil data Aset.';
            } finally {
                this.isLoading = false;
            }
        },
        async createAset(data) {
            this.isLoading = true;
            this.error = null;
            try {
                await apiClient.post('/aset/item', data);
                await this.fetchAset(); // Refresh list setelah create
            } catch (e) {
                this.error = 'Gagal membuat Aset baru.';
                throw e; // Propagate error untuk ditangani di komponen
            } finally {
                this.isLoading = false;
            }
        },
        async updateAset(id, data) {
            this.isLoading = true;
            this.error = null;
            try {
                await apiClient.put(`/aset/item/${id}`, data);
                await this.fetchAset(); // Refresh list setelah update
            } catch (e) {
                this.error = 'Gagal memperbarui Aset.';
                throw e;
            } finally {
                this.isLoading = false;
            }
        },
        async deleteAset(id) {
            this.isLoading = true;
            this.error = null;
            try {
                await apiClient.delete(`/aset/item/${id}`);
                await this.fetchAset(); // Refresh list setelah delete
            } catch (e) {
                this.error = 'Gagal menghapus Aset.';
                throw e;
            } finally {
                this.isLoading = false;
            }
        },
        async pindahkanAset(asetId, data) {
            this.isLoading = true;
            this.error = null;
            try {
                await apiClient.post(`/aset/item/${asetId}/pindahkan`, data);
                await this.fetchAset(); // Refresh data tabel setelah berhasil
            } catch (e) {
                this.error = 'Gagal memindahkan aset.';
                throw e;
            } finally {
                this.isLoading = false;
            }
        },
        async fetchAsetHistori(asetId) {
            this.isLoading = true; // Gunakan loading state yang ada
            this.error = null;
            try {
                const response = await apiClient.get(`/aset/item/${asetId}/histori`);
                return response.data; // Langsung kembalikan data histori
            } catch (e) {
                this.error = 'Gagal mengambil data histori aset.';
                throw e;
            } finally {
                this.isLoading = false;
            }
        }
    }
});
