import type { SkinName } from '../types'

export type Palette = {
  label: string
  bg: string
  bg2: string
  panel: string
  primary: string
  secondary: string
  accent: string
  text: string
  dim: string
  you: string
  claude: string
}

export const SKINS: Record<Exclude<SkinName, 'off'>, Palette> = {
  cyberpunk: {
    label: 'Cyberpunk neon: magenta, cyan and yellow on deep violet',
    bg: '#0d0221',
    bg2: '#2a0845',
    panel: '#140430',
    primary: '#ff2bd6',
    secondary: '#00f0ff',
    accent: '#fcee0a',
    text: '#ece8ff',
    dim: '#7c6bb0',
    you: '◢ YOU',
    claude: '◤ CLAUDE // NEURAL LINK',
  },
  synthwave: {
    label: 'Synthwave sunset: hot pink and orange over purple',
    bg: '#1a0933',
    bg2: '#3d0f4a',
    panel: '#22093f',
    primary: '#ff6ec7',
    secondary: '#ffb86c',
    accent: '#8be9fd',
    text: '#fbe7ff',
    dim: '#a77bca',
    you: '▲ YOU',
    claude: '☀ CLAUDE // OUTRUN',
  },
  matrix: {
    label: 'Matrix: phosphor green on black',
    bg: '#000a02',
    bg2: '#002b0c',
    panel: '#00140a',
    primary: '#00ff66',
    secondary: '#00c853',
    accent: '#b9f6ca',
    text: '#c8ffd8',
    dim: '#2e7d4f',
    you: '> USER',
    claude: '> CLAUDE // THE CONSTRUCT',
  },
}

export const SKIN_NAMES = [...Object.keys(SKINS), 'off'] as SkinName[]

export function isSkinName(name: string): name is SkinName {
  return (SKIN_NAMES as string[]).includes(name)
}
