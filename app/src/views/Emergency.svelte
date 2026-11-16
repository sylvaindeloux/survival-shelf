<script lang="ts">
  import Backpack from '@lucide/svelte/icons/backpack';
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import MapPin from '@lucide/svelte/icons/map-pin';
  import Plus from '@lucide/svelte/icons/plus';
  import { app } from '../lib/app.svelte';
  import { PLAN_TOPICS } from '../lib/core/emergency';
  import { i18n, t, tn } from '../lib/i18n/index.svelte';
  import { bagHref } from '../lib/ui/bags';
  import { reviewText, topicTitle } from '../lib/ui/emergency';
  import { dialogs, router } from '../lib/ui/state.svelte';
  import Bags from './Bags.svelte';
  import EmergencyInfo from './EmergencyInfo.svelte';

  const status = $derived(app.emergency);
  const missing = $derived(status.missing.map((topic) => topicTitle(topic).toLocaleLowerCase(i18n.lang)).join(', '));
</script>

{#if router.path === 'info'}
  <EmergencyInfo />
{:else if router.path === 'bags' || router.path.startsWith('bags/')}
  <Bags />
{:else}
  <div class="stack">
    <header class="page-head">
      <div>
        <h1>{t('emergency.title')}</h1>
        <p class="muted">{t('emergency.subtitle')}</p>
      </div>
    </header>

    <div class="blocks">
      <a class="card block" href="#/emergency/info">
        <span class="block-head">
          <span class="block-icon"><MapPin size={24} /></span>
          <h2>{t('emergency.infoTitle')}</h2>
          <span class="kpi num">{t('emergency.filled', { count: status.filled.length, total: PLAN_TOPICS.length })}</span>
          <ChevronRight size={20} class="chevron" />
        </span>
        <!-- One segment per topic of the household plan. -->
        <span class="segments" aria-hidden="true">
          {#each PLAN_TOPICS as topic (topic)}
            <span class:on={status.filled.includes(topic)}></span>
          {/each}
        </span>
        <span class="small">
          {#if status.missing.length > 0}
            <span class="warn-text">{tn('emergency.missing', status.missing.length, { list: missing })}</span>
          {:else}
            {t('emergency.allFilled')}
          {/if}
          · <span class:warn-text={status.reviewDue}>{reviewText()}</span>
        </span>
      </a>

      <section class="card block">
        <span class="block-head">
          <span class="block-icon"><Backpack size={24} /></span>
          <h2><a class="title-link" href="#/emergency/bags">{t('bags.title')}</a></h2>
        </span>
        <ul class="bags">
          {#each app.bags as bag (bag.bag.name)}
            {@const complete = bag.total > 0 && bag.ready === bag.total}
            <li>
              <a class="bag" href={bagHref(bag.bag.name)}>
                <span class="grow">
                  <span class="bag-head">
                    <span class="name">{bag.bag.name}</span>
                    <span class="small strong num">{t('bags.ready', { ready: bag.ready, total: bag.total })}</span>
                  </span>
                  <span class="bar" class:done={complete} aria-hidden="true"><span style:width="{bag.total > 0 ? (bag.ready / bag.total) * 100 : 0}%"></span></span>
                  <span class="small muted">
                    {#if bag.bag.stored}<span class="where"><MapPin size={14} />{bag.bag.stored}</span>{' · '}{/if}
                    {complete ? t('bags.complete') : tn('bags.missing', bag.total - bag.ready)}
                    {#if bag.checkDue}{' · '}<span class="warn-text">{t('bags.toCheck')}</span>{/if}
                  </span>
                </span>
                <ChevronRight size={20} class="chevron" />
              </a>
            </li>
          {/each}
          <li class="add-row">
            <button type="button" class="add" onclick={() => (dialogs.bag = {})}><Plus size={18} />{t('bags.add')}</button>
            <span class="small muted">{t('bags.onePerPerson')}</span>
          </li>
        </ul>
      </section>
    </div>
  </div>
{/if}

<style>
  .blocks {
    display: grid;
    gap: 0.875rem;
    max-width: 40rem;
  }

  .block {
    display: flex;
    flex-direction: column;
    gap: 0.625rem;
    color: var(--text);
    text-decoration: none;
  }

  a.block:hover {
    border-color: var(--control);
  }

  .block-head {
    display: flex;
    align-items: center;
    gap: 0.625rem;
  }

  .block-head h2 {
    flex: 1;
    min-width: 0;
    font-size: 1.3rem;
  }

  .block-icon {
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
    font-size: 1.35rem;
    font-weight: 700;
    white-space: nowrap;
  }

  .block-head :global(.chevron) {
    flex: none;
    color: var(--muted);
  }

  .segments {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: minmax(0, 1fr);
    gap: 3px;
  }

  .segments span {
    height: 10px;
    border-radius: 2px;
    background: var(--track);
  }

  .segments span.on {
    background: var(--ok);
  }

  .warn-text {
    color: var(--warn);
    font-weight: 600;
  }

  .title-link {
    color: inherit;
    text-decoration: none;
  }

  .title-link:hover {
    text-decoration: underline;
  }

  .bags {
    display: flex;
    flex-direction: column;
    margin: -0.25rem 0 -0.375rem;
    padding: 0;
    list-style: none;
  }

  .bags li {
    border-top: 1px solid var(--border);
  }

  .bags li:first-child {
    border-top: none;
  }

  .bag {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 0;
    color: var(--text);
    text-decoration: none;
  }

  .bag .grow {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 5px;
    min-width: 0;
  }

  .bag-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .bag .name {
    min-width: 0;
    font-weight: 600;
    overflow-wrap: anywhere;
  }

  .bag:hover .name {
    text-decoration: underline;
  }

  .strong {
    font-weight: 700;
    white-space: nowrap;
  }

  .bag .bar {
    height: 6px;
  }

  .where {
    display: inline-flex;
    align-items: center;
    gap: 2px;
  }

  .bag :global(.chevron) {
    flex: none;
    color: var(--muted);
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
</style>
