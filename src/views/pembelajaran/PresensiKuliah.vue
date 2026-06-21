<script setup>
import { usePembelajaranStore } from '@/stores/pembelajaran';
import { useToast } from 'primevue/usetoast';
import { ref } from 'vue';

const store = usePembelajaranStore();
const toast = useToast();
const kode = ref('');

async function submitPresensi() {
    if (!kode.value.trim()) return;
    try {
        const response = await store.checkIn(kode.value.trim().toUpperCase());
        toast.add({ severity: 'success', summary: 'Berhasil', detail: response.message, life: 4000 });
        kode.value = '';
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Presensi Gagal', detail: store.error, life: 4000 });
    }
}
</script>

<template>
    <div class="grid grid-cols-12 gap-6">
        <div class="col-span-12 lg:col-span-6 lg:col-start-4">
            <div class="card text-center">
                <div class="w-20 h-20 mx-auto mb-5 rounded-full bg-primary/10 flex items-center justify-center">
                    <i class="pi pi-check-circle text-primary !text-4xl"></i>
                </div>
                <h1 class="text-2xl font-semibold mb-2">Presensi Perkuliahan</h1>
                <p class="text-muted-color mb-6">Masukkan kode dinamis yang ditampilkan dosen. Kode berlaku selama 10 menit.</p>
                <InputText v-model="kode" maxlength="8" class="w-full text-center !text-2xl tracking-[0.4em] uppercase mb-4"
                    placeholder="KODE" @keyup.enter="submitPresensi" />
                <Button label="Kirim Presensi" icon="pi pi-send" class="w-full" size="large"
                    :loading="store.isLoading" :disabled="!kode.trim()" @click="submitPresensi" />
                <Message severity="info" class="mt-5 text-left">Presensi hanya berhasil jika KRS Anda disetujui dan pertemuan sedang dibuka.</Message>
            </div>
        </div>
    </div>
</template>
