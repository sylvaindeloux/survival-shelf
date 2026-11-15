<script lang="ts">
  import ArrowLeft from '@lucide/svelte/icons/arrow-left';
  import Check from '@lucide/svelte/icons/check';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import MapPin from '@lucide/svelte/icons/map-pin';
  import Minus from '@lucide/svelte/icons/minus';
  import PackageMinus from '@lucide/svelte/icons/package-minus';
  import Pencil from '@lucide/svelte/icons/pencil';
  import Plus from '@lucide/svelte/icons/plus';
  import Printer from '@lucide/svelte/icons/printer';
  import Search from '@lucide/svelte/icons/search';
  import Trash from '@lucide/svelte/icons/trash';
  import Utensils from '@lucide/svelte/icons/utensils';
  import { app } from '../lib/app.svelte';
  import { CATEGORIES, KINDS } from '../lib/core/categories';
  import { productTarget } from '../lib/core/plan';
  import { expiryStatus, type ProductSummary } from '../lib/core/status';
  import type { Kind } from '../lib/core/types';
  import { formatDate, formatNumber, t, tn } from '../lib/i18n/index.svelte';
  import ExpiryBadge from '../lib/ui/ExpiryBadge.svelte';
  import CategoryIcon from '../lib/ui/CategoryIcon.svelte';
  import KindCard from '../lib/ui/KindCard.svelte';
  import { KIND_TEXTS, categoryLabel, kindLabel, quantity, tierLabel } from '../lib/ui/format';
  import { dialogs, kindOfPath, router } from '../lib/ui/state.svelte';

  type Filter = 'all' | 'expired' | 'soon';

  let query = $state('');
  let filter = $state<Filter>('all');
  let location = $state('');
  let expanded = $state<Record<string, boolean>>({});

  /** Null on the hub, which shows one card per kind. */
  const kind = $derived(kindOfPath(router.path));

  // Each kind starts unfiltered: a filter set elsewhere would hide products without saying why.
  $effect(() => {
    void kind;
    query = '';
    filter = 'all';
  });

  const categoryOrder = new Map(CATEGORIES.map((category, index) => [category.key, index]));

  function matches(summary: ProductSummary): boolean {
    const text = query.trim().toLocaleLowerCase();
    if (text && !summary.product.name.toLocaleLowerCase().includes(text) && !summary.product.notes.toLocaleLowerCase().includes(text)) {
      return false;
    }
    if (location && !summary.lots.some((lot) => lot.location === location)) return false;
    if (filter === 'expired') return summary.status === 'expired';
    if (filter === 'soon') return summary.status === 'soon';
    return true;
  }

  function ofKind(of: Kind): ProductSummary[] {
    return app.summaries.filter((summary) => summary.product.kind === of);
  }

  const scope = $derived(kind ? ofKind(kind) : app.summaries);

  function byName(a: ProductSummary, b: ProductSummary): number {
    return a.product.name.localeCompare(b.product.name);
  }

  const groups = $derived.by(() => {
    const byCategory = new Map<string, ProductSummary[]>();
    for (const summary of scope.filter(matches)) {
      const list = byCategory.get(summary.product.category) ?? [];
      list.push(summary);
      byCategory.set(summary.product.category, list);
    }
    return [...byCategory.entries()]
      .sort(([a], [b]) => (categoryOrder.get(a) ?? 99) - (categoryOrder.get(b) ?? 99) || a.localeCompare(b))
      .map(([category, items]) => ({ category, items: items.sort(byName) }));
  });

  /** Quantity of a gear item to own, null when it is not in the plan. */
  function gearTarget(summary: ProductSummary): number | null {
    const target = productTarget(summary.product, app.shelf.settings, 0);
    return target === null || target === 0 ? null : target;
  }

  // Gear is a checklist: what is still missing first, then what is ready, then what the plan does not ask for.
  const gearGroups = $derived.by(() => {
    const items = scope.filter(matches).sort(byName);
    const planned = items.filter((summary) => gearTarget(summary) !== null);
    return [
      { title: t('stock.toComplete'), items: planned.filter((summary) => summary.usableQty < gearTarget(summary)!) },
      { title: t('stock.ready'), items: planned.filter((summary) => summary.usableQty >= gearTarget(summary)!) },
      { title: t('plan.unplannedTitle'), items: items.filter((summary) => gearTarget(summary) === null) },
    ].filter((group) => group.items.length > 0);
  });

  const shown = $derived(kind === 'gear' ? gearGroups.length : groups.length);

  const counts = $derived({
    expired: scope.filter((summary) => summary.status === 'expired').length,
    soon: scope.filter((summary) => summary.status === 'soon').length,
  });

  const lotCount = $derived(scope.reduce((sum, summary) => sum + summary.lots.length, 0));

  function statusCounts(of: Kind) {
    const list = ofKind(of);
    return {
      products: list.length,
      expired: list.filter((summary) => summary.status === 'expired').length,
      soon: list.filter((summary) => summary.status === 'soon').length,
    };
  }

  const firstOut = $derived(app.autonomy.supplies.find((supply) => Number.isFinite(supply.days)) ?? null);

  function visibleLots(summary: ProductSummary) {
    return location ? summary.lots.filter((lot) => lot.location === location) : summary.lots;
  }
</script>

{#snippet productItem(summary: ProductSummary, gear: boolean)}
  {@const open = expanded[summary.product.name] ?? false}
  {@const lots = visibleLots(summary)}
  {@const goal = app.plan.current ? productTarget(summary.product, app.shelf.settings, app.plan.current.days) : null}
  {@const target = gear ? gearTarget(summary) : null}
  {@const food = summary.product.kind === 'food'}
  <li class="product" class:open>
    <div class="product-row">
      <button class="product-main" class:gear onclick={() => (expanded[summary.product.name] = !open)} aria-expanded={open}>
        <span class="lead">
          {#if target !== null}
            <span class="mark" class:ok={summary.usableQty >= target} aria-hidden="true">{#if summary.usableQty >= target}<Check size={16} />{/if}</span>
          {/if}
          <span class="name">
            <strong>{summary.product.name}</strong>
            {#if !gear && app.plan.current && goal && summary.usableQty < goal}
              <span class="small muted">{t('stock.belowTarget', { tier: tierLabel(app.plan.current.days), qty: quantity(goal, summary.product) })}</span>
            {:else if gear && summary.lots.some((lot) => lot.location)}
              <span class="small muted">{[...new Set(summary.lots.map((lot) => lot.location).filter(Boolean))].join(', ')}</span>
            {:else if summary.product.notes}
              <span class="small muted">{summary.product.notes}</span>
            {/if}
          </span>
        </span>
        <span class="qty num" class:zero={summary.qty === 0}>
          {#if target !== null}
            {t('stock.ofTarget', { have: formatNumber(summary.usableQty), target: formatNumber(target) })}
          {:else}
            {quantity(summary.qty, summary.product)}
          {/if}
        </span>
        {#if summary.lots[0] && (!gear || summary.lots[0].expires)}
          <span class="badge"><ExpiryBadge lot={summary.lots[0]} /></span>
        {/if}
        <ChevronDown size={18} class="chevron" />
      </button>
      <div class="quick">
        {#if !gear}
          <button
            class="icon-btn outlined"
            disabled={summary.qty === 0}
            onclick={() => (dialogs.take = { action: 'consumed', product: summary.product.name })}
            aria-label={t('take.consume')}
            title={t('take.consume')}><Minus size={18} /></button
          >
        {/if}
        <button
          class="icon-btn outlined"
          onclick={() => (dialogs.lot = { product: summary.product.name })}
          aria-label={t('stock.addLot')}
          title={t('stock.addLot')}><Plus size={18} /></button
        >
      </div>
    </div>
    {#if open}
      <div class="details">
        {#if lots.length === 0}
          <p class="small muted">{t('stock.noLots')}</p>
        {/if}
        <ul class="lots">
          {#each lots as lot (lot.id)}
            <li class="lot">
              <span class="lot-qty num">{quantity(lot.qty, summary.product)}</span>
              <ExpiryBadge {lot} />
              <span class="lot-meta small muted">
                {#if lot.expires && expiryStatus(lot, app.shelf.settings, app.today) !== 'ok'}{formatDate(lot.expires)}{/if}
                {#if lot.location}<span class="where"><MapPin size={13} />{lot.location}</span>{/if}
              </span>
              <span class="lot-actions">
                <button class="icon-btn" onclick={() => (dialogs.take = { action: 'consumed', lotId: lot.id })} aria-label={t('take.consume')} title={t('take.consume')}>
                  {#if food}<Utensils size={17} />{:else}<PackageMinus size={17} />{/if}
                </button>
                <button class="icon-btn" onclick={() => (dialogs.take = { action: 'discarded', lotId: lot.id })} aria-label={t('take.discard')} title={t('take.discard')}><Trash size={17} /></button>
                <button class="icon-btn" onclick={() => (dialogs.lot = { lotId: lot.id })} aria-label={t('lot.editTitle')} title={t('lot.editTitle')}><Pencil size={17} /></button>
              </span>
            </li>
          {/each}
        </ul>
        <div class="row wrap product-actions">
          <button class="btn small" onclick={() => (dialogs.product = { name: summary.product.name })}><Pencil size={15} />{t('stock.editProduct')}</button>
          <span class="small muted">
            {#if summary.product.kcal}{summary.product.kcal} kcal/{summary.product.unit || t('stock.unit')}{/if}
            {#if summary.product.water}{summary.product.kcal ? ' · ' : ''}{summary.product.water} L/{summary.product.unit || t('stock.unit')}{/if}
          </span>
        </div>
      </div>
    {/if}
  </li>
{/snippet}

{#snippet categoryGroups()}
  {#each groups as group (group.category)}
    <section class="group">
      <h2 class="group-title"><CategoryIcon category={group.category} />{categoryLabel(group.category)}</h2>
      <ul class="products card">
        {#each group.items as summary (summary.product.name)}
          {@render productItem(summary, false)}
        {/each}
      </ul>
    </section>
  {/each}
{/snippet}

<div class="stack">
  {#if kind}
    <a class="btn ghost small back" href="#/stock"><ArrowLeft size={18} />{t('stock.title')}</a>
  {/if}
  <header class="page-head">
    <div>
      <h1>{kind ? kindLabel(kind) : t('stock.title')}</h1>
      <p class="muted">{tn('stock.summary', scope.length, { lots: lotCount })}</p>
    </div>
    <div class="row">
      <button class="btn" onclick={() => window.print()} title={t('stock.print')}><Printer size={18} /><span class="hide-sm">{t('stock.print')}</span></button>
      <button class="btn primary" onclick={() => (dialogs.lot = { kind: kind ?? undefined })}><Plus size={18} />{t('action.add')}</button>
    </div>
  </header>

  {#if kind === 'gear' && app.gear.total > 0}
    <section class="card gear-summary">
      <p><strong class="num">{tn('kind.gearCount', app.gear.ready, { total: app.gear.total })}</strong></p>
      <div class="bar" class:done={app.gear.ready === app.gear.total}><span style:width="{(app.gear.ready / app.gear.total) * 100}%"></span></div>
    </section>
  {/if}

  <div class="toolbar">
    <label class="search">
      <Search size={18} />
      <span class="visually-hidden">{t(kind ? 'stock.search' : 'stock.searchAll')}</span>
      <input type="search" bind:value={query} placeholder={t(kind ? 'stock.search' : 'stock.searchAll')} />
    </label>
    {#if kind}
      <div class="row wrap">
        {#if kind !== 'gear'}
          <div class="chips" role="group" aria-label={t('stock.filter')}>
            <button class:active={filter === 'all'} onclick={() => (filter = 'all')}>{t('stock.all')}</button>
            <button class:active={filter === 'expired'} onclick={() => (filter = 'expired')}>
              {t('stock.expired')}{#if counts.expired}<span class="count expired">{counts.expired}</span>{/if}
            </button>
            <button class:active={filter === 'soon'} onclick={() => (filter = 'soon')}>
              {t('stock.soon')}{#if counts.soon}<span class="count soon">{counts.soon}</span>{/if}
            </button>
          </div>
        {/if}
        {#if app.locations.length > 0}
          <label class="location">
            <MapPin size={16} />
            <span class="visually-hidden">{t('lot.location')}</span>
            <select bind:value={location}>
              <option value="">{t('stock.allLocations')}</option>
              {#each app.locations as option (option)}
                <option value={option}>{option}</option>
              {/each}
            </select>
          </label>
        {/if}
      </div>
    {/if}
  </div>

  {#if scope.length === 0}
    <section class="card empty">
      <p class="muted">{t(kind ? KIND_TEXTS[kind].empty : 'stock.empty')}</p>
      <button class="btn primary" onclick={() => (dialogs.lot = { kind: kind ?? undefined })}><Plus size={18} />{t('stock.addLot')}</button>
    </section>
  {:else if !kind && query.trim() === ''}
    <div class="kinds">
      {#each KINDS as each (each)}
        {@const status = statusCounts(each)}
        <KindCard kind={each} href="#/stock/{each}" subtitle="{t(KIND_TEXTS[each].examples)} · {tn('stock.products', status.products)}">
          {#if each === 'gear'}
            {#if app.gear.total > 0}
              <div class="bar" class:done={app.gear.ready === app.gear.total}><span style:width="{(app.gear.ready / app.gear.total) * 100}%"></span></div>
              <span class="pills">
                <span class="pill ok">{tn('kind.gearCount', app.gear.ready, { total: app.gear.total })}</span>
                {#if app.gear.missing.length > 0}<span class="pill">{tn('kind.gearMissing', app.gear.missing.length)}</span>{/if}
              </span>
            {/if}
          {:else}
            <span class="pills">
              {#if status.expired > 0}<span class="pill expired">{tn('stock.expiredCount', status.expired)}</span>{/if}
              {#if status.soon > 0}<span class="pill soon">{tn('stock.soonCount', status.soon)}</span>{/if}
              {#if status.products > 0 && status.expired === 0 && status.soon === 0}<span class="pill ok">{t('stock.upToDate')}</span>{/if}
              {#if each === 'consumable' && firstOut}
                <span class="pill">{t('stock.supply', { name: firstOut.product.name, lasts: tn('plan.lasts', Math.floor(firstOut.days)) })}</span>
              {/if}
            </span>
          {/if}
        </KindCard>
      {/each}
    </div>
  {:else if shown === 0}
    <p class="muted center">{t('stock.noMatch')}</p>
  {:else if kind === 'gear'}
    {#each gearGroups as group (group.title)}
      <section class="group">
        <h2 class="group-title">{group.title} <span class="group-count muted">{group.items.length}</span></h2>
        <ul class="products card">
          {#each group.items as summary (summary.product.name)}
            {@render productItem(summary, true)}
          {/each}
        </ul>
      </section>
    {/each}
  {:else}
    {@render categoryGroups()}
  {/if}
</div>

<button class="fab" onclick={() => (dialogs.lot = { kind: kind ?? undefined })} aria-label={t('stock.addLot')}><Plus size={26} /></button>

<style>
  .page-head {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 1rem;
  }

  .toolbar {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  .search {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0 0.9rem;
    min-height: 46px;
    border-radius: var(--radius-sm);
    border: 1.5px solid var(--control);
    background: var(--surface);
    color: var(--muted);
  }

  .search:focus-within {
    border-color: var(--primary);
  }

  .search input {
    flex: 1;
    min-width: 0;
    border: none;
    background: transparent;
    outline: none;
    font-size: 1rem;
    color: var(--text);
  }

  .chips {
    display: flex;
    gap: 0.4rem;
  }

  .chips button {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    min-height: 36px;
    padding: 0.3rem 0.85rem;
    border-radius: var(--radius-sm);
    border: 1.5px solid var(--control);
    background: var(--surface);
    font-weight: 600;
    font-size: 0.9rem;
    cursor: pointer;
  }

  .chips button.active {
    background: var(--text);
    border-color: var(--text);
    color: var(--surface);
    font-weight: 700;
  }

  .count {
    min-width: 1.3rem;
    padding: 0 0.35rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 700;
    text-align: center;
  }

  .count.expired {
    background: var(--danger);
    color: var(--surface);
  }

  .count.soon {
    background: var(--warn);
    color: var(--surface);
  }

  .location {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0 0.4rem 0 0.75rem;
    min-height: 36px;
    border-radius: var(--radius-sm);
    border: 1.5px solid var(--control);
    background: var(--surface);
    color: var(--muted);
  }

  .location select {
    border: none;
    background: transparent;
    font-weight: 600;
    font-size: 0.875rem;
    color: var(--text);
    padding: 0.3rem;
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

  .gear-summary {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  .gear-summary strong {
    font-family: var(--font-display);
    font-size: 1.6rem;
  }

  .group-count {
    font-family: var(--font);
    font-size: 0.9rem;
    font-weight: 600;
  }

  .lead {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    min-width: 0;
  }

  .mark {
    flex: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border: 2px solid var(--control);
    border-radius: 4px;
  }

  .mark.ok {
    background: var(--ok);
    border-color: var(--ok);
    color: var(--surface);
  }

  .group-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1.25rem;
    margin: 0.25rem 0 0.5rem 0.25rem;
  }

  .products {
    list-style: none;
    margin: 0;
    padding: 0;
    overflow: hidden;
  }

  .product + .product {
    border-top: 1px solid var(--border);
  }

  .product-row {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding-right: 0.6rem;
  }

  .product-main {
    flex: 1;
    min-width: 0;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto auto 18px;
    align-items: center;
    gap: 0.6rem;
    padding: 0.8rem 0.5rem 0.8rem 1rem;
    border: none;
    background: none;
    text-align: left;
    cursor: pointer;
  }

  .product-main :global(.chevron) {
    color: var(--muted);
    transition: transform 0.15s;
  }

  .product.open .product-main :global(.chevron) {
    transform: rotate(180deg);
  }

  .name {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .name strong,
  .name span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .qty {
    font-weight: 700;
  }

  .qty.zero {
    color: var(--muted);
  }

  .quick {
    display: flex;
    gap: 0.35rem;
  }

  @media (max-width: 560px) {
    .product-main {
      grid-template-columns: minmax(0, 1fr) auto;
      row-gap: 0.25rem;
    }

    .product-main .badge {
      grid-column: 1;
      grid-row: 2;
    }

    .product-main .qty {
      grid-column: 2;
      grid-row: 1;
    }

    .product-main :global(.chevron) {
      display: none;
    }

    .name strong {
      white-space: normal;
    }

    .hide-sm {
      display: none;
    }
  }

  .details {
    padding: 0 1rem 1rem;
    background: color-mix(in srgb, var(--surface-2) 50%, transparent);
    border-top: 1px dashed var(--border);
  }

  .lots {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .lot {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem 0.75rem;
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--border);
  }

  .lot-qty {
    font-weight: 700;
    min-width: 4.5rem;
  }

  .lot-meta {
    display: inline-flex;
    flex-wrap: wrap;
    gap: 0.2rem 0.6rem;
    flex: 1;
    min-width: 0;
    white-space: nowrap;
  }

  @media (max-width: 560px) {
    .lot-actions {
      order: 2;
    }

    .lot-meta {
      order: 3;
      flex-basis: 100%;
    }
  }

  .where {
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
  }

  .lot-actions {
    display: flex;
    margin-left: auto;
  }

  .product-actions {
    margin-top: 0.75rem;
    justify-content: space-between;
  }

  .empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    padding: 2rem 1rem;
    text-align: center;
  }

  .center {
    text-align: center;
  }

  .fab {
    position: fixed;
    right: 1.25rem;
    bottom: calc(var(--nav-height) + var(--safe-bottom) + 1.25rem);
    z-index: 20;
    display: none;
    align-items: center;
    justify-content: center;
    width: 58px;
    height: 58px;
    border-radius: 10px;
    border: none;
    border-bottom: 4px solid var(--primary-edge);
    background: var(--primary);
    color: var(--on-primary);
    box-shadow: 0 6px 16px rgb(0 0 0 / 22%);
    cursor: pointer;
  }

  @media (max-width: 899px) {
    .fab {
      display: inline-flex;
    }
  }
</style>
