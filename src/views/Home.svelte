<script lang="ts">
  import CalendarCheck from '@lucide/svelte/icons/calendar-check';
  import Check from '@lucide/svelte/icons/check';
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import ClipboardList from '@lucide/svelte/icons/clipboard-list';
  import Droplets from '@lucide/svelte/icons/droplets';
  import Flame from '@lucide/svelte/icons/flame';
  import Plus from '@lucide/svelte/icons/plus';
  import Sparkles from '@lucide/svelte/icons/sparkles';
  import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
  import { app } from '../lib/app.svelte';
  import { buyCount } from '../lib/core/checkin';
  import { findProduct } from '../lib/core/stock';
  import { formatDate, formatNumber, t, tn } from '../lib/i18n/index.svelte';
  import ExpiryBadge from '../lib/ui/ExpiryBadge.svelte';
  import { checkinTitle, formatKcal, formatLiters, quantity, tierLabel, wholeDays } from '../lib/ui/format';
  import { dialogs, router } from '../lib/ui/state.svelte';

  const settings = $derived(app.shelf.settings);
  const autonomy = $derived(app.autonomy);
  const plan = $derived(app.plan);
  const checkin = $derived(app.checkin);
  const lostDays = $derived(autonomy.food.naiveDays - autonomy.food.days);
  const alertLots = $derived([...app.alerts.expired, ...app.alerts.soon]);
  const isEmpty = $derived(app.shelf.products.length === 0 && app.shelf.lots.length === 0);
  const lowMenu = $derived(app.menu > 0 && app.menu < settings.kcalPerPersonPerDay * 0.9);
  const toBuy = $derived(buyCount(checkin.buy));
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
        <button class="btn primary" onclick={() => router.go('plan')}><ClipboardList size={18} />{t('home.openPlan')}</button>
        <button class="btn" onclick={() => (dialogs.lot = {})}><Plus size={18} />{t('stock.addLot')}</button>
        {#if !app.demo}
          <button class="btn ghost" onclick={() => app.startDemo()}><Sparkles size={18} />{t('welcome.demo')}</button>
        {/if}
      </div>
    </section>
  {:else}
    {#if app.shelf.lots.length === 0}
      <section class="card ready">
        <span class="empty-icon">🧭</span>
        <div class="grow">
          <h2>{t('home.readyTitle')}</h2>
          <p class="small muted">{t('home.readyText')}</p>
        </div>
        <div class="row wrap">
          <button class="btn primary" onclick={() => router.go('checkin')}><CalendarCheck size={18} />{t('home.readyAction')}</button>
          <button class="btn" onclick={() => (dialogs.lot = {})}><Plus size={18} />{t('stock.addLot')}</button>
        </div>
      </section>
    {/if}

    <section class="card hero" aria-labelledby="autonomy-title">
      <div class="autonomy">
        <p id="autonomy-title" class="eyebrow">{t('home.autonomy')}</p>
        <p class="big num">
          {wholeDays(autonomy.days)}<span class="unit">{t('home.days')}</span>
        </p>
        {#if autonomy.limitedBy}
          <p class="small muted">{t(autonomy.limitedBy === 'food' ? 'home.limitedByFood' : 'home.limitedByWater')}</p>
        {/if}
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
              <p class="small muted">
                {t('home.water')} · {formatLiters(autonomy.water.usable)}
                {#if autonomy.treatmentLiters > 0}<br />{t('home.treatment', { liters: formatLiters(autonomy.treatmentLiters) })}{/if}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div class="tiers">
        <p class="eyebrow">{t('home.tiers')}</p>
        <ol class="ladder">
          {#each plan.tiers as tier (tier.days)}
            {@const current = tier === plan.current}
            <li class:current class:complete={tier.complete}>
              <span class="mark" aria-hidden="true">{#if tier.complete}<Check size={14} />{/if}</span>
              <span class="tier-name">{tierLabel(tier.days)}</span>
              <span class="bar" class:done={tier.complete}><span style:width="{tier.progress * 100}%"></span></span>
              <span class="pct num small">{formatNumber(Math.floor(tier.progress * 100), 0)} %</span>
            </li>
          {/each}
        </ol>
        {#if plan.current}
          <p class="small">
            {t('home.currentTier', { tier: tierLabel(plan.current.days) })}
            {#if toBuy > 0}<span class="muted">· {tn('home.toBuy', toBuy)}</span>{/if}
          </p>
        {:else if plan.tiers.length > 0}
          <p class="small ok-text">{t('home.allTiers')}</p>
        {/if}
      </div>

      {#if lostDays >= 1}
        <p class="note small">
          <TriangleAlert size={16} />
          {t('home.lostToExpiry', { days: formatNumber(Math.floor(lostDays), 0) })}
        </p>
      {/if}
      {#if lowMenu}
        <p class="note small">
          <TriangleAlert size={16} />
          <span>
            {t('home.lowMenu', { menu: formatKcal(app.menu), need: formatKcal(settings.kcalPerPersonPerDay) })}
            <button class="link" onclick={() => router.go('plan')}>{t('home.adjustPlan')}</button>
          </span>
        </p>
      {/if}
    </section>

    <div class="cards">
      <section class="card checkin">
        <div class="section-title">
          <h2>{checkinTitle(settings.rhythm)}</h2>
          <CalendarCheck size={20} />
        </div>
        <div class="counters">
          <div class:alert={checkin.discard.length > 0}>
            <strong class="num">{checkin.discard.length}</strong><span class="small muted">{t('checkin.discardShort')}</span>
          </div>
          <div>
            <strong class="num">{checkin.consume.length}</strong><span class="small muted">{t('checkin.consumeShort')}</span>
          </div>
          <div>
            <strong class="num">{toBuy}</strong><span class="small muted">{t('checkin.buyShort')}</span>
          </div>
        </div>
        <button class="btn primary" onclick={() => router.go('checkin')}>{t('home.openCheckin')}<ChevronRight size={18} /></button>
      </section>

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
            {#each alertLots.slice(0, 5) as lot (lot.id)}
              <li>
                <button class="alert-item" onclick={() => (dialogs.take = { action: 'consumed', lotId: lot.id })}>
                  <span class="grow">
                    <strong>{lot.product}</strong>
                    <span class="muted small">{quantity(lot.qty, findProduct(app.shelf, lot.product))}{lot.location ? ` · ${lot.location}` : ''}</span>
                  </span>
                  <ExpiryBadge {lot} />
                </button>
              </li>
            {/each}
          </ul>
          {#if alertLots.length > 5}
            <button class="btn ghost small more" onclick={() => router.go('stock')}>{t('home.seeAll')}<ChevronRight size={16} /></button>
          {/if}
        {/if}
      </section>
    </div>
  {/if}
</div>

<style>
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

  .ready {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem 1rem;
    border-color: color-mix(in srgb, var(--primary) 40%, var(--border));
    background: var(--primary-soft);
  }

  .ready .grow {
    flex: 1 1 16rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .hero {
    display: grid;
    gap: 1.25rem;
    background:
      radial-gradient(120% 140% at 100% 0%, color-mix(in srgb, var(--primary) 14%, transparent), transparent 60%),
      var(--surface);
  }

  @media (min-width: 760px) {
    .hero {
      grid-template-columns: 1fr 1fr;
      column-gap: 2rem;
    }

    .hero .note {
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
    margin: 0.25rem 0 0.35rem;
  }

  .big .unit {
    font-size: 1.1rem;
    font-weight: 600;
    letter-spacing: 0;
    color: var(--muted);
    margin-left: 0.4rem;
  }

  .resources {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
    margin-top: 0.85rem;
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

  .tiers {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  .ladder {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .ladder li {
    display: grid;
    grid-template-columns: auto 5.5rem 1fr 3rem;
    align-items: center;
    gap: 0.6rem;
    padding: 0.55rem 0.7rem;
    border-radius: var(--radius-sm);
    border: 1px solid transparent;
  }

  .ladder li.current {
    border-color: color-mix(in srgb, var(--primary) 45%, var(--border));
    background: var(--surface);
  }

  .mark {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    border: 2px solid var(--border);
    color: var(--on-primary);
  }

  .complete .mark {
    border-color: var(--ok);
    background: var(--ok);
  }

  .current .mark {
    border-color: var(--primary);
  }

  .tier-name {
    font-weight: 700;
  }

  .pct {
    text-align: right;
    color: var(--muted);
  }

  .ok-text {
    color: var(--ok);
    font-weight: 600;
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

  .cards {
    display: grid;
    gap: 1rem;
  }

  @media (min-width: 760px) {
    .cards {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      align-items: start;
    }
  }

  .checkin {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .checkin .section-title {
    margin: 0;
    color: var(--primary);
  }

  .checkin h2 {
    color: var(--text);
  }

  .counters {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.5rem;
  }

  .counters div {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0.6rem 0.25rem;
    border-radius: var(--radius-sm);
    background: var(--surface-2);
    text-align: center;
  }

  .counters strong {
    font-size: 1.5rem;
    line-height: 1.1;
  }

  .counters .alert {
    background: var(--danger-soft);
    color: var(--danger);
  }

  .alert-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    padding: 0;
    border: none;
    background: none;
    text-align: left;
    cursor: pointer;
  }

  .alert-item .grow strong {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .more {
    margin-top: 0.25rem;
  }
</style>
