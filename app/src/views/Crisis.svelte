<script lang="ts">
  import Backpack from '@lucide/svelte/icons/backpack';
  import BookOpen from '@lucide/svelte/icons/book-open';
  import Check from '@lucide/svelte/icons/check';
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import Droplet from '@lucide/svelte/icons/droplet';
  import MapPin from '@lucide/svelte/icons/map-pin';
  import Phone from '@lucide/svelte/icons/phone';
  import Utensils from '@lucide/svelte/icons/utensils';
  import { app } from '../lib/app.svelte';
  import { drinkWater, eatFirst, waterToday } from '../lib/core/crisis';
  import { phoneLink } from '../lib/core/emergency';
  import { findProduct } from '../lib/core/stock';
  import { FIND_WATER_GUIDE, guideLang } from '../lib/guides/library';
  import { formatDuration, i18n, t, tn } from '../lib/i18n/index.svelte';
  import ExpiryBadge from '../lib/ui/ExpiryBadge.svelte';
  import { formatLiters, quantity, wholeDays } from '../lib/ui/format';
  import { dialogs } from '../lib/ui/state.svelte';

  const settings = $derived(app.shelf.settings);
  const autonomy = $derived(app.autonomy);
  const water = $derived(waterToday(app.shelf, app.today));
  const food = $derived(eatFirst(app.shelf, app.today));
  const boxLabel = $derived(formatLiters(water.boxLiters));
  // A no-break space keeps "3 L" on one line in the sentence.
  const perPerson = $derived(formatLiters(settings.waterPerPersonPerDay).replace(' ', '\u00a0'));
  // The first emergency number that can be called: the 112 of a new file, or the user's own.
  const call = $derived(
    app.shelf.emergency
      .filter((entry) => entry.topic === 'number')
      .map((entry) => phoneLink(entry.phone))
      .find((link) => link !== null && !link.sms) ?? null,
  );

  function drink() {
    const product = water.product?.name ?? '';
    app.update((shelf) => drinkWater(shelf, app.today).shelf, t('crisis.drunkToast', { liters: boxLabel, product }));
  }
</script>

<div class="crisis">
  <h1 class="visually-hidden">{t('crisis.title')}</h1>

  <div class="column">
    <section class="card days" aria-labelledby="crisis-left">
      <p id="crisis-left" class="eyebrow">{t('crisis.left')}</p>
      <p class="huge num">{wholeDays(autonomy.days)}<span>{tn('crisis.days', Math.floor(autonomy.days))}</span></p>
      {#if autonomy.limitedBy === 'water'}
        <p class="muted">{t('crisis.limitedByWater')} · {t('crisis.foodFor', { duration: formatDuration(autonomy.food.days) })}</p>
      {:else if autonomy.limitedBy === 'food'}
        <p class="muted">{t('crisis.limitedByFood')} · {t('crisis.waterFor', { duration: formatDuration(autonomy.water.days) })}</p>
      {/if}
    </section>

    <section class="card block" aria-labelledby="crisis-water">
      <div class="block-head">
        <h2 id="crisis-water"><Droplet size={24} class="water" />{t('crisis.waterTitle')}</h2>
        <span class="kpi num">{formatLiters(water.need)}</span>
      </div>
      {#if water.boxes > 0}
        <ul class="bottles">
          {#each Array.from({ length: water.boxes }, (_, index) => index) as index (index)}
            <li>
              {#if index < water.done}
                <span class="bt on"><Check size={16} />{boxLabel}<span class="visually-hidden">{t('crisis.drunk')}</span></span>
              {:else}
                <button type="button" class="bt" onclick={drink} aria-label={t('crisis.drink', { liters: boxLabel })}>{boxLabel}</button>
              {/if}
            </li>
          {/each}
        </ul>
        <p class="small muted">
          {t(water.boxLiters === water.product?.water ? 'crisis.tapBottle' : 'crisis.tapLiter')}
          {t(settings.cats + settings.dogs > 0 ? 'crisis.waterNeedPets' : 'crisis.waterNeed', { liters: perPerson })}
        </p>
      {:else}
        <p class="warn-text">{t('crisis.noWater')}</p>
        <a class="more" href="#/guides/{FIND_WATER_GUIDE[guideLang(i18n.lang)]}">{t('crisis.findWater')}<ChevronRight size={16} /></a>
      {/if}
    </section>
  </div>

  <div class="column">
    <section class="card block" aria-labelledby="crisis-eat">
      <div class="block-head">
        <h2 id="crisis-eat"><Utensils size={24} class="food" />{t('crisis.eatTitle')}</h2>
      </div>
      {#if food.length > 0}
        <ul class="list">
          {#each food as lot (lot.id)}
            <li>
              <button type="button" class="eat" onclick={() => (dialogs.take = { action: 'consumed', lotId: lot.id })}>
                <span class="grow">
                  <strong>{lot.product}</strong>
                  <span class="muted small">{quantity(lot.qty, findProduct(app.shelf, lot.product))}{lot.location ? ` · ${lot.location}` : ''}</span>
                </span>
                <ExpiryBadge {lot} />
              </button>
            </li>
          {/each}
        </ul>
      {:else}
        <p class="muted">{t('crisis.nothingToEat')}</p>
      {/if}
      <button type="button" class="btn ate" disabled={app.shelf.lots.length === 0} onclick={() => (dialogs.take = { action: 'consumed' })}><Check size={20} />{t('crisis.ate')}</button>
    </section>

    <nav class="shortcuts" aria-label={t('crisis.shortcuts')}>
      {#if call}
        <a class="btn alarm" href={call.href}><Phone size={20} />{t('crisis.call', { number: call.text })}</a>
      {/if}
      <a class="btn" href="#/emergency/info"><MapPin size={20} />{t('emergency.infoTitle')}</a>
      <a class="btn" href="#/emergency/bags"><Backpack size={20} />{t('crisis.bags')}</a>
      <a class="btn" href="#/guides"><BookOpen size={20} />{t('nav.guides')}</a>
    </nav>
  </div>
</div>

<style>
  .crisis {
    display: grid;
    gap: 1rem;
  }

  .column {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    min-width: 0;
  }

  .days {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  /* The number to read from across the room. */
  .huge {
    font-family: var(--font-display);
    font-size: 5.25rem;
    font-weight: 700;
    line-height: 0.95;
  }

  .huge span {
    margin-left: 0.5rem;
    font-size: 1.75rem;
  }

  .block {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .block-head {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .block-head h2 {
    display: flex;
    flex: 1;
    align-items: center;
    gap: 0.5rem;
    min-width: 0;
    font-size: 1.35rem;
  }

  .block-head :global(.water) {
    flex: none;
    color: var(--water);
  }

  .block-head :global(.food) {
    flex: none;
    color: var(--food);
  }

  .kpi {
    font-family: var(--font-display);
    font-size: 1.35rem;
    font-weight: 700;
    white-space: nowrap;
  }

  /* One box per bottle (or liter) of the day: tapped when drunk. */
  .bottles {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.4rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .bt {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
    width: 100%;
    height: 48px;
    border: 1.5px solid var(--water);
    border-radius: var(--radius-sm);
    background: var(--surface);
    color: var(--water);
    font-weight: 700;
    font-size: 0.95rem;
    white-space: nowrap;
  }

  button.bt {
    cursor: pointer;
  }

  button.bt:hover {
    background: color-mix(in srgb, var(--water) 12%, var(--surface));
  }

  .bt.on {
    background: var(--water);
    color: var(--on-primary);
  }

  .warn-text {
    color: var(--warn);
    font-weight: 600;
  }

  .more {
    display: inline-flex;
    align-items: center;
    align-self: flex-start;
    gap: 0.15rem;
    font-weight: 600;
  }

  .list {
    margin: -0.25rem 0;
  }

  .eat {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    padding: 0;
    border: none;
    background: none;
    text-align: left;
    cursor: pointer;
  }

  .eat strong {
    overflow-wrap: anywhere;
  }

  .eat:hover strong {
    text-decoration: underline;
  }

  .ate {
    white-space: normal;
    text-align: center;
  }

  .ate :global(svg) {
    flex: none;
  }

  .shortcuts {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.625rem;
  }

  /* Labels go on two lines rather than out of the button on small phones. */
  .shortcuts .btn {
    min-height: 56px;
    padding: 0.4rem 0.6rem;
    white-space: normal;
    text-align: center;
    line-height: 1.15;
  }

  .shortcuts .btn :global(svg) {
    flex: none;
  }

  @media (min-width: 720px) {
    .crisis {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      align-items: start;
    }
  }
</style>
