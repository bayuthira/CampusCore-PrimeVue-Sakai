// src/stores/prodi.js
import apiClient from '@/services/api';
import { defineStore } from 'pinia';

export const useProdiStore = defineStore('prodi', {
    state: () => ({
        prodiList: [],
        isLoading: false,
        error: null
    }),
    actions: {
        async fetchProdi() {
            this.isLoading = true;
            this.error = null;
            try {
                const response = await apiClient.get('/prodi');
                this.prodiList = response.data;
            } catch (e) {
                this.error = 'Gagal mengambil data prodi.';
                console.error(e);
            } finally {
                this.isLoading = false;
            }
        },
        async createProdi(prodiData) {
            this.isLoading = true;
            this.error = null;
            try {
                await apiClient.post('/prodi', prodiData);
                await this.fetchProdi();
            } catch (e) {
                this.error = 'Gagal membuat prodi baru.';
                throw e;
            } finally {
                this.isLoading = false;
            }
        },
        /**
         * Update Prodi mendukung partial update.
         * Payload hanya berisi field yang ingin diubah.
         */
        async updateProdi(id, prodiData) {
            this.isLoading = true;
            this.error = null;
            try {
                await apiClient.put(`/prodi/${id}`, prodiData);
                await this.fetchProdi();
            } catch (e) {
                this.error = 'Gagal memperbarui prodi.';
                throw e;
            } finally {
                this.isLoading = false;
            }
        },
        async deleteProdi(id) {
            this.isLoading = true;
            this.error = null;
            try {
                await apiClient.delete(`/prodi/${id}`);
                await this.fetchProdi();
            } catch (e) {
                this.error = 'Gagal menghapus prodi.';
                throw e;
            } finally {
                this.isLoading = false;
            }
        }
    }
});