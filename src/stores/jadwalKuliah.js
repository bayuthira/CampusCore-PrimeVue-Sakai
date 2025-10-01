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
            this.error = null;
            try {
                const response = await apiClient.get('/akademik/jadwal-kuliah', { params: filters });

                // Tambahkan field baru 'dosen_pengampu_searchable'
                this.list = response.data.map((jadwal) => ({
                    ...jadwal,
                    // Buat satu string berisi semua nama dosen, dipisahkan koma
                    dosen_pengampu_searchable: jadwal.dosen_pengampu.map((d) => d.nama_dosen).join(', ')
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
            this.error = null;
            try {
                await apiClient.post('/akademik/jadwal-kuliah', data);
                await this.fetchAll();
            } catch (e) {
                this.error = 'Gagal membuat jadwal baru.';
                throw e;
            } finally {
                this.isLoading = false;
            }
        },
        async update(id, data) {
            this.isLoading = true;
            this.error = null;
            try {
                await apiClient.put(`/akademik/jadwal-kuliah/${id}`, data);
                await this.fetchAll();
            } catch (e) {
                this.error = 'Gagal memperbarui jadwal.';
                throw e;
            } finally {
                this.isLoading = false;
            }
        },
        async delete(id) {
            this.isLoading = true;
            this.error = null;
            try {
                await apiClient.delete(`/akademik/jadwal-kuliah/${id}`);
                await this.fetchAll();
            } catch (e) {
                this.error = 'Gagal menghapus jadwal.';
                throw e;
            } finally {
                this.isLoading = false;
            }
        },
        async fetchRuanganTersedia(jadwalId) {
            // Fungsi ini tidak mengubah state, hanya mengambil dan mengembalikan data
            try {
                const response = await apiClient.get(`/lookups/ruangan-tersedia?jadwal_kuliah_id=${jadwalId}`);
                return response.data;
            } catch (e) {
                console.error('Gagal mengambil data ruangan tersedia:', e);
                throw new Error('Gagal mengambil data ruangan tersedia.');
            }
        },

        async plotRuangan(data) {
            this.isLoading = true;
            this.error = null;
            try {
                await apiClient.post('/akademik/plot-jadwal-ruangan', data);
                await this.fetchAll(); // Refresh tabel jadwal
            } catch (e) {
                this.error = 'Gagal melakukan plot ruangan.';
                throw e;
            } finally {
                this.isLoading = false;
            }
        },
        async unplotRuangan(jadwalId) {
            this.isLoading = true;
            this.error = null;
            try {
                await apiClient.delete(`/akademik/plot-jadwal-ruangan/${jadwalId}`);
                await this.fetchAll(); // Refresh tabel jadwal
            } catch (e) {
                this.error = 'Gagal melakukan unplot ruangan.';
                throw e;
            } finally {
                this.isLoading = false;
            }
        }
    }
});
