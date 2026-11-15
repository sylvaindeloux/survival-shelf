<script lang="ts">
  import Download from '@lucide/svelte/icons/download';
  import Save from '@lucide/svelte/icons/save';
  import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
  import { ONLINE_WARNING_SNOOZE_DAYS, showOnlineWarning } from '../core/hosting';
  import { app } from '../app.svelte';
  import { i18n, t } from '../i18n/index.svelte';
  import Dialog from './Dialog.svelte';
  import { preferences } from './state.svelte';

  const README = 'https://github.com/sylvaindeloux/survival-shelf';

  let open = $state(false);
  const visible = $derived(showOnlineWarning(location.hostname, preferences.onlineWarningUntil, app.today));
  /** Data only worth taking along once there is some of the user's own. */
  const hasData = $derived(app.started && !app.demo);
  const why = $derived(i18n.lang === 'fr' ? `${README}/blob/master/README.fr.md#pour-commencer` : `${README}#get-started`);
</script>

{#if visible}
  <div class="online-warning" role="note">
    <TriangleAlert size={20} />
    <p>{t('online.text')}</p>
    <div class="row wrap">
      <button class="btn small primary" onclick={() => (open = true)}><Download size={16} />{t('online.getCopy')}</button>
      <a class="btn small" href={why} target="_blank" rel="noopener">{t('online.why')}</a>
      <button class="btn small" onclick={() => preferences.hideOnlineWarningUntil(app.today + ONLINE_WARNING_SNOOZE_DAYS)}>
        {t('online.later')}
      </button>
    </div>
  </div>
{/if}

{#if open}
  <Dialog title={t('online.title')} onclose={() => (open = false)}>
    <div class="stack">
      <p>{t('online.intro')}</p>
      <section class="step">
        <h3><span class="step-num">1</span>{t('online.appTitle')}</h3>
        <p class="small muted">{t('online.appText')}</p>
        <a class="btn primary" href="./survival-shelf.html" download><Download size={18} />{t('online.appButton')}</a>
      </section>
      {#if hasData}
        <section class="step">
          <h3><span class="step-num">2</span>{t('online.dataTitle')}</h3>
          {#if app.fileState === 'linked'}
            <p class="small muted">{t('online.dataLinked', { name: app.fileName })}</p>
          {:else}
            <p class="small muted">{t('online.dataText')}</p>
            {#if app.canLinkFiles}
              <button class="btn" onclick={() => app.linkNewFile()}><Save size={18} />{t('file.saveAs')}</button>
            {:else}
              <button class="btn" onclick={() => app.exportFile()}><Download size={18} />{t('file.export')}</button>
            {/if}
          {/if}
        </section>
      {/if}
      <p class="small muted">{t('online.phone')}</p>
    </div>
    {#snippet footer()}
      <button class="btn" onclick={() => (open = false)}>{t('action.close')}</button>
    {/snippet}
  </Dialog>
{/if}

<style>
  .online-warning {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem 0.75rem;
    padding: 0.75rem 1rem;
    border-radius: var(--radius-sm);
    border: 1px solid color-mix(in srgb, var(--warn) 25%, transparent);
    background: var(--warn-soft);
    color: var(--warn);
  }

  .online-warning p {
    flex: 1 1 220px;
    font-size: 0.9rem;
    color: var(--text);
  }

  .online-warning .btn:not(.primary) {
    color: var(--text);
  }

  .step {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .step h3 {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1rem;
  }

  .step-num {
    display: inline-grid;
    place-items: center;
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 50%;
    background: var(--primary);
    color: var(--on-primary);
    font-size: 0.8rem;
  }
</style>
