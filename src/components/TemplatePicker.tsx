import { theme } from '../theme';
import { templates } from '../templates';
import { InstallButton } from './InstallButton';

export function TemplatePicker({ onPick }: { onPick: (id: string) => void }) {
  return (
    <div className="page">
      <header className="home-head">
        <img src={import.meta.env.BASE_URL + theme.logoUrl} alt="" className="home-logo" />
        <div>
          <h1>Media VV Elspeet</h1>
          <p>Kies een template om te beginnen</p>
        </div>
      </header>
      <InstallButton />
      <main className="grid">
        {templates.map((t) => (
          <button key={t.id} className="tile" onClick={() => onPick(t.id)}>
            <span className="tile-emoji" aria-hidden>
              {t.emoji}
            </span>
            <span className="tile-name">{t.name}</span>
            <span className="tile-desc">{t.description}</span>
          </button>
        ))}
      </main>
      <button className="gallery-link" onClick={() => onPick('galerij')}>
        <span aria-hidden>🖼️</span>
        <span>
          <strong>Galerij</strong>
          <small>Alle geüploade foto's en logo's bekijken, toevoegen of opruimen</small>
        </span>
        <span aria-hidden>→</span>
      </button>
    </div>
  );
}
