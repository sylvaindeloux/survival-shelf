<script lang="ts">
  import Check from '@lucide/svelte/icons/check';
  import Copy from '@lucide/svelte/icons/copy';
  import MapPin from '@lucide/svelte/icons/map-pin';
  import Plus from '@lucide/svelte/icons/plus';
  import Share2 from '@lucide/svelte/icons/share-2';
  import Trash from '@lucide/svelte/icons/trash';
  import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
  import { app } from '../lib/app.svelte';
  import { CATALOG } from '../lib/core/catalog';
  import { waterWithoutProduct } from '../lib/core/checkin';
  import { findProduct } from '../lib/core/stock';
  import { formatDate, i18n, t } from '../lib/i18n/index.svelte';
  import ExpiryBadge from '../lib/ui/ExpiryBadge.svelte';
  import ReminderCard from '../lib/ui/ReminderCard.svelte';
  import { categoryIcon, checkinTitle, formatLiters, quantity, RHYTHM_TEXTS, tierLabel } from '../lib/ui/format';
  import { dialogs, router } from '../lib/ui/state.svelte';

  const settings = $derived(app.shelf.settings);
  const checkin = $derived(app.checkin);
  const buy = $derived(checkin.buy);
  const water = $derived(buy ? waterWithoutProduct(buy) : { stored: 0, treatment: 0 });
  const texts = $derived(RHYTHM_TEXTS[settings.rhythm]);
  const foodShort = $derived(buy !== null && buy.foodDays < buy.days && !buy.missing.some((line) => (line.product.kcal ?? 0) > 0));
  const overload = $derived(app.rotation.shareOfNeeds > 1);
  const canShare = typeof navigator.share === 'function';

  const bottle = CATALOG.find((entry) => entry.id === 'water-bottle');
  const filter = CATALOG.find((entry) => entry.id === 'water-filter');

  /** Opens the "add to stock" dialog for a catalog water item, with enough units for these liters. */
  function buyWater(entry: typeof bottle, liters: number) {
    if (!entry) return;
    dialogs.lot = { product: entry.name[i18n.lang], qty: Math.ceil(liters / (entry.water ?? 1)) };
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
    if (buy) {
      lines.push('', t('checkin.buyTitle', { tier: tierLabel(buy.days) }));
      for (const line of buy.missing) lines.push(`- ${line.product.name}: +${quantity(line.missing, line.product)}`);
      if (water.stored > 0) lines.push(`- ${t('checkin.drinkingWater')}: +${formatLiters(water.stored)}`);
      if (water.treatment > 0) lines.push(`- ${t('checkin.waterTreatment')}: ${formatLiters(water.treatment)}`);
    }
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

<div class="stack">
  <header class="page-head">
    <div>
      <h1>{checkinTitle(settings.rhythm)}</h1>
      <p class="muted">{t(texts.subtitle)}</p>
    </div>
    <div class="row">
      {#if canShare}
        <button class="icon-btn outlined" onclick={share} aria-label={t('action.share')} title={t('action.share')}><Share2 size={18} /></button>
      {/if}
      <button class="icon-btn outlined" onclick={copy} aria-label={t('action.copy')} title={t('action.copy')}><Copy size={18} /></button>
    </div>
  </header>

  {#if checkin.discard.length > 0}
    <section class="card step discard">
      <h2><span class="num-badge">1</span>{t('checkin.discardTitle')}</h2>
      <p class="small muted">{t('checkin.discardText')}</p>
      <ul class="list">
        {#each checkin.discard as lot (lot.id)}
          {@const product = findProduct(app.shelf, lot.product)}
          <li>
            <span class="icon" aria-hidden="true">{categoryIcon(product?.category ?? '')}</span>
            <span class="grow">
              <strong>{lot.product}</strong>
              <span class="small muted">{[quantity(lot.qty, product), formatDate(lot.expires), lot.location].filter(Boolean).join(' · ')}</span>
            </span>
            <button class="btn small" onclick={() => (dialogs.take = { action: 'discarded', lotId: lot.id })}>
              <Trash size={16} /><span class="hide-sm">{t('checkin.discarded')}</span>
            </button>
          </li>
        {/each}
      </ul>
    </section>
  {/if}

  <section class="card step">
    <h2><span class="num-badge">{checkin.discard.length > 0 ? 2 : 1}</span>{t('checkin.consumeTitle')}</h2>
    <p class="small muted">
      {t(texts.consume, { margin: settings.rotationMarginDays })}
    </p>
    {#if checkin.consume.length === 0}
      <p class="empty small">{t('checkin.consumeEmpty')}</p>
    {:else}
      <ul class="list">
        {#each checkin.consume as item (item.product.name)}
          <li>
            <span class="icon" aria-hidden="true">{categoryIcon(item.product.category)}</span>
            <span class="grow">
              <strong>{item.product.name} <span class="qty num">{quantity(item.qty, item.product)}</span></strong>
              <span class="small muted lot">
                <ExpiryBadge lot={item.lot} />
                {#if item.lot.location}<span class="where"><MapPin size={13} />{item.lot.location}</span>{/if}
              </span>
            </span>
            <button class="btn small primary" onclick={() => (dialogs.take = { action: 'consumed', lotId: item.lot.id, qty: item.qty })}>
              <Check size={16} /><span class="hide-sm">{t('checkin.done')}</span>
            </button>
          </li>
        {/each}
      </ul>
      {#if overload}
        <p class="note small"><TriangleAlert size={16} />{t('checkin.overload')}</p>
      {/if}
    {/if}
  </section>

  <section class="card step">
    {#if buy}
      <h2><span class="num-badge">{checkin.discard.length > 0 ? 3 : 2}</span>{t('checkin.buyTitle', { tier: tierLabel(buy.days) })}</h2>
      <div class="tier-progress">
        <span class="bar"><span style:width="{buy.progress * 100}%"></span></span>
        <span class="small muted num">{Math.floor(buy.progress * 100)} %</span>
      </div>
      <p class="small muted">{t('checkin.buyText')}</p>
      <ul class="list">
        {#each buy.missing as line (line.product.name)}
          <li>
            <span class="icon" aria-hidden="true">{categoryIcon(line.product.category)}</span>
            <span class="grow">
              <strong>{line.product.name} <span class="qty num">+{quantity(line.missing, line.product)}</span></strong>
              <span class="small muted">
                {#if line.liters !== undefined}
                  {t('checkin.liters', { liters: formatLiters(line.liters) })}
                {:else}
                  {t('checkin.have', { have: quantity(line.have, line.product), target: quantity(line.target, line.product) })}
                {/if}
              </span>
            </span>
            <button class="btn small" onclick={() => (dialogs.lot = { product: line.product.name, qty: line.missing })}>
              <Plus size={16} /><span class="hide-sm">{t('checkin.bought')}</span>
            </button>
          </li>
        {/each}
        {#if water.stored > 0}
          <li>
            <span class="icon" aria-hidden="true">💧</span>
            <span class="grow">
              <strong>{t('checkin.drinkingWater')} <span class="qty num">+{formatLiters(water.stored)}</span></strong>
              <span class="small muted">{t('checkin.noWaterProduct')}</span>
            </span>
            <button class="btn small" onclick={() => buyWater(bottle, water.stored)}>
              <Plus size={16} /><span class="hide-sm">{t('checkin.bought')}</span>
            </button>
          </li>
        {/if}
        {#if water.treatment > 0}
          <li>
            <span class="icon" aria-hidden="true">🚰</span>
            <span class="grow">
              <strong>{t('checkin.waterTreatment')} <span class="qty num">{formatLiters(water.treatment)}</span></strong>
              <span class="small muted">{t('checkin.treatmentHint')}</span>
            </span>
            <button class="btn small" onclick={() => buyWater(filter, water.treatment)}>
              <Plus size={16} /><span class="hide-sm">{t('checkin.bought')}</span>
            </button>
          </li>
        {/if}
      </ul>
      {#if foodShort}
        <p class="note small">
          <TriangleAlert size={16} />
          <span>
            {t('checkin.foodShort', { days: Math.floor(buy.foodDays), tier: tierLabel(buy.days) })}
            <button class="link" onclick={() => router.go('plan')}>{t('home.adjustPlan')}</button>
          </span>
        </p>
      {/if}
    {:else}
      <h2><span class="num-badge">{checkin.discard.length > 0 ? 3 : 2}</span>{t('checkin.buyDoneTitle')}</h2>
      <p class="empty">🎉 {t('checkin.buyDone')}</p>
    {/if}
  </section>

  <ReminderCard />
</div>

<style>
  .step {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  .step h2 {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }

  .num-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.6rem;
    height: 1.6rem;
    border-radius: 50%;
    background: var(--primary-soft);
    color: var(--primary);
    font-size: 0.85rem;
  }

  .discard {
    border-color: color-mix(in srgb, var(--danger) 35%, var(--border));
  }

  .discard .num-badge {
    background: var(--danger-soft);
    color: var(--danger);
  }

  .qty {
    margin-left: 0.25rem;
    color: var(--primary);
  }

  .lot {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.4rem;
    margin-top: 0.15rem;
  }

  .where {
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
  }

  .tier-progress {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .tier-progress .bar {
    flex: 1;
  }

  .empty {
    padding: 0.75rem;
    border-radius: var(--radius-sm);
    background: var(--surface-2);
    color: var(--muted);
  }

  .note {
    display: flex;
    align-items: flex-start;
    gap: 0.4rem;
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

  @media (max-width: 420px) {
    .hide-sm {
      display: none;
    }
  }
</style>
