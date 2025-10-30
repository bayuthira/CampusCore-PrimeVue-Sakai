// src/stores/sertifikat.js
import apiClient from '@/services/api';
import { defineStore } from 'pinia';

export const useSertifikatStore = defineStore('sertifikat', {
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
                const response = await apiClient.get(`/sdm/pegawai/${pegawaiId}/sertifikat`);
                this.list = response.data;
            } catch (e) {
                this.error = 'Gagal mengambil riwayat sertifikat.';
            } finally {
                this.isLoading = false;
            }
        },
        async create(pegawaiId, data) {
            this.isLoading = true;
            try {
                await apiClient.post(`/sdm/pegawai/${pegawaiId}/sertifikat`, data);
                await this.fetchByPegawai(pegawaiId);
            } finally {
                this.isLoading = false;
            }
        },
        async update(id, data) {
            this.isLoading = true;
            try {
                await apiClient.put(`/sdm/sertifikat/${id}`, data);
            } finally {
                this.isLoading = false;
            }
        },
        async delete(id) {
            this.isLoading = true;
            try {
                await apiClient.delete(`/sdm/sertifikat/${id}`);
            } finally {
                this.isLoading = false;
            }
        }
    }
});
