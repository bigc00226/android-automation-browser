"use client";

import { useEffect, type CSSProperties } from "react";
import { Icon } from "@/components/Icon";
import { cx } from "@/lib/format";
import { useSite } from "./SiteRoot";
import css from "./site.module.css";

/**
 * Image of a demo page. With "画像非表示" on, the picture is never requested;
 * a box with exactly the same footprint takes its place, so the layout (and
 * every tap coordinate below it) stays where it was.
 */
export function SiteImage({
  scene,
  w,
  h,
  alt,
  bytes,
  fluid,
  radius = 0,
  className,
}: {
  /** Name of the generated illustration (see /sites/img/[name]). */
  scene: string;
  w: number;
  h: number;
  alt: string;
  /** Nominal download size of the photo this illustration stands in for. */
  bytes: number;
  /** Stretch to the container width, keeping the aspect ratio. */
  fluid?: boolean;
  radius?: number;
  className?: string;
}) {
  const { env, registerImage } = useSite();
  useEffect(() => registerImage(bytes), [registerImage, bytes]);

  const style: CSSProperties = fluid
    ? { width: "100%", height: "auto", aspectRatio: `${w} / ${h}`, borderRadius: radius }
    : { width: w, height: h, borderRadius: radius };

  if (env.hideImages) {
    return (
      <span className={cx(css.placeholder, className)} style={style} role="img" aria-label={`${alt}（非表示）`}>
        <Icon name="imageOff" size={Math.min(26, Math.round(h * 0.34))} stroke={1.7} />
        {h >= 110 && (
          <small>
            画像非表示 {w}×{h}
          </small>
        )}
      </span>
    );
  }
  return (
    // Plain <img> on purpose: the point of this component is the raw image request.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={cx(css.image, className)}
      style={style}
      src={`/sites/img/${scene}?w=${w * 2}&h=${h * 2}`}
      width={w}
      height={h}
      alt={alt}
      decoding="async"
    />
  );
}
