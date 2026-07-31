'use client';

import { useEffect, useState } from 'react';

// Lipila redirects the card-checkout popup here (backUrl) after the payment
// flow ends. This page is intentionally standalone — it must NOT load the
// full app inside the little popup window. It tells the main window to refresh
// and then closes itself.
export default function PaymentReturnPage() {
  const [autoCloseFailed, setAutoCloseFailed] = useState(false);

  useEffect(() => {
    // Nudge the window that opened this popup to re-check the payment status.
    try {
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage({ type: 'chilimba:payment-return' }, '*');
      }
    } catch {
      /* cross-origin opener — ignore */
    }

    // Windows opened via window.open() are allowed to close themselves.
    const t = setTimeout(() => {
      window.close();
      // If we're still here a moment later, the browser blocked the close.
      setTimeout(() => setAutoCloseFailed(true), 400);
    }, 1200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: '12px',
      fontFamily: 'system-ui, sans-serif', textAlign: 'center', padding: '24px',
      color: '#0f172a',
    }}>
      <div style={{ fontSize: '40px' }}>🌀</div>
      <h1 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Returning to Chilimba…</h1>
      <p style={{ fontSize: '14px', color: '#64748b', margin: 0, maxWidth: '320px' }}>
        Your payment is being processed. Your wallet will update automatically once it&apos;s confirmed.
      </p>
      {autoCloseFailed && (
        <button
          onClick={() => window.close()}
          style={{
            marginTop: '8px', padding: '10px 20px', borderRadius: '8px',
            border: 'none', background: '#0d9488', color: '#fff',
            fontSize: '14px', fontWeight: 600, cursor: 'pointer',
          }}
        >
          Close this window
        </button>
      )}
    </div>
  );
}
