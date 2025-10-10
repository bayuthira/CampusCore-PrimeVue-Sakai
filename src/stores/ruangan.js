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
            this.isLoading = true;
            this.error = null;
            try {
                const response = await apiClient.get('/aset/ruangan', {
                    params: { q: query }
                });

                // TAMBAHKAN KEMBALI LOGIKA INI
                // untuk menghitung dan menambahkan field 'luas'
                this.ruanganList = response.data.map((ruangan) => ({
                    ...ruangan,
                    luas: ruangan.panjang && ruangan.lebar ? parseFloat(ruangan.panjang) * parseFloat(ruangan.lebar) : 0
                }));
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
