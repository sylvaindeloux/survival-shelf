<script lang="ts">
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import MapPin from '@lucide/svelte/icons/map-pin';
  import { app } from '../lib/app.svelte';
  import { PLAN_TOPICS } from '../lib/core/emergency';
  import { i18n, t, tn } from '../lib/i18n/index.svelte';
  import { reviewText, topicTitle } from '../lib/ui/emergency';
  import { router } from '../lib/ui/state.svelte';
  import EmergencyInfo from './EmergencyInfo.svelte';

  const status = $derived(app.emergency);
  const missing = $derived(status.missing.map((topic) => topicTitle(topic).toLocaleLowerCase(i18n.lang)).join(', '));
</script>

{#if router.path === 'info'}
  <EmergencyInfo />
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

  .block:hover {
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
</style>
