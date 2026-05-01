import apiClient from '@/services/api';
import { defineStore } from 'pinia';

export const useAbsensiStore = defineStore('absensi', {
    state: () => ({
        rekapList: [],
        biometrikList: [], // State untuk daftar status biometrik
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

        /**
        * Mengambil daftar status biometrik semua pegawai
        */
        async fetchBiometrikStatus() {
            this.isLoading = true;
            this.error = null;
            try {
                const response = await apiClient.get('/sdm/absensi/biometrik-status');
                // Keamanan data: Pastikan biometrikList selalu menerima array
                this.biometrikList = Array.isArray(response.data) ? response.data : (response.data.data || []);
            } catch (e) {
                this.error = 'Gagal mengambil status biometrik.';
                console.error('Error fetching biometrik status:', e);
            } finally {
                this.isLoading = false;
            }
        },

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
                // Refresh list biometrik setelah audit agar status di tabel terupdate
                await this.fetchBiometrikStatus();
            } catch (e) {
                console.error('Gagal melakukan audit:', e);
                throw e;
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
                // Refresh list biometrik setelah hapus
                await this.fetchBiometrikStatus();
            } catch (e) {
                console.error('Gagal menghapus foto wajah:', e);
                throw e;
            } finally {
                this.isLoading = false;
            }
        }
    }
});