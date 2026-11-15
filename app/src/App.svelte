<script lang="ts">
  import ArrowLeft from '@lucide/svelte/icons/arrow-left';
  import BookOpen from '@lucide/svelte/icons/book-open';
  import CalendarCheck from '@lucide/svelte/icons/calendar-check';
  import CircleCheck from '@lucide/svelte/icons/circle-check';
  import ClipboardList from '@lucide/svelte/icons/clipboard-list';
  import HardDrive from '@lucide/svelte/icons/hard-drive';
  import House from '@lucide/svelte/icons/house';
  import Package from '@lucide/svelte/icons/package';
  import SettingsIcon from '@lucide/svelte/icons/settings';
  import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
  import { onMount, type Component } from 'svelte';
  import { app } from './lib/app.svelte';
  import { i18n, t, type MessageKey } from './lib/i18n/index.svelte';
  import Banners from './lib/ui/Banners.svelte';
  import LotDialog from './lib/ui/LotDialog.svelte';
  import Logo from './lib/ui/Logo.svelte';
  import PrintSheet from './lib/ui/PrintSheet.svelte';
  import { RHYTHM_TEXTS } from './lib/ui/format';
  import ProductDialog from './lib/ui/ProductDialog.svelte';
  import TakeDialog from './lib/ui/TakeDialog.svelte';
  import Toasts from './lib/ui/Toasts.svelte';
  import { dialogs, preferences, router, type Route } from './lib/ui/state.svelte';
  import CheckIn from './views/CheckIn.svelte';
  import Guides from './views/Guides.svelte';
  import Home from './views/Home.svelte';
  import Plan from './views/Plan.svelte';
  import Settings from './views/Settings.svelte';
  import Stock from './views/Stock.svelte';
  import Welcome from './views/Welcome.svelte';

  const NAV = $derived<{ route: Route; label: MessageKey; icon: Component }[]>([
    { route: 'home', label: 'nav.home', icon: House },
    { route: 'checkin', label: RHYTHM_TEXTS[app.shelf.settings.rhythm].nav, icon: CalendarCheck },
    { route: 'stock', label: 'nav.stock', icon: Package },
    { route: 'plan', label: 'nav.plan', icon: ClipboardList },
    { route: 'guides', label: 'nav.guides', icon: BookOpen },
    { route: 'settings', label: 'nav.settings', icon: SettingsIcon },
  ]);
  // Phones have room for five tabs: the settings are behind the gear of the top bar.
  const TABS = $derived(NAV.filter((item) => item.route !== 'settings'));

  const VIEWS: Record<Route, Component> = { home: Home, checkin: CheckIn, stock: Stock, plan: Plan, guides: Guides, settings: Settings };
  const View = $derived(VIEWS[router.route]);

  // Only what needs doing: expired lots to discard, lots due for rotation and supplies due for replacement.
  const badges = $derived<Partial<Record<Route, number>>>({
    checkin:
      app.checkin.discard.length +
      app.checkin.consume.filter((item) => item.due).length +
      app.checkin.replace.filter((item) => item.due).length,
  });
  const fileWarning = $derived(app.fileState !== 'none' && app.fileState !== 'linked');
  // Printing from the guides prints the guide on screen, anywhere else the inventory sheet.
  const printsPage = $derived(router.route === 'guides');

  onMount(() => {
    void app.init();
  });

  $effect(() => {
    document.documentElement.lang = i18n.lang;
  });

  // Starting (setup, demo, file) comes from a long page: show the overview from its top.
  $effect(() => {
    if (app.started) window.scrollTo({ top: 0 });
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
  {#if router.route === 'guides'}
    <!-- The guides can be read before any stock exists. -->
    <div class="guest">
      <header class="guest-bar no-print">
        <a class="brand" href="#/"><Logo size={30} /><span>Survival Shelf</span></a>
        <a class="btn ghost small" href="#/"><ArrowLeft size={18} />{t('guides.back')}</a>
      </header>
      <main><Guides /></main>
    </div>
  {:else}
    <Welcome />
  {/if}
{:else}
  <div class="layout" class:screen-only={!printsPage}>
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
      <div class="sidebar-foot">
        {@render fileChip()}
        <p class="app-version">v{__APP_VERSION__}</p>
      </div>
    </aside>

    <header class="topbar">
      <a class="brand" href="#/"><Logo size={30} /><span>Survival Shelf</span></a>
      <span class="topbar-actions">
        {@render fileChip()}
        <a class="icon-btn" href="#/settings" aria-label={t('nav.settings')} aria-current={router.route === 'settings' ? 'page' : undefined}>
          <SettingsIcon size={22} />
        </a>
      </span>
    </header>

    <main>
      <div class="no-print"><Banners /></div>
      <View />
    </main>

    <nav class="tabbar" aria-label={t('nav.label')}>
      {#each TABS as item (item.route)}
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
  {#if !printsPage}<PrintSheet />{/if}
{/if}

{#if dialogs.lot}
  <LotDialog request={dialogs.lot} />
{/if}
{#if dialogs.product}
  <ProductDialog name={dialogs.product.name} kind={dialogs.product.kind} />
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
    font-family: var(--font-display);
    font-size: 1.15rem;
    font-weight: 700;
  }

  .file-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    max-width: 100%;
    min-height: 32px;
    padding: 0.25rem 0.7rem;
    border-radius: var(--radius-sm);
    border: 1.5px solid var(--border);
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
    background: var(--surface);
    border-bottom: 1.5px solid var(--border);
  }

  .topbar-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.35rem;
    min-width: 0;
  }

  /* A long file name is cut with an ellipsis instead of pushing the gear off the screen. */
  .topbar .brand {
    flex: none;
  }

  .topbar .file-chip {
    min-width: 0;
  }

  .topbar .icon-btn[aria-current='page'] {
    color: var(--primary);
  }

  /* Reading the guides before starting: a plain page with a way back. */
  .guest-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: calc(0.6rem + env(safe-area-inset-top)) 1rem 0.6rem;
    background: var(--surface);
    border-bottom: 1.5px solid var(--border);
  }

  .guest main {
    padding-bottom: 3rem;
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
    background: var(--surface);
    border-top: 1.5px solid var(--border);
  }

  .tab {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    color: var(--muted);
    text-decoration: none;
    font-size: 0.72rem;
    font-weight: 600;
  }

  .tab-icon {
    position: relative;
    display: inline-flex;
    padding: 3px 14px;
  }

  .tab[aria-current='page'] {
    color: var(--primary);
  }

  /* Active tab: a solid bar on the top edge instead of a soft pill. */
  .tab[aria-current='page']::before {
    content: '';
    position: absolute;
    top: -1.5px;
    left: 22%;
    right: 22%;
    height: 3px;
    border-radius: 0 0 2px 2px;
    background: var(--primary);
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
      border-right: 1.5px solid var(--border);
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
      border-radius: var(--radius-sm);
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
      box-shadow: inset 3px 0 0 var(--primary);
    }

    .badge {
      margin-left: auto;
      min-width: 1.4rem;
      padding: 0 0.4rem;
      border-radius: 4px;
      background: var(--warn-soft);
      color: var(--warn);
      font-size: 0.75rem;
      text-align: center;
    }

    .sidebar-foot {
      margin-top: auto;
    }

    .app-version {
      margin: 0.75rem 0 0;
      padding: 0 0.85rem;
      font-size: 0.75rem;
      color: var(--muted);
    }
  }

  /* A page that prints itself (a guide): drop the navigation, keep the content. */
  @media print {
    .layout {
      display: block;
    }

    .sidebar,
    .topbar,
    .tabbar {
      display: none;
    }

    main {
      max-width: none;
      padding: 0;
    }
  }
</style>
