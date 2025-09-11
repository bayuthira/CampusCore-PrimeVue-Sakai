// src/stores/lookup.js
import apiClient from '@/services/api';
import { defineStore } from 'pinia';

export const useLookupStore = defineStore('lookup', {
    state: () => ({
        kondisiAset: [],
        asetHistoriStatuses: []
    }),
    actions: {
        async fetchKondisiAset() {
            try {
                const response = await apiClient.get('/lookups/kondisi-aset');
                this.kondisiAset = response.data;
            } catch (e) {
                console.error('Gagal mengambil data kondisi aset:', e);
            }
        },
        async fetchAsetHistoriStatuses() {
            try {
                const response = await apiClient.get('/lookups/aset-histori-statuses');
                this.asetHistoriStatuses = response.data;
            } catch (e) {
                console.error('Gagal mengambil data status histori aset:', e);
            }
        },
        async searchUsers(query) {
            try {
                const response = await apiClient.get(`/lookups/users?q=${query}`);
                return response.data; // Kembalikan hasil pencarian
            } catch (e) {
                console.error('Gagal mencari user:', e);
                return []; // Kembalikan array kosong jika error
            }
        }
    }
});
