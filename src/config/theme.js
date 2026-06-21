import Aura from '@primeuix/themes/aura';
import Lara from '@primeuix/themes/lara';
import Nora from '@primeuix/themes/nora';

const presets = { Aura, Lara, Nora };
const primaryColors = ['noir', 'emerald', 'green', 'lime', 'orange', 'amber', 'yellow', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose'];
const surfaceColors = ['slate', 'gray', 'zinc', 'neutral', 'stone', 'soho', 'viva', 'ocean'];
const menuModes = ['static', 'overlay'];
const customSurfacePalettes = {
    soho: { 0: '#ffffff', 50: '#f4f4f4', 100: '#e8e9e9', 200: '#d2d2d4', 300: '#bbbcbe', 400: '#a5a5a9', 500: '#8e8f93', 600: '#77787d', 700: '#616268', 800: '#4a4b52', 900: '#34343d', 950: '#1d1e27' },
    viva: { 0: '#ffffff', 50: '#f3f3f3', 100: '#e7e7e8', 200: '#cfd0d0', 300: '#b7b8b9', 400: '#9fa1a1', 500: '#87898a', 600: '#6e7173', 700: '#565a5b', 800: '#3e4244', 900: '#262b2c', 950: '#0e1315' },
    ocean: { 0: '#ffffff', 50: '#fbfcfc', 100: '#f7f9f8', 200: '#eff3f2', 300: '#dadedd', 400: '#b1b7b6', 500: '#828787', 600: '#5f7274', 700: '#415b61', 800: '#29444e', 900: '#183240', 950: '#0c1920' }
};

function getEnvOption(name, options, fallback) {
    const value = import.meta.env[name];
    return options.includes(value) ? value : fallback;
}

export const defaultThemeConfig = {
    preset: getEnvOption('VITE_THEME_PRESET', Object.keys(presets), 'Aura'),
    primary: getEnvOption('VITE_THEME_PRIMARY', primaryColors, 'blue'),
    surface: getEnvOption('VITE_THEME_SURFACE', surfaceColors, 'slate'),
    menuMode: getEnvOption('VITE_THEME_MENU_MODE', menuModes, 'static')
};

export const defaultThemePreset = presets[defaultThemeConfig.preset];

export function getPrimaryPalette(color = defaultThemeConfig.primary) {
    if (color === 'noir') return null;

    return Object.fromEntries([50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((shade) => [shade, `{${color}.${shade}}`]));
}

export function getSurfacePalette(color = defaultThemeConfig.surface) {
    if (customSurfacePalettes[color]) return customSurfacePalettes[color];

    return {
        0: '#ffffff',
        ...Object.fromEntries([50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((shade) => [shade, `{${color}.${shade}}`]))
    };
}
