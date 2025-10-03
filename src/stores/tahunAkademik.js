// src/stores/tahunAkademik.js
import apiClient from '@/services/api'; // <-- Menggunakan apiClient terpusat
import { defineStore } from 'pinia';

export const useTahunAkademikStore = defineStore('tahunAkademik', {
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
                const response = await apiClient.get('/tahun-akademik');
                this.list = response.data;
            } catch (e) {
                this.error = 'Gagal mengambil data Tahun Akademik.';
            } finally {
                this.isLoading = false;
            }
        },
        async create(data) {
            this.isLoading = true;
            try {
                await apiClient.post('/tahun-akademik', data);
                await this.fetchAll();
            } finally {
                this.isLoading = false;
            }
        },
        async update(id, data) {
            this.isLoading = true;
            try {
                await apiClient.put(`/tahun-akademik/${id}`, data);
                await this.fetchAll();
            } finally {
                this.isLoading = false;
            }
        },
        async delete(id) {
            this.isLoading = true;
            try {
                await apiClient.delete(`/tahun-akademik/${id}`);
                await this.fetchAll();
            } finally {
                this.isLoading = false;
            }
        }
    }
});
