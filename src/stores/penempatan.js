// src/stores/penempatan.js
import apiClient from '@/services/api';
import { defineStore } from 'pinia';

export const usePenempatanStore = defineStore('penempatan', {
    state: () => ({
        list: [],
        isLoading: false,
        error: null
    }),
    actions: {
        async fetchByPegawai(pegawaiId) {
            this.isLoading = true;
            this.error = null;
            try {
                const response = await apiClient.get(`/sdm/pegawai/${pegawaiId}/penempatan`);
                this.list = response.data;
            } catch (e) {
                this.error = 'Gagal mengambil riwayat penempatan.';
            } finally {
                this.isLoading = false;
            }
        },
        async create(pegawaiId, data) {
            this.isLoading = true;
            try {
                await apiClient.post(`/sdm/pegawai/${pegawaiId}/penempatan`, data);
                await this.fetchByPegawai(pegawaiId);
            } finally {
                this.isLoading = false;
            }
        },
        async update(id, data) {
            this.isLoading = true;
            try {
                await apiClient.put(`/sdm/penempatan/${id}`, data);
            } finally {
                this.isLoading = false;
            }
        },
        async delete(id) {
            this.isLoading = true;
            try {
                await apiClient.delete(`/sdm/penempatan/${id}`);
            } finally {
                this.isLoading = false;
            }
        }
    }
});
