import apiClient from '@/services/api';
import { defineStore } from 'pinia';

export const useDosenPaStore = defineStore('dosenPa', {
    state: () => ({
        advisees: [],
        adviseeKrs: [],
        isLoading: false,
        error: null
    }),
    actions: {
        async fetchMyAdvisees(tahunAkademikId) {
            this.isLoading = true;
            try {
                const response = await apiClient.get('/dosen-pa/my-advisees', {
                    params: { tahun_akademik_id: tahunAkademikId }
                });
                this.advisees = response.data;
            } finally {
                this.isLoading = false;
            }
        },
        async fetchAdviseeKrs(mahasiswaId, tahunAkademikId) {
            this.isLoading = true;
            try {
                const response = await apiClient.get(`/dosen-pa/advisee-krs/${mahasiswaId}`, {
                    params: { tahun_akademik_id: tahunAkademikId }
                });
                this.adviseeKrs = response.data;
            } finally {
                this.isLoading = false;
            }
        },
        async updateStatus(enrollmentId, status) {
            await apiClient.put(`/krs/enrollments/${enrollmentId}/status`, {
                status_approval: status
            });
        },
        // --- Admin Actions ---
        async singleAssign(payload) {
            // payload: { registrasi_id, dosen_pa_id }
            await apiClient.put('/dosen-pa/single-assign', payload);
        },
        async batchAssign(payload) {
            // payload: { prodi_id, angkatan, kode_rombel, dosen_pa_id }
            await apiClient.put('/dosen-pa/batch-assign', payload);
        }
    }
});
