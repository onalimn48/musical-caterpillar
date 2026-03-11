import { useEffect, useMemo, useState } from 'react';

function isStandaloneMode() {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

function detectPlatform() {
  if (typeof navigator === 'undefined') {
    return { isIos: false, isSafari: false };
  }

  const ua = navigator.userAgent;
  const isIos = /iPhone|iPad|iPod/.test(ua);
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
  return { isIos, isSafari };
}

export default function InstallAppCard() {
  const [{ deferredPrompt, installed, showIosHelp }, setState] = useState({
    deferredPrompt: null,
    installed: isStandaloneMode(),
    showIosHelp: false,
  });
  const { isIos, isSafari } = useMemo(detectPlatform, []);

  useEffect(() => {
    function onBeforeInstallPrompt(event) {
      event.preventDefault();
      setState((current) => ({ ...current, deferredPrompt: event }));
    }

    function onInstalled() {
      setState({ deferredPrompt: null, installed: true, showIosHelp: false });
    }

    function onDisplayModeChange() {
      if (isStandaloneMode()) {
        setState({ deferredPrompt: null, installed: true, showIosHelp: false });
      }
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onInstalled);
    window.matchMedia('(display-mode: standalone)').addEventListener('change', onDisplayModeChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onInstalled);
      window.matchMedia('(display-mode: standalone)').removeEventListener('change', onDisplayModeChange);
    };
  }, []);

  async function handleInstall() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice.catch(() => {});
      setState((current) => ({ ...current, deferredPrompt: null }));
      return;
    }

    if (isIos && isSafari) {
      setState((current) => ({ ...current, showIosHelp: true }));
      return;
    }

    setState((current) => ({ ...current, showIosHelp: true }));
  }

  if (installed) {
    return (
      <div style={{
        marginTop: 26,
        padding: '16px 18px',
        borderRadius: 18,
        background: 'linear-gradient(135deg,rgba(74,222,128,.18),rgba(34,211,238,.08))',
        border: '1px solid rgba(74,222,128,.32)',
        color: '#dcfce7',
        textAlign: 'center',
      }}>
        <div style={{ fontFamily: "'Fredoka',sans-serif", fontSize: 20, marginBottom: 6 }}>Installed</div>
        <div style={{ fontSize: 14, lineHeight: 1.6, color: '#bbf7d0' }}>
          Musical Caterpillar is already added like an app on this device.
        </div>
      </div>
    );
  }

  return (
    <>
      <div style={{
        marginTop: 26,
        padding: '22px 20px',
        borderRadius: 22,
        background: 'linear-gradient(135deg,rgba(34,211,238,.14),rgba(167,139,250,.12))',
        border: '1px solid rgba(255,255,255,.12)',
        textAlign: 'center',
        boxShadow: '0 18px 40px rgba(15,23,42,.18)',
      }}>
        <div style={{ fontSize: 34, marginBottom: 8 }}>📲</div>
        <div style={{ fontFamily: "'Fredoka',sans-serif", fontSize: 24, color: '#f8fafc', marginBottom: 8 }}>
          Add Musical Caterpillar
        </div>
        <p style={{ color: '#cbd5e1', fontSize: 14, lineHeight: 1.6, maxWidth: 520, margin: '0 auto 14px' }}>
          Save it to your home screen or desktop so kids can open it like an app.
        </p>
        <button
          type="button"
          onClick={handleInstall}
          style={{
            border: 'none',
            borderRadius: 14,
            padding: '12px 18px',
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
            color: '#082f49',
            background: 'linear-gradient(135deg,#67e8f9,#a5f3fc)',
            boxShadow: '0 10px 28px rgba(103,232,249,.28)',
          }}
        >
          {deferredPrompt ? 'Install App' : 'Add to Home Screen'}
        </button>
      </div>

      {showIosHelp ? (
        <div
          onClick={() => setState((current) => ({ ...current, showIosHelp: false }))}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(2,6,23,.72)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 18,
            zIndex: 50,
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: 'min(100%, 420px)',
              borderRadius: 22,
              padding: '22px 20px',
              background: 'linear-gradient(180deg,#0f172a,#111827)',
              border: '1px solid rgba(255,255,255,.12)',
              boxShadow: '0 24px 60px rgba(0,0,0,.35)',
              color: '#e2e8f0',
            }}
          >
            <div style={{ fontFamily: "'Fredoka',sans-serif", fontSize: 24, color: '#f8fafc', marginBottom: 10 }}>
              Add It Like an App
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: '#cbd5e1', margin: '0 0 14px' }}>
              {isIos && isSafari
                ? 'In Safari, tap Share, then choose Add to Home Screen.'
                : 'Open your browser menu and look for Install App or Add to Home Screen.'}
            </p>
            <div style={{
              borderRadius: 16,
              padding: '14px 16px',
              background: 'rgba(255,255,255,.05)',
              border: '1px solid rgba(255,255,255,.08)',
              fontSize: 14,
              lineHeight: 1.7,
              color: '#e2e8f0',
            }}>
              <div>1. Open the browser share or menu button.</div>
              <div>2. Choose <strong>{isIos && isSafari ? 'Add to Home Screen' : 'Install App'}</strong>.</div>
              <div>3. Confirm to place Musical Caterpillar on the device.</div>
            </div>
            <button
              type="button"
              onClick={() => setState((current) => ({ ...current, showIosHelp: false }))}
              style={{
                marginTop: 16,
                width: '100%',
                border: 'none',
                borderRadius: 14,
                padding: '12px 16px',
                fontWeight: 700,
                fontSize: 15,
                cursor: 'pointer',
                color: '#082f49',
                background: 'linear-gradient(135deg,#fde68a,#fcd34d)',
              }}
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
