<script lang="ts">
  import Backpack from '@lucide/svelte/icons/backpack';
  import Check from '@lucide/svelte/icons/check';
  import ChevronLeft from '@lucide/svelte/icons/chevron-left';
  import MapPin from '@lucide/svelte/icons/map-pin';
  import Package from '@lucide/svelte/icons/package';
  import PackagePlus from '@lucide/svelte/icons/package-plus';
  import Pencil from '@lucide/svelte/icons/pencil';
  import Plus from '@lucide/svelte/icons/plus';
  import Printer from '@lucide/svelte/icons/printer';
  import { app } from '../lib/app.svelte';
  import { isReady, localizedItemName, setItemReady, type BagStatus, type ItemStatus } from '../lib/core/bags';
  import { findProduct } from '../lib/core/stock';
  import { sameName } from '../lib/core/text';
  import type { BagItem } from '../lib/core/types';
  import { formatDate, i18n, t } from '../lib/i18n/index.svelte';
  import { bagHref, checkText, groupIcon, groupTitle, markChecked } from '../lib/ui/bags';
  import ExpiryBadge from '../lib/ui/ExpiryBadge.svelte';
  import { quantity } from '../lib/ui/format';
  import SubTabs, { type SubTab } from '../lib/ui/SubTabs.svelte';
  import { dialogs, router } from '../lib/ui/state.svelte';

  /** `bags/Sac%20d%E2%80%99Alex` shows that bag, `bags` the first one. */
  const wanted = $derived(decode(router.path.replace(/^bags\/?/, '')));
  const current = $derived<BagStatus | null>(app.bags.find((status) => sameName(status.bag.name, wanted)) ?? app.bags[0] ?? null);

  function decode(text: string): string {
    try {
      return decodeURIComponent(text);
    } catch {
      return text;
    }
  }

  function add() {
    dialogs.bag = {};
  }

  const tabs = $derived<SubTab[]>([
    ...app.bags.map((status) => ({
      key: status.bag.name,
      href: bagHref(status.bag.name),
      label: status.bag.name,
      icon: Backpack,
      status: t('bags.ready', { ready: status.ready, total: status.total }),
      tone: complete(status) ? ('ok' as const) : ('muted' as const),
      progress: status.total > 0 ? status.ready / status.total : 0,
      current: status === current,
    })),
    { key: '', label: t('bags.add'), short: t('bags.addShort'), icon: Plus, add: true, onclick: add, current: false },
  ]);

  function complete(status: { ready: number; total: number }): boolean {
    return status.total > 0 && status.ready === status.total;
  }

  function tick(item: BagItem, ready: boolean) {
    app.update((shelf) => setItemReady(shelf, item, ready));
  }

  /** Adds a lot of the item's product in the bag; an expired one is replaced by it. */
  function putIn({ item, state, lot }: ItemStatus, bag: string) {
    dialogs.lot =
      state === 'expired' && lot !== null
        ? { product: item.product, qty: lot.qty, replaces: lot.id, location: bag }
        : { product: item.product, location: bag };
  }
</script>

{#snippet itemRow(status: ItemStatus, bag: string)}
  {@const { item, state, lot } = status}
  {@const name = localizedItemName(item.name, i18n.lang)}
  {@const ready = isReady(state)}
  <li class:missing={!ready}>
    {#if item.product === ''}
      <!-- Packed by hand: the whole line ticks it. -->
      <label class="what">
        <input type="checkbox" class="visually-hidden" checked={item.ready} onchange={(event) => tick(item, event.currentTarget.checked)} />
        <span class="box" aria-hidden="true"><Check size={16} /></span>
        <span class="name">{name}</span>
      </label>
    {:else}
      <!-- Follows a product of the stock: ready when one of its lots is in the bag, nothing to tick. -->
      <span class="what">
        <span class="box linked" class:on={ready} aria-hidden="true"><Check size={16} /></span>
        <span class="name">{name}{#if !sameName(item.product, name)}<small>{item.product}</small>{/if}</span>
      </span>
    {/if}
    {#if state === 'expired' && lot !== null}
      <span class="state expired" title={formatDate(lot.expires)}>{t('bags.state.expired')}</span>
    {:else if lot !== null && lot.expires !== ''}
      <ExpiryBadge {lot} />
    {:else if !ready}
      <span class="state">{t('bags.state.missing')}</span>
    {/if}
    {#if item.product !== '' && !ready}
      <button
        class="icon-btn put no-print"
        onclick={() => putIn(status, bag)}
        aria-label={t('bags.putInLabel', { item: name })}
        title={t('bags.putIn')}
      >
        <PackagePlus size={20} />
      </button>
    {/if}
  </li>
{/snippet}

<div class="stack sheet">
  <a class="back no-print" href="#/emergency"><ChevronLeft size={18} />{t('nav.emergency')}</a>

  <header class="no-print">
    <h1>{t('bags.title')}</h1>
    <p class="muted">{t('bags.subtitle')}</p>
  </header>

  {#if current}
    <div class="no-print"><SubTabs label={t('bags.title')} items={tabs} wrap /></div>

    <div class="bag-head">
      <h1 class="print-only">{current.bag.name}</h1>
      <p class="bagline">
        {#if current.bag.stored}<span class="where"><MapPin size={16} />{current.bag.stored}</span> ·{/if}
        <span class:warn-text={current.checkDue}>{checkText(current)}</span>
      </p>
      {#if current.bag.notes}<p class="notes">{current.bag.notes}</p>{/if}
      <p class="print-only small">Survival Shelf · {t('print.printed', { date: formatDate(app.today) })}</p>
    </div>

    <div class="row wrap no-print">
      <button class="btn small" class:primary={current.checkDue} onclick={() => markChecked(current.bag.name)}><Check size={16} />{t('bags.checked')}</button>
      <button class="btn small" onclick={() => (dialogs.bag = { bag: current.bag.name })}><Pencil size={16} />{t('action.edit')}</button>
      <button class="btn small" onclick={() => window.print()}><Printer size={16} />{t('action.print')}</button>
    </div>

    <div class="groups">
      {#each current.groups as group (group.group)}
        {@const Icon = groupIcon(group.group)}
        {@const done = complete({ ready: group.ready, total: group.items.length })}
        <section class="card group">
          <h2 class="group-head">
            <Icon size={20} />
            <span class="title">{groupTitle(group.group)}</span>
            <span class="count" class:ok={done}>{t('bags.ready', { ready: group.ready, total: group.items.length })}</span>
          </h2>
          <div class="bar" class:done aria-hidden="true"><span style:width="{(group.ready / group.items.length) * 100}%"></span></div>
          <ul>
            {#each group.items as status, index (index)}
              {@render itemRow(status, current.bag.name)}
            {/each}
          </ul>
        </section>
      {/each}

      {#if current.others.length > 0}
        <section class="card group">
          <h2 class="group-head"><Package size={20} /><span class="title">{t('bags.others')}</span></h2>
          <p class="small muted">{t('bags.othersHint')}</p>
          <ul>
            {#each current.others as lot (lot.id)}
              <li>
                <span class="what"><span class="name">{lot.product}<small>{quantity(lot.qty, findProduct(app.shelf, lot.product))}</small></span></span>
                {#if lot.expires !== ''}<ExpiryBadge {lot} />{/if}
                <button class="icon-btn no-print" onclick={() => (dialogs.lot = { lotId: lot.id })} aria-label={`${t('lot.editTitle')} · ${lot.product}`} title={t('lot.editTitle')}>
                  <Pencil size={18} />
                </button>
              </li>
            {/each}
          </ul>
        </section>
      {/if}
    </div>
  {:else}
    <section class="card empty">
      <Backpack size={40} />
      <p>{t('bags.none')}</p>
      <button class="btn primary" onclick={add}><Plus size={18} />{t('bags.add')}</button>
    </section>
  {/if}
</div>

<style>
  .back {
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
    align-self: flex-start;
    margin-bottom: -0.25rem;
    color: var(--primary);
    font-weight: 600;
    text-decoration: none;
  }

  header p,
  .bag-head p {
    margin: 0.25rem 0 0;
  }

  .bag-head {
    margin-top: -0.25rem;
  }

  .bagline {
    color: var(--muted);
  }

  .where {
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
  }

  .where :global(svg) {
    flex: none;
  }

  .notes {
    white-space: pre-line;
    overflow-wrap: anywhere;
  }

  .warn-text {
    color: var(--warn);
    font-weight: 600;
  }

  .groups {
    display: grid;
    gap: 0.875rem;
    align-items: start;
  }

  .group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.75rem 0.875rem 0.375rem;
  }

  .group p {
    margin: 0;
  }

  .group-head {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1.2rem;
  }

  .group-head :global(svg) {
    flex: none;
    color: var(--primary);
  }

  .group-head .title {
    flex: 1;
    min-width: 0;
  }

  .count {
    font-family: var(--font);
    font-size: 0.8125rem;
    font-weight: 700;
    white-space: nowrap;
    color: var(--warn);
  }

  .count.ok {
    color: var(--ok);
  }

  .group .bar {
    height: 6px;
  }

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  li {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-height: 44px;
    border-top: 1px solid var(--border);
  }

  li:first-child {
    border-top: none;
  }

  .what {
    display: flex;
    flex: 1;
    align-items: center;
    gap: 0.625rem;
    min-width: 0;
    padding: 0.4rem 0;
  }

  label.what {
    cursor: pointer;
  }

  .name {
    display: flex;
    flex-direction: column;
    min-width: 0;
    overflow-wrap: break-word;
  }

  .name small {
    color: var(--muted);
    font-size: 0.8125rem;
  }

  .missing .name {
    font-weight: 600;
  }

  /* A square to tick: empty, or filled with a check. */
  .box {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border: 2px solid var(--control);
    border-radius: 5px;
    color: transparent;
  }

  input:checked + .box,
  .box.on {
    border-color: var(--primary);
    background: var(--primary);
    color: var(--on-primary);
  }

  /* Ticked from the stock, not by hand: a softer square that does not look clickable. */
  .box.linked {
    border-style: dashed;
  }

  .box.linked.on {
    border-style: solid;
    border-color: var(--primary-soft);
    background: var(--primary-soft);
    color: var(--primary);
  }

  input:focus-visible + .box {
    outline: 2px solid var(--primary);
    outline-offset: 2px;
  }

  label.what:hover .box {
    border-color: var(--primary);
  }

  .state {
    flex: none;
    color: var(--warn);
    font-size: 0.875rem;
    font-weight: 600;
  }

  .state.expired {
    color: var(--danger);
  }

  li :global(.pill) {
    flex: none;
  }

  .put {
    color: var(--primary);
  }

  .empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    padding: 2rem 1rem;
    text-align: center;
  }

  .empty :global(svg) {
    color: var(--primary);
  }

  .empty p {
    max-width: 28rem;
    margin: 0;
  }

  @media (min-width: 720px) {
    .groups {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (min-width: 960px) {
    .groups {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }

  /* A list to pack the bag with, pen in hand: two columns, a square on each line. */
  @media print {
    .sheet {
      gap: 8pt;
      font-size: 10pt;
    }

    h1 {
      font-size: 18pt;
    }

    .groups {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8pt;
    }

    li :global(.pill) {
      padding: 0 3pt;
      font-size: 8.5pt;
    }

    .group {
      gap: 4pt;
      padding: 8pt;
      border-width: 1pt;
      break-inside: avoid;
    }

    .group-head {
      font-size: 12pt;
    }

    .group .bar {
      display: none;
    }

    li {
      min-height: 0;
    }

    .what {
      padding: 2pt 0;
    }

    .box {
      width: 12pt;
      height: 12pt;
      border-width: 1pt;
    }

    .box :global(svg) {
      width: 9pt;
      height: 9pt;
    }
  }
</style>
