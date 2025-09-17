// src/stores/aset.js
import apiClient from '@/services/api';
import { defineStore } from 'pinia';

export const useAsetStore = defineStore('aset', {
    state: () => ({
        asetList: [],
        isLoading: false,
        error: null
    }),
    actions: {
        async fetchAset() {
            this.isLoading = true;
            this.error = null;
            try {
                const response = await apiClient.get('/aset/item');
                this.asetList = response.data.map((aset) => ({
                    ...aset,
                    info_lokasi: aset.peminjaman_id ? `Dipinjam: ${aset.nama_peminjam}` : aset.nama_ruangan || 'Gudang'
                }));
            } catch (e) {
                this.error = 'Gagal mengambil data Aset.';
            } finally {
                this.isLoading = false;
            }
        },
        async createAset(data) {
            this.isLoading = true;
            this.error = null;
            try {
                await apiClient.post('/aset/item', data);
                await this.fetchAset(); // Refresh list setelah create
            } catch (e) {
                this.error = 'Gagal membuat Aset baru.';
                throw e; // Propagate error untuk ditangani di komponen
            } finally {
                this.isLoading = false;
            }
        },
        async updateAset(id, data) {
            this.isLoading = true;
            this.error = null;
            try {
                await apiClient.put(`/aset/item/${id}`, data);
                await this.fetchAset(); // Refresh list setelah update
            } catch (e) {
                this.error = 'Gagal memperbarui Aset.';
                throw e;
            } finally {
                this.isLoading = false;
            }
        },
        async deleteAset(id) {
            this.isLoading = true;
            this.error = null;
            try {
                await apiClient.delete(`/aset/item/${id}`);
                await this.fetchAset(); // Refresh list setelah delete
            } catch (e) {
                this.error = 'Gagal menghapus Aset.';
                throw e;
            } finally {
                this.isLoading = false;
            }
        },
        async tambahHistori(asetId, data) {
            this.isLoading = true;
            this.error = null;
            try {
                await apiClient.post(`/aset/item/${asetId}/histori`, data);
                await this.fetchAset(); // Refresh data aset (mungkin lokasinya berubah)
            } catch (e) {
                this.error = 'Gagal menambah histori aset.';
                throw e;
            } finally {
                this.isLoading = false;
            }
        },
        async fetchAsetHistori(asetId) {
            this.isLoading = true; // Gunakan loading state yang ada
            this.error = null;
            try {
                const response = await apiClient.get(`/aset/item/${asetId}/histori`);
                return response.data; // Langsung kembalikan data histori
            } catch (e) {
                this.error = 'Gagal mengambil data histori aset.';
                throw e;
            } finally {
                this.isLoading = false;
            }
        },
        async pinjamAset(asetId, data) {
            this.isLoading = true;
            this.error = null;
            try {
                await apiClient.post(`/aset/item/${asetId}/pinjam`, data);
                await this.fetchAset();
            } catch (e) {
                this.error = 'Gagal meminjamkan aset.';
                throw e;
            } finally {
                this.isLoading = false;
            }
        },
        async kembalikanAset(peminjamanId, data) {
            this.isLoading = true;
            this.error = null;
            try {
                await apiClient.post(`/peminjaman/${peminjamanId}/kembalikan`, data);
                await this.fetchAset();
            } catch (e) {
                this.error = 'Gagal mengembalikan aset.';
                throw e;
            } finally {
                this.isLoading = false;
            }
        },
        async tambahBiaya(asetId, formData) {
            this.isLoading = true;
            this.error = null;
            try {
                // Kirim sebagai multipart/form-data
                await apiClient.post(`/aset/item/${asetId}/biaya`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
                // Tidak perlu fetchAset karena tidak mengubah data utama di tabel
            } catch (e) {
                this.error = 'Gagal menambah biaya aset.';
                throw e;
            } finally {
                this.isLoading = false;
            }
        },
        async fetchBiaya(asetId) {
            this.isLoading = true;
            try {
                const response = await apiClient.get(`/aset/item/${asetId}/biaya`);
                return response.data;
            } catch (e) {
                throw new Error('Gagal mengambil daftar biaya.');
            } finally {
                this.isLoading = false;
            }
        },

        async updateBiaya(biayaId, data) {
            this.isLoading = true;
            try {
                await apiClient.put(`/aset/biaya/${biayaId}`, data);
            } catch (e) {
                throw new Error('Gagal memperbarui biaya.');
            } finally {
                this.isLoading = false;
            }
        },

        async deleteBiaya(biayaId) {
            this.isLoading = true;
            try {
                await apiClient.delete(`/aset/biaya/${biayaId}`);
            } catch (e) {
                throw new Error('Gagal menghapus biaya.');
            } finally {
                this.isLoading = false;
            }
        },
        async getBuktiFile(filePath) {
            try {
                // PERBAIKAN: Hapus 'uploads/' dari awal path
                const correctedPath = filePath.replace('uploads/', '');

                // Gunakan path yang sudah diperbaiki
                const response = await apiClient.get(`/files/${correctedPath}`, {
                    responseType: 'blob'
                });
                return response.data;
            } catch (e) {
                throw new Error('Gagal mengunduh file bukti.');
            }
        },
        async updateBuktiBiaya(biayaId, formData) {
            this.isLoading = true;
            try {
                await apiClient.post(`/aset/biaya/${biayaId}/update-bukti`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
            } catch (e) {
                throw new Error('Gagal memperbarui bukti.');
            } finally {
                this.isLoading = false;
            }
        },

        async hapusBuktiBiaya(biayaId) {
            this.isLoading = true;
            try {
                await apiClient.delete(`/aset/biaya/${biayaId}/hapus-bukti`);
            } catch (e) {
                throw new Error('Gagal menghapus bukti.');
            } finally {
                this.isLoading = false;
            }
        },
        async fetchAsetByRuangan(ruanganId) {
            this.isLoading = true;
            this.error = null;
            try {
                const response = await apiClient.get(`/aset/item?ruangan_id=${ruanganId}`);
                return response.data; // Langsung kembalikan hasilnya
            } catch (e) {
                this.error = 'Gagal mengambil data aset per ruangan.';
                throw e;
            } finally {
                this.isLoading = false;
            }
        }
    }
});
