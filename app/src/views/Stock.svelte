<script lang="ts">
  import ArrowDownUp from '@lucide/svelte/icons/arrow-down-up';
  import BatteryMedium from '@lucide/svelte/icons/battery-medium';
  import CalendarClock from '@lucide/svelte/icons/calendar-clock';
  import Check from '@lucide/svelte/icons/check';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import CircleCheck from '@lucide/svelte/icons/circle-check';
  import CircleDashed from '@lucide/svelte/icons/circle-dashed';
  import MapPin from '@lucide/svelte/icons/map-pin';
  import Minus from '@lucide/svelte/icons/minus';
  import PackageMinus from '@lucide/svelte/icons/package-minus';
  import Pencil from '@lucide/svelte/icons/pencil';
  import Plus from '@lucide/svelte/icons/plus';
  import Printer from '@lucide/svelte/icons/printer';
  import RefreshCw from '@lucide/svelte/icons/refresh-cw';
  import Search from '@lucide/svelte/icons/search';
  import Target from '@lucide/svelte/icons/target';
  import Toolbox from '@lucide/svelte/icons/toolbox';
  import Trash from '@lucide/svelte/icons/trash';
  import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
  import Utensils from '@lucide/svelte/icons/utensils';
  import { app } from '../lib/app.svelte';
  import { CATEGORIES, KINDS } from '../lib/core/categories';
  import { isWaterProduct, productTarget, waterGoal } from '../lib/core/plan';
  import { expiryStatus, type ProductSummary } from '../lib/core/status';
  import { lotExpiry } from '../lib/core/stock';
  import type { Kind, Product } from '../lib/core/types';
  import { formatDate, formatNumber, t, tn } from '../lib/i18n/index.svelte';
  import CategoryIcon from '../lib/ui/CategoryIcon.svelte';
  import ExpiryBadge from '../lib/ui/ExpiryBadge.svelte';
  import SubTabs, { type SubTab } from '../lib/ui/SubTabs.svelte';
  import { KIND_TEXTS, categoryLabel, dailyLabel, formatKcal, formatLiters, kindLabel, ofTarget, quantity, targetLabel, tierLabel } from '../lib/ui/format';
  import { dialogs, kindOfPath, router } from '../lib/ui/state.svelte';

  type Filter = 'all' | 'expired' | 'soon';
  type Order = 'category' | 'expiry';

  const KIND_ICONS = { food: Utensils, consumable: BatteryMedium, gear: Toolbox };

  const settings = $derived(app.shelf.settings);
  /** The Stocks tab opens on the food. */
  const kind = $derived<Kind>(kindOfPath(router.path) ?? 'food');

  let query = $state('');
  let filter = $state<Filter>('all');
  let location = $state('');
  let searching = $state(false);
  let searchInput = $state<HTMLInputElement>();
  let order = $state<Order>('category');
  let expanded = $state<Record<string, boolean>>({});
  /** Tier whose targets the gauges show, picked by the user; otherwise the tier being built. */
  let chosenTier = $state<number | null>(null);

  const tier = $derived(
    chosenTier !== null && settings.tiers.includes(chosenTier) ? chosenTier : (app.plan.current?.days ?? settings.tiers.at(-1) ?? 0),
  );

  // Each kind starts unfiltered: a filter set elsewhere would hide products without saying why.
  $effect(() => {
    void kind;
    query = '';
    filter = 'all';
    location = '';
  });

  $effect(() => {
    if (searching) searchInput?.focus();
  });

  function toggleSearch() {
    searching = !searching;
    // Closed filters must not keep hiding products.
    if (!searching) {
      query = '';
      filter = 'all';
      location = '';
    }
  }

  const categoryOrder = new Map(CATEGORIES.map((category, index) => [category.key, index]));

  function ofKind(of: Kind): ProductSummary[] {
    return app.summaries.filter((summary) => summary.product.kind === of);
  }

  const scope = $derived(ofKind(kind));
  const filtering = $derived(query.trim() !== '' || filter !== 'all' || location !== '');

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

  const visible = $derived(scope.filter(matches));

  function byName(a: ProductSummary, b: ProductSummary): number {
    return a.product.name.localeCompare(b.product.name);
  }

  /** Quantity the chosen tier needs, null without a target. Water is counted in liters on its card, gear whatever the tier. */
  function goalOf(product: Product): number | null {
    if (isWaterProduct(product)) return null;
    const target = productTarget(product, settings, product.kind === 'gear' ? 0 : tier);
    return target === null || target === 0 ? null : target;
  }

  const groups = $derived.by(() => {
    const byCategory = new Map<string, ProductSummary[]>();
    for (const summary of visible) byCategory.set(summary.product.category, [...(byCategory.get(summary.product.category) ?? []), summary]);
    return [...byCategory.entries()]
      .sort(([a], [b]) => (categoryOrder.get(a) ?? 99) - (categoryOrder.get(b) ?? 99) || a.localeCompare(b))
      .map(([category, items]) => ({ category, items: items.sort(byName) }));
  });

  // Food: the water card comes first and holds the water goal of the tier, even before any water product.
  const showWater = $derived(kind === 'food' && (!filtering || groups.some((group) => group.category === 'water')));
  const water = $derived(waterGoal(app.autonomy, tier));
  const waterItems = $derived(groups.find((group) => group.category === 'water')?.items ?? []);
  const otherGroups = $derived(kind === 'food' ? groups.filter((group) => group.category !== 'water') : groups);

  function firstExpiry(summary: ProductSummary): number {
    return summary.lots[0] ? lotExpiry(summary.lots[0]) : Number.POSITIVE_INFINITY;
  }

  const byDate = $derived([...visible].sort((a, b) => firstExpiry(a) - firstExpiry(b) || byName(a, b)));

  // Gear is a checklist: what is still missing first, then what is ready, then what has no target.
  const gearGroups = $derived.by(() => {
    const items = [...visible].sort(byName);
    const planned = items.filter((summary) => goalOf(summary.product) !== null);
    return [
      { key: 'missing', title: t('stock.toComplete'), icon: CircleDashed, tone: 'warn', items: planned.filter((summary) => summary.usableQty < goalOf(summary.product)!) },
      { key: 'ready', title: t('stock.ready'), icon: CircleCheck, tone: 'ok', items: planned.filter((summary) => summary.usableQty >= goalOf(summary.product)!) },
      { key: 'none', title: t('plan.unplannedTitle'), icon: Minus, tone: 'muted', items: items.filter((summary) => goalOf(summary.product) === null) },
    ].filter((group) => group.items.length > 0);
  });

  /** Consumables and gear due for replacement, on top of their list. */
  const toReplace = $derived(app.checkin.replace.filter((item) => item.due && item.product.kind === kind));

  const counts = $derived({
    expired: scope.filter((summary) => summary.status === 'expired').length,
    soon: scope.filter((summary) => summary.status === 'soon').length,
  });

  const lotCount = $derived(scope.reduce((sum, summary) => sum + summary.lots.length, 0));
  const lasts = $derived(new Map(app.autonomy.supplies.map((supply) => [supply.product.name, supply.days])));
  const menuShare = $derived(settings.kcalPerPersonPerDay > 0 ? app.menu / settings.kcalPerPersonPerDay : 1);

  /** What needs a look in each part, on its tab. */
  function tabStatus(of: Kind): Pick<SubTab, 'status' | 'tone'> {
    const list = ofKind(of);
    const expired = list.filter((summary) => summary.status === 'expired').length;
    if (expired > 0) return { status: tn('stock.expiredCount', expired), tone: 'danger' };
    if (of === 'gear') {
      if (app.gear.missing.length > 0) return { status: tn('kind.gearMissing', app.gear.missing.length), tone: 'warn' };
      if (app.gear.total > 0) return { status: tn('kind.gearCount', app.gear.ready, { total: app.gear.total }), tone: 'ok' };
    } else {
      const replace = app.checkin.replace.filter((item) => item.due && item.product.kind === of).length;
      if (replace > 0) return { status: tn('stock.toReplaceCount', replace), tone: 'warn' };
      const soon = list.filter((summary) => summary.status === 'soon').length;
      if (soon > 0) return { status: tn('stock.soonCount', soon), tone: 'warn' };
    }
    return { status: tn('stock.products', list.length), tone: 'muted' };
  }

  const tabs = $derived<SubTab[]>(
    KINDS.map((each) => ({
      key: each,
      href: `#/stock/${each}`,
      label: kindLabel(each),
      icon: KIND_ICONS[each],
      current: each === kind,
      ...tabStatus(each),
    })),
  );

  function visibleLots(summary: ProductSummary) {
    return location ? summary.lots.filter((lot) => lot.location === location) : summary.lots;
  }

  function placesOf(summary: ProductSummary): string {
    return [...new Set(summary.lots.map((lot) => lot.location).filter(Boolean))].join(', ');
  }
</script>

{#snippet gauge(have: number, goal: number, label: string)}
  <span class="l2">
    <span class="bar" class:done={have >= goal}><span style:width="{Math.min(1, have / goal) * 100}%"></span></span>
    <span class="q num">{label}</span>
  </span>
{/snippet}

{#snippet item(summary: ProductSummary)}
  {@const product = summary.product}
  {@const open = expanded[product.name] ?? false}
  {@const goal = goalOf(product)}
  {@const gear = product.kind === 'gear'}
  {@const days = lasts.get(product.name)}
  {@const lots = visibleLots(summary)}
  <li class="item" class:open>
    <button class="item-main" onclick={() => (expanded[product.name] = !open)} aria-expanded={open}>
      <span class="l1">
        <span class="name">{product.name}</span>
        {#if gear}
          {#if summary.usableQty === 0 && goal !== null}
            <span class="small muted">{t('stock.toBuy')}</span>
          {:else if placesOf(summary)}
            <span class="small muted places">{placesOf(summary)}</span>
          {/if}
        {/if}
        {#if summary.lots[0]?.expires}<ExpiryBadge lot={summary.lots[0]} />{/if}
        {#if goal === null}<span class="q num" class:zero={summary.qty === 0}>{quantity(summary.qty, product)}</span>{/if}
        <ChevronDown size={18} class="chevron" />
      </span>
      {#if goal !== null}
        {@render gauge(summary.usableQty, goal, ofTarget(summary.usableQty, goal, product))}
      {/if}
      {#if days !== undefined && Number.isFinite(days)}
        <span class="small muted">{tn('plan.lasts', Math.floor(days))}</span>
      {/if}
    </button>
    {#if open}
      <div class="details">
        {#if dailyLabel(product) || targetLabel(product)}
          <p class="small muted">{[dailyLabel(product), targetLabel(product)].filter(Boolean).join(' · ')}</p>
        {/if}
        {#if goal !== null && !gear && settings.tiers.length > 1}
          <p class="targets small">
            {#each settings.tiers as each (each)}
              {@const target = productTarget(product, settings, each) ?? 0}
              <span class="target" class:reached={summary.usableQty >= target}>
                {#if summary.usableQty >= target}<Check size={12} />{/if}{tierLabel(each)} · {quantity(target, product)}
              </span>
            {/each}
          </p>
        {/if}
        {#if lots.length === 0}
          <p class="small muted">{t('stock.noLots')}</p>
        {:else}
          <ul class="lots">
            {#each lots as lot (lot.id)}
              <li class="lot">
                <span class="lot-qty num">{quantity(lot.qty, product)}</span>
                <ExpiryBadge {lot} />
                <span class="lot-meta small muted">
                  {#if lot.expires && expiryStatus(lot, settings, app.today) !== 'ok'}{formatDate(lot.expires)}{/if}
                  {#if lot.location}<span class="where"><MapPin size={13} />{lot.location}</span>{/if}
                </span>
                <span class="lot-actions">
                  <button class="icon-btn" onclick={() => (dialogs.take = { action: 'consumed', lotId: lot.id })} aria-label={t('take.consume')} title={t('take.consume')}>
                    {#if product.kind === 'food'}<Utensils size={17} />{:else}<PackageMinus size={17} />{/if}
                  </button>
                  <button class="icon-btn" onclick={() => (dialogs.take = { action: 'discarded', lotId: lot.id })} aria-label={t('take.discard')} title={t('take.discard')}><Trash size={17} /></button>
                  <button class="icon-btn" onclick={() => (dialogs.lot = { lotId: lot.id })} aria-label={t('lot.editTitle')} title={t('lot.editTitle')}><Pencil size={17} /></button>
                </span>
              </li>
            {/each}
          </ul>
        {/if}
        <div class="row wrap item-actions">
          <button class="btn small" onclick={() => (dialogs.lot = { product: product.name })}><Plus size={15} />{t('stock.addLot')}</button>
          {#if !gear}
            <button class="btn small" disabled={summary.qty === 0} onclick={() => (dialogs.take = { action: 'consumed', product: product.name })}>
              <Minus size={15} />{t('take.consume')}
            </button>
          {/if}
          <button class="btn small ghost" onclick={() => (dialogs.product = { name: product.name })}><Pencil size={15} />{t('stock.editProduct')}</button>
          <span class="small muted">
            {#if product.kcal}{product.kcal} kcal/{product.unit || t('stock.unit')}{/if}
            {#if product.water}{product.kcal ? ' · ' : ''}{product.water} L/{product.unit || t('stock.unit')}{/if}
          </span>
        </div>
      </div>
    {/if}
  </li>
{/snippet}

<div class="stack">
  <SubTabs label={t('stock.title')} items={tabs} />

  <header class="page-head">
    <div class="title">
      <h1>{kindLabel(kind)}</h1>
      <p class="muted">
        {#if kind === 'gear' && app.gear.total > 0}{tn('kind.gearCount', app.gear.ready, { total: app.gear.total })} ·{/if}
        {tn('stock.summary', scope.length, { lots: lotCount })}
      </p>
    </div>
    <div class="row">
      <button
        class="icon-btn search-toggle"
        class:on={searching}
        onclick={toggleSearch}
        aria-expanded={searching}
        aria-controls="stock-search"
        aria-label={t('stock.searchToggle')}
        title={t('stock.searchToggle')}><Search size={22} /></button
      >
      <button class="btn primary" onclick={() => (dialogs.lot = { kind })}><Plus size={18} />{t('action.add')}</button>
    </div>
  </header>

  {#if kind === 'gear' && app.gear.total > 0}
    <div class="bar" class:done={app.gear.ready === app.gear.total} aria-hidden="true">
      <span style:width="{(app.gear.ready / app.gear.total) * 100}%"></span>
    </div>
  {/if}

  {#if searching}
    <div class="toolbar" id="stock-search">
      <label class="search">
        <Search size={18} />
        <span class="visually-hidden">{t('stock.search')}</span>
        <input bind:this={searchInput} type="search" bind:value={query} placeholder={t('stock.search')} />
      </label>
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
          <label class="picker">
            <MapPin size={16} class="picker-icon" />
            <span class="visually-hidden">{t('lot.location')}</span>
            <select bind:value={location}>
              <option value="">{t('stock.allLocations')}</option>
              {#each app.locations as option (option)}
                <option value={option}>{option}</option>
              {/each}
            </select>
            <ChevronDown size={16} class="picker-chevron" />
          </label>
        {/if}
      </div>
    </div>
  {/if}

  {#if kind !== 'gear' && scope.length > 0}
    <div class="row wrap">
      {#if settings.tiers.length > 0}
        <label class="picker strong">
          <Target size={16} class="picker-icon" />
          <span class="visually-hidden">{t('stock.tierPicker')}</span>
          <select value={tier} onchange={(event) => (chosenTier = Number(event.currentTarget.value))}>
            {#each settings.tiers as each (each)}
              <option value={each}>{t('stock.tierChoice', { tier: tierLabel(each) })}</option>
            {/each}
          </select>
          <ChevronDown size={16} class="picker-chevron" />
        </label>
      {/if}
      <label class="picker">
        <ArrowDownUp size={16} class="picker-icon" />
        <span class="visually-hidden">{t('stock.order')}</span>
        <select bind:value={order}>
          <option value="category">{t('stock.byCategory')}</option>
          <option value="expiry">{t('stock.byExpiry')}</option>
        </select>
        <ChevronDown size={16} class="picker-chevron" />
      </label>
    </div>
  {/if}

  {#if kind === 'food' && menuShare < 0.9 && !filtering}
    <p class="note small">
      <TriangleAlert size={16} />
      <span>
        {t('plan.menu', { kcal: formatKcal(app.menu) })} · {formatNumber(Math.round(menuShare * 100), 0)} % {t('plan.ofNeed')}.
        {t('plan.menuLow')}
      </span>
    </p>
  {/if}

  {#if scope.length === 0}
    <section class="card empty">
      <p class="muted">{t(KIND_TEXTS[kind].empty)}</p>
      <div class="row wrap center">
        <button class="btn primary" onclick={() => (dialogs.lot = { kind })}><Plus size={18} />{t('stock.addLot')}</button>
        <button class="btn" onclick={() => (dialogs.product = { kind })}><Target size={18} />{t('stock.planProduct')}</button>
      </div>
    </section>
  {:else if visible.length === 0 && filtering}
    <p class="muted center">{t('stock.noMatch')}</p>
  {:else}
    <div class="cards" class:single={order === 'expiry' && kind !== 'gear'}>
      {#if toReplace.length > 0 && !filtering}
        <section class="card group replace">
          <h2 class="group-head"><RefreshCw size={20} class="warn" />{t('stock.toReplaceTitle')}</h2>
          <ul>
            {#each toReplace as entry (entry.lot.id)}
              <li class="replace-item">
                <span class="l1">
                  <span class="name">{entry.product.name}</span>
                  <ExpiryBadge lot={entry.lot} />
                </span>
                <span class="l1">
                  <span class="small muted grow">{[quantity(entry.lot.qty, entry.product), entry.lot.location].filter(Boolean).join(' · ')}</span>
                  <button class="btn small" onclick={() => (dialogs.lot = { product: entry.product.name, qty: entry.lot.qty, replaces: entry.lot.id })}>
                    <RefreshCw size={16} />{t('checkin.replaced')}
                  </button>
                </span>
              </li>
            {/each}
          </ul>
        </section>
      {/if}

      {#if kind === 'gear'}
        {#each gearGroups as group (group.key)}
          <section class="card group">
            <h2 class="group-head"><group.icon size={20} class={group.tone} />{group.title}<span class="count {group.tone}">{group.items.length}</span></h2>
            <ul>
              {#each group.items as summary (summary.product.name)}
                {@render item(summary)}
              {/each}
            </ul>
          </section>
        {/each}
      {:else if order === 'expiry'}
        <section class="card group">
          <h2 class="group-head"><CalendarClock size={20} />{t('stock.byExpiry')}</h2>
          <ul>
            {#each byDate as summary (summary.product.name)}
              {@render item(summary)}
            {/each}
          </ul>
        </section>
      {:else}
        {#if showWater}
          <section class="card group">
            <h2 class="group-head"><CategoryIcon category="water" size={20} />{categoryLabel('water')}</h2>
            <div class="goal">
              <span class="l1"><span class="name">{t('stock.storedWater')}</span></span>
              {@render gauge(water.stored.have, water.stored.target, t('stock.ofTarget', { have: formatNumber(water.stored.have, 1), target: formatLiters(water.stored.target) }))}
            </div>
            {#if water.treatment}
              <div class="goal">
                <span class="l1"><span class="name">{t('stock.treatedWater')}</span></span>
                {@render gauge(water.treatment.have, water.treatment.target, t('stock.ofTarget', { have: formatNumber(water.treatment.have, 1), target: formatLiters(water.treatment.target) }))}
              </div>
            {/if}
            {#if waterItems.length > 0}
              <ul>
                {#each waterItems as summary (summary.product.name)}
                  {@render item(summary)}
                {/each}
              </ul>
            {:else if !filtering}
              <p class="note small"><TriangleAlert size={16} />{t('plan.noWaterProduct')}</p>
            {/if}
          </section>
        {/if}
        {#each otherGroups as group (group.category)}
          <section class="card group">
            <h2 class="group-head"><CategoryIcon category={group.category} size={20} />{categoryLabel(group.category)}</h2>
            <ul>
              {#each group.items as summary (summary.product.name)}
                {@render item(summary)}
              {/each}
            </ul>
          </section>
        {/each}
      {/if}
    </div>
  {/if}

  <div class="row wrap end-actions">
    <button class="btn ghost" onclick={() => (dialogs.product = { kind })}><Target size={18} />{t('stock.planProduct')}</button>
    <button class="btn ghost" onclick={() => window.print()}><Printer size={18} />{t('stock.printSheet')}</button>
  </div>
</div>

<style>
  .page-head {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: space-between;
    gap: 0.5rem 1rem;
  }

  .title {
    flex: 1 1 10rem;
    min-width: 0;
  }

  /* Stays on the right, also when a long title pushes it to its own line. */
  .page-head > .row {
    flex: none;
    margin-left: auto;
  }

  .search-toggle {
    width: 44px;
    height: 44px;
    color: var(--text);
  }

  .search-toggle.on {
    background: var(--primary-soft);
    color: var(--primary);
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
    flex-wrap: wrap;
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

  /* A native select dressed as a chip: works everywhere, with the keyboard and screen readers. */
  .picker {
    position: relative;
    display: inline-flex;
    align-items: center;
    max-width: 100%;
  }

  .picker select {
    appearance: none;
    max-width: 100%;
    min-height: 36px;
    padding: 0 1.75rem 0 1.95rem;
    border-radius: var(--radius-sm);
    border: 1.5px solid var(--control);
    background: var(--surface);
    color: var(--text);
    font-weight: 600;
    font-size: 0.9rem;
    text-overflow: ellipsis;
    cursor: pointer;
  }

  .picker option {
    background: var(--surface);
    color: var(--text);
  }

  .picker :global(.picker-icon),
  .picker :global(.picker-chevron) {
    position: absolute;
    pointer-events: none;
    color: var(--muted);
  }

  .picker :global(.picker-icon) {
    left: 0.6rem;
  }

  .picker :global(.picker-chevron) {
    right: 0.5rem;
  }

  .picker.strong select {
    background: var(--text);
    border-color: var(--text);
    color: var(--surface);
  }

  .picker.strong :global(.picker-icon),
  .picker.strong :global(.picker-chevron) {
    color: var(--surface);
  }

  .count {
    min-width: 1.3rem;
    padding: 0 0.35rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 700;
    text-align: center;
    background: var(--surface-2);
    color: var(--muted);
  }

  .count.expired {
    background: var(--danger);
    color: var(--surface);
  }

  .count.soon,
  .count.warn {
    background: var(--warn-soft);
    color: var(--warn);
  }

  .count.ok {
    background: var(--ok-soft);
    color: var(--ok);
  }

  .note {
    display: flex;
    gap: 0.5rem;
    align-items: flex-start;
    padding: 0.6rem 0.75rem;
    border-radius: var(--radius-sm);
    background: var(--surface-2);
    color: var(--muted);
  }

  .note :global(svg) {
    flex: none;
    margin-top: 0.15rem;
    color: var(--warn);
  }

  /* Category cards: one column on phones, two on wider screens, filled top to bottom. */
  .cards > :global(*) {
    margin-bottom: 0.875rem;
  }

  .group {
    padding: 0 0.875rem;
  }

  .group-head {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.75rem 0 0.4rem;
    font-size: 1.2rem;
  }

  .group-head .count {
    margin-left: auto;
    font-family: var(--font);
  }

  .group-head :global(.warn) {
    color: var(--warn);
  }

  .group-head :global(.ok) {
    color: var(--ok);
  }

  .group-head :global(.muted) {
    color: var(--muted);
  }

  .group ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .group.replace {
    border-color: var(--warn);
    background: var(--warn-soft);
    --bar-gap: var(--warn-soft);
  }

  .item,
  .replace-item,
  .goal {
    border-top: 1px solid var(--border);
  }

  .group-head + .goal,
  .group-head + ul > li:first-child {
    border-top: none;
  }

  .item-main {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    width: 100%;
    padding: 0.65rem 0;
    border: none;
    background: none;
    color: inherit;
    text-align: left;
    cursor: pointer;
  }

  .goal,
  .replace-item {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    padding: 0.65rem 0;
  }

  .l1,
  .l2 {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    min-width: 0;
  }

  .l1 .name {
    flex: 1;
    min-width: 0;
    font-weight: 600;
  }

  .places {
    max-width: 45%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .l2 .bar {
    flex: 1;
  }

  .q {
    font-size: 0.875rem;
    font-weight: 600;
    white-space: nowrap;
  }

  .q.zero {
    color: var(--muted);
  }

  .item-main :global(.chevron) {
    flex: none;
    color: var(--muted);
    transition: transform 0.15s;
  }

  .item.open .item-main :global(.chevron) {
    transform: rotate(180deg);
  }

  .details {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    margin: 0 -0.875rem;
    padding: 0.75rem 0.875rem 0.9rem;
    background: color-mix(in srgb, var(--surface-2) 60%, transparent);
    border-top: 1px dashed var(--border);
  }

  .targets {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
  }

  .target {
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
    padding: 0.1rem 0.45rem;
    border-radius: 4px;
    border: 1px solid var(--border);
    color: var(--muted);
    font-weight: 600;
  }

  .target.reached {
    border-color: transparent;
    background: var(--ok-soft);
    color: var(--ok);
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
    padding: 0.4rem 0;
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

  .where {
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
  }

  .lot-actions {
    display: flex;
    margin-left: auto;
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

  .item-actions {
    gap: 0.5rem;
  }

  .grow {
    flex: 1;
    min-width: 0;
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
    justify-content: center;
    text-align: center;
  }

  .end-actions {
    justify-content: center;
  }

  @media (min-width: 720px) {
    .cards:not(.single) {
      columns: 2;
      column-gap: 1rem;
    }

    .cards > :global(*) {
      break-inside: avoid;
    }
  }
</style>
