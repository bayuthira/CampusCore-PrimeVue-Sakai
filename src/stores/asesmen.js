import apiClient from '@/services/api';
import { defineStore } from 'pinia';

export const useAsesmenStore = defineStore('asesmen', {
    state: () => ({
        list: [],
        schedules: [],
        detail: null,
        studentList: [],
        isLoading: false,
        error: null
    }),
    actions: {
        async run(callback) {
            this.isLoading = true;
            this.error = null;
            try {
                return await callback();
            } catch (error) {
                this.error = error.response?.data?.error || 'Operasi asesmen gagal.';
                throw error;
            } finally {
                this.isLoading = false;
            }
        },
        fetchAll(tahunAkademikId) {
            return this.run(async () => {
                const response = await apiClient.get('/asesmen', { params: { tahun_akademik_id: tahunAkademikId } });
                this.list = response.data;
            });
        },
        fetchSchedules(tahunAkademikId) {
            return this.run(async () => {
                const response = await apiClient.get('/asesmen/jadwal', { params: { tahun_akademik_id: tahunAkademikId } });
                this.schedules = response.data;
            });
        },
        fetchDetail(id) {
            return this.run(async () => {
                const response = await apiClient.get(`/asesmen/${id}`);
                this.detail = response.data;
                return response.data;
            });
        },
        save(payload, id = null) {
            return this.run(async () => {
                const response = id ? await apiClient.put(`/asesmen/${id}`, payload) : await apiClient.post('/asesmen', payload);
                this.detail = response.data;
                return response.data;
            });
        },
        action(id, action, payload = undefined) {
            return this.run(async () => {
                const response = await apiClient.post(`/asesmen/${id}/${action}`, payload);
                return response.data;
            });
        },
        upload(id, jenis, formData) {
            return this.run(async () => {
                await apiClient.post(`/asesmen/${id}/dokumen/${jenis}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                await this.fetchDetail(id);
            });
        },
        async download(id, file) {
            const response = await apiClient.get(`/asesmen/${id}/dokumen/${file.id}/download`, { responseType: 'blob' });
            const url = URL.createObjectURL(response.data);
            const link = document.createElement('a');
            link.href = url;
            link.download = file.nama_file_asli;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
        },
        production(id, payload) {
            return this.run(() => apiClient.put(`/asesmen/${id}/penggandaan`, payload));
        },
        attendance(id, enrollmentId, payload) {
            return this.run(() => apiClient.put(`/asesmen/${id}/presensi/${enrollmentId}`, payload));
        },
        grade(id, enrollmentId, payload) {
            return this.run(() => apiClient.put(`/asesmen/${id}/nilai/${enrollmentId}`, payload));
        },
        fetchStudent(tahunAkademikId) {
            return this.run(async () => {
                const response = await apiClient.get('/asesmen-saya', { params: { tahun_akademik_id: tahunAkademikId } });
                this.studentList = response.data;
            });
        },
        checkIn(kode) {
            return this.run(async () => (await apiClient.post('/asesmen-saya/check-in', { kode })).data);
        }
    }
});
