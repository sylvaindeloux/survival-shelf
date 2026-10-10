<script lang="ts">
  import Trash from '@lucide/svelte/icons/trash';
  import { app } from '../app.svelte';
  import { CATALOG, findCatalogItem } from '../core/catalog';
  import { CATEGORIES, findCategory } from '../core/categories';
  import { isWaterProduct, productTarget } from '../core/plan';
  import { deleteProduct, emptyProduct, findProduct, lotsOf, upsertProduct } from '../core/stock';
  import { parseNumber, sameName } from '../core/text';
  import type { Per, Product } from '../core/types';
  import { i18n, t, tn } from '../i18n/index.svelte';
  import Dialog from './Dialog.svelte';
  import { inputNumber, quantity, tierLabel } from './format';
  import { dialogs } from './state.svelte';

  /** Product to edit; absent to create one. */
  let { name: originalName }: { name?: string } = $props();

  // The dialog is recreated for every request: reading the props once is intended.
  // svelte-ignore state_referenced_locally
  const product = originalName === undefined ? undefined : findProduct(app.shelf, originalName);
  const creating = product === undefined;
  let name = $state(product?.name ?? '');
  let category = $state(product?.category ?? 'other');
  let unit = $state(product?.unit ?? '');
  let kcal = $state(inputNumber(product?.kcal ?? null));
  let water = $state(inputNumber(product?.water ?? null));
  let daily = $state(inputNumber(product?.daily ?? null));
  let per = $state<Per>(product?.per ?? 'person');
  let target = $state(inputNumber(product?.target ?? null));
  let notes = $state(product?.notes ?? '');
  let submitted = $state(false);
  let confirmDelete = $state(false);

  // svelte-ignore state_referenced_locally
  const lotCount = product ? lotsOf(app.shelf, product.name).length : 0;
  const customCategory = $derived(findCategory(category) ? null : category);
  const suggestions = $derived(
    CATALOG.map((entry) => entry.name[i18n.lang]).filter((candidate) => !findProduct(app.shelf, candidate)),
  );

  function invalidNumber(value: string): boolean {
    const number = parseNumber(value);
    return number !== null && (Number.isNaN(number) || number < 0);
  }

  function optionalNumber(value: string): number | null {
    const number = parseNumber(value);
    return number === null || Number.isNaN(number) ? null : number;
  }

  const nameTaken = $derived(
    !(product && sameName(name, product.name)) && app.shelf.products.some((candidate) => sameName(candidate.name, name)),
  );
  const valid = $derived(name.trim() !== '' && !nameTaken && ![kcal, water, daily, target].some(invalidNumber));

  /** The product as currently filled in, for the tier preview and saving. */
  const draft = $derived<Product>({
    ...(product ?? emptyProduct(name.trim())),
    name: name.trim(),
    category,
    unit: unit.trim(),
    kcal: optionalNumber(kcal),
    water: optionalNumber(water),
    daily: optionalNumber(daily),
    per,
    target: optionalNumber(target),
    notes: notes.trim(),
  });
  const waterProduct = $derived(isWaterProduct(draft));
  const preview = $derived(
    app.shelf.settings.tiers
      .map((days) => ({ days, qty: productTarget(draft, app.shelf.settings, days) }))
      .filter((tier) => tier.qty !== null && tier.qty > 0),
  );

  /** Pre-fills a new product from the catalog when its name is known. */
  function prefill() {
    if (!creating) return;
    const entry = findCatalogItem(name);
    if (!entry) return;
    category = entry.category;
    unit = entry.unit[i18n.lang];
    kcal = inputNumber(entry.kcal);
    water = inputNumber(entry.water);
    daily = inputNumber(entry.daily);
    per = entry.per;
    target = inputNumber(entry.target);
  }

  function save(event: SubmitEvent) {
    event.preventDefault();
    submitted = true;
    if (!valid) return;
    const saved = draft;
    app.update(
      (shelf) => upsertProduct(shelf, saved, product?.name),
      creating ? t('toast.productAdded', { name: saved.name }) : undefined,
    );
    dialogs.product = null;
  }

  function remove() {
    if (!product) return;
    app.update((shelf) => deleteProduct(shelf, product.name), t('toast.productDeleted', { name: product.name }));
    dialogs.product = null;
  }
</script>

<Dialog title={creating ? t('product.addTitle') : t('product.editTitle')} onclose={() => (dialogs.product = null)}>
  <form id="product-form" class="stack" novalidate onsubmit={save}>
    <label class="field">
      <span>{t('product.name')}</span>
      <input
        class="input"
        list={creating ? 'catalog-suggestions' : undefined}
        bind:value={name}
        oninput={prefill}
        onchange={prefill}
        placeholder={creating ? t('lot.productPlaceholder') : undefined}
        autocomplete="off"
        aria-invalid={submitted && (name.trim() === '' || nameTaken)}
      />
      {#if creating}
        <datalist id="catalog-suggestions">
          {#each suggestions as suggestion (suggestion)}
            <option value={suggestion}></option>
          {/each}
        </datalist>
      {/if}
      {#if nameTaken}<span class="hint error">{t('product.nameTaken')}</span>{/if}
    </label>
    <div class="grid-2">
      <label class="field">
        <span>{t('product.category')}</span>
        <select class="select" bind:value={category}>
          {#each CATEGORIES as option (option.key)}
            <option value={option.key}>{option.icon} {option.label[i18n.lang]}</option>
          {/each}
          {#if customCategory}
            <option value={customCategory}>📦 {customCategory}</option>
          {/if}
        </select>
      </label>
      <label class="field">
        <span>{t('product.unit')}</span>
        <input class="input" bind:value={unit} placeholder={t('product.unitPlaceholder')} />
      </label>
    </div>
    <div class="grid-2">
      <label class="field">
        <span>{t('product.kcal')}</span>
        <input class="input" inputmode="decimal" bind:value={kcal} placeholder="0" aria-invalid={submitted && invalidNumber(kcal)} />
      </label>
      <label class="field">
        <span>{t('product.water')}</span>
        <input class="input" inputmode="decimal" bind:value={water} placeholder="0" aria-invalid={submitted && invalidNumber(water)} />
      </label>
    </div>

    <fieldset class="plan stack">
      <legend>{t('product.planTitle')}</legend>
      {#if waterProduct}
        <p class="hint">{t('product.waterPlanned')}</p>
      {:else}
        <div class="grid-2">
          <label class="field">
            <span>{t('product.daily')}{unit.trim() ? ` (${unit.trim()})` : ''}</span>
            <input class="input" inputmode="decimal" bind:value={daily} placeholder="—" aria-invalid={submitted && invalidNumber(daily)} />
          </label>
          <label class="field">
            <span>{t('product.target')}{unit.trim() ? ` (${unit.trim()})` : ''}</span>
            <input class="input" inputmode="decimal" bind:value={target} placeholder="—" aria-invalid={submitted && invalidNumber(target)} />
          </label>
        </div>
        <div class="segmented" role="group" aria-label={t('product.per')}>
          <button type="button" class:active={per === 'person'} onclick={() => (per = 'person')}>{t('product.perPerson')}</button>
          <button type="button" class:active={per === 'household'} onclick={() => (per = 'household')}>{t('product.perHousehold')}</button>
        </div>
        <p class="hint">{t('product.planHint')}</p>
        {#if preview.length > 0}
          <p class="preview small">
            {#each preview as tier (tier.days)}
              <span><strong>{tierLabel(tier.days)}</strong> {quantity(tier.qty ?? 0, draft)}</span>
            {/each}
          </p>
        {:else}
          <p class="small muted">{t('product.notPlanned')}</p>
        {/if}
      {/if}
    </fieldset>

    <label class="field">
      <span>{t('product.notes')}</span>
      <input class="input" bind:value={notes} />
    </label>
  </form>

  {#snippet footer()}
    {#if confirmDelete}
      <span class="confirm small">{tn('product.confirmDelete', lotCount)}</span>
      <button type="button" class="btn" onclick={() => (confirmDelete = false)}>{t('action.cancel')}</button>
      <button type="button" class="btn danger" onclick={remove}><Trash size={18} />{t('action.delete')}</button>
    {:else}
      {#if !creating}
        <button type="button" class="btn danger" onclick={() => (confirmDelete = true)}><Trash size={18} />{t('action.delete')}</button>
      {/if}
      <span class="spacer"></span>
      <button type="submit" form="product-form" class="btn primary">{creating ? t('action.add') : t('action.save')}</button>
    {/if}
  {/snippet}
</Dialog>

<style>
  .error {
    color: var(--danger);
  }

  .confirm {
    flex: 1 1 100%;
    color: var(--danger);
    font-weight: 600;
  }

  .plan {
    margin: 0;
    padding: 0.75rem 1rem 1rem;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--surface-2);
    gap: 0.75rem;
  }

  legend {
    padding: 0 0.4rem;
    font-weight: 700;
    font-size: 0.85rem;
    color: var(--primary);
  }

  .plan .input {
    background: var(--surface);
  }

  .preview {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem 1rem;
  }
</style>
