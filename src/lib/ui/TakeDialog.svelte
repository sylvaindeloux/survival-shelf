<script lang="ts">
  import Minus from '@lucide/svelte/icons/minus';
  import Plus from '@lucide/svelte/icons/plus';
  import { app } from '../app.svelte';
  import { byExpiry, findProduct, lotsOf, takeFromLot, takeFromProduct } from '../core/stock';
  import { parseNumber } from '../core/text';
  import type { LogAction } from '../core/types';
  import { t } from '../i18n/index.svelte';
  import Dialog from './Dialog.svelte';
  import ExpiryBadge from './ExpiryBadge.svelte';
  import { inputNumber, quantity } from './format';
  import { dialogs, type TakeDialogState } from './state.svelte';

  let { request }: { request: TakeDialogState } = $props();

  // svelte-ignore state_referenced_locally
  const lot = request.lotId ? app.shelf.lots.find((candidate) => candidate.id === request.lotId) : undefined;
  // svelte-ignore state_referenced_locally
  const productName = lot?.product ?? request.product ?? '';
  const product = findProduct(app.shelf, productName);
  const lots = lot ? [lot] : lotsOf(app.shelf, productName).sort(byExpiry);
  const available = lots.reduce((sum, candidate) => sum + candidate.qty, 0);

  // svelte-ignore state_referenced_locally
  let action = $state<LogAction>(request.action);
  // Discarding a lot usually means all of it.
  // svelte-ignore state_referenced_locally
  let qty = $state(
    inputNumber(request.action === 'discarded' && lot ? lot.qty : Math.min(request.qty ?? 1, available)),
  );
  let note = $state('');

  const value = $derived(parseNumber(qty));
  const valid = $derived(value !== null && !Number.isNaN(value) && value > 0 && value <= available);

  function step(delta: number) {
    const current = value !== null && !Number.isNaN(value) ? value : 0;
    qty = inputNumber(Math.min(available, Math.max(0, current + delta)));
  }

  function submit(event: SubmitEvent) {
    event.preventDefault();
    if (!valid || value === null) return;
    const key = action === 'consumed' ? 'toast.consumed' : 'toast.discarded';
    const message = t(key, { what: `${quantity(value, product)} · ${productName}` });
    app.update(
      (shelf) =>
        lot
          ? takeFromLot(shelf, lot.id, value, action, app.today, note.trim()).shelf
          : takeFromProduct(shelf, productName, value, action, app.today, note.trim()).shelf,
      message,
    );
    dialogs.take = null;
  }
</script>

<Dialog title={productName} onclose={() => (dialogs.take = null)}>
  <form id="take-form" class="stack" novalidate onsubmit={submit}>
    <div class="segmented" role="group">
      <button type="button" class:active={action === 'consumed'} onclick={() => (action = 'consumed')}>{t('take.consume')}</button>
      <button type="button" class:active={action === 'discarded'} onclick={() => (action = 'discarded')}>{t('take.discard')}</button>
    </div>

    <div class="field">
      <span>{t('take.qty')}{product?.unit ? ` (${product.unit})` : ''}</span>
      <div class="stepper">
        <button type="button" class="icon-btn outlined" onclick={() => step(-1)} aria-label="−1"><Minus size={20} /></button>
        <input class="input num" inputmode="decimal" bind:value={qty} aria-invalid={!valid} />
        <button type="button" class="icon-btn outlined" onclick={() => step(1)} aria-label="+1"><Plus size={20} /></button>
      </div>
      <span class="hint">{t('take.available', { qty: quantity(available, product) })}</span>
    </div>

    {#if lot}
      <p class="small muted">{t('take.fromLot')} <ExpiryBadge {lot} />{lot.location ? ` · ${lot.location}` : ''}</p>
    {:else if lots.length > 1}
      <p class="small muted">{t('take.fefo')}</p>
    {/if}

    {#if action === 'discarded'}
      <label class="field">
        <span>{t('take.note')}</span>
        <input class="input" bind:value={note} placeholder={t('take.notePlaceholder')} />
      </label>
    {/if}
  </form>

  {#snippet footer()}
    <button type="button" class="btn" onclick={() => (dialogs.take = null)}>{t('action.cancel')}</button>
    <button type="submit" form="take-form" class="btn primary {action === 'discarded' ? 'danger-fill' : ''}" disabled={!valid}>
      {action === 'consumed' ? t('take.consume') : t('take.discard')}
    </button>
  {/snippet}
</Dialog>

<style>
  .danger-fill,
  .danger-fill:hover {
    background: var(--danger);
    border-color: var(--danger);
    color: #fff;
  }
</style>
