// Confirmación global con modal (reemplaza window.confirm).
// Uso: const confirm = useConfirm();  if (!(await confirm({ message: "…" }))) return;
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

import Icon from "./Icon";

export interface ConfirmOpts {
  title?: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
}

type ConfirmFn = (opts: ConfirmOpts) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn>(async () => false);

export function useConfirm(): ConfirmFn {
  return useContext(ConfirmContext);
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [opts, setOpts] = useState<ConfirmOpts | null>(null);
  const resolver = useRef<((v: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((o) => {
    setOpts(o);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  function close(result: boolean) {
    setOpts(null);
    resolver.current?.(result);
    resolver.current = null;
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {opts && (
        <div className="overlay" onClick={() => close(false)}>
          <div className="sheet" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
            <div className="sheet__head spread">
              <span className="display" style={{ fontSize: 17 }}>{opts.title ?? "Confirmar"}</span>
              <button type="button" className="iconbtn iconbtn--xs" onClick={() => close(false)} aria-label="Cerrar">
                <Icon name="x" size={16} />
              </button>
            </div>
            <div className="sheet__body">
              <p style={{ fontSize: 14, margin: 0, lineHeight: 1.5 }}>{opts.message}</p>
            </div>
            <div className="sheet__foot spread">
              <button type="button" className="btn btn--ghost" onClick={() => close(false)}>Cancelar</button>
              <button
                type="button"
                className={"btn " + (opts.danger ? "btn--danger" : "btn--primary")}
                onClick={() => close(true)}
                autoFocus
              >
                {opts.confirmLabel ?? "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
