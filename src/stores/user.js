// src/stores/user.js
import apiClient from '@/services/api';
import { defineStore } from 'pinia';
import { useAuthStore } from './auth';

apiClient.interceptors.request.use((config) => {
    const authStore = useAuthStore();
    if (authStore.token) {
        config.headers.Authorization = `Bearer ${authStore.token}`;
    }
    return config;
});

export const useUserStore = defineStore('user', {
    state: () => ({
        userList: [],
        isLoading: false,
        error: null
    }),
    actions: {
        async fetchUsers() {
            this.isLoading = true;
            this.error = null;
            try {
                const response = await apiClient.get('/users');

                // ---- PERUBAHAN DI SINI ----
                // Kita akan loop setiap user dan menambahkan field baru 'status_label'
                const usersWithStatusLabel = response.data.map((user) => {
                    return {
                        ...user, // Salin semua data user yang sudah ada
                        status_label: user.is_active ? 'AKTIF' : 'TIDAK' // Tambahkan field baru
                    };
                });

                this.userList = usersWithStatusLabel; // Simpan data yang sudah dimodifikasi
            } catch (e) {
                this.error = 'Gagal mengambil data pengguna.';
                console.error(e);
            } finally {
                this.isLoading = false;
            }
        },
        async createUser(userData) {
            this.isLoading = true;
            this.error = null;
            try {
                await apiClient.post('/users', userData);
                await this.fetchUsers();
            } catch (e) {
                this.error = 'Gagal membuat pengguna baru.';
                throw e;
            } finally {
                this.isLoading = false;
            }
        },
        async updateUser(userId, userData) {
            this.isLoading = true;
            this.error = null;
            try {
                await apiClient.put(`/users/${userId}`, userData);
                await this.fetchUsers();
            } catch (e) {
                this.error = 'Gagal memperbarui pengguna.';
                throw e;
            } finally {
                this.isLoading = false;
            }
        },
        async resetPassword(userId, newPassword) {
            this.isLoading = true;
            this.error = null;
            try {
                await apiClient.put(`/users/${userId}/reset-password`, { new_password: newPassword });
            } catch (e) {
                this.error = 'Gagal mereset password.';
                throw e;
            } finally {
                this.isLoading = false;
            }
        },
        async deleteUser(userId) {
            this.isLoading = true;
            this.error = null;
            try {
                await apiClient.delete(`/users/${userId}`);
                await this.fetchUsers();
            } catch (e) {
                this.error = 'Gagal menghapus pengguna.';
                throw e;
            } finally {
                this.isLoading = false;
            }
        },
        async assignRole(userId, roleId) {
            try {
                await apiClient.post('/users/assign-role', { user_id: userId, role_id: roleId });
            } catch (e) {
                console.error(`Gagal memberikan role ${roleId} ke user ${userId}`, e);
                throw e; // Lemparkan error agar bisa ditangani
            }
        },
        async revokeRole(userId, roleId) {
            try {
                // Perhatikan: Method DELETE dengan body, pastikan backend Anda handle ini
                await apiClient.delete('/users/revoke-role', {
                    data: { user_id: userId, role_id: roleId }
                });
            } catch (e) {
                console.error(`Gagal mencabut role ${roleId} dari user ${userId}`, e);
                throw e;
            }
        }
    }
});
