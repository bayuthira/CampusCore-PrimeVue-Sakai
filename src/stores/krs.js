import apiClient from '@/services/api';
import { defineStore } from 'pinia';

export const useKrsStore = defineStore('krs', {
    state: () => ({
        availableJadwal: [], // Jadwal yang bisa dipilih
        myEnrollments: [],   // Mata kuliah yang sudah diambil
        isLoading: false,
        error: null
    }),
    actions: {
        async fetchAvailableJadwal(tahunAkademikId) {
            this.isLoading = true;
            try {
                const response = await apiClient.get('/krs/jadwal-available', {
                    params: { tahun_akademik_id: tahunAkademikId }
                });
                this.availableJadwal = response.data;
            } catch (e) {
                this.error = 'Gagal mengambil jadwal tersedia.';
            } finally {
                this.isLoading = false;
            }
        },
        async fetchMyEnrollments(tahunAkademikId) {
            this.isLoading = true;
            try {
                const response = await apiClient.get('/krs/my-enrollments', {
                    params: { tahun_akademik_id: tahunAkademikId }
                });
                this.myEnrollments = response.data;
            } catch (e) {
                this.error = 'Gagal mengambil data KRS saya.';
            } finally {
                this.isLoading = false;
            }
        },
        // Submit KRS dalam bentuk Array (Batch)
        async submitKrs(payload) {
            this.isLoading = true;
            try {
                // payload: { tahun_akademik_id: UUID, jadwal_kuliah_ids: [UUID] }
                await apiClient.post('/krs/enrollments', payload);
            } finally {
                this.isLoading = false;
            }
        },
        async unenroll(id) {
            this.isLoading = true;
            try {
                await apiClient.delete(`/krs/enrollments/${id}`);
            } finally {
                this.isLoading = false;
            }
        }
    }
});