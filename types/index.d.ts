export type SkinName = 'cyberpunk' | 'synthwave' | 'matrix' | 'off'
export type Layout = 'cards' | 'bubbles'
export type Picture = { mime: string; base64: string }
export type Look = {
  skin: SkinName
  layout: Layout
  isBannerOn: boolean
  name: string
  avatar: Picture | null
  background: Picture | null
}

declare module 'claude-code' {
  interface PluginState {
    'cod-skin': { look: Look }
  }
}
