"use client";

import type { ReactNode } from "react";
import { Icon } from "@/components/Icon";
import { useEscape } from "@/lib/hooks";
import css from "./Overlays.module.css";

/** Bottom sheet at the device's natural scale (forms are for people, not macros). */
export function Sheet({
  title,
  onClose,
  children,
  footer,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEscape(onClose);
  return (
    <div className={css.sheetScrim} onClick={onClose}>
      <div className={css.sheet} role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className={css.sheetHead}>
          <span className={css.grabber} />
          <h2>{title}</h2>
          <button type="button" className={css.roundBtn} aria-label="閉じる" onClick={onClose}>
            <Icon name="close" size={18} stroke={2.2} />
          </button>
        </div>
        <div className={css.sheetBody}>{children}</div>
        {footer && <div className={css.sheetFoot}>{footer}</div>}
      </div>
    </div>
  );
}
