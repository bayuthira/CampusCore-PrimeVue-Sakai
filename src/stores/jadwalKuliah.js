import apiClient from '@/services/api';
import { defineStore } from 'pinia';

export const useJadwalKuliahStore = defineStore('jadwalKuliah', {
    state: () => ({
        list: [],
        isLoading: false,
        error: null
    }),
    actions: {
        async fetchAll(filters = {}) {
            this.isLoading = true;
            this.error = null;
            try {
                const response = await apiClient.get('/akademik/jadwal-kuliah', { params: filters });
                this.list = response.data.map((jadwal) => ({
                    ...jadwal,
                    // Gabungkan nama dosen untuk pencarian global di tabel
                    dosen_pengampu_searchable: (jadwal.dosen_pengampu || []).map((d) => d.nama_dosen).join(', ')
                }));
            } catch (e) {
                this.error = 'Gagal mengambil jadwal kuliah.';
                console.error(e);
            } finally {
                this.isLoading = false;
            }
        },
        async create(data) {
            this.isLoading = true;
            try {
                await apiClient.post('/akademik/jadwal-kuliah', data);
                await this.fetchAll();
            } finally {
                this.isLoading = false;
            }
        },
        async update(id, data) {
            this.isLoading = true;
            try {
                await apiClient.put(`/akademik/jadwal-kuliah/${id}`, data);
                await this.fetchAll();
            } finally {
                this.isLoading = false;
            }
        },
        async delete(id) {
            this.isLoading = true;
            try {
                await apiClient.delete(`/akademik/jadwal-kuliah/${id}`);
                await this.fetchAll();
            } finally {
                this.isLoading = false;
            }
        },
        async fetchRuanganTersedia(jadwalId) {
            try {
                const response = await apiClient.get(`/lookups/ruangan-tersedia?jadwal_kuliah_id=${jadwalId}`);
                return response.data;
            } catch (e) {
                console.error('Gagal mengambil data ruangan tersedia:', e);
                throw e;
            }
        },
        async plotRuangan(data) {
            this.isLoading = true;
            try {
                await apiClient.post('/akademik/plot-jadwal-ruangan', data);
                await this.fetchAll();
            } finally {
                this.isLoading = false;
            }
        },
        async unplotRuangan(jadwalId) {
            this.isLoading = true;
            try {
                await apiClient.delete(`/akademik/plot-jadwal-ruangan/${jadwalId}`);
                await this.fetchAll();
            } finally {
                this.isLoading = false;
            }
        }
    }
});