"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { useSite } from "@/components/site/SiteRoot";
import { profilePalette } from "@/lib/color";
import { pad2 } from "@/lib/format";
import { EXTERNAL_EXAMPLES } from "@/lib/urls";
import css from "./start.module.css";

const TILES = [
  { href: "/sites/news", icon: "image", label: "デモニュース", desc: "画像の多いページ", tint: "#e8f0ff", ink: "#1d4ed8" },
  { href: "/sites/login", icon: "lock", label: "会員ログイン", desc: "Cookie の分離", tint: "#e7f7ee", ink: "#15803d" },
  { href: "/sites/grid", icon: "crosshair", label: "座標テスト", desc: "タップ位置の確認", tint: "#fff3d9", ink: "#b45309" },
];

/** Home page of the demo browser: session summary, address box and shortcuts. */
export default function StartPage() {
  const { env, navigate } = useSite();
  const [text, setText] = useState("");
  // The shell sends free-text address-bar input here as ?q=…
  const [query] = useState(() => new URLSearchParams(window.location.search).get("q") ?? "");

  const cookies = Object.values(env.jar).reduce((n, host) => n + Object.keys(host).length, 0);
  const palette = env.profileHue != null ? profilePalette(env.profileHue) : null;
  const external = EXTERNAL_EXAMPLES[0];

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (text.trim()) navigate(text);
  };

  return (
    <main className={css.page}>
      <header className={css.header}>
        <span className={css.logo}>
          <Icon name="crosshair" size={16} stroke={2.2} />
        </span>
        <strong>FixView スタート</strong>
      </header>

      <section
        className={css.session}
        style={palette ? { background: palette.bg, color: palette.on } : undefined}
        aria-label="現在のセッション"
      >
        <span className={css.sessionBadge}>{env.profileSlot != null ? pad2(env.profileSlot) : <Icon name="globe" size={20} />}</span>
        <div>
          <strong>{env.profileSlot != null ? env.profileName : env.embedded ? "通常ブラウザモード" : "単体表示"}</strong>
          <span>
            {env.profileSlot != null ? `プロファイル ${pad2(env.profileSlot)}・` : ""}
            保存中の Cookie {cookies} 件
          </span>
        </div>
      </section>

      <form className={css.search} onSubmit={submit}>
        <Icon name="search" size={18} />
        <input
          type="text"
          inputMode="url"
          enterKeyHint="go"
          value={text}
          placeholder="URL を入力"
          aria-label="URL を入力"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          onChange={(e) => setText(e.target.value)}
        />
        <button type="submit" aria-label="移動">
          <Icon name="forward" size={18} stroke={2.4} />
        </button>
      </form>
      {query && (
        <p className={css.notice}>
          「{query}」— キーワード検索は Web デモでは省略しています。URL を入力するか、下のショートカットをお試しください。
        </p>
      )}

      <h2 className={css.heading}>ショートカット</h2>
      <div className={css.tiles}>
        {TILES.map((tile) => (
          <Link key={tile.href} href={tile.href} className={css.tile}>
            <span className={css.tileIcon} style={{ background: tile.tint, color: tile.ink }}>
              <Icon name={tile.icon} size={20} />
            </span>
            <strong>{tile.label}</strong>
            <small>{tile.desc}</small>
          </Link>
        ))}
        <button type="button" className={css.tile} onClick={() => navigate(external.url)}>
          <span className={css.tileIcon} style={{ background: "#f1e9ff", color: "#7c3aed" }}>
            <Icon name="external" size={20} />
          </span>
          <strong>Wikipedia</strong>
          <small>外部サイトの例</small>
        </button>
      </div>

      <p className={css.foot}>
        このページを含む demo:// のページはアプリ内蔵のサンプルです。表示エリアの大きさは、どの機種でも設定した値に固定されます。
      </p>
    </main>
  );
}
