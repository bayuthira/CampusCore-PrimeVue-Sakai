<template>
    <div class="flex flex-col items-center justify-center min-h-screen text-center">
        <h1 class="text-4xl font-bold">Akses Ditolak</h1>
        <p class="text-lg mt-4">Anda tidak memiliki izin untuk mengakses halaman ini.</p>
        <Button label="Kembali ke Dashboard" icon="pi pi-home" class="mt-6" @click="$router.push('/')" />
    </div>
</template>
