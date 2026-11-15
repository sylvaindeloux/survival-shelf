<script lang="ts">
  import ArrowLeft from '@lucide/svelte/icons/arrow-left';
  import Cat from '@lucide/svelte/icons/cat';
  import Check from '@lucide/svelte/icons/check';
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import Dog from '@lucide/svelte/icons/dog';
  import Droplets from '@lucide/svelte/icons/droplets';
  import Flame from '@lucide/svelte/icons/flame';
  import Plus from '@lucide/svelte/icons/plus';
  import Settings2 from '@lucide/svelte/icons/settings-2';
  import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
  import Users from '@lucide/svelte/icons/users';
  import { app } from '../lib/app.svelte';
  import { CATEGORIES, KINDS } from '../lib/core/categories';
  import { STORED_WATER_DAYS, isPlanned, isWaterProduct, productTarget } from '../lib/core/plan';
  import type { ProductSummary } from '../lib/core/status';
  import type { Kind } from '../lib/core/types';
  import { formatNumber, t, tn, type MessageKey } from '../lib/i18n/index.svelte';
  import CategoryIcon from '../lib/ui/CategoryIcon.svelte';
  import KindCard from '../lib/ui/KindCard.svelte';
  import { KIND_TEXTS, categoryLabel, dailyLabel, formatKcal, formatLiters, kindLabel, quantity, targetLabel, tierLabel } from '../lib/ui/format';
  import { dialogs, kindOfPath, router } from '../lib/ui/state.svelte';

  const settings = $derived(app.shelf.settings);
  const menuShare = $derived(app.menu / settings.kcalPerPersonPerDay);
  const categoryOrder = new Map(CATEGORIES.map((category, index) => [category.key, index]));

  /** Null on the hub, which shows one card per kind. */
  const kind = $derived(kindOfPath(router.path));

  /** What each kind is about, under its title. */
  const INTROS: Record<Kind, MessageKey> = {
    food: 'kind.foodHint',
    consumable: 'plan.consumableText',
    gear: 'plan.gearText',
  };

  function byCategory(list: ProductSummary[]): [string, ProductSummary[]][] {
    const groups = new Map<string, ProductSummary[]>();
    for (const summary of list) groups.set(summary.product.category, [...(groups.get(summary.product.category) ?? []), summary]);
    return [...groups.entries()].sort(([a], [b]) => (categoryOrder.get(a) ?? 99) - (categoryOrder.get(b) ?? 99) || a.localeCompare(b));
  }

  function ofKind(of: Kind): ProductSummary[] {
    return app.summaries.filter((summary) => summary.product.kind === of);
  }

  const scope = $derived(kind ? ofKind(kind) : []);
  const planned = $derived(byCategory(scope.filter((summary) => isPlanned(summary.product))));
  // Water is planned from the water need, whatever the kind of its products (a filter is gear): it stays with the food.
  const waterProducts = $derived(app.summaries.filter((summary) => isWaterProduct(summary.product)));
  const unplanned = $derived(scope.filter((summary) => !isPlanned(summary.product) && !isWaterProduct(summary.product)));
  const dailyWater = $derived(app.autonomy.water.dailyNeed);
  const lasts = $derived(new Map(app.autonomy.supplies.map((supply) => [supply.product.name, supply.days])));
  const firstOut = $derived(app.autonomy.supplies.find((supply) => Number.isFinite(supply.days)) ?? null);

  function plannedCount(of: Kind): number {
    return ofKind(of).filter((summary) => isPlanned(summary.product) || (of === 'food' && isWaterProduct(summary.product))).length;
  }
</script>

<div class="stack">
  {#if kind}
    <a class="btn ghost small back" href="#/plan"><ArrowLeft size={18} />{t('plan.title')}</a>
  {/if}
  <header class="page-head">
    <div>
      <h1>{kind ? kindLabel(kind) : t('plan.title')}</h1>
      <p class="muted">{t(kind ? INTROS[kind] : 'plan.subtitle')}</p>
    </div>
    <button class="btn primary" onclick={() => (dialogs.product = { kind: kind ?? undefined })}><Plus size={18} /><span class="hide-sm">{t('plan.addProduct')}</span></button>
  </header>

  {#if !kind}
    <section class="card stack needs">
      <div class="section-title">
        <h2>{t('plan.needsTitle')}</h2>
        <button class="btn ghost small" onclick={() => router.go('settings')}><Settings2 size={16} />{t('plan.change')}</button>
      </div>
      <div class="stats">
        <span class="stat"><Users size={18} />{tn('plan.people', settings.people)}</span>
        {#if settings.cats > 0}<span class="stat"><Cat size={18} />{tn('plan.cats', settings.cats)}</span>{/if}
        {#if settings.dogs > 0}<span class="stat"><Dog size={18} />{tn('plan.dogs', settings.dogs)}</span>{/if}
        <span class="stat food"><Flame size={18} />{t('plan.kcalNeed', { kcal: formatKcal(settings.kcalPerPersonPerDay) })}</span>
        <span class="stat water"><Droplets size={18} />{t('plan.waterNeed', { liters: formatLiters(settings.waterPerPersonPerDay) })}</span>
      </div>
    </section>

    <div class="kinds">
      {#each KINDS as each (each)}
        <KindCard kind={each} href="#/plan/{each}" subtitle="{t(KIND_TEXTS[each].examples)} · {tn('plan.plannedCount', plannedCount(each))}">
          {#if each === 'food'}
            <p class="small">
              {t('plan.menu', { kcal: formatKcal(app.menu) })}
              <span class="muted">· {formatNumber(Math.round(menuShare * 100), 0)} % {t('plan.ofNeed')}</span>
            </p>
            <div class="bar" class:done={menuShare >= 0.9}><span style:width="{Math.min(1, menuShare) * 100}%"></span></div>
          {:else if each === 'consumable'}
            {#if firstOut}
              <span class="pills"><span class="pill">{t('stock.supply', { name: firstOut.product.name, lasts: tn('plan.lasts', Math.floor(firstOut.days)) })}</span></span>
            {/if}
          {:else if app.gear.total > 0}
            <div class="bar" class:done={app.gear.ready === app.gear.total}><span style:width="{(app.gear.ready / app.gear.total) * 100}%"></span></div>
            <span class="pills">
              <span class="pill ok">{tn('kind.gearCount', app.gear.ready, { total: app.gear.total })}</span>
              {#if app.gear.missing.length > 0}<span class="pill">{tn('kind.gearMissing', app.gear.missing.length)}</span>{/if}
            </span>
          {/if}
        </KindCard>
      {/each}
    </div>
  {:else}
    {#if kind === 'food'}
      <section class="card menu">
        <p class="small">
          <strong>{t('plan.menu', { kcal: formatKcal(app.menu) })}</strong>
          <span class="muted">· {formatNumber(Math.round(menuShare * 100), 0)} % {t('plan.ofNeed')}</span>
        </p>
        <div class="bar" class:done={menuShare >= 0.9}><span style:width="{Math.min(1, menuShare) * 100}%"></span></div>
        <p class="hint">{menuShare < 0.9 ? t('plan.menuLow') : t('plan.menuHint')}</p>
      </section>

      <section class="card stack">
        <div class="section-title">
          <h2 class="icon-title"><CategoryIcon category="water" size={22} />{t('plan.waterTitle')}</h2>
        </div>
        <p class="small muted">{t('plan.waterText', { liters: `${formatNumber(dailyWater, 2)} L`, days: STORED_WATER_DAYS })}</p>
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
                <CategoryIcon category={summary.product.category} size={16} />{summary.product.name} · {quantity(summary.usableQty, summary.product)}
              </button>
            {/each}
          </div>
        {:else}
          <p class="note small"><TriangleAlert size={16} />{t('plan.noWaterProduct')}</p>
        {/if}
      </section>
    {/if}

    {#if planned.length === 0}
      <section class="card empty">
        <p class="muted">{t(kind === 'food' ? 'plan.empty' : 'plan.emptyKind')}</p>
        <button class="btn primary" onclick={() => (dialogs.product = { kind })}><Plus size={18} />{t('plan.addProduct')}</button>
      </section>
    {/if}

    {#each planned as [category, list] (category)}
      <section class="group">
        <h2 class="group-title"><CategoryIcon {category} />{categoryLabel(category)}</h2>
        <ul class="card products">
          {#each list as summary (summary.product.name)}
            {@const product = summary.product}
            {@const days = lasts.get(product.name)}
            <li>
              <button class="product" onclick={() => (dialogs.product = { name: product.name })}>
                <span class="grow">
                  <strong>{product.name}</strong>
                  <span class="small muted">
                    {[dailyLabel(product), targetLabel(product)].filter(Boolean).join(' · ')}
                    {#if days !== undefined && Number.isFinite(days)}· {tn('plan.lasts', Math.floor(days))}{/if}
                  </span>
                  <span class="targets">
                    {#if kind === 'gear'}
                      {@const target = productTarget(product, settings, 0) ?? 0}
                      <span class="target small" class:reached={summary.usableQty >= target}>
                        {#if summary.usableQty >= target}<Check size={12} />{/if}{t('plan.everyTier')} · {quantity(target, product)}
                      </span>
                    {:else}
                      {#each settings.tiers as tierDays (tierDays)}
                        {@const target = productTarget(product, settings, tierDays) ?? 0}
                        {@const reached = summary.usableQty >= target}
                        <span class="target small" class:reached>
                          {#if reached}<Check size={12} />{/if}{tierLabel(tierDays)} · {quantity(target, product)}
                        </span>
                      {/each}
                    {/if}
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
              <CategoryIcon category={summary.product.category} size={16} />{summary.product.name}
            </button>
          {/each}
        </div>
      </section>
    {/if}
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
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
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

  .back {
    align-self: flex-start;
    margin-bottom: -0.5rem;
  }

  .kinds {
    display: grid;
    gap: 0.75rem;
  }

  @media (min-width: 900px) {
    .kinds {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }

  .pills {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
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
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.35rem 0.75rem;
    border-radius: var(--radius-sm);
    border: 1.5px solid var(--control);
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

  .group-title,
  .icon-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .group-title {
    font-size: 1.25rem;
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
    border-radius: 4px;
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
