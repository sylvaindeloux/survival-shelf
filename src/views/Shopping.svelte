<script lang="ts">
  import Copy from '@lucide/svelte/icons/copy';
  import Droplets from '@lucide/svelte/icons/droplets';
  import Flame from '@lucide/svelte/icons/flame';
  import Plus from '@lucide/svelte/icons/plus';
  import Share2 from '@lucide/svelte/icons/share-2';
  import { app } from '../lib/app.svelte';
  import { PRESETS } from '../lib/core/presets';
  import { formatNumber, t } from '../lib/i18n/index.svelte';
  import { categoryIcon, formatKcal, formatLiters, quantity } from '../lib/ui/format';
  import { dialogs } from '../lib/ui/state.svelte';

  const settings = $derived(app.shelf.settings);
  const riceKcal = PRESETS.find((preset) => preset.name.en === 'Rice')?.kcal ?? 3600;
  const hasTargets = $derived(app.shelf.products.some((product) => product.target !== null));
  const canShare = typeof navigator.share === 'function';

  function listText(): string {
    const lines = app.shopping.map((item) => `- ${item.product.name}: ${quantity(item.missing, item.product)}`);
    if (app.gap.kcal > 0) lines.push(`- ${t('shopping.gapFood', { kcal: formatKcal(app.gap.kcal) })}`);
    if (app.gap.water > 0) lines.push(`- ${t('shopping.gapWater', { liters: formatLiters(app.gap.water) })}`);
    return `${t('shopping.title')}\n${lines.join('\n')}`;
  }

  async function share() {
    try {
      await navigator.share({ title: t('shopping.title'), text: listText() });
    } catch {
      // Cancelled.
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(listText());
      app.toast(t('shopping.copied'), 'success');
    } catch {
      app.toast(t('shopping.copyFailed'), 'error');
    }
  }
</script>

<div class="stack">
  <header class="page-head">
    <div>
      <h1>{t('shopping.title')}</h1>
      <p class="muted">{t('shopping.subtitle')}</p>
    </div>
    {#if app.shopping.length > 0 || app.gap.kcal > 0 || app.gap.water > 0}
      <div class="row">
        {#if canShare}
          <button class="icon-btn outlined" onclick={share} aria-label={t('action.share')} title={t('action.share')}><Share2 size={18} /></button>
        {/if}
        <button class="icon-btn outlined" onclick={copy} aria-label={t('action.copy')} title={t('action.copy')}><Copy size={18} /></button>
      </div>
    {/if}
  </header>

  {#if app.gap.kcal > 0 || app.gap.water > 0}
    <section class="card gap">
      <h2>{t('shopping.gapTitle', { days: settings.targetDays })}</h2>
      <div class="gap-items">
        {#if app.gap.kcal > 0}
          <div class="gap-item food">
            <Flame size={22} />
            <div>
              <strong>+{formatKcal(app.gap.kcal)}</strong>
              <p class="small muted">{t('shopping.riceEquivalent', { kg: formatNumber(app.gap.kcal / riceKcal, 1) })}</p>
            </div>
          </div>
        {/if}
        {#if app.gap.water > 0}
          <div class="gap-item water">
            <Droplets size={22} />
            <div>
              <strong>+{formatLiters(app.gap.water)}</strong>
              <p class="small muted">{t('shopping.water')}</p>
            </div>
          </div>
        {/if}
      </div>
    </section>
  {/if}

  {#if app.shopping.length > 0}
    <ul class="card list">
      {#each app.shopping as item (item.product.name)}
        <li>
          <span class="icon" aria-hidden="true">{categoryIcon(item.product.category)}</span>
          <span class="grow">
            <strong>{item.product.name}</strong>
            <span class="small muted">{t('shopping.have', { have: quantity(item.have, item.product), target: quantity(item.product.target ?? 0, item.product) })}</span>
          </span>
          <span class="missing num">+{quantity(item.missing, item.product)}</span>
          <button
            class="icon-btn outlined"
            onclick={() => (dialogs.lot = { product: item.product.name, qty: item.missing })}
            aria-label={t('shopping.bought')}
            title={t('shopping.bought')}><Plus size={18} /></button
          >
        </li>
      {/each}
    </ul>
  {:else if app.gap.kcal === 0 && app.gap.water === 0}
    <section class="card done">
      <span class="emoji">✅</span>
      <p>{t('shopping.allGood')}</p>
    </section>
  {/if}

  {#if !hasTargets}
    <p class="small muted">{t('shopping.noTargets')}</p>
  {/if}
</div>

<style>
  .page-head {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 1rem;
  }

  .gap {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .gap-items {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 0.75rem;
  }

  .gap-item {
    display: flex;
    gap: 0.6rem;
    padding: 0.75rem;
    border-radius: var(--radius-sm);
    background: var(--surface-2);
  }

  .gap-item strong {
    font-size: 1.2rem;
    color: var(--text);
  }

  .food {
    color: var(--food);
  }

  .water {
    color: var(--water);
  }

  .list {
    list-style: none;
    margin: 0;
    padding: 0 1rem;
  }

  .list li {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 0;
  }

  .list li + li {
    border-top: 1px solid var(--border);
  }

  .icon {
    font-size: 1.3rem;
  }

  .grow {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }

  .missing {
    font-weight: 800;
    color: var(--primary);
  }

  .done {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .emoji {
    font-size: 1.5rem;
  }
</style>
