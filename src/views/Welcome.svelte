<script lang="ts">
  import FolderOpen from '@lucide/svelte/icons/folder-open';
  import Minus from '@lucide/svelte/icons/minus';
  import Plus from '@lucide/svelte/icons/plus';
  import ShieldCheck from '@lucide/svelte/icons/shield-check';
  import Sparkles from '@lucide/svelte/icons/sparkles';
  import WifiOff from '@lucide/svelte/icons/wifi-off';
  import FileText from '@lucide/svelte/icons/file-text';
  import { app } from '../lib/app.svelte';
  import { i18n, t, type LangPreference } from '../lib/i18n/index.svelte';
  import Logo from '../lib/ui/Logo.svelte';

  let people = $state(2);
</script>

<div class="welcome">
  <div class="hero">
    <span class="logo"><Logo size={72} /></span>
    <h1>Survival Shelf</h1>
    <p class="tagline">{t('welcome.tagline')}</p>
    <ul class="perks">
      <li><WifiOff size={18} />{t('welcome.offline')}</li>
      <li><FileText size={18} />{t('welcome.file')}</li>
      <li><ShieldCheck size={18} />{t('welcome.private')}</li>
    </ul>
  </div>

  <div class="choices">
    <section class="card choice main">
      <h2>{t('welcome.newTitle')}</h2>
      <p class="muted small">{t('welcome.newText')}</p>
      <div class="people">
        <span>{t('settings.people')}</span>
        <div class="stepper">
          <button class="icon-btn outlined" onclick={() => (people = Math.max(1, people - 1))} aria-label="−1"><Minus size={18} /></button>
          <strong class="num" aria-live="polite">{people}</strong>
          <button class="icon-btn outlined" onclick={() => (people = Math.min(50, people + 1))} aria-label="+1"><Plus size={18} /></button>
        </div>
      </div>
      <button class="btn primary" onclick={() => app.startNew(people)}>{t('welcome.start')}</button>
    </section>

    <section class="card choice">
      <h2>{t('welcome.openTitle')}</h2>
      <p class="muted small">{app.canLinkFiles ? t('welcome.openText') : t('welcome.importText')}</p>
      <button class="btn" onclick={() => app.openFile()}><FolderOpen size={18} />{t('file.open')}</button>
    </section>

    <section class="card choice">
      <h2>{t('welcome.demoTitle')}</h2>
      <p class="muted small">{t('welcome.demoText')}</p>
      <button class="btn" onclick={() => app.startDemo()}><Sparkles size={18} />{t('welcome.demo')}</button>
    </section>
  </div>

  <label class="lang">
    <span class="visually-hidden">{t('settings.language')}</span>
    <select
      value={i18n.preference}
      onchange={(event) => i18n.setPreference((event.currentTarget as HTMLSelectElement).value as LangPreference)}
    >
      <option value="auto">🌐 {t('settings.auto')}</option>
      <option value="en">English</option>
      <option value="fr">Français</option>
    </select>
  </label>
</div>

<style>
  .welcome {
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2rem;
    padding: max(2rem, env(safe-area-inset-top)) 1rem calc(2rem + var(--safe-bottom));
    background:
      radial-gradient(90% 60% at 50% 0%, color-mix(in srgb, var(--primary) 16%, transparent), transparent 70%),
      var(--bg);
  }

  .hero {
    text-align: center;
    max-width: 560px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
  }

  .logo {
    display: inline-flex;
    border-radius: 18px;
    box-shadow: 0 10px 30px color-mix(in srgb, var(--primary) 35%, transparent);
  }

  h1 {
    font-size: 2.2rem;
  }

  .tagline {
    font-size: 1.1rem;
    color: var(--muted);
  }

  .perks {
    list-style: none;
    margin: 0.5rem 0 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.5rem 1.25rem;
    font-size: 0.9rem;
    font-weight: 600;
  }

  .perks li {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    color: var(--primary);
  }

  .choices {
    width: 100%;
    max-width: 900px;
    display: grid;
    gap: 1rem;
  }

  @media (min-width: 800px) {
    .choices {
      grid-template-columns: 1.3fr 1fr 1fr;
    }
  }

  .choice {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .choice .btn {
    margin-top: auto;
  }

  .choice.main {
    border-color: color-mix(in srgb, var(--primary) 40%, var(--border));
  }

  .people {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    font-weight: 600;
  }

  .stepper {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .stepper strong {
    min-width: 2ch;
    text-align: center;
    font-size: 1.25rem;
  }

  .lang select {
    border: 1px solid var(--border);
    background: var(--surface);
    border-radius: 999px;
    padding: 0.4rem 0.8rem;
  }
</style>
