<script lang="ts">
  import ArrowLeft from '@lucide/svelte/icons/arrow-left';
  import BookOpen from '@lucide/svelte/icons/book-open';
  import House from '@lucide/svelte/icons/house';
  import ListChecks from '@lucide/svelte/icons/list-checks';
  import Package from '@lucide/svelte/icons/package';
  import SettingsIcon from '@lucide/svelte/icons/settings';
  import Siren from '@lucide/svelte/icons/siren';
  import { onMount, type Component } from 'svelte';
  import { app } from './lib/app.svelte';
  import { i18n, t, type MessageKey } from './lib/i18n/index.svelte';
  import BagDialog from './lib/ui/BagDialog.svelte';
  import Banners from './lib/ui/Banners.svelte';
  import { crisisSince, quitCrisis } from './lib/ui/crisis';
  import EmergencyDialog from './lib/ui/EmergencyDialog.svelte';
  import LotDialog from './lib/ui/LotDialog.svelte';
  import Logo from './lib/ui/Logo.svelte';
  import PrintSheet from './lib/ui/PrintSheet.svelte';
  import ProductDialog from './lib/ui/ProductDialog.svelte';
  import TakeDialog from './lib/ui/TakeDialog.svelte';
  import Toasts from './lib/ui/Toasts.svelte';
  import { dialogs, preferences, router, type Route } from './lib/ui/state.svelte';
  import CheckIn from './views/CheckIn.svelte';
  import Crisis from './views/Crisis.svelte';
  import Emergency from './views/Emergency.svelte';
  import Guides from './views/Guides.svelte';
  import Home from './views/Home.svelte';
  import Settings from './views/Settings.svelte';
  import Stock from './views/Stock.svelte';
  import Welcome from './views/Welcome.svelte';

  // One tab per part of the app. The settings are not a part: they sit behind the gear in the corner.
  const TABS: { route: Route; label: MessageKey; icon: Component }[] = [
    { route: 'home', label: 'nav.home', icon: House },
    { route: 'checkin', label: 'nav.todo', icon: ListChecks },
    { route: 'stock', label: 'nav.stock', icon: Package },
    { route: 'emergency', label: 'nav.emergency', icon: Siren },
    { route: 'guides', label: 'nav.guides', icon: BookOpen },
  ];

  const VIEWS: Record<Route, Component> = {
    home: Home,
    checkin: CheckIn,
    stock: Stock,
    emergency: Emergency,
    guides: Guides,
    settings: Settings,
  };
  const crisis = $derived(preferences.crisisSince);
  // In crisis mode, the home tab shows what matters that day.
  const View = $derived(router.route === 'home' && crisis !== null ? Crisis : VIEWS[router.route]);

  // Only what needs doing: expired lots to discard, lots due for rotation and supplies due for replacement,
  // the emergency info to read again and the bags to check.
  const badges = $derived<Partial<Record<Route, number>>>({
    checkin:
      app.checkin.discard.length +
      app.checkin.consume.filter((item) => item.due).length +
      app.checkin.replace.filter((item) => item.due).length +
      (app.emergency.reviewDue ? 1 : 0) +
      app.bags.filter((bag) => bag.checkDue).length,
  });
  // Printing a guide, the emergency info or a bag prints the page on screen, anywhere else the inventory sheet.
  const printsPage = $derived(
    router.route === 'guides' || (router.route === 'emergency' && (router.path === 'info' || router.path.split('/')[0] === 'bags')),
  );

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
    <header class="topbar" class:crisis={crisis !== null}>
      {#if crisis !== null}
        <div class="crisis-bar">
          <Siren size={24} />
          <p><strong>{t('crisis.title')}</strong> · {crisisSince(crisis)}</p>
          <button type="button" class="quit" onclick={quitCrisis}>{t('crisis.quit')}</button>
        </div>
      {/if}
      <div class="topbar-inner">
        <a class="brand" href="#/" aria-label="Survival Shelf"><Logo size={32} /><span class="brand-name">Survival Shelf</span></a>
        <nav class="tabs" aria-label={t('nav.label')}>
          {#each TABS as item (item.route)}
            <a class="tab" href={item.route === 'home' ? '#/' : `#/${item.route}`} aria-current={router.route === item.route ? 'page' : undefined}>
              <item.icon size={24} />
              <span class="tab-label">{t(item.label)}</span>
              {#if badges[item.route]}<span class="count">{badges[item.route]}</span>{/if}
            </a>
          {/each}
        </nav>
        <a class="tab gear" href="#/settings" title={t('nav.settings')} aria-label={t('nav.settings')} aria-current={router.route === 'settings' ? 'page' : undefined}>
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
{#if dialogs.emergency}
  <EmergencyDialog request={dialogs.emergency} />
{/if}
{#if dialogs.bag}
  <BagDialog request={dialogs.bag} />
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

  /* The settings are a tab without a label, in the corner. */
  .gear {
    flex: none;
    margin-left: auto;
  }

  /* Crisis mode: a red bar that says so, with the way out. */
  .crisis-bar {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    padding: 6px 6px 6px 1rem;
    background: var(--danger);
    color: var(--on-primary);
  }

  .crisis-bar :global(svg) {
    flex: none;
  }

  .crisis-bar p {
    flex: 1;
    min-width: 0;
    font-size: 0.95rem;
  }

  .crisis-bar strong {
    font-family: var(--font-display);
    font-size: 1.2rem;
  }

  .quit {
    flex: none;
    min-height: 44px;
    padding: 0 0.75rem;
    border: 1.5px solid currentColor;
    border-radius: var(--radius-sm);
    background: transparent;
    color: inherit;
    font-family: var(--font-display);
    font-size: 1rem;
    font-weight: 700;
    cursor: pointer;
  }

  .quit:hover {
    background: color-mix(in srgb, currentColor 15%, transparent);
  }

  /* On phones the red bar takes the place of the brand and the gear; the tabs stay at the bottom. */
  @media (max-width: 719px) {
    .topbar.crisis {
      background: var(--danger);
      box-shadow: none;
    }

    .topbar.crisis .topbar-inner {
      padding: 0;
    }

    .topbar.crisis .brand,
    .topbar.crisis .gear {
      display: none;
    }
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
    /* The top line is drawn inside the bar, from the same edge as the open tab's bar, which covers it
       exactly: a border would be rounded by the browser and leave the bar sticking out above it. */
    box-shadow: inset 0 1.5px 0 var(--border);
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

  /* Active tab: a solid bar on the top edge, over the bar's top line. */
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

  /* Phones: the gear fills the corner of the top bar from edge to edge, as a bottom tab fills its cell, and
     the open one has its bar on the edge that touches the page. The header line is drawn inside the bar,
     from the same edge as that olive bar, which covers it exactly: a border would be rounded by the browser
     and show around it. */
  @media (max-width: 719px) {
    .topbar {
      border-bottom: none;
      box-shadow: inset 0 -1.5px 0 var(--border);
    }

    .gear {
      width: 56px;
      height: 56px;
      /* Over the padding of the top bar, which keeps its height, and the icon its place. */
      margin: -6px -6px -6px auto;
    }

    .gear[aria-current='page'] {
      box-shadow: inset 0 -3px 0 var(--primary);
    }
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
    .crisis-bar {
      padding: 6px max(1.25rem, calc((100% - 1040px) / 2 + 1.25rem)) 6px max(2rem, calc((100% - 1040px) / 2 + 2rem));
    }

    .topbar-inner {
      max-width: 1040px;
      /* A multiple of 4: at 125 and 150 % zoom the header line stays on a whole pixel, without a seam under
         the open tab. */
      height: 64px;
      margin: 0 auto;
      padding: 0 max(1.25rem, env(safe-area-inset-right, 0px)) 0 max(2rem, env(safe-area-inset-left, 0px));
      align-items: flex-end;
      gap: 1.25rem;
    }

    /* The header only holds the tabs: the logo and the name open the home page instead. */
    .brand {
      display: none;
    }

    .tabs {
      position: static;
      display: flex;
      gap: 2px;
      /* Labels shorten rather than push the gear off the screen. */
      min-width: 0;
      height: auto;
      padding: 0;
      background: none;
      box-shadow: none;
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

    /* The olive bar is the top border itself: no gray line above it. */
    .tab[aria-current='page'] {
      background: var(--bg);
      border-color: var(--border);
      border-top: 3px solid var(--primary);
      box-shadow: none;
      color: var(--text);
    }

    /* The open tab joins the page: between its sides, it hides the header line under it. The tab ends
       on top of that line instead of overlapping it, so its sides stop exactly where the line starts,
       and the cover is taller than the line since browsers round a 1.5px border to 1 or 2 pixels. */
    .tab[aria-current='page']::after {
      content: '';
      position: absolute;
      left: 0;
      right: 0;
      bottom: -2px;
      height: 2px;
      background: var(--bg);
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

    /* The tab names the page, so no title opens it: the page starts right under the open tab, as on phones. */
    main {
      padding: 1rem max(2rem, env(safe-area-inset-right, 0px)) 4rem max(2rem, env(safe-area-inset-left, 0px));
    }
  }

  /* Tablet in portrait: the tabs are tighter. */
  @media (min-width: 720px) and (max-width: 959px) {
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
