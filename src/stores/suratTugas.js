// src/stores/suratTugas.js
import apiClient from '@/services/api';
import { defineStore } from 'pinia';

export const useSuratTugasStore = defineStore('suratTugas', {
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
                const response = await apiClient.get('/sdm/surat-tugas');
                this.list = response.data;
            } catch (e) {
                this.error = 'Gagal mengambil data surat tugas.';
            } finally {
                this.isLoading = false;
            }
        },
        async fetchById(id) {
            this.isLoading = true;
            try {
                const response = await apiClient.get(`/sdm/surat-tugas/${id}`);
                return response.data; // Kembalikan data detail
            } finally {
                this.isLoading = false;
            }
        },
        async create(data) {
            this.isLoading = true;
            try {
                await apiClient.post('/sdm/surat-tugas', data);
                await this.fetchAll();
            } finally {
                this.isLoading = false;
            }
        },
        async update(id, data) {
            this.isLoading = true;
            try {
                await apiClient.put(`/sdm/surat-tugas/${id}`, data);
                await this.fetchAll();
            } finally {
                this.isLoading = false;
            }
        },
        async delete(id) {
            this.isLoading = true;
            try {
                await apiClient.delete(`/sdm/surat-tugas/${id}`);
                await this.fetchAll();
            } finally {
                this.isLoading = false;
            }
        }
    }
});
