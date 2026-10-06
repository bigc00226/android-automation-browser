import type { ReactNode } from "react";

/* Inline stroke icons on a 24px grid (no icon library: the demo ships Next.js only). */
const PATHS: Record<string, ReactNode> = {
  back: <path d="M15 5l-7 7 7 7" />,
  forward: <path d="M9 5l7 7-7 7" />,
  reload: (
    <>
      <path d="M20 12a8 8 0 1 1-2.6-5.9" />
      <path d="M20 4.5V9h-4.5" />
    </>
  ),
  close: <path d="M6 6l12 12M18 6L6 18" />,
  lock: (
    <>
      <rect x="5" y="10.5" width="14" height="9.5" rx="2.5" />
      <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.6 2.4 3.9 5.2 3.9 8.5S14.6 18.1 12 20.5c-2.6-2.4-3.9-5.2-3.9-8.5S9.400 5.900 12 3.5z" />
    </>
  ),
  settings: (
    <>
      <path d="M4 7h9M17 7h3M4 12h3M11 12h9M4 17h11M19 17h1" />
      <circle cx="15" cy="7" r="2" />
      <circle cx="9" cy="12" r="2" />
      <circle cx="17" cy="17" r="2" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8.5" r="3.2" />
      <path d="M3 19.5a6 6 0 0 1 12 0" />
      <path d="M15.500 5.600a3.200 3.200 0 0 1 0 5.800M17.500 14.200a6 6 0 0 1 3.500 5.300" />
    </>
  ),
  image: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
      <circle cx="8.700" cy="9.500" r="1.600" />
      <path d="M20.500 15l-4.500-4.500L6 19.500" />
    </>
  ),
  imageOff: (
    <>
      <path d="M8 4.5h10a2.500 2.500 0 0 1 2.500 2.500v10M19.500 19.500H6A2.500 2.500 0 0 1 3.500 17V7c0-.7.300-1.300.700-1.800" />
      <path d="M3.500 3.500l17 17M6 19.500l6.200-6.200" />
    </>
  ),
  trash: (
    <>
      <path d="M4.500 7h15M9.500 7V5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v2M6.500 7l.8 11.200a2 2 0 0 0 2 1.800h5.400a2 2 0 0 0 2-1.800L17.500 7" />
      <path d="M10 11v5M14 11v5" />
    </>
  ),
  edit: (
    <>
      <path d="M4 20l1-4.500L15.500 5a2.100 2.100 0 0 1 3 0l.5.5a2.100 2.100 0 0 1 0 3L8.500 19 4 20z" />
      <path d="M13.500 7l3.500 3.500" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  check: <path d="M5 12.500l4.500 4.500L19 7.500" />,
  chevronRight: <path d="M9.500 6l6 6-6 6" />,
  chevronDown: <path d="M6 9.500l6 6 6-6" />,
  copy: (
    <>
      <rect x="8.500" y="8.500" width="11" height="11" rx="2.500" />
      <path d="M15.500 8.500V7a2.500 2.500 0 0 0-2.500-2.500H7A2.500 2.500 0 0 0 4.500 7v6A2.500 2.500 0 0 0 7 15.500h1.500" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8.500" />
      <path d="M12 11v5.500M12 7.700v.1" />
    </>
  ),
  download: <path d="M12 4v11M7.500 11l4.500 4.500 4.500-4.500M5 19.500h14" />,
  upload: <path d="M12 15.500v-11M7.500 8.500L12 4l4.500 4.500M5 19.500h14" />,
  crosshair: (
    <>
      <circle cx="12" cy="12" r="6.500" />
      <path d="M12 2.500v5M12 16.500v5M2.500 12h5M16.500 12h5" />
    </>
  ),
  phone: (
    <>
      <rect x="6.500" y="2.500" width="11" height="19" rx="2.800" />
      <path d="M10.500 18.500h3" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.500" />
      <path d="M16 16l4.500 4.500" />
    </>
  ),
  external: <path d="M13.500 4.500h6v6M19.500 4.500l-8.500 8.500M10 6H6.500A2.500 2.500 0 0 0 4 8.500v9A2.500 2.500 0 0 0 6.500 20h9a2.500 2.500 0 0 0 2.500-2.500V14" />,
  alert: (
    <>
      <path d="M12 4l9 15.500H3L12 4z" />
      <path d="M12 10v4.500M12 17v.1" />
    </>
  ),
  home: <path d="M4 11.500L12 4.500l8 7M6.500 10v9.500h11V10M10 19.500v-5h4v5" />,
  reset: (
    <>
      <path d="M4 12a8 8 0 1 0 2.600-5.900" />
      <path d="M4 4.500V9h4.500" />
    </>
  ),
  eye: (
    <>
      <path d="M2.500 12S6 5.500 12 5.500 21.500 12 21.500 12 18 18.500 12 18.500 2.500 12 2.500 12z" />
      <circle cx="12" cy="12" r="2.800" />
    </>
  ),
  eyeOff: (
    <>
      <path d="M9.500 5.900A9 9 0 0 1 12 5.500c6 0 9.500 6.500 9.500 6.500a15 15 0 0 1-2.700 3.400M6.300 7.600A15 15 0 0 0 2.500 12S6 18.500 12 18.500a9 9 0 0 0 4-.9" />
      <path d="M3.500 3.500l17 17M10 10a2.800 2.800 0 0 0 4 4" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  more: (
    <>
      <circle cx="12" cy="5.500" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="18.500" r="1" />
    </>
  ),
  grid: (
    <>
      <rect x="4" y="4" width="6.500" height="6.500" rx="1.500" />
      <rect x="13.500" y="4" width="6.500" height="6.500" rx="1.500" />
      <rect x="4" y="13.500" width="6.500" height="6.500" rx="1.500" />
      <rect x="13.500" y="13.500" width="6.500" height="6.500" rx="1.500" />
    </>
  ),
  panel: (
    <>
      <rect x="3.500" y="4.500" width="17" height="15" rx="2.500" />
      <path d="M14.500 4.500v15" />
    </>
  ),
  bolt: <path d="M13 3L5 13.500h6L10.500 21 19 10h-6l0-7z" />,
  star: <path d="M12 4l2.400 5 5.600.7-4.100 3.800 1.100 5.500L12 16.300 7 19l1.100-5.500L4 9.700 9.600 9 12 4z" />,
  user: (
    <>
      <circle cx="12" cy="8.500" r="3.500" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </>
  ),
};

export type IconName = keyof typeof PATHS;

export function Icon({
  name,
  size = 20,
  stroke = 1.8,
  className,
}: {
  name: string;
  size?: number;
  stroke?: number;
  className?: string;
}) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name] ?? null}
    </svg>
  );
}
