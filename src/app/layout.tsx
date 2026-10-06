import type { Metadata, Viewport } from "next";
import { APP_NAME } from "@/lib/defaults";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: `${APP_NAME} — Web デモ`, template: `%s | ${APP_NAME}` },
  description:
    "機種に依存しない固定表示エリアとマルチプロファイルを備えた、Android 自動化向けブラウザアプリの Web デモ。",
  applicationName: APP_NAME,
  appleWebApp: { capable: true, title: APP_NAME, statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // The app positions things by pixel, so page zoom is disabled like in a native app.
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#2558E4",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
