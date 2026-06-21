<script setup>
const appName = import.meta.env.VITE_APP_NAME || 'CampusCore';
const yearNow = new Date().getFullYear();
</script>

<template>
    <div class="layout-footer">
        &copy; {{ yearNow }}
        <span class="font-medium ml-1">{{ appName }} by Bayu Eka Riarsa Thira.</span>
        UI based on Sakai by
        <a href="https://primevue.org" target="_blank" rel="noopener noreferrer" class="text-primary font-bold hover:underline">PrimeVue</a>
    </div>
</template>
