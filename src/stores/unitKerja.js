// src/stores/unitKerja.js
import apiClient from '@/services/api';
import { defineStore } from 'pinia';

export const useUnitKerjaStore = defineStore('unitKerja', {
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
                const response = await apiClient.get('/sdm/unit-kerja');
                this.list = response.data;
            } catch (e) {
                this.error = 'Gagal mengambil data unit kerja.';
            } finally {
                this.isLoading = false;
            }
        },
        async create(data) {
            this.isLoading = true;
            try {
                await apiClient.post('/sdm/unit-kerja', data);
                await this.fetchAll();
            } finally {
                this.isLoading = false;
            }
        },
        async update(id, data) {
            this.isLoading = true;
            try {
                await apiClient.put(`/sdm/unit-kerja/${id}`, data);
                await this.fetchAll();
            } finally {
                this.isLoading = false;
            }
        },
        async delete(id) {
            this.isLoading = true;
            try {
                await apiClient.delete(`/sdm/unit-kerja/${id}`);
                await this.fetchAll();
            } finally {
                this.isLoading = false;
            }
        }
    }
});
