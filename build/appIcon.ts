// The PWA icon, drawn in code (keeps the zero-raster rule in source).
export function appIconSvg(): string {
  const ink = '#170b1c';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs><radialGradient id="sky" cx="50%" cy="35%" r="75%"><stop offset="0" stop-color="#5a1638"/><stop offset=".6" stop-color="#1c0b28"/><stop offset="1" stop-color="#0b0610"/></radialGradient></defs>
  <rect width="512" height="512" rx="112" fill="url(#sky)"/>
  <circle cx="256" cy="200" r="118" fill="#f6ecc8" stroke="${ink}" stroke-width="14"/>
  <circle cx="300" cy="170" r="22" fill="#e0cf9a"/><circle cx="220" cy="240" r="14" fill="#e0cf9a"/>
  <path d="M60 470V330h46v34h34v-90l40-60 40 60v58h30v-70l46-80 46 80v70h30v-58l40-60 40 60v90h34v-34h46v140Z" fill="#0d0714" stroke="${ink}" stroke-width="12" stroke-linejoin="round"/>
  <rect x="244" y="300" width="24" height="40" rx="12" fill="#ffb43d"/><rect x="168" y="320" width="20" height="30" rx="10" fill="#ffb43d"/><rect x="324" y="320" width="20" height="30" rx="10" fill="#ffb43d"/>
  <path d="M256 92 l14 -28 l14 28 z" fill="#e8344e" stroke="${ink}" stroke-width="8" stroke-linejoin="round"/>
</svg>`;
}
