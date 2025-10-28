// src/stores/dokumen.js
import apiClient from '@/services/api';
import { defineStore } from 'pinia';

export const useDokumenStore = defineStore('dokumen', {
    state: () => ({
        list: [],
        isLoading: false,
        error: null
    }),
    actions: {
        async fetchList(entityType, entityId) {
            this.isLoading = true;
            this.list = [];
            this.error = null;
            try {
                const response = await apiClient.get(`/sdm/${entityType}/${entityId}/dokumen`);
                this.list = response.data;
            } catch (e) {
                this.error = 'Gagal mengambil daftar dokumen.';
                console.error(e);
            } finally {
                this.isLoading = false;
            }
        },
        async upload(entityType, entityId, formData) {
            this.isLoading = true;
            try {
                await apiClient.post(`/sdm/${entityType}/${entityId}/dokumen`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                await this.fetchList(entityType, entityId); // Refresh list
            } catch (e) {
                this.error = 'Gagal mengupload dokumen.';
                throw e;
            } finally {
                this.isLoading = false;
            }
        },
        async delete(dokumenId) {
            this.isLoading = true;
            try {
                await apiClient.delete(`/sdm/dokumen/${dokumenId}`);
            } catch (e) {
                this.error = 'Gagal menghapus dokumen.';
                throw e;
            } finally {
                this.isLoading = false;
            }
        },
        async viewFile(path) {
            try {
                const correctedPath = path.replace('uploads/', '');
                const response = await apiClient.get(`/files/${correctedPath}`, {
                    responseType: 'blob'
                });
                return response.data;
            } catch (e) {
                throw new Error('Gagal mengunduh file.');
            }
        }
    }
});
