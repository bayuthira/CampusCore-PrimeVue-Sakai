import apiClient from '@/services/api';
import { defineStore } from 'pinia';

export const useRpsStore = defineStore('rps', {
    state: () => ({
        header: null,
        weeklyMatrix: [],
        isLoading: false,
        error: null
    }),
    actions: {
        // --- Header RPS ---
        async fetchHeader(mataKuliahId) {
            this.isLoading = true;
            try {
                const response = await apiClient.get(`/matakuliah/${mataKuliahId}/rps-header`);
                this.header = response.data;
            } catch (e) {
                this.header = null; // API mereturn null jika belum ada
            } finally {
                this.isLoading = false;
            }
        },
        async saveHeader(mataKuliahId, payload) {
            this.isLoading = true;
            try {
                const response = await apiClient.put(`/matakuliah/${mataKuliahId}/rps-header`, payload);
                this.header = response.data;
                return response.data;
            } finally {
                this.isLoading = false;
            }
        },

        // --- Matriks Mingguan ---
        async fetchWeekly(mataKuliahId) {
            this.isLoading = true;
            try {
                const response = await apiClient.get(`/matakuliah/${mataKuliahId}/rps-mingguan`);
                this.weeklyMatrix = response.data;
            } finally {
                this.isLoading = false;
            }
        },
        async saveWeekly(mataKuliahId, payload) {
            this.isLoading = true;
            try {
                await apiClient.post(`/matakuliah/${mataKuliahId}/rps-mingguan`, payload);
                await this.fetchWeekly(mataKuliahId);
            } finally {
                this.isLoading = false;
            }
        },
        async deleteWeekly(idMingguan, mataKuliahId) {
            this.isLoading = true;
            try {
                await apiClient.delete(`/matakuliah/rps-mingguan/${idMingguan}`);
                await this.fetchWeekly(mataKuliahId);
            } finally {
                this.isLoading = false;
            }
        },

        // --- File & Verifikasi ---
        async uploadRpsFile(mataKuliahId, formData) {
            this.isLoading = true;
            try {
                await apiClient.post(`/matakuliah/${mataKuliahId}/upload-rps`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } finally {
                this.isLoading = false;
            }
        },
        async verifyRps(mataKuliahId, payload) {
            this.isLoading = true;
            try {
                const response = await apiClient.put(`/matakuliah/${mataKuliahId}/verifikasi-rps`, payload);
                return response.data;
            } finally {
                this.isLoading = false;
            }
        }
    }
});