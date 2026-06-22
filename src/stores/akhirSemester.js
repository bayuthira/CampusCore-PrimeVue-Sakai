import apiClient from '@/services/api';
import { defineStore } from 'pinia';

export const useAkhirSemesterStore = defineStore('akhirSemester', {
    state: () => ({ status: null, khs: null, transcript: null, outbox: [], corrections: [], isLoading: false, error: null }),
    actions: {
        async run(callback) {
            this.isLoading = true;
            this.error = null;
            try { return await callback(); }
            catch (error) { this.error = error.response?.data?.error || 'Operasi akhir semester gagal.'; throw error; }
            finally { this.isLoading = false; }
        },
        fetchStatus(id) { return this.run(async () => { this.status = (await apiClient.get(`/akademik/akhir-semester/${id}`)).data; }); },
        closeSemester(id) { return this.run(async () => (await apiClient.post(`/akademik/akhir-semester/${id}/tutup`)).data); },
        fetchKhs(id) { return this.run(async () => { this.khs = (await apiClient.get('/akademik/khs-saya', { params: { tahun_akademik_id: id } })).data; }); },
        fetchTranscript() { return this.run(async () => { this.transcript = (await apiClient.get('/akademik/transkrip-saya')).data; }); },
        fetchOutbox() { return this.run(async () => { this.outbox = (await apiClient.get('/akademik/feeder/outbox')).data; }); },
        fetchCorrections() { return this.run(async () => { this.corrections = (await apiClient.get('/akademik/koreksi-nilai')).data; }); },
        submitCorrection(payload) { return this.run(async () => (await apiClient.post('/akademik/koreksi-nilai', payload)).data); },
        reviewCorrection(id, payload) { return this.run(async () => (await apiClient.post(`/akademik/koreksi-nilai/${id}/review`, payload)).data); },
        applyCorrection(id) { return this.run(async () => (await apiClient.post(`/akademik/koreksi-nilai/${id}/terapkan`)).data); }
    }
});
