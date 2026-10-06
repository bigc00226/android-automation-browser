import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The dev indicator would otherwise be drawn inside the simulated phone and
  // inside every embedded demo page.
  devIndicators: false,
  // Lets a real phone on the same LAN open the dev server (http://<PC-IP>:3000).
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.*.*.*"],
  async redirects() {
    return [{ source: "/sites", destination: "/sites/start", permanent: false }];
  },
};

export default nextConfig;
