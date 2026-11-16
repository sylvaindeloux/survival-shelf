<script lang="ts">
  import Backpack from '@lucide/svelte/icons/backpack';
  import Check from '@lucide/svelte/icons/check';
  import CircleCheck from '@lucide/svelte/icons/circle-check';
  import Copy from '@lucide/svelte/icons/copy';
  import MapPin from '@lucide/svelte/icons/map-pin';
  import RefreshCw from '@lucide/svelte/icons/refresh-cw';
  import Share2 from '@lucide/svelte/icons/share-2';
  import ShoppingCart from '@lucide/svelte/icons/shopping-cart';
  import Siren from '@lucide/svelte/icons/siren';
  import Trash from '@lucide/svelte/icons/trash';
  import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
  import Utensils from '@lucide/svelte/icons/utensils';
  import { app } from '../lib/app.svelte';
  import { CATALOG } from '../lib/core/catalog';
  import { isStoredWater, KINDS } from '../lib/core/categories';
  import { buyCount, waterWithoutProduct } from '../lib/core/checkin';
  import type { TierLine } from '../lib/core/plan';
  import { findProduct } from '../lib/core/stock';
  import type { Lot } from '../lib/core/types';
  import { formatDate, localize, t, tn } from '../lib/i18n/index.svelte';
  import { bagHref, markChecked } from '../lib/ui/bags';
  import { markReviewed } from '../lib/ui/emergency';
  import ExpiryBadge from '../lib/ui/ExpiryBadge.svelte';
  import ReminderCard from '../lib/ui/ReminderCard.svelte';
  import { checkinTitle, formatLiters, kindLabel, ofTarget, quantity, RHYTHM_TEXTS, tierLabel } from '../lib/ui/format';
  import { dialogs, router } from '../lib/ui/state.svelte';
  import { todoCounts } from '../lib/ui/todo';

  const settings = $derived(app.shelf.settings);
  const checkin = $derived(app.checkin);
  const buy = $derived(checkin.buy);
  const water = $derived(buy ? waterWithoutProduct(buy) : { stored: 0, treatment: 0 });
  const texts = $derived(RHYTHM_TEXTS[settings.rhythm]);
  const foodShort = $derived(buy !== null && buy.foodDays < buy.days && !buy.missing.some((line) => (line.product.kcal ?? 0) > 0));
  const overload = $derived(app.rotation.shareOfNeeds > 1);
  const canShare = typeof navigator.share === 'function';

  const toBuy = $derived(buyCount(buy));
  const review = $derived(app.emergency.reviewDue);
  /** Bags checked more than a year ago. */
  const bags = $derived(app.bags.filter((bag) => bag.checkDue));
  /** Everything to do, all actions together. */
  const count = $derived(todoCounts().total);
  // A tier can be short of food with nothing to buy (a light menu): the buy card then only shows why.
  const showBuy = $derived(buy !== null && (toBuy > 0 || foodShort));
  const cards = $derived(
    [checkin.discard.length > 0, checkin.consume.length > 0, checkin.replace.length > 0, showBuy, review].filter(Boolean).length + bags.length,
  );

  /** What to buy, by kind: the shopping list follows the shop's aisles. Water without a product goes with the food. */
  const buyGroups = $derived(
    KINDS.map((kind) => ({ kind, lines: buy ? buy.missing.filter((line) => line.product.kind === kind) : [] })).filter(
      (group) => group.lines.length > 0 || (group.kind === 'food' && (water.stored > 0 || water.treatment > 0)),
    ),
  );

  function buyLineText(line: TierLine): string {
    return `- ${line.product.name}: +${quantity(line.missing, line.product)}`;
  }

  const bottle = CATALOG.find((entry) => entry.id === 'water-bottle');
  const filter = CATALOG.find((entry) => entry.id === 'water-filter');

  /** Opens the "add to stock" dialog for a catalog water item, with enough units for these liters. */
  function buyWater(entry: typeof bottle, liters: number) {
    if (!entry) return;
    dialogs.lot = { product: localize(entry.name), qty: Math.ceil(liters / (entry.water ?? 1)) };
  }

  function listText(): string {
    const lines = [`Survival Shelf · ${checkinTitle(settings.rhythm)}`];
    if (checkin.discard.length > 0) {
      lines.push('', t('checkin.discardTitle'));
      for (const lot of checkin.discard) lines.push(`- ${lot.product}: ${quantity(lot.qty, findProduct(app.shelf, lot.product))}`);
    }
    if (checkin.consume.length > 0) {
      lines.push('', t('checkin.consumeTitle'));
      for (const item of checkin.consume) lines.push(`- ${item.product.name}: ${quantity(item.qty, item.product)}`);
    }
    if (checkin.replace.length > 0) {
      lines.push('', t('checkin.replaceTitle'));
      for (const item of checkin.replace) lines.push(`- ${item.product.name}: ${quantity(item.lot.qty, item.product)}`);
    }
    if (buy && toBuy > 0) {
      lines.push('', `${t('checkin.buyTitle')} (${t('stock.tierChoice', { tier: tierLabel(buy.days) })})`);
      for (const group of buyGroups) {
        if (buyGroups.length > 1) lines.push(`[${kindLabel(group.kind)}]`);
        lines.push(...group.lines.map(buyLineText));
        if (group.kind !== 'food') continue;
        if (water.stored > 0) lines.push(`- ${t('checkin.drinkingWater')}: +${formatLiters(water.stored)}`);
        if (water.treatment > 0) lines.push(`- ${t('checkin.waterTreatment')}: ${formatLiters(water.treatment)}`);
      }
    }
    if (review) lines.push('', t('checkin.reviewTitle'));
    for (const bag of bags) lines.push('', t('checkin.bagTitle', { bag: bag.bag.name }));
    return lines.join('\n');
  }

  async function share() {
    try {
      await navigator.share({ title: checkinTitle(settings.rhythm), text: listText() });
    } catch {
      // Cancelled.
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(listText());
      app.toast(t('checkin.copied'), 'success');
    } catch {
      app.toast(t('checkin.copyFailed'), 'error');
    }
  }
</script>

{#snippet lotRow(name: string, qty: string, lot: Lot, verb: string, act: () => void)}
  <li>
    <span class="l1"><span class="name">{name}</span><span class="q num">{qty}</span></span>
    <span class="l1">
      <span class="meta small muted">
        <ExpiryBadge {lot} />
        {#if lot.location}<span class="where"><MapPin size={13} />{lot.location}</span>{/if}
      </span>
      <button class="btn small" onclick={act}><Check size={16} />{verb}</button>
    </span>
  </li>
{/snippet}

{#snippet buyRow(name: string, qty: string, meta: string, act: () => void)}
  <li>
    <span class="l1"><span class="name">{name}</span><span class="q num">{qty}</span></span>
    <span class="l1">
      <span class="meta small muted">{meta}</span>
      <button class="btn small" onclick={act}><Check size={16} />{t('checkin.bought')}</button>
    </span>
  </li>
{/snippet}

<div class="stack">
  <header class="page-head">
    <div>
      <h1>{t('checkin.title')}</h1>
      <p class="muted">{count > 0 ? tn('checkin.count', count) : t('checkin.nothing')}</p>
    </div>
    {#if count > 0}
      <div class="row">
        {#if canShare}
          <button class="icon-btn outlined" onclick={share} aria-label={t('action.share')} title={t('action.share')}><Share2 size={18} /></button>
        {/if}
        <button class="icon-btn outlined" onclick={copy} aria-label={t('action.copy')} title={t('action.copy')}><Copy size={18} /></button>
      </div>
    {/if}
  </header>

  {#if cards === 0}
    <section class="card up-to-date">
      <CircleCheck size={40} />
      <h2>{t('checkin.upToDateTitle')}</h2>
      <p class="muted">{t('checkin.upToDateText')}</p>
      <p class="small muted">{t(texts.subtitle)}</p>
    </section>
  {:else}
    <!-- One card per action, the most urgent first: two columns on wider screens. -->
    <div class="cards" class:single={cards === 1}>
      {#if checkin.discard.length > 0}
        <section class="card action discard">
          <h2 class="action-head"><Trash size={20} />{t('checkin.discardTitle')}<span class="count">{checkin.discard.length}</span></h2>
          <p class="lead small muted">{t('checkin.discardText')}</p>
          <ul>
            {#each checkin.discard as lot (lot.id)}
              {@render lotRow(lot.product, quantity(lot.qty, findProduct(app.shelf, lot.product)), lot, t('checkin.discarded'), () => (dialogs.take = { action: 'discarded', lotId: lot.id }))}
            {/each}
          </ul>
        </section>
      {/if}

      {#if checkin.consume.length > 0}
        <section class="card action consume">
          <h2 class="action-head"><Utensils size={20} />{t('checkin.consumeTitle')}<span class="count">{checkin.consume.length}</span></h2>
          <p class="lead small muted">{t(texts.consume, { margin: settings.rotationMarginDays })}</p>
          <ul>
            {#each checkin.consume as item (item.product.name)}
              {@render lotRow(item.product.name, quantity(item.qty, item.product), item.lot, t(isStoredWater(item.product) ? 'checkin.drunk' : 'checkin.eaten'), () => (dialogs.take = { action: 'consumed', lotId: item.lot.id, qty: item.qty }))}
            {/each}
          </ul>
          {#if overload}
            <p class="note small"><TriangleAlert size={16} />{t('checkin.overload')}</p>
          {/if}
        </section>
      {/if}

      {#if checkin.replace.length > 0}
        <section class="card action replace">
          <h2 class="action-head"><RefreshCw size={20} />{t('checkin.replaceTitle')}<span class="count">{checkin.replace.length}</span></h2>
          <p class="lead small muted">{t('checkin.replaceText')}</p>
          <ul>
            {#each checkin.replace as item (item.lot.id)}
              {@render lotRow(item.product.name, quantity(item.lot.qty, item.product), item.lot, t('checkin.replaced'), () => (dialogs.lot = { product: item.product.name, qty: item.lot.qty, replaces: item.lot.id }))}
            {/each}
          </ul>
        </section>
      {/if}

      {#if buy && showBuy}
        <section class="card action buy">
          <h2 class="action-head"><ShoppingCart size={20} />{t('checkin.buyTitle')}{#if toBuy > 0}<span class="count">{toBuy}</span>{/if}</h2>
          <p class="lead small muted">{t('checkin.buyText', { tier: tierLabel(buy.days) })}</p>
          {#each buyGroups as group (group.kind)}
            {#if buyGroups.length > 1}<h3 class="kind-title">{kindLabel(group.kind)}</h3>{/if}
            <ul>
              {#each group.lines as line (line.product.name)}
                {@render buyRow(
                  line.product.name,
                  `+${quantity(line.missing, line.product)}`,
                  line.liters !== undefined ? t('checkin.liters', { liters: formatLiters(line.liters) }) : ofTarget(line.have, line.target, line.product),
                  () => (dialogs.lot = { product: line.product.name, qty: line.missing }),
                )}
              {/each}
              {#if group.kind === 'food' && water.stored > 0}
                {@render buyRow(t('checkin.drinkingWater'), `+${formatLiters(water.stored)}`, t('checkin.noWaterProduct'), () => buyWater(bottle, water.stored))}
              {/if}
              {#if group.kind === 'food' && water.treatment > 0}
                {@render buyRow(t('checkin.waterTreatment'), formatLiters(water.treatment), t('checkin.treatmentHint'), () => buyWater(filter, water.treatment))}
              {/if}
            </ul>
          {/each}
          {#if foodShort}
            <p class="note small">
              <TriangleAlert size={16} />
              <span>
                {t('checkin.foodShort', { days: Math.floor(buy.foodDays), tier: tierLabel(buy.days) })}
                <button class="link" onclick={() => router.go('stock', 'food')}>{t('home.adjustTargets')}</button>
              </span>
            </p>
          {/if}
        </section>
      {/if}

      {#if review}
        <section class="card action review">
          <h2 class="action-head"><Siren size={20} />{t('checkin.reviewTitle')}</h2>
          <p class="lead small muted">{t('checkin.reviewText', { date: formatDate(settings.emergencyReviewed) })}</p>
          <div class="row wrap review-actions">
            <a class="btn small" href="#/emergency/info">{t('checkin.openInfo')}</a>
            <button class="btn small" onclick={markReviewed}><Check size={16} />{t('emergency.reviewed')}</button>
          </div>
        </section>
      {/if}

      {#each bags as bag (bag.bag.name)}
        <section class="card action review">
          <h2 class="action-head"><Backpack size={20} />{t('checkin.bagTitle', { bag: bag.bag.name })}</h2>
          <p class="lead small muted">{t('checkin.bagText', { date: formatDate(bag.bag.checked) })}</p>
          <div class="row wrap review-actions">
            <a class="btn small" href={bagHref(bag.bag.name)}>{t('checkin.openInfo')}</a>
            <button class="btn small" onclick={() => markChecked(bag.bag.name)}><Check size={16} />{t('bags.checked')}</button>
          </div>
        </section>
      {/each}
    </div>
  {/if}

  <ReminderCard />
</div>

<style>
  .up-to-date {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.4rem;
    padding: 2rem 1rem;
    text-align: center;
  }

  .up-to-date :global(svg) {
    margin-bottom: 0.4rem;
    color: var(--ok);
  }

  .up-to-date h2 {
    font-size: 1.5rem;
  }

  .up-to-date p {
    margin: 0;
  }

  .cards > :global(*) {
    margin-bottom: 0.875rem;
  }

  .cards > :global(:last-child) {
    margin-bottom: 0;
  }

  /* An action card: a thick colored edge on the left says how urgent it is. */
  .action {
    padding: 0 0.875rem 0.25rem;
    border-left-width: 6px;
  }

  .discard {
    border-left-color: var(--danger);
  }

  .consume,
  .replace {
    border-left-color: var(--warn);
  }

  .buy {
    border-left-color: var(--primary);
  }

  .review {
    border-left-color: var(--info);
  }

  .review-actions {
    justify-content: flex-end;
    padding: 0.25rem 0 0.75rem;
  }

  .action-head {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.75rem 0 0.3rem;
    font-size: 1.2rem;
  }

  .discard .action-head :global(svg) {
    color: var(--danger);
  }

  .consume .action-head :global(svg) {
    color: var(--primary);
  }

  .replace .action-head :global(svg) {
    color: var(--warn);
  }

  .review .action-head :global(svg) {
    color: var(--info);
  }

  .count {
    min-width: 1.3rem;
    margin-left: auto;
    padding: 0 0.35rem;
    border-radius: 4px;
    font-family: var(--font);
    font-size: 0.75rem;
    font-weight: 700;
    text-align: center;
    background: var(--warn-soft);
    color: var(--warn);
  }

  .discard .count {
    background: var(--danger);
    color: var(--surface);
  }

  .lead {
    margin: 0 0 0.25rem;
  }

  .action ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .action li {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    padding: 0.65rem 0;
    border-top: 1px solid var(--border);
  }

  .action li:first-child {
    border-top: none;
  }

  .l1 {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    min-width: 0;
  }

  .name {
    flex: 1;
    min-width: 0;
    font-weight: 600;
  }

  .q {
    font-size: 0.875rem;
    font-weight: 600;
    white-space: nowrap;
  }

  .meta {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.4rem;
  }

  .where {
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
  }

  .l1 .btn {
    flex: none;
  }

  .kind-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0.4rem 0 0;
    font-family: var(--font);
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted);
  }

  .kind-title::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--border);
  }

  .note {
    display: flex;
    align-items: flex-start;
    gap: 0.4rem;
    margin: 0.25rem 0 0.65rem;
    color: var(--warn);
  }

  .note :global(svg) {
    flex: none;
    margin-top: 0.15rem;
  }

  .link {
    padding: 0;
    border: none;
    background: none;
    color: var(--primary);
    font-weight: 600;
    text-decoration: underline;
    cursor: pointer;
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
