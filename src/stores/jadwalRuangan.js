// src/stores/jadwalRuangan.js
import apiClient from '@/services/api';
import { defineStore } from 'pinia';

export const useJadwalRuanganStore = defineStore('jadwalRuangan', {
    state: () => ({
        events: [],
        isLoading: false
    }),
    actions: {
        async fetchEvents(ruanganId, start, end) {
            this.isLoading = true;
            try {
                console.log('=== Store fetchEvents ===');
                console.log('URL:', `/aset/ruangan/${ruanganId}/jadwal`);
                console.log('Params:', { start, end });

                const response = await apiClient.get(`/aset/ruangan/${ruanganId}/jadwal`, {
                    params: { start, end }
                });

                console.log('Response data:', response.data);
                console.log('Jumlah events:', response.data.length);

                this.events = response.data.map((event) => ({
                    id: event.id,
                    title: event.judul_kegiatan,
                    start: event.waktu_mulai,
                    end: event.waktu_selesai,
                    extendedProps: event // Simpan semua data asli di sini
                }));

                console.log('Events setelah mapping:', this.events);
            } catch (e) {
                console.error('Gagal mengambil jadwal ruangan:', e);
                console.error('Error response:', e.response?.data);
            } finally {
                this.isLoading = false;
            }
        },
        async createEvent(data) {
            try {
                await apiClient.post('/aset/ruangan/jadwal', data);
            } catch (e) {
                this.error = 'Gagal menambahkan jadwal.';
                throw e;
            }
        },
        async deleteEvent(id) {
            try {
                await apiClient.delete(`/aset/jadwal-ruangan/${id}`);
            } catch (e) {
                this.error = 'Gagal menghapus jadwal.';
                throw e;
            }
        }
    }
});
