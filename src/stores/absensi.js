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
        },

        // --- Fitur Baru: Manajemen Wajah (Biometrik) ---

        /**
         * Mengambil foto referensi wajah sebagai Blob (Aman dengan Token)
         */
        async fetchFaceBlob(pegawaiId) {
            try {
                const response = await apiClient.get(`/sdm/absensi/wajah/${pegawaiId}`, {
                    responseType: 'blob'
                });
                return URL.createObjectURL(response.data);
            } catch (e) {
                console.error('Gagal mengambil foto wajah:', e);
                return null;
            }
        },

        /**
         * Melakukan audit status foto wajah
         */
        async auditFace(pegawaiId, status) {
            this.isLoading = true;
            try {
                await apiClient.put(`/sdm/absensi/wajah/${pegawaiId}/audit`, {
                    status_audit: status
                });
            } finally {
                this.isLoading = false;
            }
        },

        /**
         * Menghapus/Reset foto referensi wajah
         */
        async deleteFace(pegawaiId) {
            this.isLoading = true;
            try {
                await apiClient.delete(`/sdm/absensi/wajah/${pegawaiId}`);
            } finally {
                this.isLoading = false;
            }
        }
    }
});