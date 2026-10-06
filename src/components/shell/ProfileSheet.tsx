"use client";

import { useCallback, useState } from "react";
import { Icon } from "@/components/Icon";
import { Chip } from "@/components/ui/Controls";
import { profilePalette } from "@/lib/color";
import { PROFILE_HUES } from "@/lib/defaults";
import { cx, formatBytes, formatDateTime, pad2 } from "@/lib/format";
import {
  clearSessionData,
  cookieCount,
  deleteProfile,
  openProfile,
  saveProfile,
  sessionKeyOf,
  setGridMode,
  setOverlay,
  toast,
  useApp,
} from "@/lib/store";
import { DEMO_SITES } from "@/lib/urls";
import { Sheet } from "./Sheet";
import css from "./Overlays.module.css";

/** Register a new profile or edit / inspect an existing one. */
export function ProfileSheet({ slot }: { slot: number }) {
  const existing = useApp((s) => s.profiles[slot]);
  const cookies = useApp((s) => cookieCount(s, sessionKeyOf(slot)));
  const cacheBytes = useApp((s) => s.cache[sessionKeyOf(slot)] ?? 0);
  const active = useApp((s) => s.ui.session?.slot === slot);
  const [name, setName] = useState(existing?.name ?? "");
  const [startUrl, setStartUrl] = useState(existing?.startUrl ?? "demo://start");
  const [hue, setHue] = useState(existing?.hue ?? PROFILE_HUES[(slot - 1) % PROFILE_HUES.length]);
  const close = useCallback(() => setOverlay(null), []);

  const label = `プロファイル ${pad2(slot)}`;
  const preview = profilePalette(hue);

  const save = (thenOpen: boolean) => {
    saveProfile({ slot, name, hue, startUrl });
    setGridMode("open");
    close();
    if (thenOpen) openProfile(slot);
    else toast(existing ? `${label} を更新しました` : `${label} を登録しました`, "ok");
  };

  return (
    <Sheet
      title={existing ? `${label} を編集` : `${label} を登録`}
      onClose={close}
      footer={
        <>
          <button type="button" className={css.btn} onClick={() => save(false)}>
            保存
          </button>
          <button type="button" className={cx(css.btn, css.btnPrimary)} onClick={() => save(!active)}>
            {active ? "保存して閉じる" : "保存して開く"}
          </button>
        </>
      }
    >
      <div className={css.profileHero}>
        <span className={css.profileDot} style={{ background: preview.bg, color: preview.on }}>
          {slot}
        </span>
        <div>
          <strong>{name.trim() || label}</strong>
          <span>
            {existing
              ? `Cookie ${cookies}件・キャッシュ ${formatBytes(cacheBytes)}・最終使用 ${formatDateTime(existing.lastUsedAt)}`
              : "Cookie・キャッシュはプロファイルごとに分離されます"}
          </span>
        </div>
      </div>

      <label className={css.field}>
        <span>名前</span>
        <input
          type="text"
          value={name}
          maxLength={20}
          placeholder={`例: アカウント${slot}`}
          autoComplete="off"
          onChange={(e) => setName(e.target.value)}
        />
      </label>

      <label className={css.field}>
        <span>開始URL（切替時に開くページ）</span>
        <input
          type="text"
          inputMode="url"
          value={startUrl}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          autoComplete="off"
          onChange={(e) => setStartUrl(e.target.value)}
        />
      </label>
      <div className={css.chipRow}>
        {DEMO_SITES.map((site) => (
          <Chip key={site.id} active={startUrl === site.url} onClick={() => setStartUrl(site.url)}>
            {site.label}
          </Chip>
        ))}
      </div>

      <div className={css.field}>
        <span>色</span>
        <div className={css.swatches}>
          {PROFILE_HUES.map((h) => (
            <button
              key={h}
              type="button"
              className={cx(css.swatch, h === hue && css.swatchOn)}
              style={{ background: profilePalette(h).bg }}
              aria-label={`色 ${h}`}
              aria-pressed={h === hue}
              onClick={() => setHue(h)}
            />
          ))}
        </div>
      </div>

      {existing && (
        <div className={css.dangerRow}>
          <button
            type="button"
            className={css.btnGhost}
            onClick={() => {
              clearSessionData(sessionKeyOf(slot));
              toast(`${label} の Cookie・キャッシュを消去しました`, "ok");
            }}
          >
            <Icon name="reset" size={16} />
            Cookie・キャッシュを消去
          </button>
          <button
            type="button"
            className={cx(css.btnGhost, css.btnGhostDanger)}
            onClick={() => {
              close();
              deleteProfile(slot);
              toast(`${label} を削除しました`, "ok");
            }}
          >
            <Icon name="trash" size={16} />
            登録を削除
          </button>
        </div>
      )}
    </Sheet>
  );
}
