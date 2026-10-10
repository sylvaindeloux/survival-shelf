import './app.css';
import { mount } from 'svelte';
import { registerSW } from 'virtual:pwa-register';
import App from './App.svelte';
import { app } from './lib/app.svelte';
import { t } from './lib/i18n/index.svelte';

mount(App, { target: document.getElementById('app')! });

// Service workers do not run from file:// (single-file build opened from a disk).
if (location.protocol !== 'file:' && 'serviceWorker' in navigator) {
  const updateServiceWorker = registerSW({
    onNeedRefresh() {
      app.toast(t('pwa.update'), 'info', { label: t('pwa.reload'), run: () => void updateServiceWorker(true) }, true);
    },
    onOfflineReady() {
      app.toast(t('pwa.offlineReady'), 'success');
    },
  });
}
