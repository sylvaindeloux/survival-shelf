<script lang="ts">
  import Trash from '@lucide/svelte/icons/trash';
  import { app } from '../app.svelte';
  import { CATEGORIES, defaultKind, isWaterTreatment } from '../core/categories';
  import { isValidDate, monthsLater } from '../core/dates';
  import { CATALOG, findCatalogItem } from '../core/catalog';
  import { addLot, deleteLot, emptyProduct, findProduct, replaceLot, updateLot, upsertProduct } from '../core/stock';
  import { parseNumber } from '../core/text';
  import type { Kind } from '../core/types';
  import { localize, t } from '../i18n/index.svelte';
  import Dialog from './Dialog.svelte';
  import CategoryIcon from './CategoryIcon.svelte';
  import KindPicker from './KindPicker.svelte';
  import { categoryLabel, inputNumber, keepsText, quantity } from './format';
  import { dialogs, type LotDialogState } from './state.svelte';

  let { request }: { request: LotDialogState } = $props();

  type Precision = 'day' | 'month' | 'none';

  // The dialog is recreated for every request: reading the props once is intended.
  // svelte-ignore state_referenced_locally
  const editing = request.lotId ? app.shelf.lots.find((lot) => lot.id === request.lotId) : undefined;
  /** Lot this one replaces: logged as used when the new one is saved. */
  // svelte-ignore state_referenced_locally
  const replaced = !editing && request.replaces ? app.shelf.lots.find((lot) => lot.id === request.replaces) : undefined;
  // svelte-ignore state_referenced_locally
  let productName = $state(editing?.product ?? request.product ?? '');
  // svelte-ignore state_referenced_locally
  let qty = $state(inputNumber(editing?.qty ?? request.qty ?? 1));
  let precision = $state<Precision>(
    editing ? (editing.expires === '' ? 'none' : /^\d{4}-\d{2}$/.test(editing.expires) ? 'month' : 'day') : 'day',
  );
  let expires = $state(editing?.expires ?? '');
  /** The date was filled in by the app from the typical shelf life, not by the user. */
  let estimated = $state(false);
  let location = $state(editing?.location ?? replaced?.location ?? '');
  let submitted = $state(false);

  // Fields of a new product.
  let category = $state('other');
  let unit = $state('');
  let kcal = $state('');
  let water = $state('');
  // svelte-ignore state_referenced_locally
  let kind = $state<Kind>(request.kind ?? defaultKind({ category: 'other', kcal: null, water: null }));
  /** Picked by the user or given by the page: a new category no longer changes it, the catalog still does. */
  // svelte-ignore state_referenced_locally
  let kindChosen = request.kind !== undefined;
  /** Calories only make sense for food, liters for food and water treatment (the volume it makes drinkable). */
  const showKcal = $derived(kind === 'food');
  const showWater = $derived(kind === 'food' || isWaterTreatment({ category }));

  const existing = $derived(findProduct(app.shelf, productName));
  const isNew = $derived(productName.trim() !== '' && !existing);
  const qtyValue = $derived(parseNumber(qty));
  const errors = $derived({
    product: productName.trim() === '',
    qty: qtyValue === null || Number.isNaN(qtyValue) || qtyValue <= 0,
    expires: precision !== 'none' && !isValidDate(expires),
    numbers: [showKcal ? kcal : '', showWater ? water : ''].some((value) => {
      const number = parseNumber(value);
      return number !== null && (Number.isNaN(number) || number < 0);
    }),
  });
  const valid = $derived(!errors.product && !errors.qty && !errors.expires && !(isNew && errors.numbers));

  const suggestions = $derived([
    ...app.shelf.products.map((product) => product.name),
    ...CATALOG.map((entry) => localize(entry.name)).filter((name) => !findProduct(app.shelf, name)),
  ]);
  const unitSuggestions = $derived([...new Set(CATALOG.map((entry) => localize(entry.unit)))]);
  /** Typical shelf life, to help when the date is hard to read on the packaging. */
  const catalogEntry = $derived(findCatalogItem(productName));

  function applyCatalog() {
    if (existing) return;
    const entry = findCatalogItem(productName);
    if (!entry) return;
    category = entry.category;
    kind = entry.kind;
    unit = localize(entry.unit);
    kcal = inputNumber(entry.kcal);
    water = inputNumber(entry.water);
  }

  /** New lot: estimates the expiry from the typical shelf life, until the user enters a date. */
  function estimate() {
    if (editing || !(estimated || (precision === 'day' && expires === ''))) return;
    const entry = findCatalogItem(productName);
    if (!entry) {
      if (estimated) [precision, expires, estimated] = ['day', '', false];
      return;
    }
    precision = entry.shelfLife === null ? 'none' : 'month';
    expires = entry.shelfLife === null ? '' : monthsLater(app.today, entry.shelfLife);
    estimated = true;
  }

  function productChanged() {
    applyCatalog();
    estimate();
  }

  // Asked to add a product that is not in the list yet (water from the check-in): fill it from the catalog.
  productChanged();

  /** A new category gives its kind until the user picks one. */
  function categoryChanged() {
    if (!kindChosen) kind = defaultKind({ category, kcal: optionalNumber(kcal), water: optionalNumber(water) });
  }

  function setPrecision(next: Precision) {
    estimated = false;
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
          kind,
          category,
          unit: unit.trim(),
          kcal: showKcal ? optionalNumber(kcal) : null,
          water: showWater ? optionalNumber(water) : null,
        });
      }
      const input = { product, qty: qtyValue, expires: lotExpires, location };
      if (editing) return updateLot(next, editing.id, input);
      if (replaced) return replaceLot(next, replaced.id, input, app.today);
      return addLot(next, input, app.today);
    }, editing ? undefined : t(replaced ? 'toast.replaced' : 'toast.lotAdded', { what: `${quantity(qtyValue, existing ?? { ...emptyProduct(name), unit })} · ${product}` }));

    if (keepOpen) {
      productName = '';
      qty = '1';
      if (estimated) [precision, expires, estimated] = ['day', '', false];
      else expires = precision === 'month' ? '' : expires;
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

<Dialog title={editing ? t('lot.editTitle') : replaced ? t('lot.replaceTitle') : t('lot.addTitle')} onclose={() => (dialogs.lot = null)}>
  <form
    id="lot-form"
    class="stack"
    novalidate
    onsubmit={(event) => {
      event.preventDefault();
      save(false);
    }}
  >
    {#if replaced}
      <p class="replace-hint">{t('lot.replaceHint', { what: `${quantity(replaced.qty, findProduct(app.shelf, replaced.product))} · ${replaced.product}` })}</p>
    {/if}
    <label class="field">
      <span>{t('lot.product')}</span>
      <input
        id="lot-product"
        class="input"
        list="product-suggestions"
        bind:value={productName}
        oninput={productChanged}
        onchange={productChanged}
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
        <span class="hint category"><CategoryIcon category={existing.category} size={16} />{categoryLabel(existing.category)}{existing.unit ? ` · ${existing.unit}` : ''}</span>
      {/if}
    </label>

    {#if isNew}
      <fieldset class="new-product stack">
        <legend>{t('lot.newProduct')}</legend>
        <KindPicker bind:value={kind} onpick={() => (kindChosen = true)} />
        <div class="grid-2">
          <label class="field">
            <span>{t('product.category')}</span>
            <select class="select" bind:value={category} onchange={categoryChanged}>
              {#each CATEGORIES as option (option.key)}
                <option value={option.key}>{localize(option.label)}</option>
              {/each}
            </select>
          </label>
          <label class="field">
            <span>{t('product.unit')}</span>
            <input class="input" list="unit-suggestions" bind:value={unit} placeholder={t('product.unitPlaceholder')} />
          </label>
        </div>
        {#if showKcal || showWater}
          <div class="grid-2">
            {#if showKcal}
              <label class="field">
                <span>{t('product.kcal')}</span>
                <input class="input" inputmode="decimal" bind:value={kcal} placeholder="0" />
              </label>
            {/if}
            {#if showWater}
              <label class="field">
                <span>{t('product.water')}</span>
                <input class="input" inputmode="decimal" bind:value={water} placeholder="0" />
              </label>
            {/if}
          </div>
        {/if}
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
        <input
          class="input"
          type="date"
          bind:value={expires}
          oninput={() => (estimated = false)}
          aria-label={t('lot.expires')}
          aria-invalid={submitted && errors.expires}
        />
      {:else if precision === 'month'}
        <input
          class="input"
          type="month"
          bind:value={expires}
          oninput={() => (estimated = false)}
          placeholder="YYYY-MM"
          aria-label={t('lot.expires')}
          aria-invalid={submitted && errors.expires}
        />
        {#if !estimated}<span class="hint">{t('lot.monthHint')}</span>{/if}
      {/if}
      {#if estimated && precision !== 'none'}
        <span class="hint estimated">{t('lot.estimated')}</span>
      {/if}
      {#if catalogEntry}
        <span class="hint">{keepsText(catalogEntry)}</span>
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
    {:else if !replaced}
      <button type="button" class="btn" onclick={() => save(true)}>{t('lot.saveAndNext')}</button>
    {/if}
    <button type="submit" form="lot-form" class="btn primary">{editing ? t('action.save') : t('action.add')}</button>
  {/snippet}
</Dialog>

<style>
  .replace-hint {
    padding: 0.6rem 0.75rem;
    border-radius: var(--radius-sm);
    background: var(--warn-soft);
    color: var(--text);
  }

  .hint.category {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
  }

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

  .estimated {
    color: var(--primary);
    font-weight: 600;
  }

  .error {
    color: var(--danger);
    font-size: 0.9rem;
  }
</style>
