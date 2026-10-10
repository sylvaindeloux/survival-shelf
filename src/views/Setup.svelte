<script lang="ts">
  import ArrowLeft from '@lucide/svelte/icons/arrow-left';
  import ArrowRight from '@lucide/svelte/icons/arrow-right';
  import Baby from '@lucide/svelte/icons/baby';
  import Check from '@lucide/svelte/icons/check';
  import Minus from '@lucide/svelte/icons/minus';
  import PawPrint from '@lucide/svelte/icons/paw-print';
  import Pill from '@lucide/svelte/icons/pill';
  import Plus from '@lucide/svelte/icons/plus';
  import type { Component } from 'svelte';
  import { app } from '../lib/app.svelte';
  import { productFromCatalog, starterItems, type CatalogItem, type Need } from '../lib/core/catalog';
  import { CATEGORIES, isWaterTreatment } from '../lib/core/categories';
  import { DEFAULT_SETTINGS } from '../lib/core/defaults';
  import { parseNumber } from '../lib/core/text';
  import { formatNumber, i18n, t, type MessageKey } from '../lib/i18n/index.svelte';
  import Logo from '../lib/ui/Logo.svelte';
  import { categoryIcon, categoryLabel, formatKcal, inputNumber, quantity, tierLabel } from '../lib/ui/format';

  let { onback }: { onback: () => void } = $props();

  const NEEDS: { need: Need; icon: Component; label: MessageKey; hint: MessageKey }[] = [
    { need: 'baby', icon: Baby, label: 'setup.needBaby', hint: 'setup.needBabyHint' },
    { need: 'pet', icon: PawPrint, label: 'setup.needPet', hint: 'setup.needPetHint' },
    { need: 'treatment', icon: Pill, label: 'setup.needTreatment', hint: 'setup.needTreatmentHint' },
  ];

  interface Choice {
    entry: CatalogItem;
    selected: boolean;
    /** Daily use, or the minimum to own for things that are not used up. */
    amount: string;
  }

  let step = $state<1 | 2>(1);
  let people = $state(1);
  let needs = $state<Need[]>([]);
  let choices = $state<Choice[]>([]);

  const categoryOrder = new Map(CATEGORIES.map((category, index) => [category.key, index]));
  const groups = $derived.by(() => {
    const byCategory = new Map<string, Choice[]>();
    for (const choice of choices) byCategory.set(choice.entry.category, [...(byCategory.get(choice.entry.category) ?? []), choice]);
    return [...byCategory.entries()].sort(([a], [b]) => (categoryOrder.get(a) ?? 99) - (categoryOrder.get(b) ?? 99));
  });

  function amountOf(choice: Choice): number | null {
    const value = parseNumber(choice.amount);
    return value === null || Number.isNaN(value) || value < 0 ? null : value;
  }

  const menu = $derived(
    choices
      .filter((choice) => choice.selected && choice.entry.per === 'person' && choice.entry.daily !== null)
      .reduce((sum, choice) => sum + (amountOf(choice) ?? 0) * (choice.entry.kcal ?? 0), 0),
  );
  const menuShare = $derived(menu / DEFAULT_SETTINGS.kcalPerPersonPerDay);
  const selectedCount = $derived(choices.filter((choice) => choice.selected).length);
  const tiers = $derived(DEFAULT_SETTINGS.tiers.map(tierLabel).join(', '));

  function toggleNeed(need: Need) {
    needs = needs.includes(need) ? needs.filter((candidate) => candidate !== need) : [...needs, need];
  }

  function toPlan() {
    choices = starterItems(needs).map((entry) => ({ entry, selected: true, amount: inputNumber(entry.daily ?? entry.target) }));
    step = 2;
    window.scrollTo({ top: 0 });
  }

  /** "≈ 1.4 kg per week": what the household uses, to make daily amounts concrete. */
  function weekly(choice: Choice): string {
    const amount = amountOf(choice);
    if (choice.entry.daily === null || amount === null || amount === 0) return '';
    const count = choice.entry.per === 'household' ? 1 : people;
    const unit = { unit: choice.entry.unit[i18n.lang] };
    return t('setup.perWeek', { qty: quantity(Math.round(amount * count * 7 * 100) / 100, unit) });
  }

  /** What water items stand for: they have no amount of their own. */
  function waterHint(entry: CatalogItem): string {
    if (isWaterTreatment(entry)) return t('setup.treatmentHint', { liters: formatNumber(entry.water ?? 0) });
    return t('setup.waterHint', { liters: formatNumber(DEFAULT_SETTINGS.waterPerPersonPerDay) });
  }

  /** "kg per person per day", "rolls for the household"… next to the amount. */
  function amountLabel(entry: CatalogItem): string {
    const unit = entry.unit[i18n.lang];
    const household = entry.per === 'household';
    if (entry.daily !== null) return t(household ? 'setup.dailyHousehold' : 'setup.dailyPerson', { unit });
    return t(household ? 'setup.ownHousehold' : 'setup.ownPerson', { unit });
  }

  function create() {
    const products = choices
      .filter((choice) => choice.selected)
      .map((choice) => {
        const product = productFromCatalog(choice.entry, i18n.lang);
        const amount = amountOf(choice);
        if (choice.entry.daily !== null) product.daily = amount;
        else if (choice.entry.target !== null) product.target = amount;
        return product;
      });
    void app.startWithPlan(people, products);
  }
</script>

<div class="setup">
  <header class="head">
    <button class="icon-btn" onclick={() => (step === 1 ? onback() : (step = 1))} aria-label={t('setup.back')}><ArrowLeft size={22} /></button>
    <span class="brand"><Logo size={28} />Survival Shelf</span>
    <span class="step small muted">{t('setup.step', { step, total: 2 })}</span>
  </header>

  {#if step === 1}
    <section class="content stack">
      <div>
        <h1>{t('setup.householdTitle')}</h1>
        <p class="muted">{t('setup.householdText')}</p>
      </div>

      <div class="card stack">
        <span class="label">{t('setup.people')}</span>
        <div class="stepper people">
          <button class="icon-btn outlined" onclick={() => (people = Math.max(1, people - 1))} aria-label="−1"><Minus size={20} /></button>
          <input
            class="input num"
            type="number"
            inputmode="numeric"
            min="1"
            aria-label={t('setup.people')}
            bind:value={people}
            onchange={() => (people = Math.max(1, Math.round(people || 1)))}
          />
          <button class="icon-btn outlined" onclick={() => (people += 1)} aria-label="+1"><Plus size={20} /></button>
        </div>
      </div>

      <div class="stack needs">
        <span class="label">{t('setup.needs')}</span>
        {#each NEEDS as option (option.need)}
          {@const active = needs.includes(option.need)}
          <button class="card need" class:active aria-pressed={active} onclick={() => toggleNeed(option.need)}>
            <span class="need-icon"><option.icon size={22} /></span>
            <span class="grow">
              <strong>{t(option.label)}</strong>
              <span class="small muted">{t(option.hint)}</span>
            </span>
            <span class="check" aria-hidden="true">{#if active}<Check size={18} />{/if}</span>
          </button>
        {/each}
      </div>

      <div class="actions">
        <button class="btn primary" onclick={toPlan}>{t('setup.next')}<ArrowRight size={18} /></button>
      </div>
    </section>
  {:else}
    <section class="content stack">
      <div>
        <h1>{t('setup.planTitle')}</h1>
        <p class="muted">{t('setup.planText', { tiers })}</p>
      </div>

      {#each groups as [category, list] (category)}
        <section class="group">
          <h2 class="group-title"><span aria-hidden="true">{categoryIcon(category)}</span> {categoryLabel(category)}</h2>
          <ul class="card items">
            {#each list as choice (choice.entry.id)}
              {@const editable = choice.entry.daily !== null || choice.entry.target !== null}
              {@const id = `pick-${choice.entry.id}`}
              <li class:off={!choice.selected}>
                <input {id} type="checkbox" bind:checked={choice.selected} />
                <div class="item">
                  <label for={id}><strong>{choice.entry.name[i18n.lang]}</strong></label>
                  {#if editable}
                    <div class="amount">
                      <input
                        class="input num"
                        inputmode="decimal"
                        bind:value={choice.amount}
                        disabled={!choice.selected}
                        aria-label={`${choice.entry.name[i18n.lang]}: ${amountLabel(choice.entry)}`}
                        aria-invalid={choice.amount.trim() !== '' && amountOf(choice) === null}
                      />
                      <span class="small">{amountLabel(choice.entry)}</span>
                      {#if choice.selected && weekly(choice)}<span class="small muted">{weekly(choice)}</span>{/if}
                    </div>
                  {:else}
                    <span class="small muted">{waterHint(choice.entry)}</span>
                  {/if}
                </div>
              </li>
            {/each}
          </ul>
        </section>
      {/each}
      <p class="small muted">{t('setup.later')}</p>
    </section>

    <footer class="summary">
      <div class="menu">
        <p class="small"><strong>{t('setup.menu', { kcal: formatKcal(menu) })}</strong></p>
        <div class="bar" class:done={menuShare >= 0.9}><span style:width="{Math.min(1, menuShare) * 100}%"></span></div>
        <p class="hint">{t('setup.menuNeed', { kcal: formatKcal(DEFAULT_SETTINGS.kcalPerPersonPerDay) })}</p>
      </div>
      <button class="btn primary" onclick={create} disabled={selectedCount === 0}><Check size={18} />{t('setup.create')}</button>
    </footer>
  {/if}
</div>

<style>
  .setup {
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    background:
      radial-gradient(90% 40% at 50% 0%, color-mix(in srgb, var(--primary) 12%, transparent), transparent 70%),
      var(--bg);
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
    font-weight: 800;
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

  .label {
    font-weight: 700;
  }

  .people {
    max-width: 260px;
  }

  .needs {
    gap: 0.6rem;
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
    border-radius: 12px;
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
    border-radius: 50%;
    border: 2px solid var(--border);
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

  .group-title {
    font-size: 0.95rem;
    margin: 0 0 0.5rem 0.25rem;
  }

  .items {
    list-style: none;
    margin: 0;
    padding: 0.25rem 1rem;
  }

  .items li {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.6rem 0;
    border-top: 1px solid var(--border);
  }

  .items li:first-child {
    border-top: none;
  }

  .items li.off strong {
    color: var(--muted);
    text-decoration: line-through;
  }

  .items input[type='checkbox'] {
    width: 20px;
    height: 20px;
    flex: none;
    margin: 0.1rem 0 0;
    accent-color: var(--primary);
  }

  .item {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .item label {
    cursor: pointer;
  }

  .amount {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.25rem 0.5rem;
  }

  .amount .input {
    width: 4.75rem;
    min-height: 36px;
    padding: 0.3rem 0.6rem;
    text-align: right;
  }

  .summary {
    position: sticky;
    bottom: 0;
    display: flex;
    align-items: center;
    gap: 1rem;
    width: 100%;
    max-width: 720px;
    margin: auto auto 0;
    padding: 0.75rem 1rem calc(0.75rem + var(--safe-bottom));
    background: color-mix(in srgb, var(--surface) 94%, transparent);
    backdrop-filter: blur(12px);
    border-top: 1px solid var(--border);
  }

  .menu {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  @media (min-width: 720px) {
    .summary {
      border: 1px solid var(--border);
      border-radius: var(--radius) var(--radius) 0 0;
    }
  }
</style>
