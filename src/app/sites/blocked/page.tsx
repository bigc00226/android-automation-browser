"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import { useSite } from "@/components/site/SiteRoot";
import css from "./blocked.module.css";

const REASONS: Record<string, string> = {
  xfo: "このサイトは、他のページへの埋め込み表示を許可していません（X-Frame-Options）。",
  csp: "このサイトは、他のページへの埋め込み表示を許可していません（Content-Security-Policy）。",
  refused: "このサイトは、他のページへの埋め込み表示を許可していません。",
  mixed: "https で公開されたデモの中に、http のサイトは表示できません。",
  network: "サイトに接続できませんでした。URL をご確認ください。",
  redirects: "リダイレクトが多く、ページを確認できませんでした。",
  invalid: "URL の形式が正しくありません。",
  private: "ローカルネットワーク内のアドレスは、Web デモからは開けません。",
  self: "デモ自身のページは、表示エリアの中には開けません。",
};
const FRAMING = ["xfo", "csp", "refused"];

/**
 * Shown instead of an external site that cannot be embedded. The restriction
 * only exists because this demo shows pages in an iframe.
 */
export default function BlockedPage() {
  const { navigate } = useSite();
  const [params] = useState(() => new URLSearchParams(window.location.search));
  const url = params.get("url") ?? "";
  const reason = params.get("reason") ?? "refused";
  const framing = FRAMING.includes(reason);
  const openable = /^https?:\/\//i.test(url);

  return (
    <main className={css.page}>
      <span className={css.icon}>
        <Icon name={framing ? "lock" : "alert"} size={28} />
      </span>
      <h1>{framing ? "Web デモでは表示できないサイトです" : "ページを開けませんでした"}</h1>
      {url && <p className={css.url}>{url}</p>}
      <p className={css.text}>{REASONS[reason] ?? REASONS.refused}</p>
      {framing && (
        <p className={css.note}>
          これはブラウザ上で動かしている Web デモ（iframe 表示）だけの制約です。Android アプリ本体は WebView
          でページを直接表示するため、この制限を受けません。
        </p>
      )}
      <div className={css.actions}>
        {openable && (
          <a className={css.primary} href={url} target="_blank" rel="noopener noreferrer">
            新しいタブで開く
            <Icon name="external" size={16} />
          </a>
        )}
        <button type="button" className={css.secondary} onClick={() => navigate("demo://start")}>
          スタートページへ
        </button>
      </div>
    </main>
  );
}
