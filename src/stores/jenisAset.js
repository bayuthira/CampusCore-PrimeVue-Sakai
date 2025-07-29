// src/stores/jenisAset.js
import apiClient from '@/services/api';
import { defineStore } from 'pinia';

export const useJenisAsetStore = defineStore('jenisAset', {
    state: () => ({
        jenisAsetList: [],
        isLoading: false,
        error: null
    }),
    actions: {
        async fetchJenisAset() {
            this.isLoading = true;
            this.error = null;
            try {
                const response = await apiClient.get('/aset/jenis');
                this.jenisAsetList = response.data;
            } catch (e) {
                this.error = 'Gagal mengambil data Jenis Aset.';
            } finally {
                this.isLoading = false;
            }
        },
        async createJenisAset(data) {
            this.isLoading = true;
            this.error = null;
            try {
                await apiClient.post('/aset/jenis', data);
                await this.fetchJenisAset();
            } catch (e) {
                this.error = 'Gagal membuat Jenis Aset baru.';
                throw e;
            } finally {
                this.isLoading = false;
            }
        },
        async updateJenisAset(id, data) {
            this.isLoading = true;
            this.error = null;
            try {
                await apiClient.put(`/aset/jenis/${id}`, data);
                await this.fetchJenisAset();
            } catch (e) {
                this.error = 'Gagal memperbarui Jenis Aset.';
                throw e;
            } finally {
                this.isLoading = false;
            }
        },
        async deleteJenisAset(id) {
            this.isLoading = true;
            this.error = null;
            try {
                await apiClient.delete(`/aset/jenis/${id}`);
                await this.fetchJenisAset();
            } catch (e) {
                this.error = 'Gagal menghapus Jenis Aset.';
                throw e;
            } finally {
                this.isLoading = false;
            }
        }
    }
});
