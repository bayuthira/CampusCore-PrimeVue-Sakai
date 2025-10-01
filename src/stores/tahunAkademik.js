// src/stores/tahunAkademik.js
import apiClient from '@/services/api';
import { defineStore } from 'pinia';

export const useTahunAkademikStore = defineStore('tahunAkademik', {
    state: () => ({ list: [], isLoading: false }),
    actions: {
        async fetchAll() {
            this.isLoading = true;
            try {
                const response = await apiClient.get('/tahun-akademik');
                this.list = response.data;
            } catch (e) {
                console.error('Gagal fetch tahun akademik:', e);
            } finally {
                this.isLoading = false;
            }
        },
        async create(data) {
            try {
                await apiClient.post('/tahun-akademik', data);
                await this.fetchAll();
            } catch (e) {
                this.error = 'Gagal menambah tahun akademik.';
                throw e;
            }
        },
        async update(id, data) {
            try {
                await apiClient.put(`/tahun-akademik/${id}`, data);
                await this.fetchAll();
            } catch (e) {
                this.error = 'Gagal meng-update tahun akademik.';
                throw e;
            }
        },
        async delete(id) {
            try {
                await apiClient.delete(`/tahun-akademik/${id}`);
                await this.fetchAll();
            } catch (e) {
                this.error = 'Gagal menghapus tahun akademik.';
                throw e;
            }
        }
        // Tambahkan fungsi create, update, delete jika Anda ingin membuat halaman CRUD lengkapnya.
    }
});
