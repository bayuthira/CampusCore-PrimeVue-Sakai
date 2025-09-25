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
        }
        // Tambahkan fungsi create, update, delete jika Anda ingin membuat halaman CRUD lengkapnya.
    }
});
