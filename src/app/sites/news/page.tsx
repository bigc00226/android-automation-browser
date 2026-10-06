"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { SiteImage } from "@/components/site/SiteImage";
import { useCookie, useSite } from "@/components/site/SiteRoot";
import { cx } from "@/lib/format";
import { ARTICLES } from "@/lib/news-data";
import css from "./news.module.css";

const NEWS_HOST = "demo-news";
const TABS = ["おすすめ", "ヘッドライン", "ローカル", "日本", "世界", "ビジネス"];

/** Image-heavy news feed: the sample for "画像非表示" and for per-profile cookies (consent banner). */
export default function NewsPage() {
  const { env } = useSite();
  const [consent, setConsent] = useCookie(NEWS_HOST, "consent");
  const [visits, setVisits] = useCookie(NEWS_HOST, "visits");
  const counted = useRef(false);

  useEffect(() => {
    if (counted.current) return;
    counted.current = true;
    setVisits(String((Number(visits) || 0) + 1));
  }, [visits, setVisits]);

  const [top, ...rest] = ARTICLES;

  return (
    <div className={css.page}>
      <header className={css.header}>
        <button type="button" className={css.iconBtn} aria-label="メニュー">
          <Icon name="menu" size={22} />
        </button>
        <span className={css.brand}>
          DEMO<b>ニュース</b>
        </span>
        <button type="button" className={css.iconBtn} aria-label="検索">
          <Icon name="search" size={20} />
        </button>
        <span className={css.avatar}>{env.profileSlot ?? "G"}</span>
      </header>

      <nav className={css.tabs} aria-label="カテゴリ">
        {TABS.map((tab, i) => (
          <span key={tab} className={cx(css.tab, i === 0 && css.tabOn)}>
            {tab}
          </span>
        ))}
      </nav>

      <h1 className={css.sectionTitle}>
        トップニュース
        <Icon name="chevronRight" size={18} stroke={2.4} />
      </h1>

      <article className={css.hero}>
        <Link href={`/sites/news/${top.id}`}>
          <SiteImage scene={top.scene} w={328} h={184} fluid radius={14} alt={top.title} bytes={top.bytes} />
          <p className={css.source}>
            <i />
            {top.source}
          </p>
          <h2>{top.title}</h2>
        </Link>
        <div className={css.meta}>
          <span>{top.time}</span>
          <span className={css.more}>
            <Icon name="grid" size={13} stroke={2.2} />
            もっと見る
          </span>
        </div>
      </article>

      {rest.map((article) => (
        <article key={article.id} className={css.item}>
          <Link href={`/sites/news/${article.id}`}>
            <div className={css.itemText}>
              <p className={css.source}>
                <i />
                {article.source}
              </p>
              <h2>{article.title}</h2>
              <span className={css.time}>{article.time}</span>
            </div>
            <SiteImage
              scene={article.scene}
              w={84}
              h={84}
              radius={12}
              alt={`${article.category}の写真`}
              bytes={Math.round(article.bytes * 0.35)}
            />
          </Link>
        </article>
      ))}

      <footer className={css.footer}>
        {env.profileSlot != null ? `プロファイル ${env.profileSlot}` : "このブラウザ"}での閲覧は {visits ?? 1} 回目です。
        <br />
        記事・提供元はすべて架空のサンプルです。
      </footer>

      {!consent && (
        <div className={css.consent} role="dialog" aria-label="Cookie の使用について">
          <p>当サイトは利便性向上のため Cookie を使用します。</p>
          <button type="button" onClick={() => setConsent("1")}>
            同意する
          </button>
        </div>
      )}
    </div>
  );
}
