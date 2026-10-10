<script lang="ts">
  import Trash from '@lucide/svelte/icons/trash';
  import { app } from '../app.svelte';
  import { CATEGORIES } from '../core/categories';
  import { isValidDate } from '../core/dates';
  import { CATALOG, findCatalogItem } from '../core/catalog';
  import { addLot, deleteLot, emptyProduct, findProduct, updateLot, upsertProduct } from '../core/stock';
  import { parseNumber } from '../core/text';
  import { i18n, t } from '../i18n/index.svelte';
  import Dialog from './Dialog.svelte';
  import { categoryIcon, categoryLabel, inputNumber, quantity } from './format';
  import { dialogs, type LotDialogState } from './state.svelte';

  let { request }: { request: LotDialogState } = $props();

  type Precision = 'day' | 'month' | 'none';

  // The dialog is recreated for every request: reading the props once is intended.
  // svelte-ignore state_referenced_locally
  const editing = request.lotId ? app.shelf.lots.find((lot) => lot.id === request.lotId) : undefined;
  // svelte-ignore state_referenced_locally
  let productName = $state(editing?.product ?? request.product ?? '');
  // svelte-ignore state_referenced_locally
  let qty = $state(inputNumber(editing?.qty ?? request.qty ?? 1));
  let precision = $state<Precision>(
    editing ? (editing.expires === '' ? 'none' : /^\d{4}-\d{2}$/.test(editing.expires) ? 'month' : 'day') : 'day',
  );
  let expires = $state(editing?.expires ?? '');
  let location = $state(editing?.location ?? '');
  let submitted = $state(false);

  // Fields of a new product.
  let category = $state('other');
  let unit = $state('');
  let kcal = $state('');
  let water = $state('');

  const existing = $derived(findProduct(app.shelf, productName));
  const isNew = $derived(productName.trim() !== '' && !existing);
  const qtyValue = $derived(parseNumber(qty));
  const errors = $derived({
    product: productName.trim() === '',
    qty: qtyValue === null || Number.isNaN(qtyValue) || qtyValue <= 0,
    expires: precision !== 'none' && !isValidDate(expires),
    numbers: [kcal, water].some((value) => {
      const number = parseNumber(value);
      return number !== null && (Number.isNaN(number) || number < 0);
    }),
  });
  const valid = $derived(!errors.product && !errors.qty && !errors.expires && !(isNew && errors.numbers));

  const suggestions = $derived([
    ...app.shelf.products.map((product) => product.name),
    ...CATALOG.map((entry) => entry.name[i18n.lang]).filter((name) => !findProduct(app.shelf, name)),
  ]);
  const unitSuggestions = $derived([...new Set(CATALOG.map((entry) => entry.unit[i18n.lang]))]);
  /** Typical shelf life, to help when the date is hard to read on the packaging. */
  const shelfLife = $derived(findCatalogItem(productName)?.shelfLife ?? null);

  function applyCatalog() {
    if (existing) return;
    const entry = findCatalogItem(productName);
    if (!entry) return;
    category = entry.category;
    unit = entry.unit[i18n.lang];
    kcal = inputNumber(entry.kcal);
    water = inputNumber(entry.water);
  }

  // Asked to add a product that is not in the list yet (water from the check-in): fill it from the catalog.
  applyCatalog();

  function setPrecision(next: Precision) {
    if (next === 'month' && /^\d{4}-\d{2}/.test(expires)) expires = expires.slice(0, 7);
    else if (next === 'day' && !/^\d{4}-\d{2}-\d{2}$/.test(expires)) expires = '';
    precision = next;
  }

  function optionalNumber(value: string): number | null {
    const number = parseNumber(value);
    return number === null || Number.isNaN(number) ? null : number;
  }

  function save(keepOpen: boolean) {
    submitted = true;
    if (!valid || qtyValue === null) return;
    const name = productName.trim();
    const lotExpires = precision === 'none' ? '' : expires;
    const product = existing?.name ?? name;
    app.update((shelf) => {
      let next = shelf;
      if (isNew) {
        next = upsertProduct(next, {
          ...emptyProduct(name),
          category,
          unit: unit.trim(),
          kcal: optionalNumber(kcal),
          water: optionalNumber(water),
        });
      }
      if (editing) return updateLot(next, editing.id, { product, qty: qtyValue, expires: lotExpires, location });
      return addLot(next, { product, qty: qtyValue, expires: lotExpires, location }, app.today);
    }, editing ? undefined : t('toast.lotAdded', { what: `${quantity(qtyValue, existing ?? { ...emptyProduct(name), unit })} · ${product}` }));

    if (keepOpen) {
      productName = '';
      qty = '1';
      expires = precision === 'month' ? '' : expires;
      submitted = false;
      document.getElementById('lot-product')?.focus();
    } else {
      dialogs.lot = null;
    }
  }

  function remove() {
    if (!editing) return;
    app.update((shelf) => deleteLot(shelf, editing.id), t('toast.lotDeleted'));
    dialogs.lot = null;
  }
</script>

<Dialog title={editing ? t('lot.editTitle') : t('lot.addTitle')} onclose={() => (dialogs.lot = null)}>
  <form
    id="lot-form"
    class="stack"
    novalidate
    onsubmit={(event) => {
      event.preventDefault();
      save(false);
    }}
  >
    <label class="field">
      <span>{t('lot.product')}</span>
      <input
        id="lot-product"
        class="input"
        list="product-suggestions"
        bind:value={productName}
        oninput={applyCatalog}
        onchange={applyCatalog}
        placeholder={t('lot.productPlaceholder')}
        autocomplete="off"
        aria-invalid={submitted && errors.product}
      />
      <datalist id="product-suggestions">
        {#each suggestions as suggestion (suggestion)}
          <option value={suggestion}></option>
        {/each}
      </datalist>
      {#if existing}
        <span class="hint">{categoryIcon(existing.category)} {categoryLabel(existing.category)}{existing.unit ? ` · ${existing.unit}` : ''}</span>
      {/if}
    </label>

    {#if isNew}
      <fieldset class="new-product stack">
        <legend>{t('lot.newProduct')}</legend>
        <div class="grid-2">
          <label class="field">
            <span>{t('product.category')}</span>
            <select class="select" bind:value={category}>
              {#each CATEGORIES as option (option.key)}
                <option value={option.key}>{option.icon} {option.label[i18n.lang]}</option>
              {/each}
            </select>
          </label>
          <label class="field">
            <span>{t('product.unit')}</span>
            <input class="input" list="unit-suggestions" bind:value={unit} placeholder={t('product.unitPlaceholder')} />
          </label>
        </div>
        <div class="grid-2">
          <label class="field">
            <span>{t('product.kcal')}</span>
            <input class="input" inputmode="decimal" bind:value={kcal} placeholder="0" />
          </label>
          <label class="field">
            <span>{t('product.water')}</span>
            <input class="input" inputmode="decimal" bind:value={water} placeholder="0" />
          </label>
        </div>
        <p class="hint">{t('lot.newProductHint')}</p>
      </fieldset>
    {/if}

    <label class="field">
      <span>{t('lot.qty')}{(existing?.unit || unit) ? ` (${existing?.unit || unit})` : ''}</span>
      <input class="input" inputmode="decimal" bind:value={qty} aria-invalid={submitted && errors.qty} />
    </label>

    <div class="field">
      <span>{t('lot.expires')}</span>
      <div class="segmented" role="group" aria-label={t('lot.expires')}>
        <button type="button" class:active={precision === 'day'} onclick={() => setPrecision('day')}>{t('lot.precisionDay')}</button>
        <button type="button" class:active={precision === 'month'} onclick={() => setPrecision('month')}>{t('lot.precisionMonth')}</button>
        <button type="button" class:active={precision === 'none'} onclick={() => setPrecision('none')}>{t('lot.precisionNone')}</button>
      </div>
      {#if precision === 'day'}
        <input class="input" type="date" bind:value={expires} aria-label={t('lot.expires')} aria-invalid={submitted && errors.expires} />
      {:else if precision === 'month'}
        <input
          class="input"
          type="month"
          bind:value={expires}
          placeholder="YYYY-MM"
          aria-label={t('lot.expires')}
          aria-invalid={submitted && errors.expires}
        />
        <span class="hint">{t('lot.monthHint')}</span>
      {/if}
      {#if shelfLife && precision !== 'none'}
        <span class="hint">{t('lot.shelfLife', { months: shelfLife })}</span>
      {/if}
    </div>

    <label class="field">
      <span>{t('lot.location')}</span>
      <input class="input" list="location-suggestions" bind:value={location} placeholder={t('lot.locationPlaceholder')} />
      <datalist id="location-suggestions">
        {#each app.locations as option (option)}
          <option value={option}></option>
        {/each}
      </datalist>
    </label>

    <datalist id="unit-suggestions">
      {#each unitSuggestions as option (option)}
        <option value={option}></option>
      {/each}
    </datalist>

    {#if submitted && !valid}
      <p class="error" role="alert">{t('lot.invalid')}</p>
    {/if}
  </form>

  {#snippet footer()}
    {#if editing}
      <button type="button" class="btn danger" onclick={remove}><Trash size={18} />{t('action.delete')}</button>
      <span class="spacer"></span>
    {:else}
      <button type="button" class="btn" onclick={() => save(true)}>{t('lot.saveAndNext')}</button>
    {/if}
    <button type="submit" form="lot-form" class="btn primary">{editing ? t('action.save') : t('action.add')}</button>
  {/snippet}
</Dialog>

<style>
  .new-product {
    margin: 0;
    padding: 0.75rem 1rem 1rem;
    border: 1px dashed var(--border);
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

  .segmented {
    margin-bottom: 0.25rem;
  }

  .error {
    color: var(--danger);
    font-size: 0.9rem;
  }
</style>
