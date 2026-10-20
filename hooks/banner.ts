import type { Look, Picture } from '../types'
import { href } from './pictures'
import type { Palette } from './skins'

function esc(text: string) {
  return text.replace(/[&<>"']/g, ch => `&#${ch.charCodeAt(0)};`)
}

// A round portrait with a neon ring: the person's picture, or a glyph.
function portrait(id: string, cx: number, cy: number, r: number, p: Palette, picture: Picture | null, glyph: string, isPulsing: boolean) {
  const face = picture
    ? `<clipPath id="${id}"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath>` +
      `<image href="${href(picture)}" x="${cx - r}" y="${cy - r}" width="${r * 2}" height="${r * 2}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${id})"/>`
    : `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${p.panel}"/>` +
      `<text x="${cx}" y="${cy + r * 0.38}" text-anchor="middle" font-family="monospace" font-weight="bold" font-size="${r * 1.05}" fill="${p.primary}">${esc(glyph)}</text>`
  const pulse = isPulsing
    ? `<animate attributeName="stroke-opacity" values="1;.35;1" dur="1.8s" repeatCount="indefinite"/>`
    : ''

  return `${face}<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${p.primary}" stroke-width="${Math.max(1.5, r / 12)}" filter="url(#glow)">${pulse}</circle>`
}

const GLOW = `<filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`

// The banner above the prompt: a perspective grid that scrolls toward the
// viewer, a scanline, the person's portrait and name with a glitch.
export function bannerSvg(look: Look, p: Palette, isWorking: boolean) {
  const W = 800
  const H = 104
  const horizon = 58
  let grid = ''
  for (let i = -10; i <= 10; i++) {
    grid += `<line x1="${W / 2 + i * 22}" y1="${horizon}" x2="${W / 2 + i * 120}" y2="${H}"/>`
  }
  let rows = ''
  for (let i = 0; i < 6; i++) {
    const y = horizon + 2 + i * i * 1.6
    rows += `<line x1="0" y1="${y.toFixed(1)}" x2="${W}" y2="${y.toFixed(1)}"/>`
  }
  const background = look.background
    ? `<image href="${href(look.background)}" x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice"/>` +
      `<rect width="${W}" height="${H}" fill="${p.bg}" opacity=".5"/>`
    : ''
  const name = esc(look.name || 'NETRUNNER')
  const status = isWorking ? 'PROCESSING' : 'ONLINE'
  const blink = isWorking ? '.45s' : '1.6s'

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice">`,
    `<defs>${GLOW}<linearGradient id="sky" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${p.bg}"/><stop offset="1" stop-color="${p.bg2}"/></linearGradient></defs>`,
    `<rect width="${W}" height="${H}" fill="url(#sky)"/>`,
    background,
    `<g stroke="${p.secondary}" stroke-opacity=".28" stroke-width="1">${grid}`,
    `<g>${rows}<animateTransform attributeName="transform" type="translate" values="0 0;0 9" dur="1.2s" repeatCount="indefinite"/></g></g>`,
    `<line x1="0" y1="${horizon}" x2="${W}" y2="${horizon}" stroke="${p.primary}" stroke-opacity=".7" filter="url(#glow)"/>`,
    `<rect x="0" width="${W}" height="2" fill="${p.secondary}" opacity=".18"><animate attributeName="y" values="0;${H}" dur="3.2s" repeatCount="indefinite"/></rect>`,
    portrait('me', 52, 52, 34, p, look.avatar, '◢', true),
    `<g font-family="monospace" font-weight="bold" font-size="30">`,
    `<text x="102" y="50" fill="${p.secondary}" opacity=".75">${name}<animate attributeName="x" values="102;104;101;102;102" dur="2.6s" repeatCount="indefinite"/></text>`,
    `<text x="100" y="50" fill="${p.primary}" opacity=".75">${name}<animate attributeName="x" values="100;98;101;100;100" dur="2.6s" repeatCount="indefinite"/></text>`,
    `<text x="101" y="50" fill="${p.text}" filter="url(#glow)">${name}</text></g>`,
    `<text x="102" y="76" font-family="monospace" font-size="13" fill="${p.secondary}" letter-spacing="3">NEURAL LINK // ${status}</text>`,
    `<circle cx="${W - 150}" cy="30" r="5" fill="${isWorking ? p.accent : p.primary}" filter="url(#glow)"><animate attributeName="opacity" values="1;.2;1" dur="${blink}" repeatCount="indefinite"/></circle>`,
    `<text x="${W - 136}" y="35" font-family="monospace" font-size="15" font-weight="bold" fill="${p.text}" letter-spacing="2">CLAUDE</text>`,
    `<text x="${W - 20}" y="${H - 14}" text-anchor="end" font-family="monospace" font-size="11" fill="${p.dim}">NODE 2077 · ${isWorking ? "BUSY" : "IDLE"}</text>`,
    `</svg>`,
  ].join('')
}

// The small portrait at the head of a message.
export function badgeSvg(id: string, p: Palette, picture: Picture | null, glyph: string) {
  const S = 28

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" width="${S}" height="${S}"><defs>${GLOW}</defs>${portrait(id, S / 2, S / 2, S / 2 - 3, p, picture, glyph, false)}</svg>`
}
