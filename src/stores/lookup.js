// src/stores/lookup.js
import apiClient from '@/services/api';
import { defineStore } from 'pinia';

export const useLookupStore = defineStore('lookup', {
    state: () => ({
        kondisiAset: []
    }),
    actions: {
        async fetchKondisiAset() {
            try {
                const response = await apiClient.get('/lookups/kondisi-aset');
                this.kondisiAset = response.data;
            } catch (e) {
                console.error('Gagal mengambil data kondisi aset:', e);
            }
        }
    }
});
