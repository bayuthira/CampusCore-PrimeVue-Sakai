import { createPinia } from 'pinia';
import { createApp } from 'vue';
import App from './App.vue';
import router from './router';

import { definePreset, updateSurfacePalette } from '@primeuix/themes';
import { defaultThemePreset, getPrimaryPalette, getSurfacePalette } from '@/config/theme';
import PrimeVue from 'primevue/config';
import ConfirmationService from 'primevue/confirmationservice';
import ToastService from 'primevue/toastservice';
import Tooltip from 'primevue/tooltip';

import '@/assets/styles.scss';

const primaryPalette = getPrimaryPalette();
const CampusCorePreset = definePreset(defaultThemePreset, {
    semantic: {
        ...(primaryPalette ? { primary: primaryPalette } : {})
    }
});

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(PrimeVue, {
    theme: {
        preset: CampusCorePreset,
        options: {
            darkModeSelector: '.app-dark'
        }
    }
});
updateSurfacePalette(getSurfacePalette());
app.use(ToastService);
app.use(ConfirmationService);
app.directive('tooltip', Tooltip);
app.mount('#app');
