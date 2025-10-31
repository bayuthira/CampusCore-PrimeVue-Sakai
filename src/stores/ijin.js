// src/stores/ijin.js
import apiClient from '@/services/api';
import { defineStore } from 'pinia';

export const useIjinStore = defineStore('ijin', {
    state: () => ({
        myIjinList: [],
        allIjinList: [],
        isLoading: false,
        error: null
    }),
    actions: {
        // --- Endpoint Pegawai ---
        async fetchMyIjin() {
            this.isLoading = true;
            this.error = null;
            try {
                const response = await apiClient.get('/sdm/ijin/saya');
                this.myIjinList = response.data;
            } catch (e) {
                this.error = 'Gagal mengambil riwayat ijin.';
            } finally {
                this.isLoading = false;
            }
        },
        async ajukanIjin(data) {
            this.isLoading = true;
            try {
                await apiClient.post('/sdm/ijin/ajukan', data);
                await this.fetchMyIjin();
            } finally {
                this.isLoading = false;
            }
        },

        // --- Endpoint Admin ---
        async fetchAllIjin(params = {}) {
            this.isLoading = true;
            this.error = null;
            try {
                const response = await apiClient.get('/sdm/ijin/semua', { params });
                this.allIjinList = response.data;
            } catch (e) {
                this.error = 'Gagal mengambil semua data ijin.';
            } finally {
                this.isLoading = false;
            }
        },
        async approveIjin(id, data) {
            this.isLoading = true;
            try {
                await apiClient.put(`/sdm/ijin/${id}/setujui`, data);
                await this.fetchAllIjin(); // Refresh
            } finally {
                this.isLoading = false;
            }
        },
        async rejectIjin(id, data) {
            this.isLoading = true;
            try {
                await apiClient.put(`/sdm/ijin/${id}/tolak`, data);
                await this.fetchAllIjin(); // Refresh
            } finally {
                this.isLoading = false;
            }
        }
    }
});
