import apiClient from '@/services/api';
import { defineStore } from 'pinia';

export const useKrsStore = defineStore('krs', {
    state: () => ({
        myEnrollments: [],
        isLoading: false,
        error: null
    }),
    actions: {
        async fetchMyEnrollments(tahunAkademikId) {
            this.isLoading = true;
            try {
                const response = await apiClient.get('/krs/my-enrollments', {
                    params: { tahun_akademik_id: tahunAkademikId }
                });
                this.myEnrollments = response.data;
            } catch (e) {
                this.error = 'Gagal mengambil data KRS.';
            } finally {
                this.isLoading = false;
            }
        },
        async enroll(payload) {
            this.isLoading = true;
            try {
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