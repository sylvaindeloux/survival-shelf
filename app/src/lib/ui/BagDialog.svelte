<script lang="ts">
  import Plus from '@lucide/svelte/icons/plus';
  import Trash from '@lucide/svelte/icons/trash';
  import { tick } from 'svelte';
  import { app } from '../app.svelte';
  import { addBag, BAG_GROUPS, BAG_TEMPLATE, deleteBag, findBag, isBagGroup, itemsOf, localizedItemName, saveBag } from '../core/bags';
  import { KINDS } from '../core/categories';
  import { findProduct } from '../core/stock';
  import { sameName } from '../core/text';
  import type { BagItem } from '../core/types';
  import { i18n, t } from '../i18n/index.svelte';
  import { groupIcon, groupTitle } from './bags';
  import Dialog from './Dialog.svelte';
  import { kindLabel } from './format';
  import { dialogs, router, type BagDialogState } from './state.svelte';

  let { request }: { request: BagDialogState } = $props();

  // The dialog is recreated for every request: reading it once is intended.
  // svelte-ignore state_referenced_locally
  const bag = request.bag === undefined ? undefined : findBag(app.shelf, request.bag);

  /** A line of the list being edited: `key` keeps each row in place while lines come and go. */
  interface Draft extends Omit<BagItem, 'bag'> {
    key: number;
  }

  let nextKey = 0;
  /** In the language of the app, and following the product as the stock writes its name. */
  function draftOf(item: Omit<BagItem, 'bag'>): Draft {
    const product = item.product === '' ? '' : (findProduct(app.shelf, item.product)?.name ?? item.product);
    return { ...item, name: localizedItemName(item.name, i18n.lang), product, key: nextKey++ };
  }

  let name = $state(bag?.name ?? '');
  let stored = $state(bag?.stored ?? '');
  let notes = $state(bag?.notes ?? '');
  let drafts = $state<Draft[]>(bag ? itemsOf(app.shelf, bag.name).map(({ bag: _bag, ...item }) => draftOf(item)) : []);
  // The groups of the guide, then the user's own ones, which can only be added in the file.
  // svelte-ignore state_referenced_locally
  const groups = [...BAG_GROUPS, ...new Set(drafts.map((draft) => draft.group).filter((group) => !isBagGroup(group)))];
  /** The products of the stock an item can follow, by kind. */
  const products = KINDS.map((kind) => ({
    kind,
    names: app.shelf.products
      .filter((product) => product.kind === kind)
      .map((product) => product.name)
      .sort((a, b) => a.localeCompare(b, i18n.lang)),
  })).filter((group) => group.names.length > 0);

  let submitted = $state(false);
  let confirmDelete = $state(false);
  let form: HTMLFormElement;

  const nameTaken = $derived(app.shelf.bags.some((other) => sameName(other.name, name) && !(bag && sameName(other.name, bag.name))));
  const valid = $derived(name.trim() !== '' && !nameTaken);

  function linesOf(group: string): Draft[] {
    return drafts.filter((draft) => draft.group === group);
  }

  async function addItem(group: string) {
    const draft = draftOf({ group, name: '', ready: false, product: '', extra: {} });
    drafts.push(draft);
    await tick();
    form.querySelector<HTMLInputElement>(`[data-key="${draft.key}"] input`)?.focus();
  }

  function removeItem(key: number) {
    drafts = drafts.filter((draft) => draft.key !== key);
  }

  function close() {
    dialogs.bag = null;
  }

  function submit(event: SubmitEvent) {
    event.preventDefault();
    submitted = true;
    if (!valid) return;
    const saved = name.trim();
    if (bag) {
      const items = groups
        .flatMap(linesOf)
        .map(({ key: _key, ...item }) => ({ ...item, name: item.name.trim() }))
        .filter((item) => item.name !== '');
      app.update((shelf) => saveBag(shelf, bag.name, { ...bag, name: saved, stored, notes }, items), t('bags.savedToast'));
    } else {
      app.update((shelf) => addBag(shelf, { name: saved, stored }, i18n.lang), t('bags.addedToast', { bag: saved }));
    }
    router.go('emergency', `bags/${encodeURIComponent(saved)}`);
    close();
  }

  function remove() {
    if (!bag) return;
    app.update((shelf) => deleteBag(shelf, bag.name), t('bags.deletedToast', { bag: bag.name }));
    router.go('emergency', 'bags');
    close();
  }
</script>

<Dialog title={bag ? t('bags.editTitle', { bag: bag.name }) : t('bags.newTitle')} onclose={close}>
  <form id="bag-form" class="stack" novalidate onsubmit={submit} bind:this={form}>
    <label class="field">
      <span>{t('bags.field.name')}</span>
      <input class="input" bind:value={name} placeholder={t('bags.field.namePlaceholder')} autocomplete="off" aria-invalid={submitted && !valid} />
      {#if submitted && name.trim() === ''}
        <span class="hint error">{t('bags.nameRequired')}</span>
      {:else if nameTaken}
        <span class="hint error">{t('bags.nameTaken')}</span>
      {:else}
        <span class="hint">{t('bags.field.nameHint')}</span>
      {/if}
    </label>
    <label class="field">
      <span>{t('bags.field.stored')}</span>
      <input class="input" bind:value={stored} placeholder={t('bags.field.storedPlaceholder')} />
    </label>

    {#if !bag}
      <p class="note small">{t('bags.templateNote', { count: BAG_TEMPLATE.length })}</p>
    {:else}
      <label class="field">
        <span>{t('bags.field.notes')}</span>
        <input class="input" bind:value={notes} />
      </label>

      <div class="list-head">
        <h3>{t('bags.list')}</h3>
        <p class="hint">{t('bags.listHint')}</p>
      </div>
      {#each groups as group (group)}
        {@const Icon = groupIcon(group)}
        <fieldset class="group">
          <legend><Icon size={20} />{groupTitle(group)}</legend>
          {#each linesOf(group) as draft (draft.key)}
            <div class="line" data-key={draft.key}>
              <div class="fields">
                <input class="input" bind:value={draft.name} placeholder={t('bags.item')} aria-label={t('bags.item')} />
                <select class="select" class:by-hand={draft.product === ''} bind:value={draft.product} aria-label={t('bags.product')}>
                  <option value="">{t('bags.noProduct')}</option>
                  {#if draft.product !== '' && !findProduct(app.shelf, draft.product)}
                    <option value={draft.product}>{draft.product}</option>
                  {/if}
                  {#each products as kind (kind.kind)}
                    <optgroup label={kindLabel(kind.kind)}>
                      {#each kind.names as product (product)}
                        <option value={product}>{product}</option>
                      {/each}
                    </optgroup>
                  {/each}
                </select>
              </div>
              <button type="button" class="icon-btn" onclick={() => removeItem(draft.key)} aria-label={t('bags.removeItem')} title={t('bags.removeItem')}>
                <Trash size={18} />
              </button>
            </div>
          {/each}
          <button type="button" class="btn small ghost add" onclick={() => addItem(group)}><Plus size={16} />{t('bags.addItem')}</button>
        </fieldset>
      {/each}
    {/if}
  </form>

  {#snippet footer()}
    {#if confirmDelete && bag}
      <span class="confirm small">{t('bags.deleteConfirm', { bag: bag.name })}</span>
      <button type="button" class="btn" onclick={() => (confirmDelete = false)}>{t('action.cancel')}</button>
      <button type="button" class="btn danger" onclick={remove}><Trash size={18} />{t('action.delete')}</button>
    {:else}
      {#if bag}
        <button type="button" class="btn danger" onclick={() => (confirmDelete = true)}><Trash size={18} />{t('action.delete')}</button>
      {/if}
      <span class="spacer"></span>
      <button type="submit" form="bag-form" class="btn primary">{bag ? t('action.save') : t('action.add')}</button>
    {/if}
  {/snippet}
</Dialog>

<style>
  .error {
    color: var(--danger);
  }

  .note {
    margin: 0;
    padding: 0.625rem 0.75rem;
    border-radius: var(--radius-sm);
    background: var(--primary-soft);
  }

  .confirm {
    flex: 1 1 100%;
    color: var(--danger);
    font-weight: 600;
  }

  .list-head h3 {
    font-size: 1.15rem;
  }

  .list-head p {
    margin: 0.25rem 0 0;
  }

  .group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin: 0;
    padding: 0;
    border: none;
  }

  legend {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    margin-bottom: 0.25rem;
    padding: 0;
    font-family: var(--font-display);
    font-size: 1.1rem;
    font-weight: 700;
  }

  legend :global(svg) {
    color: var(--primary);
  }

  .line {
    display: flex;
    align-items: flex-start;
    gap: 0.25rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--border);
  }

  .fields {
    display: grid;
    flex: 1;
    grid-template-columns: minmax(0, 1fr) minmax(0, 11rem);
    gap: 0.375rem;
    min-width: 0;
  }

  .select.by-hand {
    color: var(--muted);
  }

  .add {
    align-self: flex-start;
  }

  /* Phones: the product under the name of the item, smaller, as most items are ticked by hand. */
  @media (max-width: 480px) {
    .fields {
      grid-template-columns: minmax(0, 1fr);
    }

    .select {
      min-height: 40px;
      padding: 0.3rem 0.6rem;
      font-size: 0.9rem;
    }
  }
</style>
