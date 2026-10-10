<script lang="ts">
  import Bell from '@lucide/svelte/icons/bell';
  import CalendarPlus from '@lucide/svelte/icons/calendar-plus';
  import Share2 from '@lucide/svelte/icons/share-2';
  import { app } from '../app.svelte';
  import { reminderCalendar } from '../core/ics';
  import { updateSettings } from '../core/stock';
  import type { Rhythm } from '../core/types';
  import { t } from '../i18n/index.svelte';
  import { downloadText, shareFile } from '../storage/files';

  const FILE_NAME = 'survival-shelf-reminder.ics';

  /** Next Saturday at 10:00, local time, as "YYYY-MM-DDTHH:MM". */
  function nextSaturday(): string {
    const date = new Date();
    date.setDate(date.getDate() + (((6 - date.getDay() + 7) % 7) || 7));
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T10:00`;
  }

  let start = $state(nextSaturday());
  const rhythm = $derived(app.shelf.settings.rhythm);
  const canShare = typeof navigator.canShare === 'function';

  function setRhythm(next: Rhythm) {
    if (next !== rhythm) app.update((shelf) => updateSettings(shelf, { ...shelf.settings, rhythm: next }));
  }

  function calendar(): string {
    const url = location.protocol.startsWith('http') ? `${location.origin}${location.pathname}#/checkin` : undefined;
    return reminderCalendar({
      start,
      rhythm,
      title: t('reminder.eventTitle'),
      description: t('reminder.eventText'),
      url,
      now: new Date(),
    });
  }

  function download() {
    downloadText(calendar(), FILE_NAME, 'text/calendar;charset=utf-8');
    app.toast(t('reminder.downloaded'), 'success');
  }

  async function share() {
    try {
      if (!(await shareFile(new File([calendar()], FILE_NAME, { type: 'text/calendar' })))) download();
    } catch {
      download();
    }
  }
</script>

<section class="card stack reminder">
  <div class="section-title">
    <h2>{t('reminder.title')}</h2>
    <Bell size={20} />
  </div>
  <p class="small muted">{t('reminder.text')}</p>
  <div class="fields">
    <label class="field">
      <span>{t('reminder.first')}</span>
      <input class="input" type="datetime-local" bind:value={start} required />
    </label>
    <div class="field">
      <span>{t('reminder.every')}</span>
      <div class="segmented" role="group" aria-label={t('reminder.every')}>
        <button type="button" class:active={rhythm === 'weekly'} onclick={() => setRhythm('weekly')}>{t('settings.weekly')}</button>
        <button type="button" class:active={rhythm === 'monthly'} onclick={() => setRhythm('monthly')}>{t('settings.monthly')}</button>
      </div>
    </div>
  </div>
  <div class="row wrap">
    <button class="btn primary" onclick={download} disabled={start === ''}><CalendarPlus size={18} />{t('reminder.add')}</button>
    {#if canShare}
      <button class="btn" onclick={share} disabled={start === ''}><Share2 size={18} />{t('action.share')}</button>
    {/if}
  </div>
  <p class="hint">{t('reminder.hint')}</p>
</section>

<style>
  .reminder .section-title {
    margin: 0;
    color: var(--primary);
  }

  .reminder h2 {
    color: var(--text);
  }

  .fields {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
    gap: 0.75rem;
  }

  .segmented {
    min-height: 44px;
  }
</style>
