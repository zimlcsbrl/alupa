'use client';

import { useState } from 'react';

export function CopyButton({ texto }: { texto: string }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <button
      type="button"
      className="copy-button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(texto);
          setCopiado(true);
          setTimeout(() => setCopiado(false), 2000);
        } catch {
          setCopiado(false);
        }
      }}
    >
      <span aria-live="polite">{copiado ? 'Copiado' : 'Copiar'}</span>
    </button>
  );
}
