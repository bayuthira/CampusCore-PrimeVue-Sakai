// src/stores/ruangan.js
import apiClient from '@/services/api';
import { defineStore } from 'pinia';

export const useRuanganStore = defineStore('ruangan', {
    state: () => ({
        ruanganList: [],
        isLoading: false,
        error: null
    }),
    actions: {
        async fetchRuangan(query = '') {
            // Terima parameter query
            this.isLoading = true;
            this.error = null;
            try {
                // Tambahkan query 'q' jika ada isinya
                const response = await apiClient.get('/aset/ruangan', {
                    params: { q: query }
                });
                this.ruanganList = response.data;
            } catch (e) {
                this.error = 'Gagal mengambil data ruangan.';
            } finally {
                this.isLoading = false;
            }
        },

        async createRuangan(data) {
            this.isLoading = true;
            this.error = null;
            try {
                await apiClient.post('/aset/ruangan', data); // Endpoint diperbarui
                await this.fetchRuangan();
            } catch (e) {
                this.error = 'Gagal membuat ruangan baru.';
                throw e;
            } finally {
                this.isLoading = false;
            }
        },
        async updateRuangan(id, data) {
            this.isLoading = true;
            this.error = null;
            try {
                await apiClient.put(`/aset/ruangan/${id}`, data); // Endpoint diperbarui
                await this.fetchRuangan();
            } catch (e) {
                this.error = 'Gagal memperbarui ruangan.';
                throw e;
            } finally {
                this.isLoading = false;
            }
        },
        async deleteRuangan(id) {
            this.isLoading = true;
            this.error = null;
            try {
                await apiClient.delete(`/aset/ruangan/${id}`); // Endpoint diperbarui
                await this.fetchRuangan();
            } catch (e) {
                this.error = 'Gagal menghapus ruangan.';
                throw e;
            } finally {
                this.isLoading = false;
            }
        }
    }
});
