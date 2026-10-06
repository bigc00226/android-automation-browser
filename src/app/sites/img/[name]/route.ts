/*
 * Illustrations for the bundled demo pages, generated as SVG so the project
 * needs no image assets. Every scene is drawn on a 320x180 canvas and cropped
 * ("slice") to whatever size was requested.
 */

type Rand = () => number;

function rng(seed: number): Rand {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

const f = (n: number) => n.toFixed(1);

function gradient(id: string, stops: Array<[number, string]>, horizontal = false): string {
  const body = stops.map(([offset, color]) => `<stop offset="${offset}" stop-color="${color}"/>`).join("");
  return `<linearGradient id="${id}" x1="0" y1="0" x2="${horizontal ? 1 : 0}" y2="${horizontal ? 0 : 1}">${body}</linearGradient>`;
}

function skyline(rand: Rand, baseY: number, minH: number, maxH: number, color: string, lit: boolean): string {
  let out = "";
  let x = -6;
  while (x < 326) {
    const w = 14 + rand() * 22;
    const h = minH + rand() * (maxH - minH);
    out += `<rect x="${f(x)}" y="${f(baseY - h)}" width="${f(w)}" height="${f(h + 6)}" fill="${color}"/>`;
    if (lit) {
      for (let wy = baseY - h + 5; wy < baseY - 5; wy += 7) {
        for (let wx = x + 3; wx < x + w - 4; wx += 6) {
          if (rand() > 0.55) {
            out += `<rect x="${f(wx)}" y="${f(wy)}" width="2.6" height="3.4" fill="#fde68a" opacity="${(0.5 + rand() * 0.5).toFixed(2)}"/>`;
          }
        }
      }
    }
    x += w + 1;
  }
  return out;
}

function ridge(rand: Rand, baseY: number, amp: number, color: string, step: number): string {
  let d = `M0 180 L0 ${f(baseY)}`;
  for (let x = 0; x < 320; x += step) {
    d += ` L${f(x + step / 2)} ${f(baseY - amp * (0.45 + rand() * 0.55))} L${f(x + step)} ${f(baseY - amp * rand() * 0.3)}`;
  }
  return `<path d="${d} L320 180 Z" fill="${color}"/>`;
}

function cloud(x: number, y: number, s: number, opacity = 0.95): string {
  return `<g fill="#fff" opacity="${opacity}"><ellipse cx="${x}" cy="${y}" rx="${f(18 * s)}" ry="${f(8 * s)}"/><ellipse cx="${f(x - 10 * s)}" cy="${f(y + 3 * s)}" rx="${f(12 * s)}" ry="${f(6 * s)}"/><ellipse cx="${f(x + 12 * s)}" cy="${f(y + 3 * s)}" rx="${f(13 * s)}" ry="${f(6 * s)}"/></g>`;
}

const SCENES: Record<string, (rand: Rand) => string> = {
  city(rand) {
    return (
      `<defs>${gradient("g", [[0, "#1e1b4b"], [0.55, "#7c3aed"], [1, "#fb923c"]])}</defs>` +
      `<rect width="320" height="180" fill="url(#g)"/>` +
      `<circle cx="228" cy="118" r="26" fill="#fde68a" opacity="0.9"/>` +
      skyline(rand, 150, 30, 70, "#4338ca", false) +
      skyline(rand, 165, 30, 82, "#272063", true) +
      skyline(rand, 182, 18, 46, "#110d2e", true)
    );
  },
  mountain(rand) {
    return (
      `<defs>${gradient("g", [[0, "#8ec9ff"], [1, "#eaf6ff"]])}</defs>` +
      `<rect width="320" height="180" fill="url(#g)"/>` +
      `<circle cx="252" cy="42" r="17" fill="#fff7c2"/>` +
      cloud(70, 38, 1.1) +
      cloud(180, 26, 0.7, 0.85) +
      ridge(rand, 120, 62, "#9db9dd", 64) +
      ridge(rand, 136, 58, "#5f86b6", 52) +
      ridge(rand, 152, 36, "#2f5a87", 40) +
      `<path d="M0 150 Q80 138 160 148 T320 142 V180 H0Z" fill="#3f9a5d"/>` +
      `<path d="M0 164 Q90 154 180 164 T320 158 V180 H0Z" fill="#2c7a47"/>`
    );
  },
  sea(rand) {
    let waves = "";
    for (let i = 0; i < 16; i++) {
      const y = 112 + i * 4.2;
      const half = 6 + i * 2.4 + rand() * 6;
      waves += `<rect x="${f(160 - half)}" y="${f(y)}" width="${f(half * 2)}" height="1.6" rx="0.8" fill="#ffe7a8" opacity="${(0.75 - i * 0.035).toFixed(2)}"/>`;
    }
    return (
      `<defs>${gradient("g", [[0, "#ff7e5f"], [0.6, "#feb47b"], [1, "#ffe3a3"]])}${gradient("s", [[0, "#2a6f97"], [1, "#012a4a"]])}</defs>` +
      `<rect width="320" height="108" fill="url(#g)"/>` +
      `<circle cx="160" cy="106" r="30" fill="#fff3c4"/>` +
      `<rect y="106" width="320" height="74" fill="url(#s)"/>` +
      waves +
      `<path d="M228 128 L228 96 L252 128 Z" fill="#fff"/><path d="M226 128 L226 102 L210 128 Z" fill="#f1f5f9"/><path d="M204 130 H258 L250 138 H212 Z" fill="#1f2937"/>` +
      `<path d="M52 44 q6 -6 12 0 q6 -6 12 0" fill="none" stroke="#3b2f2f" stroke-width="1.6" stroke-linecap="round"/>` +
      `<path d="M92 60 q4 -4 8 0 q4 -4 8 0" fill="none" stroke="#3b2f2f" stroke-width="1.3" stroke-linecap="round"/>`
    );
  },
  stadium(rand) {
    let crowd = "";
    for (let i = 0; i < 260; i++) {
      const colors = ["#fca5a5", "#93c5fd", "#fde68a", "#e2e8f0", "#f9a8d4"];
      crowd += `<circle cx="${f(rand() * 320)}" cy="${f(38 + rand() * 40)}" r="1.5" fill="${colors[Math.floor(rand() * colors.length)]}"/>`;
    }
    let stripes = "";
    for (let i = 0; i < 8; i++) {
      stripes += `<path d="M${f(40 + i * 30)} 84 L${f(70 + i * 30)} 84 L${f(-40 + (i + 1) * 50)} 180 L${f(-40 + i * 50)} 180 Z" fill="${i % 2 ? "#2f9e54" : "#37b35f"}"/>`;
    }
    return (
      `<defs>${gradient("g", [[0, "#0f172a"], [1, "#1e3a5f"]])}</defs>` +
      `<rect width="320" height="180" fill="url(#g)"/>` +
      `<rect y="32" width="320" height="52" fill="#334155"/>` +
      crowd +
      `<rect y="84" width="320" height="96" fill="#37b35f"/>` +
      stripes +
      `<path d="M0 132 H320" stroke="#fff" stroke-width="1.6" opacity="0.9"/>` +
      `<ellipse cx="160" cy="132" rx="46" ry="15" fill="none" stroke="#fff" stroke-width="1.6" opacity="0.9"/>` +
      `<circle cx="160" cy="132" r="2.6" fill="#fff"/>` +
      `<g fill="#fff"><rect x="20" y="6" width="34" height="12" rx="2"/><rect x="266" y="6" width="34" height="12" rx="2"/></g>` +
      `<g fill="#fff" opacity="0.16"><path d="M37 18 L-20 84 H110 Z"/><path d="M283 18 L210 84 H340 Z"/></g>`
    );
  },
  space(rand) {
    let stars = "";
    for (let i = 0; i < 150; i++) {
      stars += `<circle cx="${f(rand() * 320)}" cy="${f(rand() * 180)}" r="${(0.3 + rand() * 1.1).toFixed(2)}" fill="#fff" opacity="${(0.35 + rand() * 0.65).toFixed(2)}"/>`;
    }
    return (
      `<defs>${gradient("g", [[0, "#050816"], [1, "#1b1145"]])}` +
      `<radialGradient id="n1"><stop offset="0" stop-color="#f472b6" stop-opacity="0.85"/><stop offset="1" stop-color="#f472b6" stop-opacity="0"/></radialGradient>` +
      `<radialGradient id="n2"><stop offset="0" stop-color="#38bdf8" stop-opacity="0.75"/><stop offset="1" stop-color="#38bdf8" stop-opacity="0"/></radialGradient>` +
      `<radialGradient id="n3"><stop offset="0" stop-color="#a78bfa" stop-opacity="0.8"/><stop offset="1" stop-color="#a78bfa" stop-opacity="0"/></radialGradient>` +
      `${gradient("p", [[0, "#fbbf24"], [1, "#b45309"]])}</defs>` +
      `<rect width="320" height="180" fill="url(#g)"/>` +
      `<ellipse cx="120" cy="92" rx="110" ry="58" fill="url(#n3)"/>` +
      `<ellipse cx="86" cy="70" rx="64" ry="44" fill="url(#n1)"/>` +
      `<ellipse cx="170" cy="118" rx="80" ry="46" fill="url(#n2)"/>` +
      stars +
      `<ellipse cx="258" cy="56" rx="38" ry="8" fill="none" stroke="#fde68a" stroke-width="2.4" opacity="0.8" transform="rotate(-18 258 56)"/>` +
      `<circle cx="258" cy="56" r="20" fill="url(#p)"/>`
    );
  },
  bus(rand) {
    let trees = "";
    for (let i = 0; i < 7; i++) {
      const x = 14 + i * 50 + rand() * 14;
      const s = 0.8 + rand() * 0.5;
      trees += `<rect x="${f(x - 2)}" y="${f(104 - 10 * s)}" width="4" height="${f(16 * s)}" fill="#7c4a22"/><circle cx="${f(x)}" cy="${f(96 - 12 * s)}" r="${f(13 * s)}" fill="${i % 2 ? "#3f9a5d" : "#4fb06d"}"/>`;
    }
    return (
      `<defs>${gradient("g", [[0, "#a5d8ff"], [1, "#e7f5ff"]])}</defs>` +
      `<rect width="320" height="180" fill="url(#g)"/>` +
      cloud(60, 30, 1) +
      cloud(236, 42, 0.8, 0.9) +
      `<path d="M0 112 Q80 92 160 108 T320 100 V180 H0Z" fill="#a9dcb6"/>` +
      trees +
      `<rect y="118" width="320" height="62" fill="#4b5563"/>` +
      `<path d="M0 150 H320" stroke="#f8fafc" stroke-width="2.4" stroke-dasharray="18 14"/>` +
      `<rect x="84" y="80" width="156" height="58" rx="10" fill="#14b8a6"/>` +
      `<rect x="84" y="118" width="156" height="12" fill="#0f766e"/>` +
      `<g fill="#e0f2fe"><rect x="94" y="90" width="26" height="22" rx="3"/><rect x="126" y="90" width="26" height="22" rx="3"/><rect x="158" y="90" width="26" height="22" rx="3"/><rect x="190" y="90" width="40" height="22" rx="3"/></g>` +
      `<g fill="#111827"><circle cx="118" cy="140" r="11"/><circle cx="206" cy="140" r="11"/></g>` +
      `<g fill="#9ca3af"><circle cx="118" cy="140" r="4.6"/><circle cx="206" cy="140" r="4.6"/></g>` +
      `<path d="M150 74 l6 -8 l6 8" fill="none" stroke="#fde047" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`
    );
  },
  device() {
    return (
      `<defs>${gradient("g", [[0, "#4f46e5"], [1, "#06b6d4"]], true)}${gradient("s", [[0, "#eef2ff"], [1, "#c7d2fe"]])}</defs>` +
      `<rect width="320" height="180" fill="url(#g)"/>` +
      `<g fill="#fff" opacity="0.14"><circle cx="48" cy="40" r="46"/><circle cx="290" cy="150" r="64"/></g>` +
      `<rect x="122" y="18" width="76" height="146" rx="14" fill="#0f172a"/>` +
      `<rect x="127" y="24" width="66" height="134" rx="10" fill="url(#s)"/>` +
      `<rect x="134" y="34" width="52" height="30" rx="6" fill="#6366f1"/>` +
      `<g fill="#fff"><rect x="134" y="72" width="24" height="24" rx="6"/><rect x="162" y="72" width="24" height="24" rx="6"/><rect x="134" y="100" width="24" height="24" rx="6"/><rect x="162" y="100" width="24" height="24" rx="6"/></g>` +
      `<rect x="134" y="132" width="52" height="8" rx="4" fill="#818cf8"/>` +
      `<g fill="#fff" opacity="0.95"><rect x="34" y="62" width="70" height="24" rx="12"/><rect x="216" y="42" width="78" height="24" rx="12"/><rect x="220" y="108" width="62" height="24" rx="12"/></g>` +
      `<g fill="#4f46e5"><circle cx="48" cy="74" r="6"/><circle cx="230" cy="54" r="6"/><circle cx="234" cy="120" r="6"/></g>` +
      `<g fill="#c7d2fe"><rect x="60" y="71" width="34" height="6" rx="3"/><rect x="242" y="51" width="42" height="6" rx="3"/><rect x="246" y="117" width="26" height="6" rx="3"/></g>`
    );
  },
};

function fallback(rand: Rand): string {
  const hue = Math.floor(rand() * 360);
  let blobs = "";
  for (let i = 0; i < 6; i++) {
    blobs += `<circle cx="${f(rand() * 320)}" cy="${f(rand() * 180)}" r="${f(24 + rand() * 50)}" fill="hsl(${(hue + 40 + i * 24) % 360} 80% 66%)" opacity="0.5"/>`;
  }
  return `<rect width="320" height="180" fill="hsl(${hue} 70% 46%)"/>${blobs}`;
}

function hash(text: string): number {
  let h = 2166136261;
  for (const ch of text) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}

function dimension(value: string | null, fallbackValue: number): number {
  const n = Math.round(Number(value));
  return Number.isFinite(n) && n > 0 ? Math.min(1600, Math.max(16, n)) : fallbackValue;
}

export async function GET(request: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const query = new URL(request.url).searchParams;
  const w = dimension(query.get("w"), 640);
  const h = dimension(query.get("h"), 360);
  const rand = rng(hash(name));
  const draw = Object.hasOwn(SCENES, name) ? SCENES[name] : fallback;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice">` +
    draw(rand) +
    `</svg>`;
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
