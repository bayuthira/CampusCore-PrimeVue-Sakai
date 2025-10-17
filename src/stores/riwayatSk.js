// src/stores/riwayatSk.js
import apiClient from '@/services/api';
import { defineStore } from 'pinia';

export const useRiwayatSkStore = defineStore('riwayatSk', {
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
                const response = await apiClient.get(`/sdm/pegawai/${pegawaiId}/riwayat-sk`);
                this.list = response.data;
            } catch (e) {
                this.error = 'Gagal mengambil riwayat SK.';
            } finally {
                this.isLoading = false;
            }
        },
        async create(pegawaiId, data) {
            this.isLoading = true;
            try {
                await apiClient.post(`/sdm/pegawai/${pegawaiId}/riwayat-sk`, data);
                await this.fetchByPegawai(pegawaiId);
            } finally {
                this.isLoading = false;
            }
        },
        async update(id, data) {
            this.isLoading = true;
            try {
                await apiClient.put(`/sdm/riwayat-sk/${id}`, data);
            } finally {
                this.isLoading = false;
            }
        },
        async delete(id) {
            this.isLoading = true;
            try {
                await apiClient.delete(`/sdm/riwayat-sk/${id}`);
            } finally {
                this.isLoading = false;
            }
        }
    }
});
