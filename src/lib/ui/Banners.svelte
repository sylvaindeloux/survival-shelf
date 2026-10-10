<script lang="ts">
  import Download from '@lucide/svelte/icons/download';
  import Info from '@lucide/svelte/icons/info';
  import Save from '@lucide/svelte/icons/save';
  import Share2 from '@lucide/svelte/icons/share-2';
  import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
  import { app } from '../app.svelte';
  import { t } from '../i18n/index.svelte';
  import { canShareFiles } from '../storage/files';
  import Dialog from './Dialog.svelte';
  import { router } from './state.svelte';

  const canShare = canShareFiles();
</script>

<div class="banners">
  {#if app.demo}
    <div class="banner info">
      <Info size={20} />
      <p>{t('banner.demo')}</p>
      <button class="btn small" onclick={() => app.reset()}>{t('banner.demoStart')}</button>
    </div>
  {/if}

  {#if app.fileState === 'permission'}
    <div class="banner warn">
      <TriangleAlert size={20} />
      <p>{t('banner.permission', { name: app.fileName })}</p>
      <button class="btn small primary" onclick={() => app.reconnect()}>{t('banner.allow')}</button>
    </div>
  {:else if app.fileState === 'paused'}
    <div class="banner warn">
      <TriangleAlert size={20} />
      <p>{t('banner.paused', { name: app.fileName })}</p>
      <div class="row wrap">
        <button class="btn small" onclick={() => router.go('settings')}>{t('banner.seeErrors')}</button>
        <button class="btn small danger" onclick={() => app.overwriteFile()}>{t('banner.overwrite')}</button>
      </div>
    </div>
  {:else if app.fileState === 'error'}
    <div class="banner danger">
      <TriangleAlert size={20} />
      <p>{t('banner.error', { name: app.fileName, message: app.fileError })}</p>
      <button class="btn small" onclick={() => app.reconnect()}>{t('banner.retry')}</button>
    </div>
  {:else if app.needsBackup}
    <div class="banner info">
      <Info size={20} />
      <p>{app.canLinkFiles ? t('banner.backupLink') : t('banner.backup')}</p>
      <div class="row wrap">
        {#if app.canLinkFiles}
          <button class="btn small primary" onclick={() => app.linkNewFile()}><Save size={16} />{t('file.saveAs')}</button>
        {:else}
          {#if canShare}
            <button class="btn small" onclick={() => app.shareFile()}><Share2 size={16} />{t('file.share')}</button>
          {/if}
          <button class="btn small primary" onclick={() => app.exportFile()}><Download size={16} />{t('file.export')}</button>
        {/if}
      </div>
    </div>
  {/if}
</div>

{#if app.conflict !== null}
  <Dialog title={t('conflict.title')} onclose={() => {}}>
    <p>{t('conflict.text', { name: app.fileName })}</p>
    {#snippet footer()}
      <button class="btn" onclick={() => app.resolveConflict('file')}>{t('conflict.keepFile')}</button>
      <button class="btn primary" onclick={() => app.resolveConflict('app')}>{t('conflict.keepApp')}</button>
    {/snippet}
  </Dialog>
{/if}

<style>
  .banners {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .banners:not(:empty) {
    margin-bottom: 1rem;
  }

  .banner {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem 0.75rem;
    padding: 0.75rem 1rem;
    border-radius: var(--radius-sm);
    border: 1px solid transparent;
  }

  .banner p {
    flex: 1 1 220px;
    font-size: 0.9rem;
  }

  .banner.info {
    background: var(--info-soft);
    color: var(--info);
    border-color: color-mix(in srgb, var(--info) 25%, transparent);
  }

  .banner.warn {
    background: var(--warn-soft);
    color: var(--warn);
    border-color: color-mix(in srgb, var(--warn) 25%, transparent);
  }

  .banner.danger {
    background: var(--danger-soft);
    color: var(--danger);
    border-color: color-mix(in srgb, var(--danger) 25%, transparent);
  }

  .banner p,
  .banner .btn:not(.primary) {
    color: var(--text);
  }
</style>
