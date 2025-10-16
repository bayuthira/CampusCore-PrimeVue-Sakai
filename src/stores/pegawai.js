// src/stores/pegawai.js
import apiClient from '@/services/api';
import { defineStore } from 'pinia';

export const usePegawaiStore = defineStore('pegawai', {
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
                const response = await apiClient.get('/sdm/pegawai');
                this.list = response.data;
            } catch (e) {
                this.error = 'Gagal mengambil data pegawai.';
            } finally {
                this.isLoading = false;
            }
        },
        async create(data) {
            this.isLoading = true;
            this.error = null;
            try {
                await apiClient.post('/sdm/pegawai', data);
                await this.fetchAll();
            } finally {
                this.isLoading = false;
            }
        },
        async update(id, data) {
            this.isLoading = true;
            this.error = null;
            try {
                await apiClient.put(`/sdm/pegawai/${id}`, data);
                await this.fetchAll();
            } finally {
                this.isLoading = false;
            }
        },
        async delete(id) {
            this.isLoading = true;
            this.error = null;
            try {
                await apiClient.delete(`/sdm/pegawai/${id}`);
                await this.fetchAll();
            } finally {
                this.isLoading = false;
            }
        },
        async createUserAccount(pegawaiId, passwordData) {
            this.isLoading = true;
            try {
                await apiClient.post(`/sdm/pegawai/${pegawaiId}/create-user`, passwordData);
                await this.fetchAll(); // Refresh the list to update the user_id status
            } finally {
                this.isLoading = false;
            }
        }
    }
});
