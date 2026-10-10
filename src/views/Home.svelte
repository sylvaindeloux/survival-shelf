<script lang="ts">
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import Droplets from '@lucide/svelte/icons/droplets';
  import Flame from '@lucide/svelte/icons/flame';
  import Plus from '@lucide/svelte/icons/plus';
  import RefreshCw from '@lucide/svelte/icons/refresh-cw';
  import ShoppingCart from '@lucide/svelte/icons/shopping-cart';
  import Sparkles from '@lucide/svelte/icons/sparkles';
  import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
  import { app } from '../lib/app.svelte';
  import { findProduct } from '../lib/core/stock';
  import { formatDate, formatNumber, formatRelative, t, tn } from '../lib/i18n/index.svelte';
  import ExpiryBadge from '../lib/ui/ExpiryBadge.svelte';
  import { formatKcal, formatLiters, formatPace, quantity, wholeDays } from '../lib/ui/format';
  import { dialogs, router } from '../lib/ui/state.svelte';

  const settings = $derived(app.shelf.settings);
  const autonomy = $derived(app.autonomy);
  const progress = $derived(Math.min(1, (Number.isFinite(autonomy.days) ? autonomy.days : 0) / settings.targetDays));
  const reached = $derived(autonomy.days >= settings.targetDays);
  const lostDays = $derived(autonomy.food.naiveDays - autonomy.food.days);
  const alertLots = $derived([...app.alerts.expired, ...app.alerts.soon]);
  const isEmpty = $derived(app.shelf.lots.length === 0);
</script>

<div class="stack">
  <header class="page-head">
    <div>
      <h1>{t('home.title')}</h1>
      <p class="muted">{formatDate(app.today)} · {tn('home.household', settings.people)}</p>
    </div>
  </header>

  {#if isEmpty}
    <section class="card empty">
      <span class="empty-icon">🥫</span>
      <h2>{t('home.emptyTitle')}</h2>
      <p class="muted">{t('home.emptyText')}</p>
      <div class="row wrap center">
        <button class="btn primary" onclick={() => (dialogs.lot = {})}><Plus size={18} />{t('stock.addLot')}</button>
        {#if !app.demo}
          <button class="btn" onclick={() => app.startDemo()}><Sparkles size={18} />{t('welcome.demo')}</button>
        {/if}
      </div>
    </section>
  {:else}
    <section class="card autonomy" aria-labelledby="autonomy-title">
      <div class="autonomy-main">
        <p id="autonomy-title" class="eyebrow">{t('home.autonomy')}</p>
        <p class="big num">
          {wholeDays(autonomy.days)}<span class="unit">{t('home.days')}</span>
        </p>
        <div
          class="progress"
          class:reached
          role="progressbar"
          aria-valuemin="0"
          aria-valuemax={settings.targetDays}
          aria-valuenow={Math.floor(Math.min(autonomy.days, settings.targetDays))}
        >
          <span style:width="{progress * 100}%"></span>
        </div>
        <p class="small muted">
          {reached ? t('home.goalReached', { days: settings.targetDays }) : t('home.goal', { days: settings.targetDays })}
          {#if autonomy.limitedBy}· {t(autonomy.limitedBy === 'food' ? 'home.limitedByFood' : 'home.limitedByWater')}{/if}
        </p>
      </div>
      <div class="resources">
        <div class="resource food">
          <Flame size={20} />
          <div>
            <p class="resource-days num">{wholeDays(autonomy.food.days)} {t('home.daysShort')}</p>
            <p class="small muted">{t('home.food')} · {formatKcal(autonomy.food.usable)}</p>
          </div>
        </div>
        <div class="resource water">
          <Droplets size={20} />
          <div>
            <p class="resource-days num">{wholeDays(autonomy.water.days)} {t('home.daysShort')}</p>
            <p class="small muted">{t('home.water')} · {formatLiters(autonomy.water.usable)}</p>
          </div>
        </div>
      </div>
      {#if lostDays >= 1}
        <p class="note small">
          <TriangleAlert size={16} />
          {t('home.lostToExpiry', { days: formatNumber(Math.floor(lostDays), 0) })}
        </p>
      {/if}
      {#if autonomy.food.usable === 0 && app.shelf.lots.length > 0}
        <p class="note small"><TriangleAlert size={16} />{t('home.noKcal')}</p>
      {/if}
    </section>

    <div class="cards">
      <section class="card">
        <div class="section-title">
          <h2>{t('home.alerts')}</h2>
          {#if alertLots.length > 0}
            <span class="pill {app.alerts.expired.length > 0 ? 'expired' : 'soon'}">{alertLots.length}</span>
          {/if}
        </div>
        {#if alertLots.length === 0}
          <p class="muted small">{t('home.noAlerts', { days: settings.warningDays })}</p>
        {:else}
          <ul class="list">
            {#each alertLots.slice(0, 6) as lot (lot.id)}
              <li>
                <button class="list-item" onclick={() => (dialogs.take = { action: 'consumed', lotId: lot.id })}>
                  <span class="grow">
                    <strong>{lot.product}</strong>
                    <span class="muted small">{quantity(lot.qty, findProduct(app.shelf, lot.product))}{lot.location ? ` · ${lot.location}` : ''}</span>
                  </span>
                  <ExpiryBadge {lot} />
                </button>
              </li>
            {/each}
          </ul>
          {#if alertLots.length > 6}
            <button class="btn ghost small more" onclick={() => router.go('stock')}>{t('home.seeAll')}<ChevronRight size={16} /></button>
          {/if}
        {/if}
      </section>

      <section class="card">
        <div class="section-title">
          <h2>{t('home.rotation')}</h2>
          <button class="btn ghost small" onclick={() => router.go('rotation')}><RefreshCw size={16} />{t('home.plan')}</button>
        </div>
        {#if app.rotation.items.length === 0}
          <p class="muted small">{t('rotation.empty')}</p>
        {:else}
          <ul class="list">
            {#each app.rotation.items.slice(0, 4) as item (item.product.name)}
              <li class="list-item static">
                <span class="grow">
                  <strong>{item.product.name}</strong>
                  <span class="muted small">{formatPace(item.perWeek, item.product)}</span>
                </span>
                {#if item.due}
                  <span class="pill soon">{t('rotation.due')}</span>
                {:else}
                  <span class="pill">{formatRelative(item.consumeBy - app.today)}</span>
                {/if}
              </li>
            {/each}
          </ul>
        {/if}
      </section>

      <section class="card">
        <div class="section-title">
          <h2>{t('home.shopping')}</h2>
          <button class="btn ghost small" onclick={() => router.go('shopping')}><ShoppingCart size={16} />{t('home.list')}</button>
        </div>
        {#if app.shopping.length === 0 && app.gap.kcal === 0 && app.gap.water === 0}
          <p class="muted small">{t('shopping.allGood')}</p>
        {:else}
          <p>{tn('home.toBuy', app.shopping.length)}</p>
          {#if app.gap.kcal > 0 || app.gap.water > 0}
            <p class="small muted">
              {t('home.gap', { days: settings.targetDays })}
              {#if app.gap.kcal > 0}<strong class="food-text">+{formatKcal(app.gap.kcal)}</strong>{/if}
              {#if app.gap.water > 0}<strong class="water-text">+{formatLiters(app.gap.water)}</strong>{/if}
            </p>
          {/if}
        {/if}
      </section>
    </div>
  {/if}
</div>

<style>
  .page-head {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 1rem;
  }

  .empty {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    padding: 2rem 1rem;
  }

  .empty-icon {
    font-size: 2.5rem;
  }

  .center {
    justify-content: center;
  }

  .autonomy {
    display: grid;
    gap: 1rem;
    background:
      radial-gradient(120% 140% at 100% 0%, color-mix(in srgb, var(--primary) 14%, transparent), transparent 60%),
      var(--surface);
  }

  @media (min-width: 720px) {
    .autonomy {
      grid-template-columns: 1.2fr 1fr;
      align-items: center;
    }

    .autonomy .note {
      grid-column: 1 / -1;
    }
  }

  .eyebrow {
    font-size: 0.8rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--primary);
  }

  .big {
    font-size: 3.5rem;
    font-weight: 800;
    line-height: 1;
    letter-spacing: -0.03em;
    margin: 0.25rem 0 0.75rem;
  }

  .big .unit {
    font-size: 1.1rem;
    font-weight: 600;
    letter-spacing: 0;
    color: var(--muted);
    margin-left: 0.4rem;
  }

  .progress {
    height: 10px;
    border-radius: 999px;
    background: var(--surface-2);
    overflow: hidden;
    margin-bottom: 0.5rem;
  }

  .progress span {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, var(--warn), var(--food));
    transition: width 0.4s ease;
  }

  .progress.reached span {
    background: linear-gradient(90deg, var(--primary), var(--ok));
  }

  .resources {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }

  .resource {
    display: flex;
    gap: 0.6rem;
    align-items: flex-start;
    padding: 0.75rem;
    border-radius: var(--radius-sm);
    background: var(--surface-2);
  }

  .resource.food {
    color: var(--food);
  }

  .resource.water {
    color: var(--water);
  }

  .resource-days {
    font-size: 1.3rem;
    font-weight: 800;
    color: var(--text);
  }

  .note {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    color: var(--warn);
  }

  .cards {
    display: grid;
    gap: 1rem;
  }

  @media (min-width: 900px) {
    .cards {
      grid-template-columns: repeat(3, minmax(0, 1fr));
      align-items: start;
    }
  }

  .list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
  }

  .list-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    padding: 0.55rem 0;
    border: none;
    border-top: 1px solid var(--border);
    background: none;
    text-align: left;
    cursor: pointer;
  }

  li:first-child .list-item {
    border-top: none;
  }

  .list-item.static {
    cursor: default;
  }

  .grow {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }

  .grow strong {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .more {
    margin-top: 0.25rem;
  }

  .food-text {
    color: var(--food);
    margin-left: 0.25rem;
  }

  .water-text {
    color: var(--water);
    margin-left: 0.25rem;
  }
</style>
