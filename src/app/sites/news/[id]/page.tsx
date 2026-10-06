"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Icon } from "@/components/Icon";
import { SiteImage } from "@/components/site/SiteImage";
import { ARTICLES, articleById } from "@/lib/news-data";
import css from "../news.module.css";

/** Article page: gives the sample feed real in-page navigation for the back / forward buttons. */
export default function ArticlePage() {
  const { id } = useParams<{ id: string }>();
  const article = articleById(Number(id));

  if (!article) {
    return (
      <div className={css.missing}>
        記事が見つかりませんでした。
        <br />
        <Link href="/sites/news">トップニュースへ戻る</Link>
      </div>
    );
  }

  const index = ARTICLES.indexOf(article);
  const related = [1, 2, 3].map((step) => ARTICLES[(index + step) % ARTICLES.length]);

  return (
    <div className={css.page}>
      <header className={css.articleHeader}>
        <Link href="/sites/news" className={css.backLink}>
          <Icon name="back" size={20} stroke={2.2} />
          トップ
        </Link>
        <span className={css.brand}>
          DEMO<b>ニュース</b>
        </span>
      </header>

      <SiteImage scene={article.scene} w={360} h={202} fluid alt={article.title} bytes={article.bytes} />

      <div className={css.articleBody}>
        <span className={css.category}>{article.category}</span>
        <h1>{article.title}</h1>
        <p className={css.byline}>
          {article.source}・{article.time}
        </p>

        <p className={css.para}>{article.body[0]}</p>
        <figure className={css.figure}>
          <SiteImage
            scene={related[0].scene}
            w={328}
            h={164}
            fluid
            radius={12}
            alt="関連する写真"
            bytes={96_000}
          />
          <figcaption>写真はイメージです</figcaption>
        </figure>
        {article.body.slice(1).map((text) => (
          <p key={text} className={css.para}>
            {text}
          </p>
        ))}

        <h2 className={css.related}>関連記事</h2>
        {related.map((item) => (
          <article key={item.id} className={css.item}>
            <Link href={`/sites/news/${item.id}`}>
              <div className={css.itemText}>
                <p className={css.source}>
                  <i />
                  {item.source}
                </p>
                <h2>{item.title}</h2>
                <span className={css.time}>{item.time}</span>
              </div>
              <SiteImage
                scene={item.scene}
                w={84}
                h={84}
                radius={12}
                alt={`${item.category}の写真`}
                bytes={Math.round(item.bytes * 0.35)}
              />
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
