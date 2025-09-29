// src/stores/jadwalKuliah.js
import apiClient from '@/services/api';
import { defineStore } from 'pinia';

export const useJadwalKuliahStore = defineStore('jadwalKuliah', {
    state: () => ({
        list: [],
        isLoading: false
    }),
    actions: {
        async fetchAll(filters = {}) {
            this.isLoading = true;
            try {
                // Mengirim filter sebagai query params
                const response = await apiClient.get('/akademik/jadwal-kuliah', { params: filters });
                this.list = response.data;
            } catch (e) {
                console.error('Gagal fetch jadwal kuliah:', e);
            } finally {
                this.isLoading = false;
            }
        },
        async create(data) {
            this.isLoading = true;
            this.error = null;
            try {
                await apiClient.post('/akademik/jadwal-kuliah', data);
                await this.fetchAll();
            } catch (e) {
                this.error = 'Gagal membuat jadwal baru.';
                throw e;
            } finally {
                this.isLoading = false;
            }
        },
        async update(id, data) {
            this.isLoading = true;
            this.error = null;
            try {
                await apiClient.put(`/akademik/jadwal-kuliah/${id}`, data);
                await this.fetchAll();
            } catch (e) {
                this.error = 'Gagal memperbarui jadwal.';
                throw e;
            } finally {
                this.isLoading = false;
            }
        },
        async delete(id) {
            this.isLoading = true;
            this.error = null;
            try {
                await apiClient.delete(`/akademik/jadwal-kuliah/${id}`);
                await this.fetchAll();
            } catch (e) {
                this.error = 'Gagal menghapus jadwal.';
                throw e;
            } finally {
                this.isLoading = false;
            }
        }
    }
});
