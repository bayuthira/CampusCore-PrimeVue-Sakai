// src/stores/role.js
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

export const useRoleStore = defineStore('role', {
    state: () => ({
        roleList: [],
        isLoading: false
    }),
    actions: {
        async fetchRoles() {
            this.isLoading = true;
            try {
                const response = await apiClient.get('/roles');
                this.roleList = response.data;
            } catch (e) {
                console.error('Gagal mengambil data roles:', e);
            } finally {
                this.isLoading = false;
            }
        }
    }
});
