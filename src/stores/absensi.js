import apiClient from '@/services/api';
import { defineStore } from 'pinia';

export const useAbsensiStore = defineStore('absensi', {
    state: () => ({
        rekapList: [],
        isLoading: false,
        error: null
    }),
    actions: {
        async fetchRekapSemua(params) {
            this.isLoading = true;
            this.error = null;
            try {
                // params: { bulan, tahun, pegawai_id }
                const response = await apiClient.get('/sdm/absensi/rekap-semua', { params });
                this.rekapList = response.data;
            } catch (e) {
                this.error = 'Gagal mengambil data rekap absensi.';
            } finally {
                this.isLoading = false;
            }
        },
        async inputManual(payload) {
            this.isLoading = true;
            try {
                await apiClient.post('/sdm/absensi/rekap-manual', payload);
            } finally {
                this.isLoading = false;
            }
        }
    }
});