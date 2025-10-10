// src/stores/dashboard.js
import { defineStore } from 'pinia';
import apiClient from '@/services/api';

export const useDashboardStore = defineStore('dashboard', {
    state: () => ({
        kondisiAset: null,
        lowStock: [],
        biayaAset: [],
        bookingSummary: null,
        kendaraanSummary: null,
        isLoading: false
    }),
    actions: {
        async fetchAllBaumData(biayaFilter = {}, kendaraanFilter = {}) {
            this.isLoading = true;
            try {
                // Jalankan semua fetch secara paralel
                const [kondisiRes, lowStockRes, biayaRes, bookingRes] = await Promise.all([
                    apiClient.get('/aset/summary-kondisi'),
                    apiClient.get('/aset/konsumsi/low-stock'),
                    apiClient.get('/aset/biaya/summary', { params: biayaFilter }),
                    apiClient.get('/fleet/bookings/summary')
                ]);

                this.kondisiAset = kondisiRes.data;
                this.lowStock = lowStockRes.data;
                this.biayaAset = biayaRes.data;
                this.bookingSummary = bookingRes.data;

                // Fetch kendaraan summary jika ada ID
                if (kendaraanFilter.id) {
                    const kendaraanRes = await apiClient.get(`/fleet/kendaraan/${kendaraanFilter.id}/summary`, { params: kendaraanFilter.params });
                    this.kendaraanSummary = kendaraanRes.data;
                }

            } catch (e) {
                console.error("Gagal mengambil data dashboard:", e);
            } finally {
                this.isLoading = false;
            }
        },
         async fetchKendaraanSummary(id, params) {
            try {
                const response = await apiClient.get(`/fleet/kendaraan/${id}/summary`, { params });
                this.kendaraanSummary = response.data;
            } catch (e) {
                console.error("Gagal fetch summary kendaraan:", e);
            }
        }
    }
});
