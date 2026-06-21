import apiClient from '@/services/api';
import { defineStore } from 'pinia';

export const useReportPembelajaranStore = defineStore('reportPembelajaran', {
    state: () => ({
        rows: [],
        detail: [],
        isLoading: false,
        error: null
    }),
    actions: {
        async fetchReport(tahunAkademikId) {
            this.isLoading = true;
            this.error = null;
            try {
                const response = await apiClient.get('/pembelajaran/report', {
                    params: { tahun_akademik_id: tahunAkademikId }
                });
                this.rows = response.data;
            } catch (error) {
                this.error = error.response?.data?.error || 'Gagal mengambil laporan pembelajaran.';
                throw error;
            } finally {
                this.isLoading = false;
            }
        },
        async fetchDetail(jadwalId) {
            this.isLoading = true;
            this.error = null;
            try {
                const response = await apiClient.get(`/pembelajaran/report/${jadwalId}`);
                this.detail = response.data;
            } catch (error) {
                this.error = error.response?.data?.error || 'Gagal mengambil detail laporan.';
                throw error;
            } finally {
                this.isLoading = false;
            }
        }
    }
});
