<script lang="ts">
  import Trash from '@lucide/svelte/icons/trash';
  import { app } from '../app.svelte';
  import { CATEGORIES, findCategory } from '../core/categories';
  import { deleteProduct, findProduct, lotsOf, upsertProduct } from '../core/stock';
  import { formatNumber, parseNumber, sameName } from '../core/text';
  import { i18n, t, tn } from '../i18n/index.svelte';
  import Dialog from './Dialog.svelte';
  import { dialogs } from './state.svelte';

  let { name: originalName }: { name: string } = $props();

  // svelte-ignore state_referenced_locally
  const product = findProduct(app.shelf, originalName);
  let name = $state(product?.name ?? '');
  let category = $state(product?.category ?? 'other');
  let unit = $state(product?.unit ?? '');
  let kcal = $state(formatNumber(product?.kcal ?? null));
  let water = $state(formatNumber(product?.water ?? null));
  let target = $state(formatNumber(product?.target ?? null));
  let notes = $state(product?.notes ?? '');
  let submitted = $state(false);
  let confirmDelete = $state(false);

  // svelte-ignore state_referenced_locally
  const lotCount = lotsOf(app.shelf, originalName).length;
  const customCategory = $derived(findCategory(category) ? null : category);

  function invalidNumber(value: string): boolean {
    const number = parseNumber(value);
    return number !== null && (Number.isNaN(number) || number < 0);
  }

  const nameTaken = $derived(
    !sameName(name, originalName) && app.shelf.products.some((candidate) => sameName(candidate.name, name)),
  );
  const valid = $derived(name.trim() !== '' && !nameTaken && ![kcal, water, target].some(invalidNumber));

  function optionalNumber(value: string): number | null {
    const number = parseNumber(value);
    return number === null || Number.isNaN(number) ? null : number;
  }

  function save(event: SubmitEvent) {
    event.preventDefault();
    submitted = true;
    if (!valid || !product) return;
    app.update((shelf) =>
      upsertProduct(
        shelf,
        {
          ...product,
          name: name.trim(),
          category,
          unit: unit.trim(),
          kcal: optionalNumber(kcal),
          water: optionalNumber(water),
          target: optionalNumber(target),
          notes: notes.trim(),
        },
        product.name,
      ),
    );
    dialogs.product = null;
  }

  function remove() {
    if (!product) return;
    app.update((shelf) => deleteProduct(shelf, product.name), t('toast.productDeleted', { name: product.name }));
    dialogs.product = null;
  }
</script>

<Dialog title={t('product.editTitle')} onclose={() => (dialogs.product = null)}>
  <form id="product-form" class="stack" novalidate onsubmit={save}>
    <label class="field">
      <span>{t('product.name')}</span>
      <input class="input" bind:value={name} aria-invalid={submitted && (name.trim() === '' || nameTaken)} />
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
    <div class="grid-3">
      <label class="field">
        <span>{t('product.kcal')}</span>
        <input class="input" inputmode="decimal" bind:value={kcal} placeholder="0" aria-invalid={submitted && invalidNumber(kcal)} />
      </label>
      <label class="field">
        <span>{t('product.water')}</span>
        <input class="input" inputmode="decimal" bind:value={water} placeholder="0" aria-invalid={submitted && invalidNumber(water)} />
      </label>
      <label class="field">
        <span>{t('product.target')}</span>
        <input class="input" inputmode="decimal" bind:value={target} placeholder="—" aria-invalid={submitted && invalidNumber(target)} />
      </label>
    </div>
    <p class="hint">{t('product.valuesHint')}</p>
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
      <button type="button" class="btn danger" onclick={() => (confirmDelete = true)}><Trash size={18} />{t('action.delete')}</button>
      <span class="spacer"></span>
      <button type="submit" form="product-form" class="btn primary">{t('action.save')}</button>
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
</style>
