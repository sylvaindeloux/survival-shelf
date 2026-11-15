<script lang="ts">
  import ArrowLeft from '@lucide/svelte/icons/arrow-left';
  import BookOpen from '@lucide/svelte/icons/book-open';
  import House from '@lucide/svelte/icons/house';
  import ListChecks from '@lucide/svelte/icons/list-checks';
  import Package from '@lucide/svelte/icons/package';
  import SettingsIcon from '@lucide/svelte/icons/settings';
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
  import CheckIn from './views/CheckIn.svelte';
  import Guides from './views/Guides.svelte';
  import Home from './views/Home.svelte';
  import Plan from './views/Plan.svelte';
  import Settings from './views/Settings.svelte';
  import Stock from './views/Stock.svelte';
  import Welcome from './views/Welcome.svelte';

  // One tab per part of the app. The settings are not a part: they sit behind the gear in the corner.
  const TABS: { route: Route; label: MessageKey; icon: Component }[] = [
    { route: 'home', label: 'nav.home', icon: House },
    { route: 'checkin', label: 'nav.todo', icon: ListChecks },
    { route: 'stock', label: 'nav.stock', icon: Package },
    { route: 'guides', label: 'nav.guides', icon: BookOpen },
  ];

  const VIEWS: Record<Route, Component> = { home: Home, checkin: CheckIn, stock: Stock, plan: Plan, guides: Guides, settings: Settings };
  const View = $derived(VIEWS[router.route]);
  // The plan sets the targets of the stock, so it lights up the Stock tab.
  const tab = $derived<Route>(router.route === 'plan' ? 'stock' : router.route);

  // Only what needs doing: expired lots to discard, lots due for rotation and supplies due for replacement.
  const badges = $derived<Partial<Record<Route, number>>>({
    checkin:
      app.checkin.discard.length +
      app.checkin.consume.filter((item) => item.due).length +
      app.checkin.replace.filter((item) => item.due).length,
  });
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
    <header class="topbar">
      <div class="topbar-inner">
        <a class="brand" href="#/" aria-label="Survival Shelf"><Logo size={32} /><span class="brand-name">Survival Shelf</span></a>
        <nav class="tabs" aria-label={t('nav.label')}>
          {#each TABS as item (item.route)}
            <a class="tab" href={item.route === 'home' ? '#/' : `#/${item.route}`} aria-current={tab === item.route ? 'page' : undefined}>
              <item.icon size={24} />
              <span class="tab-label">{t(item.label)}</span>
              {#if badges[item.route]}<span class="count">{badges[item.route]}</span>{/if}
            </a>
          {/each}
        </nav>
        <a class="gear" href="#/settings" title={t('nav.settings')} aria-label={t('nav.settings')} aria-current={router.route === 'settings' ? 'page' : undefined}>
          <SettingsIcon size={24} />
        </a>
      </div>
    </header>

    <main>
      <div class="no-print"><Banners /></div>
      <View />
    </main>
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
    font-size: 1.25rem;
    font-weight: 700;
  }

  /* Phone layout: brand and gear on top, the tabs at the bottom, under the thumb. */
  .topbar {
    position: sticky;
    top: 0;
    z-index: 10;
    padding-top: env(safe-area-inset-top, 0px);
    background: var(--surface);
    border-bottom: 1.5px solid var(--border);
  }

  .topbar-inner {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 6px 6px 6px 1rem;
  }

  .gear {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: none;
    width: 44px;
    height: 44px;
    margin-left: auto;
    border-radius: var(--radius-sm);
    color: var(--muted);
  }

  .gear:hover {
    background: var(--surface-2);
    color: var(--text);
  }

  .gear[aria-current='page'] {
    background: var(--primary-soft);
    color: var(--primary);
  }

  .tabs {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 10;
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: minmax(0, 1fr);
    height: calc(var(--nav-height) + var(--safe-bottom));
    padding: 0 env(safe-area-inset-right, 0px) var(--safe-bottom) env(safe-area-inset-left, 0px);
    background: var(--surface);
    border-top: 1.5px solid var(--border);
  }

  .tab {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    min-width: 0;
    color: var(--muted);
    text-decoration: none;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .tab-label {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* Active tab: a solid bar on the top edge. */
  .tab[aria-current='page'] {
    color: var(--primary);
    box-shadow: inset 0 3px 0 var(--primary);
  }

  /* What needs doing, on the corner of the icon. */
  .count {
    position: absolute;
    top: 4px;
    left: calc(50% + 6px);
    min-width: 18px;
    padding: 0 4px;
    border-radius: 4px;
    background: var(--warn-soft);
    color: var(--warn);
    font-size: 0.7rem;
    font-weight: 700;
    line-height: 16px;
    text-align: center;
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

  /* Tablet and desktop: folder tabs in the top bar, the open one joins the page. */
  @media (min-width: 720px) {
    .topbar-inner {
      max-width: 1040px;
      height: 68px;
      margin: 0 auto;
      padding: 0 max(1.25rem, env(safe-area-inset-right, 0px)) 0 max(2rem, env(safe-area-inset-left, 0px));
      align-items: flex-end;
      gap: 1.25rem;
    }

    .brand,
    .gear {
      align-self: center;
    }

    .tabs {
      position: static;
      display: flex;
      gap: 2px;
      /* Labels shorten rather than push the gear off the screen. */
      min-width: 0;
      height: auto;
      margin-bottom: -1.5px;
      padding: 0;
      background: none;
      border: none;
    }

    .tab {
      flex-direction: row;
      gap: 8px;
      height: 50px;
      padding: 0 14px;
      border: 1.5px solid transparent;
      border-bottom: none;
      border-radius: var(--radius) var(--radius) 0 0;
      font-size: 1rem;
    }

    .tab :global(svg) {
      width: 20px;
      height: 20px;
    }

    .tab:hover {
      background: var(--surface-2);
      color: var(--text);
    }

    .tab[aria-current='page'] {
      background: var(--bg);
      border-color: var(--border);
      color: var(--text);
    }

    .tab[aria-current='page'] :global(svg) {
      color: var(--primary);
    }

    .count {
      position: static;
      min-width: 22px;
      padding: 0 6px;
      font-size: 0.8rem;
      line-height: 1.5;
    }

    main {
      padding: 2rem max(2rem, env(safe-area-inset-right, 0px)) 4rem max(2rem, env(safe-area-inset-left, 0px));
    }
  }

  /* Tablet in portrait: the logo alone takes the user home, and the tabs are tighter. */
  @media (min-width: 720px) and (max-width: 959px) {
    .brand-name {
      display: none;
    }

    .topbar-inner {
      gap: 0.75rem;
    }

    .tab {
      gap: 6px;
      padding: 0 10px;
    }
  }

  /* A page that prints itself (a guide): drop the navigation, keep the content. */
  @media print {
    .topbar {
      display: none;
    }

    main {
      max-width: none;
      padding: 0;
    }
  }
</style>
