<script lang="ts">
  import Trash from '@lucide/svelte/icons/trash';
  import { app } from '../app.svelte';
  import { CATALOG, findCatalogItem } from '../core/catalog';
  import { CATEGORIES, defaultKind, findCategory, isWaterTreatment } from '../core/categories';
  import { headcount, isWaterProduct, productTarget } from '../core/plan';
  import { deleteProduct, emptyProduct, findProduct, lotsOf, upsertProduct } from '../core/stock';
  import { parseNumber, sameName } from '../core/text';
  import type { Kind, Per, Product } from '../core/types';
  import { localize, t, tn } from '../i18n/index.svelte';
  import Dialog from './Dialog.svelte';
  import KindPicker from './KindPicker.svelte';
  import { inputNumber, keepsText, quantity, tierLabel } from './format';
  import { dialogs } from './state.svelte';

  /** Product to edit (absent to create one), and the kind a new product starts with. */
  let { name: originalName, kind: initialKind }: { name?: string; kind?: Kind } = $props();

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
  // svelte-ignore state_referenced_locally
  let kind = $state<Kind>(product?.kind ?? initialKind ?? defaultKind({ category: 'other', kcal: null, water: null }));
  /** Picked by the user or given by the page: a new category no longer changes it, the catalog still does. */
  // svelte-ignore state_referenced_locally
  let kindChosen = !creating || initialKind !== undefined;
  let submitted = $state(false);
  let confirmDelete = $state(false);

  // svelte-ignore state_referenced_locally
  const lotCount = product ? lotsOf(app.shelf, product.name).length : 0;
  const catalogEntry = $derived(findCatalogItem(name));
  const customCategory = $derived(findCategory(category) ? null : category);
  const suggestions = $derived(
    CATALOG.map((entry) => localize(entry.name)).filter((candidate) => !findProduct(app.shelf, candidate)),
  );

  function invalidNumber(value: string): boolean {
    const number = parseNumber(value);
    return number !== null && (Number.isNaN(number) || number < 0);
  }

  function optionalNumber(value: string): number | null {
    const number = parseNumber(value);
    return number === null || Number.isNaN(number) ? null : number;
  }

  /** Calories only make sense for food, liters for food and water treatment (the volume it makes drinkable). */
  const showKcal = $derived(kind === 'food');
  const showWater = $derived(kind === 'food' || isWaterTreatment({ category }));
  const nameTaken = $derived(
    !(product && sameName(name, product.name)) && app.shelf.products.some((candidate) => sameName(candidate.name, name)),
  );
  const valid = $derived(name.trim() !== '' && !nameTaken && ![showKcal ? kcal : '', showWater ? water : '', daily, target].some(invalidNumber));

  /** The product as currently filled in, for the tier preview and saving. */
  const draft = $derived<Product>({
    ...(product ?? emptyProduct(name.trim())),
    name: name.trim(),
    kind,
    category,
    unit: unit.trim(),
    kcal: showKcal ? optionalNumber(kcal) : null,
    water: showWater ? optionalNumber(water) : null,
    daily: optionalNumber(daily),
    per,
    target: optionalNumber(target),
    notes: notes.trim(),
  });
  const waterProduct = $derived(isWaterProduct(draft));
  /** "Per cat" and "per dog" are only offered once the household has some (or the product already uses them). */
  const pers = $derived(
    (['person', 'household', 'cat', 'dog'] as Per[]).filter(
      (choice) => choice === per || (choice === 'cat' ? app.shelf.settings.cats > 0 : choice === 'dog' ? app.shelf.settings.dogs > 0 : true),
    ),
  );
  const PER_LABELS = { person: 'product.perPerson', household: 'product.perHousehold', cat: 'product.perCat', dog: 'product.perDog' } as const;
  /** A product per cat or per dog while there is none in the settings: nothing to plan yet. */
  const noAnimal = $derived((per === 'cat' || per === 'dog') && headcount(draft, app.shelf.settings) === 0);
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
    kind = entry.kind;
    unit = localize(entry.unit);
    kcal = inputNumber(entry.kcal);
    water = inputNumber(entry.water);
    daily = inputNumber(entry.daily);
    per = entry.per;
    target = inputNumber(entry.target);
  }

  /** A new category gives its kind until the user picks one. */
  function categoryChanged() {
    if (!kindChosen) kind = defaultKind({ category, kcal: optionalNumber(kcal), water: optionalNumber(water) });
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
      {#if catalogEntry}<span class="hint">{keepsText(catalogEntry)}</span>{/if}
    </label>
    <KindPicker bind:value={kind} onpick={() => (kindChosen = true)} />
    <div class="grid-2">
      <label class="field">
        <span>{t('product.category')}</span>
        <select class="select" bind:value={category} onchange={categoryChanged}>
          {#each CATEGORIES as option (option.key)}
            <option value={option.key}>{localize(option.label)}</option>
          {/each}
          {#if customCategory}
            <option value={customCategory}>{customCategory}</option>
          {/if}
        </select>
      </label>
      <label class="field">
        <span>{t('product.unit')}</span>
        <input class="input" bind:value={unit} placeholder={t('product.unitPlaceholder')} />
      </label>
    </div>
    {#if showKcal || showWater}
      <div class="grid-2">
        {#if showKcal}
          <label class="field">
            <span>{t('product.kcal')}</span>
            <input class="input" inputmode="decimal" bind:value={kcal} placeholder="0" aria-invalid={submitted && invalidNumber(kcal)} />
          </label>
        {/if}
        {#if showWater}
          <label class="field">
            <span>{t('product.water')}</span>
            <input class="input" inputmode="decimal" bind:value={water} placeholder="0" aria-invalid={submitted && invalidNumber(water)} />
          </label>
        {/if}
      </div>
    {:else}
      <p class="hint">{t('product.foodOnly')}</p>
    {/if}

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
        <div class="field">
          <span id="product-per">{t('product.per')}</span>
          <div class="segmented" role="group" aria-labelledby="product-per">
            {#each pers as choice (choice)}
              <button type="button" class:active={per === choice} onclick={() => (per = choice)}>{t(PER_LABELS[choice])}</button>
            {/each}
          </div>
        </div>
        <p class="hint">{t('product.planHint')}</p>
        {#if preview.length > 0}
          <p class="preview small">
            {#each preview as tier (tier.days)}
              <span><strong>{tierLabel(tier.days)}</strong> {quantity(tier.qty ?? 0, draft)}</span>
            {/each}
          </p>
        {:else if noAnimal}
          <p class="small muted">{t(per === 'cat' ? 'product.noCats' : 'product.noDogs')}</p>
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
