<script lang="ts">
  import MapPin from '@lucide/svelte/icons/map-pin';
  import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
  import Utensils from '@lucide/svelte/icons/utensils';
  import { app } from '../lib/app.svelte';
  import { formatDate, formatDuration, formatNumber, t } from '../lib/i18n/index.svelte';
  import ExpiryBadge from '../lib/ui/ExpiryBadge.svelte';
  import { categoryIcon, formatKcal, formatPace, quantity } from '../lib/ui/format';
  import { dialogs, router } from '../lib/ui/state.svelte';

  const plan = $derived(app.rotation);
  const share = $derived(Math.round(plan.shareOfNeeds * 100));
</script>

<div class="stack">
  <header>
    <h1>{t('rotation.title')}</h1>
    <p class="muted">{t('rotation.subtitle')}</p>
  </header>

  <section class="card intro">
    <p>{t('rotation.explain', { margin: app.shelf.settings.rotationMarginDays })}</p>
    {#if plan.items.length > 0 && plan.kcalPerDay > 0}
      <div class="load" class:over={share > 100}>
        <div class="load-bar"><span style:width="{Math.min(share, 100)}%"></span></div>
        <p class="small">
          {t('rotation.load', { kcal: formatKcal(plan.kcalPerDay), share: formatNumber(share, 0) })}
        </p>
        {#if share > 100}
          <p class="small warn"><TriangleAlert size={16} />{t('rotation.overload')}</p>
        {/if}
      </div>
    {/if}
    <button class="btn ghost small settings-link" onclick={() => router.go('settings')}>{t('rotation.changeMargin')}</button>
  </section>

  {#if plan.items.length === 0}
    <p class="muted center">{t('rotation.empty')}</p>
  {:else}
    <ul class="items">
      {#each plan.items as item (item.product.name)}
        <li class="card item" class:due={item.due}>
          <div class="head">
            <span class="icon" aria-hidden="true">{categoryIcon(item.product.category)}</span>
            <div class="title">
              <strong>{item.product.name}</strong>
              <span class="pace">{formatPace(item.perWeek, item.product)}</span>
            </div>
            <button
              class="btn small primary"
              aria-label={t('take.consume')}
              onclick={() => (dialogs.take = { action: 'consumed', lotId: item.nextLot.id })}
            >
              <Utensils size={16} /><span class="hide-sm">{t('take.consume')}</span>
            </button>
          </div>
          <div class="next small">
            <span class="muted">{t('rotation.next')}</span>
            <strong class="num">{quantity(item.nextLot.qty, item.product)}</strong>
            <ExpiryBadge lot={item.nextLot} />
            {#if item.nextLot.location}<span class="muted where"><MapPin size={13} />{item.nextLot.location}</span>{/if}
          </div>
          <p class="small {item.due ? 'warn' : 'muted'}">
            {item.due
              ? t('rotation.dueText', { date: formatDate(item.consumeBy) })
              : t('rotation.consumeBy', { date: formatDate(item.consumeBy), left: formatDuration(item.consumeBy - app.today) })}
          </p>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .intro {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .load-bar {
    height: 8px;
    border-radius: 999px;
    background: var(--surface-2);
    overflow: hidden;
    margin-bottom: 0.4rem;
  }

  .load-bar span {
    display: block;
    height: 100%;
    background: var(--primary);
    border-radius: inherit;
  }

  .load.over .load-bar span {
    background: var(--danger);
  }

  .warn {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    color: var(--warn);
  }

  .settings-link {
    align-self: flex-start;
    padding-left: 0;
  }

  .items {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 0.75rem;
  }

  @media (min-width: 900px) {
    .items {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  .item {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  .item.due {
    border-color: color-mix(in srgb, var(--warn) 50%, var(--border));
  }

  .head {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .icon {
    font-size: 1.5rem;
  }

  .title {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }

  .pace {
    color: var(--primary);
    font-weight: 700;
  }

  .next {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
  }

  .where {
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
  }

  .center {
    text-align: center;
  }

  @media (max-width: 560px) {
    .hide-sm {
      display: none;
    }
  }
</style>
