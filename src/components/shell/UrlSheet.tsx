"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { navigate, setOverlay, useApp } from "@/lib/store";
import { DEMO_SITES, EXTERNAL_EXAMPLES, displayUrl } from "@/lib/urls";
import { Sheet } from "./Sheet";
import css from "./Overlays.module.css";

/**
 * Address entry. It opens as a full-size sheet instead of editing inside the
 * fixed canvas, where the text can be very small on high-density screens.
 */
export function UrlSheet() {
  const session = useApp((s) => s.ui.session);
  const [text, setText] = useState(() => (session ? session.entries[session.index].url : ""));
  const inputRef = useRef<HTMLInputElement>(null);
  const close = useCallback(() => setOverlay(null), []);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const current = session?.entries[session.index].url;
  const recent = session
    ? [...new Set(session.entries.map((e) => e.url).reverse())].filter((url) => url !== current).slice(0, 5)
    : [];

  return (
    <Sheet title="アドレスを入力" onClose={close}>
      <form
        className={css.urlForm}
        onSubmit={(e) => {
          e.preventDefault();
          navigate(text);
        }}
      >
        <Icon name="search" size={18} />
        <input
          ref={inputRef}
          type="text"
          inputMode="url"
          enterKeyHint="go"
          value={text}
          placeholder="URL を入力（例: demo://news）"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          autoComplete="off"
          aria-label="アドレス"
          onChange={(e) => setText(e.target.value)}
        />
        {text && (
          <button type="button" className={css.clearBtn} aria-label="消去" onClick={() => setText("")}>
            <Icon name="close" size={14} stroke={2.4} />
          </button>
        )}
        <button type="submit" className={css.goBtn}>
          移動
        </button>
      </form>

      <h3 className={css.listTitle}>デモページ（アプリ内蔵）</h3>
      <ul className={css.linkList}>
        {DEMO_SITES.map((site) => (
          <li key={site.id}>
            <button type="button" onClick={() => navigate(site.url)}>
              <span className={css.linkIcon}>
                <Icon name={site.icon} size={18} />
              </span>
              <span className={css.linkText}>
                <strong>{site.label}</strong>
                <small>{site.desc}</small>
              </span>
              <Icon name="chevronRight" size={16} />
            </button>
          </li>
        ))}
      </ul>

      <h3 className={css.listTitle}>外部サイト</h3>
      <ul className={css.linkList}>
        {EXTERNAL_EXAMPLES.map((site) => (
          <li key={site.url}>
            <button type="button" onClick={() => navigate(site.url)}>
              <span className={css.linkIcon}>
                <Icon name="globe" size={18} />
              </span>
              <span className={css.linkText}>
                <strong>{site.label}</strong>
                <small>{site.desc}</small>
              </span>
              <Icon name="chevronRight" size={16} />
            </button>
          </li>
        ))}
      </ul>
      <p className={css.note}>
        Web デモでは、埋め込み表示を拒否するサイト（Google など）は開けません。Android アプリ本体（WebView）ではこの制限はありません。
      </p>

      {recent.length > 0 && (
        <>
          <h3 className={css.listTitle}>このセッションの履歴</h3>
          <ul className={css.linkList}>
            {recent.map((url) => (
              <li key={url}>
                <button type="button" onClick={() => navigate(url)}>
                  <span className={css.linkIcon}>
                    <Icon name="reload" size={16} />
                  </span>
                  <span className={css.linkText}>
                    <strong>{displayUrl(url)}</strong>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </Sheet>
  );
}
