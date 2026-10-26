import { useState } from 'react';
import { isIOS, useInstall } from '../install';

export function InstallButton() {
  const { installed, canPrompt, install } = useInstall();
  const [help, setHelp] = useState(false);

  if (installed) return null;

  if (canPrompt) {
    return (
      <button className="install-btn" onClick={() => install()}>
        <span aria-hidden>📲</span>
        <span>
          <strong>App installeren</strong>
          <small>Zet Media VV Elspeet op je beginscherm</small>
        </span>
      </button>
    );
  }

  // Geen installatievenster beschikbaar (iPhone, of browser zonder ondersteuning): uitleg tonen.
  return (
    <div className="install-help">
      <button className="install-btn install-btn-ghost" onClick={() => setHelp((v) => !v)} aria-expanded={help}>
        <span aria-hidden>📲</span>
        <span>
          <strong>App installeren</strong>
          <small>{help ? 'Zo werkt het:' : 'Tik hier voor uitleg'}</small>
        </span>
      </button>
      {help && (
        <div className="install-steps">
          {isIOS() ? (
            <ol>
              <li>
                Open deze pagina in <b>Safari</b>.
              </li>
              <li>
                Tik onderin op <b>Deel</b> (vierkantje met pijl omhoog).
              </li>
              <li>
                Kies <b>Zet op beginscherm</b> en tik op <b>Voeg toe</b>.
              </li>
            </ol>
          ) : (
            <ol>
              <li>
                Open deze pagina in <b>Chrome</b> of <b>Samsung Internet</b> (niet via een link in WhatsApp of
                e-mail).
              </li>
              <li>
                Chrome: tik rechtsboven op <b>⋮</b> en kies <b>App installeren</b> of{' '}
                <b>Toevoegen aan startscherm</b>.
              </li>
              <li>
                Samsung Internet: tik onderin op <b>☰</b> en kies <b>Pagina toevoegen aan → Startscherm</b>.
              </li>
            </ol>
          )}
        </div>
      )}
    </div>
  );
}
