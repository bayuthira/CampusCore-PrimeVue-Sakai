// src/stores/karirDosen.js
import apiClient from '@/services/api';
import { defineStore } from 'pinia';

export const useKarirDosenStore = defineStore('karirDosen', {
    state: () => ({
        jadList: [],
        serdosList: [],
        isLoading: false,
        error: null
    }),
    actions: {
        // --- JAD Actions ---
        async fetchJad(pegawaiId) {
            this.isLoading = true;
            this.error = null;
            try {
                const response = await apiClient.get(`/sdm/pegawai/${pegawaiId}/jad`);
                this.jadList = response.data;
            } catch (e) {
                this.error = 'Gagal mengambil riwayat JAD.';
            } finally {
                this.isLoading = false;
            }
        },
        async createJad(pegawaiId, data) {
            this.isLoading = true;
            try {
                await apiClient.post(`/sdm/pegawai/${pegawaiId}/jad`, data);
                await this.fetchJad(pegawaiId);
            } finally {
                this.isLoading = false;
            }
        },
        async updateJad(id, data) {
            this.isLoading = true;
            try {
                await apiClient.put(`/sdm/jad/${id}`, data);
            } finally {
                this.isLoading = false;
            }
        },
        async deleteJad(id) {
            this.isLoading = true;
            try {
                await apiClient.delete(`/sdm/jad/${id}`);
            } finally {
                this.isLoading = false;
            }
        },

        // --- SERDOS Actions ---
        async fetchSerdos(pegawaiId) {
            this.isLoading = true;
            this.error = null;
            try {
                const response = await apiClient.get(`/sdm/pegawai/${pegawaiId}/serdos`);
                this.serdosList = response.data;
            } catch (e) {
                this.error = 'Gagal mengambil riwayat SERDOS.';
            } finally {
                this.isLoading = false;
            }
        },
        async createSerdos(pegawaiId, data) {
            this.isLoading = true;
            try {
                await apiClient.post(`/sdm/pegawai/${pegawaiId}/serdos`, data);
                await this.fetchSerdos(pegawaiId);
            } finally {
                this.isLoading = false;
            }
        },
        async updateSerdos(id, data) {
            this.isLoading = true;
            try {
                await apiClient.put(`/sdm/serdos/${id}`, data);
            } finally {
                this.isLoading = false;
            }
        },
        async deleteSerdos(id) {
            this.isLoading = true;
            try {
                await apiClient.delete(`/sdm/serdos/${id}`);
            } finally {
                this.isLoading = false;
            }
        }
    }
});
