import apiClient from '@/services/api';
import { defineStore } from 'pinia';

export const useJadwalKendaraanStore = defineStore('jadwalKendaraan', {
    state: () => ({
        events: [],
        isLoading: false,
        error: null
    }),
    actions: {
        async fetchBookings(kendaraanId, start, end) {
            this.isLoading = true;
            this.error = null;
            try {
                const response = await apiClient.get(`/fleet/kendaraan/${kendaraanId}/bookings`, {
                    params: {
                        start,
                        end,
                        status: 'Diajukan,Disetujui,Berlangsung,Selesai'
                    }
                });
                this.events = response.data.map((booking) => ({
                    id: booking.id,
                    title: `${booking.tujuan} (${booking.nama_pemesan})`,
                    start: booking.waktu_berangkat,
                    end: booking.estimasi_waktu_kembali,
                    backgroundColor: this.getColorForStatus(booking.status),
                    borderColor: this.getColorForStatus(booking.status),
                    extendedProps: booking
                }));
            } catch (e) {
                console.error('Gagal mengambil data booking:', e);
                this.error = 'Gagal mengambil data booking.';
            } finally {
                this.isLoading = false;
            }
        },

        getColorForStatus(status) {
            switch (status) {
                case 'Disetujui':
                    return '#22C55E';
                case 'Berlangsung':
                    return '#F97316';
                case 'Diajukan':
                    return '#64748B';
                case 'Selesai':
                    return '#3B82F6';
                default:
                    return '#64748B';
            }
        },
        createBooking(data) {
            return apiClient.post('/fleet/bookings', data);
        },
        approveBooking(bookingId, data) {
            return apiClient.put(`/fleet/bookings/${bookingId}/approve`, data);
        },
        rejectBooking(bookingId, data) {
            return apiClient.put(`/fleet/bookings/${bookingId}/reject`, data);
        },
        startTrip(bookingId, data) {
            return apiClient.post(`/fleet/bookings/${bookingId}/start-trip`, data);
        },
        endTrip(bookingId, data) {
            return apiClient.post(`/fleet/bookings/${bookingId}/end-trip`, data);
        },
        async fetchMyBookings() {
            this.isLoading = true;
            this.error = null;
            try {
                const response = await apiClient.get('/fleet/my-bookings');
                return response.data; // Langsung kembalikan data
            } catch (e) {
                this.error = 'Gagal mengambil data booking saya.';
                throw e;
            } finally {
                this.isLoading = false;
            }
        }
    }
});
