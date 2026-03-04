import apiClient from '@/services/api';
import { defineStore } from 'pinia';

export const useAbsensiReportStore = defineStore('absensiReport', {
    state: () => ({
        reportData: [], // Untuk daftar di tabel
        summary: null,  // Untuk metadata bulanan (total menit, dll)
        isLoading: false,
        error: null
    }),
    actions: {
        async fetchLaporanHarian(tanggal) {
            this.isLoading = true;
            this.reportData = [];
            this.summary = null;
            try {
                const response = await apiClient.get('/sdm/absensi/laporan-harian', {
                    params: { tanggal }
                });
                // Respons harian tetap array
                this.reportData = response.data;
            } catch (e) {
                this.error = 'Gagal memuat laporan harian.';
            } finally {
                this.isLoading = false;
            }
        },
        async fetchLaporanBulanan(payload) {
            this.isLoading = true;
            this.reportData = [];
            this.summary = null;
            try {
                const response = await apiClient.get('/sdm/absensi/laporan-bulanan', {
                    params: payload
                });
                // Respons baru adalah Objek: { rekap_harian: [], total_terlambat_menit: ... }
                const data = response.data;
                this.summary = data;
                this.reportData = data.rekap_harian || [];
            } catch (e) {
                this.error = 'Gagal memuat laporan bulanan.';
            } finally {
                this.isLoading = false;
            }
        }
    }
});