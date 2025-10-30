// src/stores/cuti.js
import apiClient from '@/services/api';
import { defineStore } from 'pinia';

export const useCutiStore = defineStore('cuti', {
    state: () => ({
        myLeaveList: [],
        allLeaveList: [],
        myQuota: null,
        isLoading: false,
        error: null
    }),
    actions: {
        // --- Endpoint Pegawai ---
        async fetchMyLeave() {
            this.isLoading = true;
            this.error = null;
            try {
                const response = await apiClient.get('/sdm/cuti/saya');
                this.myLeaveList = response.data;
            } catch (e) {
                this.error = 'Gagal mengambil riwayat cuti.';
            } finally {
                this.isLoading = false;
            }
        },
        async fetchMyQuota(tahun) {
            this.error = null;
            try {
                const response = await apiClient.get(`/sdm/cuti/kuota-saya?tahun=${tahun}`);
                this.myQuota = response.data;
            } catch (e) {
                this.error = 'Gagal mengambil data kuota cuti.';
                this.myQuota = null;
            }
        },
        async ajukanCuti(data) {
            this.isLoading = true;
            try {
                await apiClient.post('/sdm/cuti/ajukan', data);
                await this.fetchMyLeave();
            } finally {
                this.isLoading = false;
            }
        },

        // --- Endpoint Admin ---
        async setJatahCuti(data) {
            this.isLoading = true;
            try {
                await apiClient.post('/sdm/cuti/jatah', data);
            } finally {
                this.isLoading = false;
            }
        },
        async fetchAllLeave(params = {}) {
            this.isLoading = true;
            this.error = null;
            try {
                const response = await apiClient.get('/sdm/cuti/semua', { params });
                this.allLeaveList = response.data;
            } catch (e) {
                this.error = 'Gagal mengambil semua data cuti.';
            } finally {
                this.isLoading = false;
            }
        },
        async approveCuti(id, data) {
            this.isLoading = true;
            try {
                await apiClient.put(`/sdm/cuti/${id}/setujui`, data);
                await this.fetchAllLeave(); // Refresh
            } finally {
                this.isLoading = false;
            }
        },
        async rejectCuti(id, data) {
            this.isLoading = true;
            try {
                await apiClient.put(`/sdm/cuti/${id}/tolak`, data);
                await this.fetchAllLeave(); // Refresh
            } finally {
                this.isLoading = false;
            }
        },
        async fetchJatahCutiByPegawai(pegawaiId, tahun) {
            this.isLoading = true;
            this.error = null;
            try {
                const response = await apiClient.get('/sdm/cuti/jatah', {
                    params: { pegawai_id: pegawaiId, tahun: tahun }
                });
                return response.data; // Kembalikan data jatah
            } catch (e) {
                this.error = 'Gagal mengambil data jatah cuti.';
                throw e;
            } finally {
                this.isLoading = false;
            }
        }
    }
});
