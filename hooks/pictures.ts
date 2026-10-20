import type { EngineInterface } from 'claude-code'

import type { Picture } from '../types'

// What fits in one drawing: the surface takes an SVG of at most 131072
// characters, and the avatar is drawn beside every message.
export const AVATAR_MAX = 60_000
export const BACKGROUND_MAX = 110_000

const MAGIC: [string, string][] = [
  ['iVBORw0KGgo', 'image/png'],
  ['/9j/', 'image/jpeg'],
  ['R0lGOD', 'image/gif'],
  ['UklGR', 'image/webp'],
]

export type Loaded = { picture: Picture } | { error: string }

export async function loadPicture($: EngineInterface, path: string, max: number): Promise<Loaded> {
  let base64: string
  try {
    ;({ base64 } = await $.fs.read(path, { as: 'bytes' }))
  } catch (error) {
    return { error: `Could not read ${path}: ${error instanceof Error ? error.message : String(error)}` }
  }
  const mime = MAGIC.find(([head]) => base64.startsWith(head))?.[1]
  if (mime === undefined) {
    return { error: `${path} is not a PNG, JPEG, GIF or WebP picture.` }
  }
  if (base64.length > max) {
    const kb = Math.floor((max * 3) / 4 / 1024)
    const has = Math.ceil((base64.length * 3) / 4 / 1024)
    return {
      error: `${path} is ${has} KB; the most that fits is about ${kb} KB. Shrink it first (for example to 256 px wide as a JPEG) and set it again.`,
    }
  }

  return { picture: { mime, base64 } }
}

export function href(picture: Picture) {
  return `data:${picture.mime};base64,${picture.base64}`
}
