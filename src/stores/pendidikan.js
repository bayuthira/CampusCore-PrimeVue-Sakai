// src/stores/pendidikan.js
import apiClient from '@/services/api';
import { defineStore } from 'pinia';

export const usePendidikanStore = defineStore('pendidikan', {
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
                const response = await apiClient.get(`/sdm/pegawai/${pegawaiId}/pendidikan`);
                this.list = response.data;
            } catch (e) {
                this.error = 'Gagal mengambil riwayat pendidikan.';
            } finally {
                this.isLoading = false;
            }
        },
        async create(pegawaiId, data) {
            this.isLoading = true;
            try {
                await apiClient.post(`/sdm/pegawai/${pegawaiId}/pendidikan`, data);
                await this.fetchByPegawai(pegawaiId); // Langsung refresh
            } finally {
                this.isLoading = false;
            }
        },
        async update(id, data) {
            this.isLoading = true;
            try {
                await apiClient.put(`/sdm/pendidikan/${id}`, data);
            } finally {
                this.isLoading = false;
            }
        },
        async delete(id) {
            this.isLoading = true;
            try {
                await apiClient.delete(`/sdm/pendidikan/${id}`);
            } finally {
                this.isLoading = false;
            }
        }
    }
});
