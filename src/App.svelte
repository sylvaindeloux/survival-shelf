<script lang="ts">
  import CircleCheck from '@lucide/svelte/icons/circle-check';
  import HardDrive from '@lucide/svelte/icons/hard-drive';
  import House from '@lucide/svelte/icons/house';
  import Package from '@lucide/svelte/icons/package';
  import RefreshCw from '@lucide/svelte/icons/refresh-cw';
  import SettingsIcon from '@lucide/svelte/icons/settings';
  import ShoppingCart from '@lucide/svelte/icons/shopping-cart';
  import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
  import { onMount, type Component } from 'svelte';
  import { app } from './lib/app.svelte';
  import { i18n, t, type MessageKey } from './lib/i18n/index.svelte';
  import Banners from './lib/ui/Banners.svelte';
  import LotDialog from './lib/ui/LotDialog.svelte';
  import Logo from './lib/ui/Logo.svelte';
  import PrintSheet from './lib/ui/PrintSheet.svelte';
  import ProductDialog from './lib/ui/ProductDialog.svelte';
  import TakeDialog from './lib/ui/TakeDialog.svelte';
  import Toasts from './lib/ui/Toasts.svelte';
  import { dialogs, preferences, router, type Route } from './lib/ui/state.svelte';
  import Home from './views/Home.svelte';
  import Rotation from './views/Rotation.svelte';
  import Settings from './views/Settings.svelte';
  import Shopping from './views/Shopping.svelte';
  import Stock from './views/Stock.svelte';
  import Welcome from './views/Welcome.svelte';

  const NAV: { route: Route; label: MessageKey; icon: Component }[] = [
    { route: 'home', label: 'nav.home', icon: House },
    { route: 'stock', label: 'nav.stock', icon: Package },
    { route: 'rotation', label: 'nav.rotation', icon: RefreshCw },
    { route: 'shopping', label: 'nav.shopping', icon: ShoppingCart },
    { route: 'settings', label: 'nav.settings', icon: SettingsIcon },
  ];

  const VIEWS: Record<Route, Component> = { home: Home, stock: Stock, rotation: Rotation, shopping: Shopping, settings: Settings };
  const View = $derived(VIEWS[router.route]);

  const badges = $derived<Partial<Record<Route, number>>>({
    stock: app.alerts.expired.length + app.alerts.soon.length,
    shopping: app.shopping.length,
  });
  const fileWarning = $derived(app.fileState !== 'none' && app.fileState !== 'linked');

  onMount(() => {
    void app.init();
  });

  $effect(() => {
    document.documentElement.lang = i18n.lang;
  });

  $effect(() => {
    if (preferences.theme === 'auto') delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = preferences.theme;
  });
</script>

{#snippet fileChip()}
  <button class="file-chip" class:warn={fileWarning} class:linked={app.fileState === 'linked'} onclick={() => router.go('settings')}>
    {#if fileWarning}
      <TriangleAlert size={16} /><span>{t('settings.attention')}</span>
    {:else if app.fileState === 'linked'}
      <CircleCheck size={16} /><span>{app.fileName}</span>
    {:else}
      <HardDrive size={16} /><span>{t('settings.browserOnly')}</span>
    {/if}
  </button>
{/snippet}

{#if !app.ready}
  <div class="splash" aria-busy="true"><Logo size={64} /></div>
{:else if !app.started}
  <Welcome />
{:else}
  <div class="layout screen-only">
    <aside class="sidebar">
      <a class="brand" href="#/"><Logo size={36} /><span>Survival Shelf</span></a>
      <nav aria-label={t('nav.label')}>
        {#each NAV as item (item.route)}
          <a class="nav-link" href={item.route === 'home' ? '#/' : `#/${item.route}`} aria-current={router.route === item.route ? 'page' : undefined}>
            <item.icon size={20} />
            <span>{t(item.label)}</span>
            {#if badges[item.route]}<span class="badge">{badges[item.route]}</span>{/if}
          </a>
        {/each}
      </nav>
      <div class="sidebar-foot">{@render fileChip()}</div>
    </aside>

    <header class="topbar">
      <a class="brand" href="#/"><Logo size={30} /><span>Survival Shelf</span></a>
      {@render fileChip()}
    </header>

    <main>
      <Banners />
      <View />
    </main>

    <nav class="tabbar" aria-label={t('nav.label')}>
      {#each NAV as item (item.route)}
        <a class="tab" href={item.route === 'home' ? '#/' : `#/${item.route}`} aria-current={router.route === item.route ? 'page' : undefined}>
          <span class="tab-icon">
            <item.icon size={22} />
            {#if badges[item.route]}<span class="dot"></span>{/if}
          </span>
          <span>{t(item.label)}</span>
        </a>
      {/each}
    </nav>
  </div>
  <PrintSheet />
{/if}

{#if dialogs.lot}
  <LotDialog request={dialogs.lot} />
{/if}
{#if dialogs.product}
  <ProductDialog name={dialogs.product.name} />
{/if}
{#if dialogs.take}
  <TakeDialog request={dialogs.take} />
{/if}
<Toasts />

<style>
  .splash {
    min-height: 100dvh;
    display: grid;
    place-items: center;
  }

  .layout {
    min-height: 100dvh;
  }

  main {
    max-width: 1040px;
    margin: 0 auto;
    padding: 1rem 1rem calc(var(--nav-height) + var(--safe-bottom) + 6rem);
  }

  .brand {
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    color: var(--text);
    text-decoration: none;
    font-weight: 800;
    letter-spacing: -0.01em;
  }

  .file-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    max-width: 100%;
    min-height: 32px;
    padding: 0.25rem 0.7rem;
    border-radius: 999px;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--muted);
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
  }

  .file-chip span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .file-chip.linked {
    color: var(--ok);
  }

  .file-chip.warn {
    color: var(--warn);
    border-color: color-mix(in srgb, var(--warn) 40%, var(--border));
    background: var(--warn-soft);
  }

  /* Phone layout: top bar + bottom tabs. */
  .topbar {
    position: sticky;
    top: 0;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: calc(0.6rem + env(safe-area-inset-top)) 1rem 0.6rem;
    background: color-mix(in srgb, var(--bg) 88%, transparent);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--border);
  }

  .topbar .file-chip {
    max-width: 50%;
  }

  .tabbar {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 10;
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    height: calc(var(--nav-height) + var(--safe-bottom));
    padding-bottom: var(--safe-bottom);
    background: color-mix(in srgb, var(--surface) 92%, transparent);
    backdrop-filter: blur(12px);
    border-top: 1px solid var(--border);
  }

  .tab {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    color: var(--muted);
    text-decoration: none;
    font-size: 0.7rem;
    font-weight: 600;
  }

  .tab-icon {
    position: relative;
    display: inline-flex;
    padding: 3px 14px;
    border-radius: 999px;
  }

  .tab[aria-current='page'] {
    color: var(--primary);
  }

  .tab[aria-current='page'] .tab-icon {
    background: var(--primary-soft);
  }

  .dot {
    position: absolute;
    top: 2px;
    right: 10px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--warn);
    border: 2px solid var(--surface);
  }

  .sidebar {
    display: none;
  }

  /* Desktop layout: sidebar. */
  @media (min-width: 900px) {
    .layout {
      display: grid;
      grid-template-columns: 250px minmax(0, 1fr);
    }

    .topbar,
    .tabbar {
      display: none;
    }

    main {
      width: 100%;
      padding: 2rem 2rem 4rem;
    }

    .sidebar {
      position: sticky;
      top: 0;
      height: 100dvh;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      padding: 1.5rem 1rem;
      border-right: 1px solid var(--border);
      background: var(--surface);
    }

    .sidebar nav {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .nav-link {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.65rem 0.85rem;
      border-radius: 12px;
      color: var(--muted);
      text-decoration: none;
      font-weight: 600;
    }

    .nav-link:hover {
      background: var(--surface-2);
      color: var(--text);
    }

    .nav-link[aria-current='page'] {
      background: var(--primary-soft);
      color: var(--primary);
    }

    .badge {
      margin-left: auto;
      min-width: 1.4rem;
      padding: 0 0.4rem;
      border-radius: 999px;
      background: var(--warn-soft);
      color: var(--warn);
      font-size: 0.75rem;
      text-align: center;
    }

    .sidebar-foot {
      margin-top: auto;
    }
  }
</style>
