<script lang="ts">
  import Check from '@lucide/svelte/icons/check';
  import Plus from '@lucide/svelte/icons/plus';
  import Trash from '@lucide/svelte/icons/trash';
  import { onMount, tick } from 'svelte';
  import { app } from '../app.svelte';
  import { formatDay } from '../core/dates';
  import {
    EMERGENCY_TOPICS,
    isTopic,
    localizedEntry,
    missingNumbers,
    needsPhone,
    phoneLink,
    withCountryNumbers,
    type CountryNumbers,
  } from '../core/emergency';
  import type { EmergencyEntry } from '../core/types';
  import { i18n, t } from '../i18n/index.svelte';
  import Dialog from './Dialog.svelte';
  import { countries, fieldLabel, ownTopics, regionName, topicHint, topicIcon, topicTitle } from './emergency';
  import { dialogs, type EmergencyDialogState } from './state.svelte';

  let { request }: { request: EmergencyDialogState } = $props();

  /** A line being edited: `key` keeps each row in place while lines come and go. */
  interface Draft extends EmergencyEntry {
    key: number;
    /** Shows the phone field: people to call, topics of the user's own, and lines that have a number. */
    withPhone: boolean;
  }

  let nextKey = 0;
  const draftOf = (entry: EmergencyEntry): Draft => ({
    ...localizedEntry(entry, i18n.lang),
    key: nextKey++,
    withPhone: needsPhone(entry.topic) || !isTopic(entry.topic) || entry.phone !== '',
  });

  let drafts = $state<Draft[]>(app.shelf.emergency.map(draftOf));
  // The topics of the household plan, then the user's own ones, which can only be added in the file.
  // svelte-ignore state_referenced_locally
  const topics = [...EMERGENCY_TOPICS, ...ownTopics(app.shelf.emergency)];
  let body: HTMLFormElement;

  function linesOf(topic: string): Draft[] {
    return drafts.filter((draft) => draft.topic === topic);
  }

  const emptyLine = (topic: string) => draftOf({ topic, name: '', details: '', phone: '', extra: {} });

  async function add(topic: string) {
    const draft = emptyLine(topic);
    drafts.push(draft);
    await tick();
    body.querySelector<HTMLInputElement>(`[data-key="${draft.key}"] input`)?.focus();
  }

  function remove(key: number) {
    drafts = drafts.filter((draft) => draft.key !== key);
  }

  function addCountry(country: CountryNumbers) {
    drafts = withCountryNumbers(drafts, country, i18n.lang).map((entry) => ('key' in entry ? (entry as Draft) : draftOf(entry)));
  }

  /** Shows the topic asked for at the top, focused on a field to fill in: on a new line when it has none. */
  onMount(async () => {
    const topic = request.topic;
    if (!topic) return;
    if (linesOf(topic).length === 0) {
      drafts.push(emptyLine(topic));
      await tick();
    }
    const block = body.querySelector<HTMLElement>(`[data-topic="${CSS.escape(topic)}"]`);
    block?.scrollIntoView({ block: 'start' });
    const empty = [...(block?.querySelectorAll<HTMLInputElement>('input') ?? [])].find((input) => input.value.trim() === '');
    empty?.focus({ preventScroll: true });
  });

  function submit(event: SubmitEvent) {
    event.preventDefault();
    const entries: EmergencyEntry[] = topics
      .flatMap((topic) => linesOf(topic))
      .map(({ key: _key, withPhone: _withPhone, ...entry }) => ({
        ...entry,
        name: entry.name.trim(),
        details: entry.details.trim(),
        phone: entry.phone.trim(),
      }))
      .filter((entry) => entry.name !== '' || entry.details !== '' || entry.phone !== '');
    // Going through the whole sheet to change it counts as reading it again.
    const today = formatDay(app.today);
    app.update(
      (shelf) => ({ ...shelf, emergency: entries, settings: { ...shelf.settings, emergencyReviewed: today } }),
      t('emergency.savedToast'),
    );
    dialogs.emergency = null;
  }
</script>

<Dialog title={t('emergency.editTitle')} onclose={() => (dialogs.emergency = null)}>
  <form id="emergency-form" class="topics" novalidate onsubmit={submit} bind:this={body}>
    {#each topics as topic (topic)}
      {@const Icon = topicIcon(topic)}
      {@const hint = topicHint(topic)}
      <fieldset class="topic" data-topic={topic}>
        <legend><Icon size={20} />{topicTitle(topic)}</legend>
        {#if hint}<p class="hint">{hint}</p>{/if}
        {#each linesOf(topic) as draft (draft.key)}
          <div class="line" data-key={draft.key}>
            <div class="fields" class:with-phone={draft.withPhone}>
              <input class="input" bind:value={draft.name} placeholder={fieldLabel(topic, 'name')} aria-label={fieldLabel(topic, 'name')} />
              {#if draft.withPhone}
                <input
                  class="input num"
                  type="tel"
                  bind:value={draft.phone}
                  placeholder={t('emergency.field.phone')}
                  aria-label={t('emergency.field.phone')}
                  aria-invalid={draft.phone.trim() !== '' && phoneLink(draft.phone) === null}
                />
              {/if}
              <input class="input details" bind:value={draft.details} placeholder={fieldLabel(topic, 'details')} aria-label={fieldLabel(topic, 'details')} />
            </div>
            <button type="button" class="icon-btn" onclick={() => remove(draft.key)} aria-label={t('emergency.removeLine')} title={t('emergency.removeLine')}>
              <Trash size={18} />
            </button>
          </div>
        {/each}
        <button type="button" class="btn small ghost add" onclick={() => add(topic)}><Plus size={16} />{t('emergency.addLine')}</button>
        {#if topic === 'number'}
          <p class="hint">{t('emergency.smsTip')}</p>
          <p class="countries-title">{t('emergency.addCountry')}</p>
          <div class="countries">
            {#each countries() as country (country.region)}
              {@const missing = missingNumbers(drafts, country)}
              <button type="button" class="chip" disabled={missing.length === 0} onclick={() => addCountry(country)}>
                {#if missing.length === 0}<Check size={16} />{:else}<Plus size={16} />{/if}
                <span class="country">{regionName(country.region)}</span>
                <span class="small muted">{country.numbers.map((number) => phoneLink(number.phone)?.text ?? number.phone).join(', ')}</span>
              </button>
            {/each}
          </div>
        {/if}
      </fieldset>
    {/each}
  </form>

  {#snippet footer()}
    <button type="button" class="btn" onclick={() => (dialogs.emergency = null)}>{t('action.cancel')}</button>
    <button type="submit" form="emergency-form" class="btn primary">{t('action.save')}</button>
  {/snippet}
</Dialog>

<style>
  .topics {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .topic {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin: 0;
    padding: 0;
    border: none;
    scroll-margin-top: 0.5rem;
  }

  legend {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0;
    font-family: var(--font-display);
    font-size: 1.15rem;
    font-weight: 700;
  }

  legend :global(svg) {
    color: var(--primary);
  }

  .topic .hint {
    margin: -0.25rem 0 0;
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
    grid-template-columns: minmax(0, 1fr);
    gap: 0.375rem;
    min-width: 0;
  }

  .fields.with-phone {
    grid-template-columns: minmax(0, 1fr) minmax(0, 9.5rem);
  }

  .fields.with-phone .details {
    grid-column: 1 / -1;
  }

  /* Small phones: a name squeezed next to a whole phone number would be unreadable, so they stack. */
  @media (max-width: 359px) {
    .fields.with-phone {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  .add {
    align-self: flex-start;
  }

  .countries-title {
    margin: 0.25rem 0 0;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--muted);
  }

  .countries {
    display: flex;
    flex-wrap: wrap;
    gap: 0.375rem;
  }

  .chip {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    min-height: 40px;
    padding: 0 0.75rem;
    border: 1.5px solid var(--control);
    border-radius: var(--radius-sm);
    background: var(--surface);
    color: var(--text);
    font: inherit;
    cursor: pointer;
  }

  .chip:hover:not(:disabled) {
    background: var(--surface-2);
  }

  .chip:disabled {
    border-color: var(--border);
    cursor: default;
  }

  .chip:disabled .country {
    color: var(--muted);
  }

  .country {
    font-weight: 600;
  }

  .chip :global(svg) {
    flex: none;
    color: var(--primary);
  }
</style>
