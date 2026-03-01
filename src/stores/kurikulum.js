import apiClient from '@/services/api';
import { defineStore } from 'pinia';

export const useKurikulumStore = defineStore('kurikulum', {
    state: () => ({
        list: [],
        currentSubjects: [],
        isLoading: false,
        error: null
    }),
    actions: {
        async fetchAll() {
            this.isLoading = true;
            try {
                const response = await apiClient.get('/kurikulum');
                this.list = response.data;
            } catch (e) {
                this.error = 'Gagal mengambil data kurikulum.';
            } finally {
                this.isLoading = false;
            }
        },
        async create(data) {
            await apiClient.post('/kurikulum', data);
            await this.fetchAll();
        },
        async update(id, data) {
            await apiClient.put(`/kurikulum/${id}`, data);
            await this.fetchAll();
        },
        async delete(id) {
            await apiClient.delete(`/kurikulum/${id}`);
            await this.fetchAll();
        },

        // --- Pemetaan Mata Kuliah ---
        async fetchSubjects(kurikulumId) {
            this.isLoading = true;
            try {
                const response = await apiClient.get(`/kurikulum/${kurikulumId}/matakuliah`);
                this.currentSubjects = response.data;
            } finally {
                this.isLoading = false;
            }
        },
        async addSubject(kurikulumId, mkId) {
            await apiClient.post(`/kurikulum/${kurikulumId}/matakuliah`, { matakuliah_id: mkId });
            await this.fetchSubjects(kurikulumId);
        },
        async removeSubject(kurikulumId, mkId) {
            await apiClient.delete(`/kurikulum/${kurikulumId}/matakuliah/${mkId}`);
            await this.fetchSubjects(kurikulumId);
        }
    }
});