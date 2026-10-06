"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Icon } from "@/components/Icon";
import { useCookie, useSite } from "@/components/site/SiteRoot";
import { formatDateTime, pad2 } from "@/lib/format";
import css from "./login.module.css";

const HOST = "demo-members";
type Check = "idle" | "checking" | "ok";

/**
 * Fictional member site. The login is kept in the cookie jar of the active
 * profile, which makes the separation between profiles visible: log in under
 * one profile, switch to another, and the page is logged out again.
 */
export default function LoginPage() {
  const [session, setSession] = useCookie(HOST, "session");
  const [loginAt, setLoginAt] = useCookie(HOST, "login_at");

  if (session) {
    return (
      <MyPage
        email={session}
        loginAt={Number(loginAt) || null}
        onLogout={() => {
          setSession(null);
          setLoginAt(null);
        }}
      />
    );
  }
  return (
    <LoginForm
      onLogin={(email) => {
        setSession(email);
        setLoginAt(String(Date.now()));
      }}
    />
  );
}

function LoginForm({ onLogin }: { onLogin: (email: string) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [check, setCheck] = useState<Check>("idle");
  const [error, setError] = useState("");
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const verify = () => {
    if (check !== "idle") return;
    setCheck("checking");
    setError("");
    timer.current = window.setTimeout(() => setCheck("ok"), 900);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+$/.test(email.trim())) return setError("メールアドレスを入力してください");
    if (!password) return setError("パスワードを入力してください");
    if (check !== "ok") return setError("ロボット検証を完了してください");
    onLogin(email.trim());
  };

  return (
    <main className={css.page}>
      <h1 className={css.brand}>サンプル会員</h1>
      <p className={css.sub}>マイページログイン</p>

      <form className={css.form} onSubmit={submit} noValidate>
        <input
          className={css.input}
          type="email"
          inputMode="email"
          placeholder="メールアドレス"
          aria-label="メールアドレス"
          autoComplete="off"
          autoCapitalize="none"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <div className={css.passwordBox}>
          <input
            className={css.input}
            type={showPassword ? "text" : "password"}
            placeholder="パスワード"
            aria-label="パスワード"
            autoComplete="off"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            aria-label={showPassword ? "パスワードを隠す" : "パスワードを表示"}
            onClick={() => setShowPassword((v) => !v)}
          >
            <Icon name={showPassword ? "eye" : "eyeOff"} size={20} />
          </button>
        </div>
        <span className={css.forgot}>パスワードをお忘れですか？</span>

        {/* Generic stand-in for a third-party bot check; it verifies nothing. */}
        <button type="button" className={css.verify} data-state={check} aria-pressed={check === "ok"} onClick={verify}>
          <span className={css.verifyBox}>
            {check === "checking" && <span className={css.spinner} />}
            {check === "ok" && <Icon name="check" size={18} stroke={3} />}
          </span>
          <span className={css.verifyText}>
            {check === "ok" ? "確認しました" : check === "checking" ? "確認しています…" : "私はロボットではありません"}
          </span>
          <span className={css.verifyBrand}>
            <b>DEMO</b>
            模擬ウィジェット
          </span>
        </button>

        {error && (
          <p className={css.error} role="alert">
            {error}
          </p>
        )}
        <button type="submit" className={css.submit}>
          ログイン
        </button>
        <p className={css.hint}>デモ：任意のメールアドレスとパスワードでログインできます。</p>
      </form>

      <button type="button" className={css.outline}>
        新規登録（無料）
      </button>
      <button type="button" className={css.outline}>
        ログインせずに利用する
      </button>

      <p className={css.legal}>
        サービス利用規約　／　プライバシーポリシー
        <br />
        ※ 架空のサイトです。検証ウィジェットは模擬表示で、実際のボット検証の通過可否は Android 実機で確認します。
      </p>
    </main>
  );
}

function pointsFor(email: string): number {
  let hash = 0;
  for (const ch of email) hash = (hash * 31 + ch.charCodeAt(0)) % 9000;
  return 500 + hash;
}

function MyPage({ email, loginAt, onLogout }: { email: string; loginAt: number | null; onLogout: () => void }) {
  const { env } = useSite();
  const owner =
    env.profileSlot != null
      ? `プロファイル ${pad2(env.profileSlot)}「${env.profileName}」`
      : env.embedded
        ? "通常ブラウザモード"
        : "このタブ";

  return (
    <main className={css.page}>
      <h1 className={css.brand}>サンプル会員</h1>
      <p className={css.sub}>マイページ</p>

      <section className={css.welcome}>
        <span className={css.avatar}>
          <Icon name="user" size={24} />
        </span>
        <div>
          <small>ログイン中</small>
          <strong>{email}</strong>
        </div>
      </section>

      <div className={css.stats}>
        <div>
          <small>保有ポイント</small>
          <strong>
            {pointsFor(email).toLocaleString("ja-JP")}
            <i>pt</i>
          </strong>
        </div>
        <div>
          <small>最終ログイン</small>
          <strong className={css.statSmall}>{formatDateTime(loginAt)}</strong>
        </div>
      </div>

      <p className={css.sessionNote}>
        <Icon name="info" size={16} />
        <span>
          このログイン状態は {owner} の Cookie に保存されています。別のプロファイルに切り替えると、未ログインの状態で表示されます。
        </span>
      </p>

      <button type="button" className={css.outline} onClick={onLogout}>
        ログアウト
      </button>
    </main>
  );
}
