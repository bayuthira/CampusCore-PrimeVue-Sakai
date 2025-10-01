// src/stores/tahunAkademik.js
import apiClient from '@/services/api';
import { defineStore } from 'pinia';

export const useTahunAkademikStore = defineStore('tahunAkademik', {
    state: () => ({
        list: [], // Nama state tetap 'list'
        isLoading: false,
        error: null
    }),
    actions: {
        async fetchAll() {
            // Nama fungsi tetap 'fetchAll'
            this.isLoading = true;
            this.error = null;
            try {
                const response = await apiClient.get('/tahun-akademik');
                this.list = response.data;
            } catch (e) {
                this.error = 'Gagal mengambil data Tahun Akademik.';
            } finally {
                this.isLoading = false;
            }
        },
        async create(data) {
            // Nama fungsi tetap 'create'
            this.isLoading = true;
            this.error = null;
            try {
                await apiClient.post('/tahun-akademik', data);
                await this.fetchAll();
            } catch (e) {
                this.error = 'Gagal membuat Tahun Akademik baru.';
                throw e;
            } finally {
                this.isLoading = false;
            }
        },
        async update(id, data) {
            // Nama fungsi tetap 'update'
            this.isLoading = true;
            this.error = null;
            try {
                await apiClient.put(`/tahun-akademik/${id}`, data);
                await this.fetchAll();
            } catch (e) {
                this.error = 'Gagal memperbarui Tahun Akademik.';
                throw e;
            } finally {
                this.isLoading = false;
            }
        },
        async delete(id) {
            // Nama fungsi tetap 'delete'
            this.isLoading = true;
            this.error = null;
            try {
                await apiClient.delete(`/tahun-akademik/${id}`);
                await this.fetchAll();
            } catch (e) {
                this.error = 'Gagal menghapus Tahun Akademik.';
                throw e;
            } finally {
                this.isLoading = false;
            }
        }
    }
});
