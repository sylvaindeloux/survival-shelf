<script lang="ts">
  import Check from '@lucide/svelte/icons/check';
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import Droplets from '@lucide/svelte/icons/droplets';
  import Flame from '@lucide/svelte/icons/flame';
  import Plus from '@lucide/svelte/icons/plus';
  import Settings2 from '@lucide/svelte/icons/settings-2';
  import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
  import Users from '@lucide/svelte/icons/users';
  import { app } from '../lib/app.svelte';
  import { CATEGORIES } from '../lib/core/categories';
  import { STORED_WATER_DAYS, isPlanned, isWaterProduct, productTarget } from '../lib/core/plan';
  import type { ProductSummary } from '../lib/core/status';
  import { formatNumber, t, tn } from '../lib/i18n/index.svelte';
  import { categoryIcon, categoryLabel, dailyLabel, formatKcal, formatLiters, quantity, targetLabel, tierLabel } from '../lib/ui/format';
  import { dialogs, router } from '../lib/ui/state.svelte';

  const settings = $derived(app.shelf.settings);
  const menuShare = $derived(app.menu / settings.kcalPerPersonPerDay);
  const categoryOrder = new Map(CATEGORIES.map((category, index) => [category.key, index]));

  function byCategory(list: ProductSummary[]): [string, ProductSummary[]][] {
    const groups = new Map<string, ProductSummary[]>();
    for (const summary of list) groups.set(summary.product.category, [...(groups.get(summary.product.category) ?? []), summary]);
    return [...groups.entries()].sort(([a], [b]) => (categoryOrder.get(a) ?? 99) - (categoryOrder.get(b) ?? 99) || a.localeCompare(b));
  }

  const planned = $derived(byCategory(app.summaries.filter((summary) => isPlanned(summary.product))));
  const waterProducts = $derived(app.summaries.filter((summary) => isWaterProduct(summary.product)));
  const unplanned = $derived(app.summaries.filter((summary) => !isPlanned(summary.product) && !isWaterProduct(summary.product)));
  const dailyWater = $derived(app.autonomy.water.dailyNeed);
</script>

<div class="stack">
  <header class="page-head">
    <div>
      <h1>{t('plan.title')}</h1>
      <p class="muted">{t('plan.subtitle')}</p>
    </div>
    <button class="btn primary" onclick={() => (dialogs.product = {})}><Plus size={18} /><span class="hide-sm">{t('plan.addProduct')}</span></button>
  </header>

  <section class="card stack needs">
    <div class="section-title">
      <h2>{t('plan.needsTitle')}</h2>
      <button class="btn ghost small" onclick={() => router.go('settings')}><Settings2 size={16} />{t('plan.change')}</button>
    </div>
    <div class="stats">
      <span class="stat"><Users size={18} />{tn('plan.people', settings.people)}</span>
      <span class="stat food"><Flame size={18} />{t('plan.kcalNeed', { kcal: formatKcal(settings.kcalPerPersonPerDay) })}</span>
      <span class="stat water"><Droplets size={18} />{t('plan.waterNeed', { liters: formatLiters(settings.waterPerPersonPerDay) })}</span>
    </div>
    <div class="menu">
      <p class="small">
        <strong>{t('plan.menu', { kcal: formatKcal(app.menu) })}</strong>
        <span class="muted">· {formatNumber(Math.round(menuShare * 100), 0)} % {t('plan.ofNeed')}</span>
      </p>
      <div class="bar" class:done={menuShare >= 0.9}><span style:width="{Math.min(1, menuShare) * 100}%"></span></div>
      <p class="hint">{menuShare < 0.9 ? t('plan.menuLow') : t('plan.menuHint')}</p>
    </div>
  </section>

  <section class="card stack">
    <div class="section-title">
      <h2>💧 {t('plan.waterTitle')}</h2>
    </div>
    <p class="small muted">{t('plan.waterText', { liters: formatLiters(dailyWater), days: STORED_WATER_DAYS })}</p>
    <ul class="list">
      {#each app.plan.tiers as tier (tier.days)}
        {@const stored = Math.min(tier.days, STORED_WATER_DAYS) * dailyWater}
        {@const treated = Math.max(0, tier.days - STORED_WATER_DAYS) * dailyWater}
        {@const done = tier.water.missingStored === 0 && tier.water.missingTreatment === 0}
        <li>
          <span class="tier-name">{tierLabel(tier.days)}</span>
          <span class="grow small">
            <span>{t('plan.storedWater', { liters: formatLiters(stored) })}</span>
            {#if treated > 0}<span class="muted">{t('plan.treatedWater', { liters: formatLiters(treated) })}</span>{/if}
          </span>
          {#if done}<span class="pill ok"><Check size={14} /></span>{/if}
        </li>
      {/each}
    </ul>
    {#if waterProducts.length > 0}
      <div class="chips">
        {#each waterProducts as summary (summary.product.name)}
          <button class="chip" onclick={() => (dialogs.product = { name: summary.product.name })}>
            {categoryIcon(summary.product.category)} {summary.product.name} · {quantity(summary.usableQty, summary.product)}
          </button>
        {/each}
      </div>
    {:else}
      <p class="note small"><TriangleAlert size={16} />{t('plan.noWaterProduct')}</p>
    {/if}
  </section>

  {#if planned.length === 0}
    <section class="card empty">
      <p class="muted">{t('plan.empty')}</p>
      <button class="btn primary" onclick={() => (dialogs.product = {})}><Plus size={18} />{t('plan.addProduct')}</button>
    </section>
  {/if}

  {#each planned as [category, list] (category)}
    <section class="group">
      <h2 class="group-title"><span aria-hidden="true">{categoryIcon(category)}</span> {categoryLabel(category)}</h2>
      <ul class="card products">
        {#each list as summary (summary.product.name)}
          {@const product = summary.product}
          <li>
            <button class="product" onclick={() => (dialogs.product = { name: product.name })}>
              <span class="grow">
                <strong>{product.name}</strong>
                <span class="small muted">{[dailyLabel(product), targetLabel(product)].filter(Boolean).join(' · ')}</span>
                <span class="targets">
                  {#each settings.tiers as days (days)}
                    {@const target = productTarget(product, settings, days) ?? 0}
                    {@const reached = summary.usableQty >= target}
                    <span class="target small" class:reached>
                      {#if reached}<Check size={12} />{/if}{tierLabel(days)} · {quantity(target, product)}
                    </span>
                  {/each}
                </span>
              </span>
              <span class="have small num">{t('plan.inStock', { qty: quantity(summary.usableQty, product) })}</span>
              <ChevronRight size={18} class="chevron" />
            </button>
          </li>
        {/each}
      </ul>
    </section>
  {/each}

  {#if unplanned.length > 0}
    <section class="card stack">
      <div>
        <h2>{t('plan.unplannedTitle')}</h2>
        <p class="small muted">{t('plan.unplannedText')}</p>
      </div>
      <div class="chips">
        {#each unplanned as summary (summary.product.name)}
          <button class="chip" onclick={() => (dialogs.product = { name: summary.product.name })}>
            {categoryIcon(summary.product.category)} {summary.product.name}
          </button>
        {/each}
      </div>
    </section>
  {/if}
</div>

<style>
  .needs .section-title {
    margin: 0;
  }

  .stats {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .stat {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.4rem 0.75rem;
    border-radius: 999px;
    background: var(--surface-2);
    font-weight: 600;
    font-size: 0.9rem;
  }

  .stat.food :global(svg) {
    color: var(--food);
  }

  .stat.water :global(svg) {
    color: var(--water);
  }

  .menu {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .tier-name {
    flex: none;
    width: 6rem;
    font-weight: 700;
  }

  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }

  .chip {
    padding: 0.35rem 0.75rem;
    border-radius: 999px;
    border: 1px solid var(--border);
    background: var(--surface);
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
  }

  .chip:hover {
    background: var(--surface-2);
  }

  .note {
    display: flex;
    align-items: flex-start;
    gap: 0.4rem;
    color: var(--warn);
  }

  .empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    text-align: center;
  }

  .group-title {
    font-size: 0.95rem;
    margin: 0 0 0.5rem 0.25rem;
  }

  .products {
    list-style: none;
    margin: 0;
    padding: 0 1rem;
  }

  .products li + li {
    border-top: 1px solid var(--border);
  }

  .product {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    padding: 0.75rem 0;
    border: none;
    background: none;
    text-align: left;
    cursor: pointer;
  }

  .product .grow {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
  }

  .targets {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
    margin-top: 0.3rem;
  }

  .target {
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
    padding: 0.05rem 0.5rem;
    border-radius: 999px;
    background: var(--surface-2);
    color: var(--muted);
    font-size: 0.78rem;
    font-weight: 600;
  }

  .target.reached {
    background: var(--ok-soft);
    color: var(--ok);
  }

  .have {
    flex: none;
    color: var(--muted);
    text-align: right;
  }

  .product :global(.chevron) {
    flex: none;
    color: var(--muted);
  }

  @media (max-width: 420px) {
    .hide-sm {
      display: none;
    }

    .have {
      display: none;
    }
  }
</style>
