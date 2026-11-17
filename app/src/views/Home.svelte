<script lang="ts">
  import Backpack from '@lucide/svelte/icons/backpack';
  import CalendarCheck from '@lucide/svelte/icons/calendar-check';
  import Can from '@lucide/svelte/icons/can';
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import CircleCheck from '@lucide/svelte/icons/circle-check';
  import House from '@lucide/svelte/icons/house';
  import ListChecks from '@lucide/svelte/icons/list-checks';
  import MapPin from '@lucide/svelte/icons/map-pin';
  import Package from '@lucide/svelte/icons/package';
  import Plus from '@lucide/svelte/icons/plus';
  import Siren from '@lucide/svelte/icons/siren';
  import Sparkles from '@lucide/svelte/icons/sparkles';
  import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
  import { app } from '../lib/app.svelte';
  import { KINDS } from '../lib/core/categories';
  import { PLAN_TOPICS } from '../lib/core/emergency';
  import { kindOverview, type KindOverview } from '../lib/core/overview';
  import type { Kind } from '../lib/core/types';
  import { formatDate, formatDuration, formatNumber, i18n, t, tn, type MessageKey } from '../lib/i18n/index.svelte';
  import { bagHref } from '../lib/ui/bags';
  import { startCrisis } from '../lib/ui/crisis';
  import { reviewText, topicTitle } from '../lib/ui/emergency';
  import { formatKcal, kindLabel, tierLabel, wholeDays } from '../lib/ui/format';
  import KindIcon from '../lib/ui/KindIcon.svelte';
  import Logo from '../lib/ui/Logo.svelte';
  import { dialogs, router } from '../lib/ui/state.svelte';
  import { todoCounts } from '../lib/ui/todo';

  type Tone = 'danger' | 'warn' | 'ok';

  const settings = $derived(app.shelf.settings);
  const autonomy = $derived(app.autonomy);
  const tier = $derived(app.plan.current);
  const lostDays = $derived(autonomy.food.naiveDays - autonomy.food.days);
  const isEmpty = $derived(app.shelf.products.length === 0 && app.shelf.lots.length === 0);
  const lowMenu = $derived(app.menu > 0 && app.menu < settings.kcalPerPersonPerDay * 0.9);

  const todo = $derived(todoCounts());
  /** "1 to discard · 3 to eat · …": only the actions with something to do. */
  const todoParts = $derived(
    [
      ...(
        [
          [todo.discard, 'checkin.discardShort'],
          [todo.consume, 'checkin.consumeShort'],
          [todo.replace, 'checkin.replaceShort'],
          [todo.buy, 'checkin.buyShort'],
        ] as [number, MessageKey][]
      )
        .filter(([count]) => count > 0)
        .map(([count, key]) => `${formatNumber(count, 0)} ${t(key)}`),
      ...(todo.review > 0 ? [t('home.reviewInfo')] : []),
      ...(todo.bags > 0 ? [tn('home.bagsToCheck', todo.bags)] : []),
    ].join(' · '),
  );

  const kinds = $derived(KINDS.map((kind) => ({ kind, overview: kindOverview(kind, app.summaries, app.checkin.replace, app.gear) })));

  /** What needs a look in a part of the stock, worst first. */
  function kindStatus(kind: Kind, overview: KindOverview): { text: string; tone: Tone }[] {
    const parts: { text: string; tone: Tone }[] = [];
    if (overview.expired > 0) parts.push({ text: tn('stock.expiredCount', overview.expired), tone: 'danger' });
    if (kind === 'gear') {
      if (overview.missing > 0) parts.push({ text: tn('kind.gearMissing', overview.missing), tone: 'warn' });
    } else if (overview.replace > 0) {
      parts.push({ text: tn('stock.toReplaceCount', overview.replace), tone: 'warn' });
    } else if (overview.soon > 0) {
      parts.push({ text: tn('stock.soonCount', overview.soon), tone: 'warn' });
    }
    if (parts.length > 0) return parts;
    if (overview.products > 0 && overview.stocked === 0) return [{ text: t('home.nothingStocked'), tone: 'warn' }];
    return [{ text: t('home.allGood'), tone: 'ok' }];
  }

  const bagsReady = $derived(app.bags.reduce((sum, bag) => sum + bag.ready, 0));
  const bagsTotal = $derived(app.bags.reduce((sum, bag) => sum + bag.total, 0));

  const emergency = $derived(app.emergency);
  const missingInfo = $derived(emergency.missing.map((topic) => topicTitle(topic).toLocaleLowerCase(i18n.lang)).join(', '));
</script>

<div class="stack">
  <h1 class="visually-hidden">{t('home.title')}</h1>
  <div class="top">
    <!-- On tablets and computers the header only holds the tabs: the app's logo and name open its home page.
         Phones keep them in their top bar. -->
    <div class="head">
      <span class="head-logo"><Logo size={44} /></span>
      <div class="head-text">
        <span class="app-name">Survival Shelf</span>
        <p class="muted strong">{formatDate(app.today)} · {tn('home.household', settings.people)}</p>
      </div>
    </div>
    <button type="button" class="sos" onclick={startCrisis}><Siren size={18} />{t('crisis.title')}</button>
  </div>

  <a class="card todo" class:done={todo.total === 0} href="#/checkin">
    <span class="todo-icon">
      {#if todo.total > 0}<ListChecks size={24} />{:else}<CircleCheck size={24} />{/if}
    </span>
    <span class="grow">
      <span class="todo-title">{todo.total > 0 ? tn('home.todo', todo.total) : t('checkin.upToDateTitle')}</span>
      <span class="small">{todo.total > 0 ? todoParts : t('checkin.upToDateText')}</span>
    </span>
    <ChevronRight size={20} class="chevron" />
  </a>

  {#if !isEmpty && app.shelf.lots.length === 0}
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

  <div class="columns">
    <div class="column">
      {#if isEmpty}
        <section class="card empty">
          <span class="empty-icon"><Can size={44} strokeWidth={1.75} /></span>
          <h2>{t('home.emptyTitle')}</h2>
          <p class="muted">{t('home.emptyText')}</p>
          <div class="row wrap center">
            <button class="btn primary" onclick={() => router.go('stock')}><Package size={18} />{t('home.openStock')}</button>
            <button class="btn" onclick={() => (dialogs.lot = {})}><Plus size={18} />{t('stock.addLot')}</button>
            {#if !app.demo}
              <button class="btn ghost" onclick={() => app.startDemo()}><Sparkles size={18} />{t('welcome.demo')}</button>
            {/if}
          </div>
        </section>
      {:else}
        <!-- Holding out at home: how long the stock lasts, then each part of it. -->
        <section class="card part" aria-labelledby="home-stay">
          <div class="part-head">
            <span class="part-icon"><House size={24} /></span>
            <h2 id="home-stay">{t('home.stayTitle')}</h2>
          </div>
          <p class="big num">{wholeDays(autonomy.days)}<span>{tn('home.days', Math.floor(autonomy.days))}</span></p>
          <!-- With nothing stored yet, which one runs out first says nothing. -->
          {#if autonomy.food.days >= 1 || autonomy.water.days >= 1}
            {#if autonomy.limitedBy === 'water'}
              <p class="small muted">{t('home.limitedByWater', { duration: formatDuration(autonomy.food.days) })}</p>
            {:else if autonomy.limitedBy === 'food'}
              <p class="small muted">{t('home.limitedByFood', { duration: formatDuration(autonomy.water.days) })}</p>
            {/if}
          {/if}
          {#if tier}
            <a class="tier" href="#/checkin">
              <span>{t('home.tier', { tier: tierLabel(tier.days) })}</span>
              <span class="bar"><span style:width="{tier.progress * 100}%"></span></span>
              <span class="num">{formatNumber(Math.floor(tier.progress * 100), 0)} %</span>
            </a>
          {:else if app.plan.tiers.length > 0}
            <p class="small ok-text">{t('home.allTiers')}</p>
          {/if}
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
                <a href="#/stock/food">{t('home.adjustTargets')}</a>
              </span>
            </p>
          {/if}
          <ul class="rows">
            {#each kinds as { kind, overview } (kind)}
              <li>
                <a class="row-link" href="#/stock/{kind}">
                  <KindIcon {kind} size={22} />
                  <span class="grow">
                    <span class="name">{kindLabel(kind)}</span>
                    <span class="small strong">
                      {#each kindStatus(kind, overview) as part, index (part.text)}
                        {#if index > 0}{' · '}{/if}<span class={part.tone}>{part.text}</span>
                      {/each}
                    </span>
                  </span>
                  {#if kind === 'gear' && overview.total > 0}
                    <span class="qty num">{t('home.of', { count: overview.ready, total: overview.total })}<small>{tn('home.ready', overview.ready)}</small></span>
                  {:else}
                    <span class="qty num">{formatNumber(overview.products, 0)}<small>{tn('home.products', overview.products)}</small></span>
                  {/if}
                  <ChevronRight size={20} class="chevron" />
                </a>
              </li>
            {/each}
          </ul>
        </section>
      {/if}
    </div>

    <div class="column">
      <!-- Leaving in a hurry: the go-bags. -->
      <section class="card part" aria-labelledby="home-leave">
        <div class="part-head">
          <span class="part-icon"><Backpack size={24} /></span>
          <h2 id="home-leave">{t('home.leaveTitle')}</h2>
          {#if bagsTotal > 0}
            <span class="kpi num">{formatNumber(Math.floor((bagsReady / bagsTotal) * 100), 0)} %</span>
          {/if}
        </div>
        <ul class="rows">
          {#each app.bags as bag (bag.bag.name)}
            <li>
              <a class="row-link" href={bagHref(bag.bag.name)}>
                <span class="grow bag">
                  <span class="bag-head">
                    <span class="name">{bag.bag.name}</span>
                    <span class="small strong num">{t('bags.ready', { ready: bag.ready, total: bag.total })}</span>
                  </span>
                  <span class="bar" class:done={bag.total > 0 && bag.ready === bag.total}>
                    <span style:width="{bag.total > 0 ? (bag.ready / bag.total) * 100 : 0}%"></span>
                  </span>
                </span>
                <ChevronRight size={20} class="chevron" />
              </a>
            </li>
          {:else}
            <li class="add-row">
              <button type="button" class="add" onclick={() => (dialogs.bag = {})}><Plus size={18} />{t('bags.add')}</button>
              <span class="small muted">{t('bags.onePerPerson')}</span>
            </li>
          {/each}
        </ul>
      </section>

      <!-- Finding each other: the household's emergency info. -->
      <section class="card part" aria-labelledby="home-meet">
        <div class="part-head">
          <span class="part-icon"><MapPin size={24} /></span>
          <h2 id="home-meet">{t('home.meetTitle')}</h2>
          <span class="kpi num">{t('emergency.filled', { count: emergency.filled.length, total: PLAN_TOPICS.length })}</span>
        </div>
        <ul class="rows">
          <li>
            <a class="row-link" href="#/emergency/info">
              <span class="grow">
                <span class="name">{t('emergency.infoTitle')}</span>
                <span class="small">
                  {#if emergency.missing.length > 0}
                    <span class="warn strong">{tn('emergency.missing', emergency.missing.length, { list: missingInfo })}</span>
                  {:else}
                    <span class="ok strong">{t('emergency.allFilled')}</span>
                  {/if}
                  {' · '}<span class:warn={emergency.reviewDue} class:strong={emergency.reviewDue}>{reviewText()}</span>
                </span>
              </span>
              <ChevronRight size={20} class="chevron" />
            </a>
          </li>
        </ul>
      </section>
    </div>
  </div>
</div>

<style>
  /* The date wraps rather than push the crisis button under it. */
  .top {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .head {
    display: flex;
    flex: 1;
    align-items: center;
    gap: 0.75rem;
    min-width: 0;
  }

  .head-text {
    min-width: 0;
  }

  .head-logo,
  .app-name {
    display: none;
  }

  @media (min-width: 720px) {
    .head-logo {
      display: inline-flex;
    }

    .app-name {
      display: block;
      font-family: var(--font-display);
      font-size: 1.35rem;
      font-weight: 700;
      line-height: 1.25;
    }
  }

  .strong {
    font-weight: 600;
  }

  /* A way into crisis mode from the home screen, discreet until it is needed. */
  .sos {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    flex: none;
    min-height: 40px;
    padding: 0 0.75rem;
    border: 1.5px solid var(--danger);
    border-radius: var(--radius-sm);
    background: var(--danger-soft);
    color: var(--danger);
    font-family: var(--font-display);
    font-size: 1rem;
    font-weight: 700;
    cursor: pointer;
  }

  .sos:hover {
    background: color-mix(in srgb, var(--danger) 18%, var(--surface));
  }

  .todo {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 0.875rem;
    border-color: var(--warn);
    background: var(--warn-soft);
    color: var(--text);
    text-decoration: none;
  }

  .todo.done {
    border-color: var(--ok);
    background: var(--ok-soft);
  }

  .todo-icon {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: var(--radius);
    background: var(--surface);
    color: var(--warn);
  }

  .todo.done .todo-icon {
    color: var(--ok);
  }

  .todo .grow {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 0.125rem;
    min-width: 0;
  }

  .todo-title {
    font-family: var(--font-display);
    font-size: 1.375rem;
    font-weight: 700;
    line-height: 1.1;
  }

  .todo:hover .todo-title {
    text-decoration: underline;
  }

  .todo :global(.chevron) {
    flex: none;
  }

  .columns,
  .column {
    display: grid;
    gap: 1rem;
    align-content: start;
    min-width: 0;
  }

  .part {
    display: flex;
    flex-direction: column;
    gap: 0.625rem;
    padding-bottom: 0.25rem;
  }

  .part-head {
    display: flex;
    align-items: center;
    gap: 0.625rem;
  }

  .part-head h2 {
    flex: 1;
    min-width: 0;
    font-size: 1.375rem;
  }

  .part-icon {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: var(--radius);
    background: var(--primary-soft);
    color: var(--primary);
  }

  .kpi {
    font-family: var(--font-display);
    font-size: 1.375rem;
    font-weight: 700;
    white-space: nowrap;
  }

  .big {
    margin-top: 0.25rem;
    font-family: var(--font-display);
    font-size: 3.4rem;
    font-weight: 700;
    line-height: 0.95;
  }

  .big span {
    margin-left: 0.35rem;
    font-size: 1.4rem;
  }

  .tier {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    color: var(--text);
    font-size: 0.875rem;
    font-weight: 600;
    text-decoration: none;
  }

  .tier .bar {
    flex: 1;
  }

  .tier:hover > span:first-child {
    text-decoration: underline;
  }

  .ok-text,
  .ok {
    color: var(--ok);
  }

  .ok-text {
    font-weight: 600;
  }

  .warn {
    color: var(--warn);
  }

  .danger {
    color: var(--danger);
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

  .rows {
    display: flex;
    flex-direction: column;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .rows li {
    border-top: 1px solid var(--border);
  }

  .rows li:first-child {
    border-top: none;
  }

  .row-link {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    padding: 0.625rem 0;
    color: var(--text);
    text-decoration: none;
  }

  .row-link > :global(.kind-icon) {
    color: var(--muted);
  }

  .row-link .grow {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 0.125rem;
    min-width: 0;
  }

  .name {
    font-weight: 600;
    overflow-wrap: anywhere;
  }

  .row-link:hover .name {
    text-decoration: underline;
  }

  .row-link :global(.chevron) {
    flex: none;
    color: var(--muted);
  }

  .qty {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    font-family: var(--font-display);
    font-size: 1.1rem;
    font-weight: 700;
    line-height: 1.15;
    white-space: nowrap;
  }

  .qty small {
    font-family: var(--font);
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--muted);
  }

  .bag {
    gap: 0.375rem;
  }

  .bag-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .add-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0 0.75rem;
  }

  .add {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    min-height: 44px;
    padding: 0;
    border: none;
    background: none;
    color: var(--primary);
    font: inherit;
    font-weight: 600;
    cursor: pointer;
  }

  .add:hover {
    text-decoration: underline;
  }

  .empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    padding: 2rem 1rem;
    text-align: center;
  }

  .empty-icon {
    display: inline-flex;
    color: var(--primary);
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
    display: flex;
    flex: 1 1 16rem;
    flex-direction: column;
    gap: 0.25rem;
  }

  /* Tablets and computers: holding out at home on the left, leaving and meeting on the right. */
  @media (min-width: 720px) {
    .columns {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
</style>
