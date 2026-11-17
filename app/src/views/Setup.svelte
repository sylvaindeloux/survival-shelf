<script lang="ts">
  import ArrowLeft from '@lucide/svelte/icons/arrow-left';
  import ArrowRight from '@lucide/svelte/icons/arrow-right';
  import BatteryMedium from '@lucide/svelte/icons/battery-medium';
  import Cat from '@lucide/svelte/icons/cat';
  import Check from '@lucide/svelte/icons/check';
  import CookingPot from '@lucide/svelte/icons/cooking-pot';
  import Dog from '@lucide/svelte/icons/dog';
  import Droplet from '@lucide/svelte/icons/droplet';
  import Funnel from '@lucide/svelte/icons/funnel';
  import Hourglass from '@lucide/svelte/icons/hourglass';
  import Minus from '@lucide/svelte/icons/minus';
  import Pill from '@lucide/svelte/icons/pill';
  import Plus from '@lucide/svelte/icons/plus';
  import Toolbox from '@lucide/svelte/icons/toolbox';
  import Users from '@lucide/svelte/icons/users';
  import Utensils from '@lucide/svelte/icons/utensils';
  import Wrench from '@lucide/svelte/icons/wrench';
  import type { Component } from 'svelte';
  import { app } from '../lib/app.svelte';
  import { waterNeed } from '../lib/core/autonomy';
  import type { Habits, Needs } from '../lib/core/catalog';
  import { CATEGORIES, KINDS } from '../lib/core/categories';
  import { DEFAULT_SETTINGS } from '../lib/core/defaults';
  import { DEFAULT_HABITS, starterList, starterProducts, type StarterItem } from '../lib/core/starter';
  import type { Kind } from '../lib/core/types';
  import { formatNumber, i18n, localize, t, tn, type MessageKey } from '../lib/i18n/index.svelte';
  import CardColumns from '../lib/ui/CardColumns.svelte';
  import CategoryIcon from '../lib/ui/CategoryIcon.svelte';
  import Logo from '../lib/ui/Logo.svelte';
  import SubTabs, { type SubTab } from '../lib/ui/SubTabs.svelte';
  import { categoryLabel, kindLabel, shelfLifeText, tierLabel } from '../lib/ui/format';

  let { onback }: { onback: () => void } = $props();

  const STEPS = 3;

  const PETS: { need: 'cat' | 'dog'; icon: Component; label: MessageKey; hint: MessageKey }[] = [
    { need: 'cat', icon: Cat, label: 'setup.cats', hint: 'setup.catsHint' },
    { need: 'dog', icon: Dog, label: 'setup.dogs', hint: 'setup.dogsHint' },
  ];

  interface Question {
    key: keyof Habits;
    icon: Component;
    title: MessageKey;
    hint?: MessageKey;
    choices: { value: string; label: MessageKey; hint: MessageKey }[];
  }

  const QUESTIONS: Question[] = [
    {
      key: 'water',
      icon: Droplet,
      title: 'setup.waterQuestion',
      choices: [
        { value: 'bottles', label: 'setup.waterBottles', hint: 'setup.waterBottlesHint' },
        { value: 'tap', label: 'setup.waterTap', hint: 'setup.waterTapHint' },
        { value: 'both', label: 'setup.waterBoth', hint: 'setup.waterBothHint' },
      ],
    },
    {
      key: 'beyond',
      icon: Funnel,
      title: 'setup.beyondQuestion',
      hint: 'setup.beyondHint',
      choices: [
        { value: 'stored', label: 'setup.beyondStored', hint: 'setup.beyondStoredHint' },
        { value: 'treatment', label: 'setup.beyondTreatment', hint: 'setup.beyondTreatmentHint' },
      ],
    },
    {
      key: 'cooking',
      icon: CookingPot,
      title: 'setup.cookingQuestion',
      choices: [
        { value: 'ready', label: 'setup.cookingReady', hint: 'setup.cookingReadyHint' },
        { value: 'stove', label: 'setup.cookingStove', hint: 'setup.cookingStoveHint' },
        { value: 'none', label: 'setup.cookingNone', hint: 'setup.cookingNoneHint' },
      ],
    },
  ];

  const KIND_ICONS: Record<Kind, Component> = { food: Utensils, consumable: BatteryMedium, gear: Toolbox };

  let step = $state<1 | 2 | 3>(1);
  let people = $state(1);
  let needs = $state<Needs>({ cat: 0, dog: 0, treatment: 0 });
  let habits = $state<Habits>({ ...DEFAULT_HABITS });
  /** Items ticked or unticked by hand: kept when the answers change, the others follow the advice. */
  let ticked = $state<Record<string, boolean>>({});
  let kind = $state<Kind>('food');

  const list = $derived(starterList(needs, habits));
  const chosen = $derived(list.filter(isTicked).map((item) => item.entry));
  const tiers = $derived(DEFAULT_SETTINGS.tiers.map(tierLabel).join(', '));
  /** Water for a year, pets included, rounded to the hundred liters. */
  const yearLiters = $derived(
    Math.round((waterNeed({ ...DEFAULT_SETTINGS, people, cats: needs.cat ?? 0, dogs: needs.dog ?? 0 }) * 365) / 100) * 100,
  );

  function isTicked(item: StarterItem): boolean {
    return ticked[item.entry.id] ?? item.essential;
  }

  const categoryOrder = new Map(CATEGORIES.map((category, index) => [category.key, index]));

  interface Group {
    key: string;
    /** About how tall the card is, in rows. */
    weight: number;
    items: StarterItem[];
  }

  /** The advised items of a family by category, then its optional items in a card of their own. */
  function groups(of: Kind): Group[] {
    const items = list.filter((item) => item.entry.kind === of);
    const byCategory = new Map<string, StarterItem[]>();
    for (const item of items.filter((each) => each.essential)) {
      byCategory.set(item.entry.category, [...(byCategory.get(item.entry.category) ?? []), item]);
    }
    const sorted = [...byCategory.entries()].sort(([a], [b]) => (categoryOrder.get(a) ?? 99) - (categoryOrder.get(b) ?? 99));
    const optional = items.filter((each) => !each.essential);
    return [
      ...sorted.map(([key, entries]) => ({ key, weight: 1.5 * entries.length + 1, items: entries })),
      ...(optional.length > 0 ? [{ key: 'optional', weight: 1.5 * optional.length + 1, items: optional }] : []),
    ];
  }

  const kindGroups = $derived(groups(kind));

  const tabs = $derived<SubTab[]>(
    KINDS.map((each) => ({
      key: each,
      onclick: () => (kind = each),
      label: kindLabel(each),
      icon: KIND_ICONS[each],
      status: tn('setup.items', chosen.filter((entry) => entry.kind === each).length),
      current: each === kind,
    })),
  );

  const nextKind = $derived(KINDS[KINDS.indexOf(kind) + 1]);

  function count(need: 'cat' | 'dog', delta: number) {
    needs[need] = Math.max(0, (needs[need] ?? 0) + delta);
  }

  function goTo(next: 1 | 2 | 3) {
    step = next;
    if (next === 3) kind = 'food';
    window.scrollTo({ top: 0 });
  }

  function back() {
    if (step === 1) onback();
    else goTo(step === 3 ? 2 : 1);
  }

  function showKind(next: Kind) {
    kind = next;
    window.scrollTo({ top: 0 });
  }

  function create() {
    const products = starterProducts(chosen, i18n.lang, DEFAULT_SETTINGS.kcalPerPersonPerDay);
    void app.startWithPlan({ people, cats: needs.cat ?? 0, dogs: needs.dog ?? 0 }, products);
  }
</script>

{#snippet question(q: Question)}
  <section class="card stack question">
    <div class="q-head">
      <span class="need-icon"><q.icon size={22} /></span>
      <div>
        <h2 class="q-title">{t(q.title)}</h2>
        {#if q.hint}<p class="small muted">{t(q.hint)}</p>{/if}
      </div>
    </div>
    <div class="choices" role="radiogroup" aria-label={t(q.title)}>
      {#each q.choices as choice (choice.value)}
        {@const on = habits[q.key] === choice.value}
        <label class="choice" class:on>
          <input type="radio" name={q.key} value={choice.value} checked={on} onchange={() => (habits = { ...habits, [q.key]: choice.value })} />
          <span class="grow">
            <strong>{t(choice.label)}</strong>
            <span class="small muted">{t(choice.hint, { liters: formatNumber(yearLiters) })}</span>
          </span>
        </label>
      {/each}
    </div>
  </section>
{/snippet}

{#snippet row(item: StarterItem)}
  {@const id = `pick-${item.entry.id}`}
  {@const on = isTicked(item)}
  <li class:off={!on}>
    <input {id} type="checkbox" checked={on} onchange={(event) => (ticked[item.entry.id] = event.currentTarget.checked)} />
    <label for={id}>
      <strong>{localize(item.entry.name)}</strong>
      <span class="use">{localize(item.entry.use)}</span>
      <span class="meta small">
        <span title={t('setup.keeps')}>
          <Hourglass size={14} aria-hidden="true" /><span class="visually-hidden">{t('setup.keeps')}</span>{shelfLifeText(item.entry)}
        </span>
        <span title={t('setup.care')}>
          <Wrench size={14} aria-hidden="true" /><span class="visually-hidden">{t('setup.care')}</span>{item.entry.care
            ? localize(item.entry.care)
            : t('setup.noCare')}
        </span>
      </span>
    </label>
  </li>
{/snippet}

<div class="setup">
  <header class="head" class:wide={step > 1}>
    <button class="icon-btn" onclick={back} aria-label={t('setup.back')}><ArrowLeft size={22} /></button>
    <span class="brand"><Logo size={28} />Survival Shelf</span>
    <span class="step small muted">{t('setup.step', { step, total: STEPS })}</span>
  </header>

  {#if step === 1}
    <section class="content stack">
      <div>
        <h1>{t('setup.householdTitle')}</h1>
        <p class="muted">{t('setup.householdText')}</p>
      </div>

      <div class="card stack">
        <span class="label">{t('setup.people')}</span>
        <div class="pet">
          <span class="need-icon"><Users size={22} /></span>
          <span class="grow">
            <strong>{t('setup.persons')}</strong>
            <span class="small muted">{t('setup.personsHint')}</span>
          </span>
          <div class="stepper">
            <button class="icon-btn outlined" onclick={() => (people = Math.max(1, people - 1))} disabled={people <= 1} aria-label={`${t('setup.persons')} −1`}
              ><Minus size={18} /></button
            >
            <span class="count num" aria-live="polite">{people}</span>
            <button class="icon-btn outlined" onclick={() => (people += 1)} aria-label={`${t('setup.persons')} +1`}><Plus size={18} /></button>
          </div>
        </div>
      </div>

      <div class="card stack pets">
        <span class="label">{t('setup.pets')}</span>
        {#each PETS as pet (pet.need)}
          <div class="pet">
            <span class="need-icon"><pet.icon size={22} /></span>
            <span class="grow">
              <strong>{t(pet.label)}</strong>
              <span class="small muted">{t(pet.hint)}</span>
            </span>
            <div class="stepper">
              <button class="icon-btn outlined" onclick={() => count(pet.need, -1)} disabled={!needs[pet.need]} aria-label={`${t(pet.label)} −1`}
                ><Minus size={18} /></button
              >
              <span class="count num" aria-live="polite">{needs[pet.need]}</span>
              <button class="icon-btn outlined" onclick={() => count(pet.need, 1)} aria-label={`${t(pet.label)} +1`}><Plus size={18} /></button>
            </div>
          </div>
        {/each}
      </div>

      <div class="stack needs">
        <span class="label">{t('setup.needs')}</span>
        <button class="card need" class:active={needs.treatment} aria-pressed={!!needs.treatment} onclick={() => (needs.treatment = needs.treatment ? 0 : 1)}>
          <span class="need-icon"><Pill size={22} /></span>
          <span class="grow">
            <strong>{t('setup.needTreatment')}</strong>
            <span class="small muted">{t('setup.needTreatmentHint')}</span>
          </span>
          <span class="check" aria-hidden="true">{#if needs.treatment}<Check size={18} />{/if}</span>
        </button>
      </div>

      <div class="actions">
        <button class="btn primary" onclick={() => goTo(2)}>{t('setup.next')}<ArrowRight size={18} /></button>
      </div>
    </section>
  {:else if step === 2}
    <section class="content wide stack">
      <div class="intro">
        <h1>{t('setup.habitsTitle')}</h1>
        <p class="muted">{t('setup.habitsText')}</p>
      </div>

      <div class="questions">
        {#each QUESTIONS as q (q.key)}{@render question(q)}{/each}
      </div>

      <div class="actions">
        <button class="btn primary" onclick={() => goTo(3)}>{t('setup.next')}<ArrowRight size={18} /></button>
      </div>
    </section>
  {:else}
    <section class="content wide stack">
      <div class="intro">
        <h1>{t('setup.listTitle')}</h1>
        <p class="muted">{t('setup.listText')}</p>
      </div>

      <SubTabs label={t('setup.families')} items={tabs} />

      {#key kind}
        <CardColumns items={kindGroups}>
          {#snippet card(group)}
            {#if group.key === 'optional'}
              <section class="optional">
                <h2 class="group-title">{t('setup.optional')} <span class="small muted">· {t('setup.optionalHint')}</span></h2>
                <ul class="rows">
                  {#each group.items as item (item.entry.id)}{@render row(item)}{/each}
                </ul>
              </section>
            {:else}
              <section class="card list">
                <h2 class="group-title"><CategoryIcon category={group.key} size={18} />{categoryLabel(group.key)}</h2>
                <ul class="rows">
                  {#each group.items as item (item.entry.id)}{@render row(item)}{/each}
                </ul>
              </section>
            {/if}
          {/snippet}
        </CardColumns>
      {/key}

      <p class="small muted note">{t('setup.amounts', { tiers })}</p>
    </section>

    <footer class="summary">
      <p class="grow"><strong>{tn('setup.checked', chosen.length)}</strong></p>
      {#if nextKind}
        <button class="btn primary" onclick={() => showKind(nextKind)}>{kindLabel(nextKind)}<ArrowRight size={18} /></button>
      {:else}
        <button class="btn primary" onclick={create} disabled={chosen.length === 0}><Check size={18} />{t('setup.create')}</button>
      {/if}
    </footer>
  {/if}
</div>

<style>
  .setup {
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    background: var(--bg);
  }

  .head {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    max-width: 720px;
    margin: 0 auto;
    padding: max(0.75rem, env(safe-area-inset-top)) 1rem 0.5rem;
  }

  .brand {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-family: var(--font-display);
    font-size: 1.15rem;
    font-weight: 700;
  }

  .step {
    margin-left: auto;
  }

  .content {
    width: 100%;
    max-width: 720px;
    margin: 0 auto;
    padding: 0.5rem 1rem 2rem;
  }

  .intro p {
    max-width: 60ch;
    margin-top: 0.35rem;
  }

  .label {
    font-weight: 700;
  }

  .needs {
    gap: 0.6rem;
  }

  .pet {
    display: flex;
    align-items: center;
    gap: 0.9rem;
  }

  .count {
    min-width: 1.75rem;
    text-align: center;
    font-size: 1.15rem;
    font-weight: 700;
  }

  .need {
    display: flex;
    align-items: center;
    gap: 0.9rem;
    width: 100%;
    text-align: left;
    cursor: pointer;
    box-shadow: none;
  }

  .need.active {
    border-color: var(--primary);
    background: var(--primary-soft);
  }

  .need-icon {
    display: inline-flex;
    padding: 0.5rem;
    border-radius: var(--radius-sm);
    background: var(--surface-2);
    color: var(--primary);
  }

  .grow {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }

  .check {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    border-radius: 5px;
    border: 2px solid var(--control);
    color: var(--on-primary);
  }

  .need.active .check {
    border-color: var(--primary);
    background: var(--primary);
  }

  .actions {
    display: flex;
    justify-content: flex-end;
  }

  /* Your habits: one card per question, the answers as large radio buttons. */
  .questions {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .question {
    gap: 0.75rem;
  }

  .q-head {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .q-title {
    font-size: 1.15rem;
  }

  .choices {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .choice {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.6rem 0.8rem;
    border: 1.5px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--surface);
    line-height: 1.3;
    cursor: pointer;
  }

  .choice.on {
    border-color: var(--primary);
    background: var(--primary-soft);
  }

  .choice input {
    order: 1;
    flex: none;
    width: 20px;
    height: 20px;
    margin: 0;
    accent-color: var(--primary);
  }

  .choice:has(input:focus-visible) {
    outline: 2px solid var(--primary);
    outline-offset: 2px;
  }

  /* The list: one family at a time, a card per category. */
  .list {
    padding: 0.75rem 1rem 0.25rem;
  }

  .group-title {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.95rem;
    color: var(--muted);
    margin-bottom: 0.15rem;
  }

  .group-title .small {
    font-family: var(--font);
    font-weight: 400;
  }

  .rows {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .rows li {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.5rem 0;
  }

  .rows li + li {
    border-top: 1px solid var(--border);
  }

  .rows input {
    width: 20px;
    height: 20px;
    flex: none;
    margin: 0.1rem 0 0;
    accent-color: var(--primary);
  }

  .rows label {
    display: flex;
    flex-direction: column;
    min-width: 0;
    line-height: 1.3;
    cursor: pointer;
  }

  .off strong {
    color: var(--muted);
  }

  .use {
    font-size: 0.95rem;
  }

  .meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.1rem 0.9rem;
    margin-top: 0.15rem;
    color: var(--muted);
  }

  .meta > span {
    display: inline-flex;
    align-items: flex-start;
    gap: 0.3rem;
  }

  .meta :global(svg) {
    flex: none;
    margin-top: 0.2rem;
  }

  .optional {
    border: 1.5px dashed var(--control);
    border-radius: var(--radius);
    padding: 0.75rem 1rem 0.25rem;
  }

  .optional .group-title {
    color: var(--text);
  }

  .note {
    max-width: 60ch;
  }

  .summary {
    position: sticky;
    bottom: 0;
    display: flex;
    align-items: center;
    gap: 1rem;
    width: 100%;
    max-width: 1040px;
    margin: auto auto 0;
    padding: 0.75rem 1rem calc(0.75rem + var(--safe-bottom));
    background: var(--surface);
    border-top: 1.5px solid var(--border);
  }

  @media (min-width: 720px) {
    .head.wide,
    .content.wide {
      max-width: 1040px;
    }

    .questions {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      align-items: start;
    }

    .summary {
      border: 1.5px solid var(--border);
      border-radius: var(--radius) var(--radius) 0 0;
    }
  }
</style>
