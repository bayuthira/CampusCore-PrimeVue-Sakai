// src/stores/kendaraan.js
import apiClient from '@/services/api';
import { defineStore } from 'pinia';

export const useKendaraanStore = defineStore('kendaraan', {
    state: () => ({
        list: [],
        isLoading: false,
        error: null
    }),
    actions: {
        async fetchAll() {
            this.isLoading = true;
            this.error = null;
            try {
                const response = await apiClient.get('/fleet/kendaraan');
                this.list = response.data;
            } catch (e) {
                this.error = 'Gagal mengambil data kendaraan.';
            } finally {
                this.isLoading = false;
            }
        },
        async create(data) {
            // Disederhanakan untuk menghilangkan warning
            this.isLoading = true;
            try {
                await apiClient.post('/fleet/kendaraan', data);
                await this.fetchAll();
            } finally {
                this.isLoading = false;
            }
        },
        async update(id, data) {
            // Disederhanakan untuk menghilangkan warning
            this.isLoading = true;
            try {
                await apiClient.put(`/fleet/kendaraan/${id}`, data);
                await this.fetchAll();
            } finally {
                this.isLoading = false;
            }
        },
        async delete(id) {
            // Disederhanakan untuk menghilangkan warning
            this.isLoading = true;
            try {
                await apiClient.delete(`/fleet/kendaraan/${id}`);
                await this.fetchAll();
            } finally {
                this.isLoading = false;
            }
        },
        async tambahServis(kendaraanId, data) {
            this.isLoading = true;
            this.error = null;
            try {
                await apiClient.post(`/fleet/kendaraan/${kendaraanId}/servis`, data);
                // Tidak perlu refresh tabel utama karena hanya menambah histori servis
            } catch (e) {
                this.error = 'Gagal menambah biaya servis.';
                throw e;
            } finally {
                this.isLoading = false;
            }
        }
    }
});
