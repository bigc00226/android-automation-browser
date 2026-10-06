"use client";

import { useCallback, type ReactNode } from "react";
import { NORMAL_KEY } from "@/lib/defaults";
import { cx, pad2 } from "@/lib/format";
import { useEscape } from "@/lib/hooks";
import { clearSessionData, deleteProfile, sessionKeyOf, setDialog, setGridMode, toast, useApp } from "@/lib/store";
import css from "./Canvas.module.css";

interface Action {
  label: string;
  tone?: "primary" | "danger";
  run?: () => void;
}

function Dialog({ title, body, actions }: { title: string; body: ReactNode; actions: Action[] }) {
  const close = useCallback(() => setDialog(null), []);
  useEscape(close);
  return (
    <div className={css.scrim} onClick={close}>
      <div className={css.dialog} role="alertdialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <h2 className={css.dialogTitle}>{title}</h2>
        <p className={css.dialogBody}>{body}</p>
        <div className={css.dialogActions}>
          {actions.map((a) => (
            <button
              key={a.label}
              type="button"
              className={cx(css.dialogBtn, a.tone === "primary" && css.dialogPrimary, a.tone === "danger" && css.dialogDanger)}
              onClick={() => {
                close();
                a.run?.();
              }}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Confirmation dialogs for the reset flows ("リセット → プロファイル番号"). */
export function CanvasDialogs() {
  const dialog = useApp((s) => s.ui.dialog);
  const profiles = useApp((s) => s.profiles);
  if (!dialog) return null;

  if (dialog.type === "reset-normal") {
    return (
      <Dialog
        title="Cookie・キャッシュをリセット"
        body="通常ブラウザモードのログイン状態と閲覧データを消去します。プロファイルのデータには影響しません。"
        actions={[
          {
            label: "リセットする",
            tone: "danger",
            run: () => {
              clearSessionData(NORMAL_KEY);
              toast("Cookie・キャッシュをリセットしました", "ok");
            },
          },
          { label: "キャンセル" },
        ]}
      />
    );
  }

  const profile = profiles[dialog.slot];
  if (!profile) return null;
  const label = `プロファイル ${pad2(profile.slot)}`;
  return (
    <Dialog
      title={`${label}「${profile.name}」をリセット`}
      body="消去する内容を選んでください。"
      actions={[
        {
          label: "Cookie・キャッシュを消去",
          tone: "primary",
          run: () => {
            clearSessionData(sessionKeyOf(profile.slot));
            setGridMode("open");
            toast(`${label} の Cookie・キャッシュを消去しました`, "ok");
          },
        },
        {
          label: "登録ごと削除",
          tone: "danger",
          run: () => {
            deleteProfile(profile.slot);
            setGridMode("open");
            toast(`${label} を削除しました`, "ok");
          },
        },
        { label: "キャンセル" },
      ]}
    />
  );
}
