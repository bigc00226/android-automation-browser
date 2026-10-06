import type { MetadataRoute } from "next";
import { APP_NAME } from "@/lib/defaults";

/** Lets the demo be added to a phone's home screen and opened without browser chrome. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${APP_NAME}（Web デモ）`,
    short_name: "FixView",
    description: "機種に依存しない固定表示エリアとマルチプロファイルを備えたブラウザアプリのデモ",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#2558E4",
    theme_color: "#2558E4",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
