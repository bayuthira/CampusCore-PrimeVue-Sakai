// src/stores/jadwalKuliah.js
import apiClient from '@/services/api';
import { defineStore } from 'pinia';

export const useJadwalKuliahStore = defineStore('jadwalKuliah', {
    state: () => ({
        list: [],
        isLoading: false
    }),
    actions: {
        async fetchAll(filters = {}) {
            this.isLoading = true;
            try {
                // Mengirim filter sebagai query params
                const response = await apiClient.get('/akademik/jadwal-kuliah', { params: filters });
                this.list = response.data;
            } catch (e) {
                console.error('Gagal fetch jadwal kuliah:', e);
            } finally {
                this.isLoading = false;
            }
        },
        async create(data) {
            try {
                await apiClient.post('/akademik/jadwal-kuliah', data);
                await this.fetchAll();
            } catch (e) {
                throw e;
            }
        }
    }
});
