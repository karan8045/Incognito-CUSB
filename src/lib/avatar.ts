/**
 * Generates a clean, modern, deterministic SVG avatar based on username and display name.
 * Aligns with Incognito CUSB's visual identity (emerald, navy, and slate tones).
 */
export function getDefaultAvatar(username: string, displayName?: string): string {
  const name = displayName || username || 'CUSB';
  const initial = name.trim().charAt(0).toUpperCase();
  
  // Deterministic color palette generation
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }

  const palettes = [
    { bg1: '#064e3b', bg2: '#047857', accent: '#34d399' }, // Emerald
    { bg1: '#0f172a', bg2: '#1e293b', accent: '#38bdf8' }, // Navy / Cyan
    { bg1: '#1e1b4b', bg2: '#312e81', accent: '#818cf8' }, // Indigo
    { bg1: '#14532d', bg2: '#15803d', accent: '#4ade80' }, // Forest CUSB
    { bg1: '#1c1917', bg2: '#292524', accent: '#a8a29e' }, // Slate Dark
    { bg1: '#022c22', bg2: '#134e4a', accent: '#2dd4bf' }, // Teal
  ];

  const palette = palettes[Math.abs(hash) % palettes.length];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
    <defs>
      <linearGradient id="grad-${Math.abs(hash)}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${palette.bg1}" />
        <stop offset="100%" stop-color="${palette.bg2}" />
      </linearGradient>
    </defs>
    <rect width="100" height="100" rx="30" fill="url(#grad-${Math.abs(hash)})" />
    <circle cx="50" cy="50" r="38" stroke="${palette.accent}" stroke-width="2" stroke-opacity="0.3" fill="none" />
    <text x="50" y="62" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="38" font-weight="700" fill="#ffffff" text-anchor="middle" letter-spacing="-1">${initial}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
