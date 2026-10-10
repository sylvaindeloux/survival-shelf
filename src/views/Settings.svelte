<script lang="ts">
  import Download from '@lucide/svelte/icons/download';
  import ExternalLink from '@lucide/svelte/icons/external-link';
  import FileText from '@lucide/svelte/icons/file-text';
  import FolderOpen from '@lucide/svelte/icons/folder-open';
  import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
  import Save from '@lucide/svelte/icons/save';
  import Share2 from '@lucide/svelte/icons/share-2';
  import Unlink from '@lucide/svelte/icons/unlink';
  import { app, issueMessage } from '../lib/app.svelte';
  import { updateSettings } from '../lib/core/stock';
  import { parseNumber } from '../lib/core/text';
  import type { Settings } from '../lib/core/types';
  import { i18n, t, tn, type LangPreference } from '../lib/i18n/index.svelte';
  import { canShareFiles } from '../lib/storage/files';
  import { preferences, type Theme } from '../lib/ui/state.svelte';

  const REPO = 'https://github.com/sylvaindeloux/survival-shelf';
  const canShare = canShareFiles();
  let confirmReset = $state(false);

  const fields: { key: keyof Settings; label: () => string; hint: () => string; min: number; step: string }[] = [
    { key: 'people', label: () => t('settings.people'), hint: () => '', min: 1, step: '1' },
    { key: 'kcalPerPersonPerDay', label: () => t('settings.kcal'), hint: () => t('settings.kcalHint'), min: 1, step: '50' },
    { key: 'waterPerPersonPerDay', label: () => t('settings.water'), hint: () => t('settings.waterHint'), min: 0, step: '0.5' },
  ];
  const goalFields: typeof fields = [
    { key: 'targetDays', label: () => t('settings.targetDays'), hint: () => t('settings.targetDaysHint'), min: 1, step: '1' },
    { key: 'warningDays', label: () => t('settings.warningDays'), hint: () => t('settings.warningDaysHint'), min: 0, step: '1' },
    { key: 'rotationMarginDays', label: () => t('settings.margin'), hint: () => t('settings.marginHint'), min: 0, step: '1' },
  ];

  function change(key: keyof Settings, min: number, event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const value = parseNumber(input.value);
    if (value === null || Number.isNaN(value) || value < min) {
      input.value = String(app.shelf.settings[key]);
      return;
    }
    app.update((shelf) => updateSettings(shelf, { ...shelf.settings, [key]: value }));
  }

  const fileStatus = $derived.by(() => {
    switch (app.fileState) {
      case 'linked':
        return t('settings.fileLinked', { name: app.fileName });
      case 'permission':
        return t('banner.permission', { name: app.fileName });
      case 'paused':
        return t('banner.paused', { name: app.fileName });
      case 'error':
        return t('banner.error', { name: app.fileName, message: app.fileError });
      default:
        return app.canLinkFiles ? t('settings.fileNone') : t('settings.fileNoneNoLink');
    }
  });
</script>

{#snippet numberFields(list: typeof fields)}
  {#each list as field (field.key)}
    <label class="field">
      <span>{field.label()}</span>
      <input
        class="input"
        type="number"
        inputmode="decimal"
        min={field.min}
        step={field.step}
        value={app.shelf.settings[field.key]}
        onchange={(event) => change(field.key, field.min, event)}
      />
      {#if field.hint()}<span class="hint">{field.hint()}</span>{/if}
    </label>
  {/each}
{/snippet}

<div class="stack">
  <header>
    <h1>{t('settings.title')}</h1>
  </header>

  <section class="card stack">
    <h2>{t('settings.household')}</h2>
    <div class="grid-3">{@render numberFields(fields)}</div>
  </section>

  <section class="card stack">
    <h2>{t('settings.goals')}</h2>
    <div class="grid-3">{@render numberFields(goalFields)}</div>
  </section>

  <section class="card stack" id="file">
    <div class="section-title">
      <h2>{t('settings.file')}</h2>
      <span class="pill {app.fileState === 'linked' ? 'ok' : app.fileState === 'none' ? '' : 'soon'}">
        {app.fileState === 'linked' ? t('settings.autosave') : app.fileState === 'none' ? t('settings.browserOnly') : t('settings.attention')}
      </span>
    </div>
    <p>{fileStatus}</p>

    <div class="row wrap">
      {#if app.fileState === 'permission' || app.fileState === 'error'}
        <button class="btn primary" onclick={() => app.reconnect()}>{t('banner.allow')}</button>
      {/if}
      {#if app.fileState === 'paused'}
        <button class="btn danger" onclick={() => app.overwriteFile()}>{t('banner.overwrite')}</button>
      {/if}
      {#if app.canLinkFiles && app.fileState === 'none'}
        <button class="btn primary" onclick={() => app.linkNewFile()}><Save size={18} />{t('file.saveAs')}</button>
      {/if}
      <button class="btn" onclick={() => app.openFile()}><FolderOpen size={18} />{t('file.open')}</button>
      <button class="btn" onclick={() => app.exportFile()}><Download size={18} />{t('file.export')}</button>
      {#if canShare}
        <button class="btn" onclick={() => app.shareFile()}><Share2 size={18} />{t('file.share')}</button>
      {/if}
      {#if app.fileState !== 'none'}
        <button class="btn ghost" onclick={() => app.unlink()}><Unlink size={18} />{t('file.unlink')}</button>
      {/if}
    </div>

    {#if app.fileState === 'none' && app.lastExport}
      <p class="small muted">{t('settings.lastExport', { date: new Date(app.lastExport).toLocaleDateString(i18n.lang) })}</p>
    {/if}
    {#if !app.canLinkFiles}
      <p class="hint">{t('settings.noLinkHint')}</p>
    {/if}

    {#if app.issues.length > 0}
      <div class="issues">
        <h3>{tn('settings.issues', app.issues.length)}</h3>
        <ul>
          {#each app.issues as issue, index (index)}
            <li class={issue.level}>
              <span class="line num">{t('settings.line', { line: issue.line })}</span>
              {issueMessage(issue)}
            </li>
          {/each}
        </ul>
      </div>
    {/if}

    <a class="small doc-link" href="{REPO}/blob/master/docs/FILE_FORMAT.md" target="_blank" rel="noopener">
      <FileText size={15} />{t('settings.formatDoc')}<ExternalLink size={13} />
    </a>
  </section>

  <section class="card stack">
    <h2>{t('settings.appearance')}</h2>
    <div class="grid-2">
      <label class="field">
        <span>{t('settings.language')}</span>
        <select
          class="select"
          value={i18n.preference}
          onchange={(event) => i18n.setPreference((event.currentTarget as HTMLSelectElement).value as LangPreference)}
        >
          <option value="auto">{t('settings.auto')}</option>
          <option value="en">English</option>
          <option value="fr">Français</option>
        </select>
      </label>
      <label class="field">
        <span>{t('settings.theme')}</span>
        <select
          class="select"
          value={preferences.theme}
          onchange={(event) => preferences.setTheme((event.currentTarget as HTMLSelectElement).value as Theme)}
        >
          <option value="auto">{t('settings.auto')}</option>
          <option value="light">{t('settings.light')}</option>
          <option value="dark">{t('settings.dark')}</option>
        </select>
      </label>
    </div>
  </section>

  <section class="card stack">
    <h2>{t('settings.about')}</h2>
    <p class="small">{t('settings.aboutText')}</p>
    {#if location.protocol !== 'file:'}
      <p class="small">
        <a href="./survival-shelf.html" download>{t('settings.singleFile')}</a>
        <span class="muted">· {t('settings.singleFileHint')}</span>
      </p>
    {/if}
    <p class="small muted">
      Survival Shelf v{__APP_VERSION__} · {t('settings.license')} ·
      <a href={REPO} target="_blank" rel="noopener">GitHub</a>
    </p>
  </section>

  <section class="card stack danger-zone">
    <h2>{t('settings.reset')}</h2>
    <p class="small muted">{t('settings.resetText')}</p>
    <div class="row wrap">
      {#if confirmReset}
        <button class="btn" onclick={() => (confirmReset = false)}>{t('action.cancel')}</button>
        <button class="btn danger" onclick={() => app.reset()}><RotateCcw size={18} />{t('settings.resetConfirm')}</button>
      {:else}
        <button class="btn danger" onclick={() => (confirmReset = true)}><RotateCcw size={18} />{t('settings.reset')}</button>
      {/if}
    </div>
  </section>
</div>

<style>
  .issues {
    padding: 0.75rem 1rem;
    border-radius: var(--radius-sm);
    background: var(--surface-2);
  }

  .issues ul {
    margin: 0.5rem 0 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    font-size: 0.875rem;
  }

  .issues li {
    display: flex;
    gap: 0.6rem;
  }

  .issues li.error {
    color: var(--danger);
  }

  .issues li.warning {
    color: var(--warn);
  }

  .issues li.info {
    color: var(--muted);
  }

  .line {
    flex: none;
    min-width: 4.5rem;
    font-weight: 700;
  }

  .doc-link {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
  }

  .danger-zone {
    border-color: color-mix(in srgb, var(--danger) 30%, var(--border));
  }
</style>
