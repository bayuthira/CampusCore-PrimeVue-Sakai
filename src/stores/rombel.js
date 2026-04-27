import apiClient from '@/services/api';
import { defineStore } from 'pinia';

export const useRombelStore = defineStore('rombel', {
    state: () => ({
        rombelList: [],
        mahasiswaList: [],
        isLoading: false,
        error: null
    }),
    actions: {
        async fetchSummary(params = {}) {
            this.isLoading = true;
            this.error = null;
            try {
                // Endpoint: GET /api/akademik/rombel
                const response = await apiClient.get('/akademik/rombel', { params });
                this.rombelList = response.data;
            } catch (e) {
                this.error = 'Gagal mengambil ringkasan rombel.';
            } finally {
                this.isLoading = false;
            }
        },
        async fetchMahasiswa(params) {
            this.isLoading = true;
            try {
                // params: { prodi_id, angkatan, kode_rombel }
                const response = await apiClient.get('/akademik/rombel/mahasiswa', { params });
                this.mahasiswaList = response.data;
            } catch (e) {
                this.error = 'Gagal mengambil daftar mahasiswa rombel.';
            } finally {
                this.isLoading = false;
            }
        },
        async moveStudents(payload) {
            this.isLoading = true;
            try {
                await apiClient.put('/akademik/rombel/pindah', payload);
            } finally {
                this.isLoading = false;
            }
        },
        async renameRombel(payload) {
            this.isLoading = true;
            try {
                await apiClient.put('/akademik/rombel/rename', payload);
            } finally {
                this.isLoading = false;
            }
        }
    }
});