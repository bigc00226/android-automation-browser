import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteRoot } from "@/components/site/SiteRoot";

/*
 * Bundled sample sites. They are ordinary pages of this app, shown inside the
 * browser shell's iframe so the fixed display area, the profile cookies and the
 * image blocking can be tried without depending on third-party sites.
 */
export const metadata: Metadata = { title: "デモページ" };

export default function SitesLayout({ children }: { children: ReactNode }) {
  return <SiteRoot>{children}</SiteRoot>;
}
