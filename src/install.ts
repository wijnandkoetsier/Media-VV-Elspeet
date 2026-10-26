import { useEffect, useState } from 'react';

/**
 * Installeren als app. Chrome/Edge/Samsung Internet sturen een `beforeinstallprompt`-event
 * zodra de app installeerbaar is; dat bewaren we zodat een eigen knop het installatievenster kan openen.
 * Safari (iPhone) kent dit niet; daar tonen we uitleg.
 */
interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferred: InstallPromptEvent | null = null;
let installed = false;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((fn) => fn());

/** Zo vroeg mogelijk aanroepen (vóór React), anders kan het event al gemist zijn. */
export function initInstall() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e as InstallPromptEvent;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    installed = true;
    deferred = null;
    notify();
  });
}

export const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

export const isIOS = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export function useInstall() {
  const [, force] = useState(0);
  useEffect(() => {
    const fn = () => force((n) => n + 1);
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);

  return {
    /** Al geïnstalleerd of geopend als app. */
    installed: installed || isStandalone(),
    /** De browser biedt installeren aan: de knop kan direct het venster openen. */
    canPrompt: !!deferred,
    async install(): Promise<boolean> {
      if (!deferred) return false;
      const ev = deferred;
      deferred = null;
      await ev.prompt();
      const { outcome } = await ev.userChoice;
      if (outcome === 'accepted') installed = true;
      notify();
      return outcome === 'accepted';
    },
  };
}
