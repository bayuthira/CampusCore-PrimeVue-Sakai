import apiClient from '@/services/api';
import { defineStore } from 'pinia';

export const usePembelajaranStore = defineStore('pembelajaran', {
    state: () => ({
        kelas: [],
        pertemuan: [],
        detail: null,
        sesiPresensi: null,
        isLoading: false,
        error: null
    }),
    actions: {
        async withLoading(callback) {
            this.isLoading = true;
            this.error = null;
            try {
                return await callback();
            } catch (error) {
                this.error = error.response?.data?.error || 'Operasi pembelajaran gagal.';
                throw error;
            } finally {
                this.isLoading = false;
            }
        },
        fetchKelas() {
            return this.withLoading(async () => {
                const response = await apiClient.get('/pembelajaran/kelas-saya');
                this.kelas = response.data;
            });
        },
        fetchPertemuan(jadwalId) {
            return this.withLoading(async () => {
                const response = await apiClient.get(`/pembelajaran/jadwal/${jadwalId}/pertemuan`);
                this.pertemuan = response.data;
            });
        },
        createPertemuan(jadwalId, payload) {
            return this.withLoading(async () => {
                await apiClient.post(`/pembelajaran/jadwal/${jadwalId}/pertemuan`, payload);
                await this.fetchPertemuan(jadwalId);
            });
        },
        fetchDetail(pertemuanId) {
            return this.withLoading(async () => {
                const response = await apiClient.get(`/pembelajaran/pertemuan/${pertemuanId}`);
                this.detail = response.data;
            });
        },
        saveBap(pertemuanId, payload) {
            return this.withLoading(async () => {
                await apiClient.put(`/pembelajaran/pertemuan/${pertemuanId}`, payload);
                await this.fetchDetail(pertemuanId);
            });
        },
        openPertemuan(pertemuanId) {
            return this.withLoading(async () => {
                const response = await apiClient.post(`/pembelajaran/pertemuan/${pertemuanId}/buka`);
                this.sesiPresensi = response.data;
                await this.fetchDetail(pertemuanId);
                return response.data;
            });
        },
        closePertemuan(pertemuanId) {
            return this.withLoading(async () => {
                await apiClient.post(`/pembelajaran/pertemuan/${pertemuanId}/tutup`);
                this.sesiPresensi = null;
                await this.fetchDetail(pertemuanId);
            });
        },
        updatePresensi(pertemuanId, enrollmentId, status, catatan = null) {
            return this.withLoading(async () => {
                await apiClient.put(`/pembelajaran/pertemuan/${pertemuanId}/presensi/${enrollmentId}`, { status, catatan });
                await this.fetchDetail(pertemuanId);
            });
        },
        checkIn(kode) {
            return this.withLoading(async () => {
                const response = await apiClient.post('/pembelajaran/presensi/check-in', { kode });
                return response.data;
            });
        }
    }
});
