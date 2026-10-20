import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Layout, Look } from '../types'
import { badgeSvg, bannerSvg } from './banner'
import { AVATAR_MAX, BACKGROUND_MAX, loadPicture } from './pictures'
import { isSkinName, SKIN_NAMES, SKINS } from './skins'

const DEFAULT: Look = {
  skin: 'cyberpunk',
  layout: 'cards',
  isBannerOn: true,
  name: '',
  avatar: null,
  background: null,
}
const look = atom({ plugin: 'cod-skin', key: 'look' } as const, DEFAULT)
const TOOL = 'mcp__cod-skin__customize'
const ERROR = '#ff3355'

// Where the person's own messages come from: typed at the terminal, sent by
// the desktop app (an SDK host), a phone through the bridge.
const OWN_ORIGINS = new Set(['composer', 'sdk', 'bridge', 'unclassified'])

// Words the terminal's spinner cycles through instead of its own.
const SPIN_WORDS = ['Jacking in', 'Decrypting', 'Overclocking', 'Splicing', 'Netrunning', 'Rerouting', 'Compiling ICE']

// What one change asks for, from the /skin command or from Claude's tool.
type Change = {
  skin?: string
  layout?: string
  banner?: boolean
  name?: string
  avatar_path?: string
  background_path?: string
  clear?: string[]
}

async function save($: EngineInterface, change: (now: Look) => Look) {
  const now = await update($, look, change)
  await $.store.set('look', now).catch(() => undefined)

  return now
}

// Applies a change and says, line by line, what it did or why it could not.
async function apply($: EngineInterface, change: Change) {
  const said: string[] = []
  if (change.skin !== undefined) {
    const skin = change.skin.toLowerCase()
    if (isSkinName(skin)) {
      await save($, now => ({ ...now, skin }))
      said.push(skin === 'off' ? 'Skin off: the chat draws as usual.' : `Skin: ${skin}.`)
    } else {
      said.push(`No skin called "${change.skin}". Skins: ${SKIN_NAMES.join(', ')}.`)
    }
  }
  if (change.layout !== undefined) {
    if (change.layout === 'cards' || change.layout === 'bubbles') {
      const layout: Layout = change.layout
      await save($, now => ({ ...now, layout }))
      said.push(`Layout: ${layout}.`)
    } else {
      said.push(`No layout called "${change.layout}". Layouts: cards, bubbles.`)
    }
  }
  if (change.banner !== undefined) {
    const isBannerOn = change.banner
    await save($, now => ({ ...now, isBannerOn }))
    said.push(`Banner ${isBannerOn ? 'on' : 'off'}.`)
  }
  if (change.name !== undefined) {
    const name = change.name.trim().slice(0, 24)
    await save($, now => ({ ...now, name }))
    said.push(name === '' ? 'Name cleared.' : `Name: ${name}.`)
  }
  for (const [path, which, max] of [
    [change.avatar_path, 'avatar', AVATAR_MAX],
    [change.background_path, 'background', BACKGROUND_MAX],
  ] as const) {
    if (path === undefined) continue
    const loaded = await loadPicture($, path, max)
    if ('error' in loaded) {
      said.push(loaded.error)
      continue
    }
    await save($, now => ({ ...now, [which]: loaded.picture }))
    said.push(`${which === 'avatar' ? 'Avatar' : 'Background'} set from ${path}.`)
  }
  for (const which of change.clear ?? []) {
    if (which === 'avatar' || which === 'background') {
      await save($, now => ({ ...now, [which]: null }))
      said.push(`${which === 'avatar' ? 'Avatar' : 'Background'} cleared.`)
    }
  }

  return said
}

async function status($: EngineInterface) {
  const now = await read($, look)

  return [
    `Skin: ${now.skin} · layout: ${now.layout} · banner: ${now.isBannerOn ? 'on' : 'off'} · name: ${now.name || '(none)'} · avatar: ${now.avatar ? 'set' : 'none'} · background: ${now.background ? 'set' : 'none'}`,
    '',
    ...SKIN_NAMES.map(name => `  /skin ${name}${name === 'off' ? '  (the chat as usual)' : `  ${SKINS[name].label}`}`),
    '  /skin layout cards | bubbles',
    '  /skin banner on | off',
    '  /skin name <your name>',
    '  /skin avatar <path to picture>      (up to about 44 KB)',
    '  /skin bg <path to picture>          (up to about 80 KB)',
    '  /skin clear avatar | bg',
    '  /skin reset',
    '',
    'Or just ask Claude: "use ~/Pictures/me.jpg as my avatar".',
  ].join('\n')
}

function parse(args: string): Change | 'help' | 'reset' {
  const [word = '', ...rest] = args.trim().split(/\s+/)
  const value = rest.join(' ').replace(/^["']|["']$/g, '')
  switch (word.toLowerCase()) {
    case '':
    case 'help':
      return 'help'
    case 'reset':
      return 'reset'
    case 'layout':
      return { layout: value }
    case 'banner':
      return { banner: value !== 'off' }
    case 'name':
      return { name: value }
    case 'avatar':
      return { avatar_path: value }
    case 'bg':
    case 'background':
      return { background_path: value }
    case 'clear':
      return { clear: [value === 'bg' ? 'background' : value] }
    default:
      return { skin: word }
  }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    try {
      const kept = (await $.store.get('look')) as Partial<Look> | undefined
      if (kept !== undefined) await update($, look, () => ({ ...DEFAULT, ...kept }))
    } catch {
      // Nothing kept: the default skin.
    }
    await $.command.register({
      name: 'skin',
      description: 'Change how the chat looks: neon skins, layout, banner, your avatar and background',
    })
    await $.tool
      .register({
        name: 'customize',
        description:
          "Changes the look of this chat (the cod-skin plugin): the skin (cyberpunk, synthwave, matrix, or off), the layout (cards, or bubbles with the person's messages on the right), the animated banner above the prompt, the name on it, and the person's avatar and banner background picture, given as paths to PNG, JPEG, GIF or WebP files on this computer. Pictures must be small: an avatar up to about 44 KB, a background up to about 80 KB. If one is larger, make a smaller copy first (for example with Python Pillow: 256 px wide for an avatar, 800 px wide for a background, saved as JPEG at quality 80) and pass that copy's path.",
        inputSchema: {
          type: 'object',
          properties: {
            skin: { type: 'string', enum: SKIN_NAMES },
            layout: { type: 'string', enum: ['cards', 'bubbles'] },
            banner: { type: 'boolean', description: 'Show the animated banner above the prompt' },
            name: { type: 'string', description: 'The name on the banner (up to 24 characters)' },
            avatar_path: { type: 'string', description: 'Absolute path to the avatar picture' },
            background_path: { type: 'string', description: 'Absolute path to the banner background picture' },
            clear: { type: 'array', items: { type: 'string', enum: ['avatar', 'background'] } },
          },
        },
      })
      .catch(() => undefined)

    return next(e)
  })

  on('command.run', { command: 'skin' }, async ($, e) => {
    const asked = parse(e.args)
    if (asked === 'help') return { text: await status($) }
    if (asked === 'reset') {
      await save($, () => DEFAULT)
      return { text: 'Skin reset: cyberpunk, cards, banner on, no avatar or background.' }
    }

    return { text: (await apply($, asked)).join('\n') || (await status($)) }
  })

  on('tool.call', { tool: TOOL }, async ($, e) => {
    const said = await apply($, e as unknown as Change)

    return { result: said.join('\n') || 'Nothing to change.' }
  }).catch(() => ({ result: 'cod-skin could not apply that change.' }))

  // The person's own messages: a neon card, with their avatar and name.
  on('ui.render', { component: 'UserMessage' }, async ($, e, next) => {
    const now = await read($, look)
    const isOwn = OWN_ORIGINS.has(e.props.origin.kind) && e.props.task === undefined && e.props.from === undefined
    if (now.skin === 'off' || !isOwn) return next(e)
    const p = SKINS[now.skin]
    const t = $.ui.resolve(e)
    const { Box, Text } = t
    const isBubble = now.layout === 'bubbles'
    const badge = e.surface !== 'terminal' && 'Svg' in t ? <t.Svg source={badgeSvg('you', p, now.avatar, '◢')} alt="Your avatar" width={28} height={28} /> : null

    return (
      <Box flexDirection="column" alignItems={isBubble ? 'flex-end' : 'stretch'} marginY={1}>
        <Box
          flexDirection="column"
          borderStyle="round"
          borderColor={p.primary}
          backgroundColor={p.panel}
          paddingX={1}
          {...(isBubble ? { width: '80%' } : {})}
        >
          <Box flexDirection="row" gap={1} alignItems="center">
            {badge}
            <Text color={p.primary} bold>
              {now.name === '' ? p.you : `${p.you} · ${now.name}`}
            </Text>
          </Box>
          <Text color={p.text}>{e.props.text}</Text>
        </Box>
      </Box>
    )
  })

  // Claude's replies: a frame in the second neon colour, headed once a reply.
  // No fill behind them, so the text stays readable on a light theme too.
  on('ui.render', { component: 'AssistantMessage' }, async ($, e, next) => {
    const now = await read($, look)
    if (now.skin === 'off') return next(e)
    const p = SKINS[now.skin]
    const t = $.ui.resolve(e)
    const { Box, Text, Markdown } = t
    const isFirst = e.props.isFirstOfReply
    const badge = e.surface !== 'terminal' && 'Svg' in t ? <t.Svg source={badgeSvg('claude', p, null, 'C')} alt="Claude" width={28} height={28} /> : null

    return (
      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor={p.secondary}
        paddingX={1}
        marginTop={isFirst ? 1 : 0}
        {...(now.layout === 'bubbles' ? { width: '90%' } : {})}
      >
        {isFirst && (
          <Box flexDirection="row" gap={1} alignItems="center">
            {badge}
            <Text color={p.secondary} bold>
              {p.claude}
            </Text>
          </Box>
        )}
        <Markdown text={e.props.text} />
      </Box>
    )
  })

  // The banner above the prompt; whatever else draws there (hacker-screen,
  // the engine) stays, under it.
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const below = await next(e)
    const now = await read($, look)
    if (now.skin === 'off' || !now.isBannerOn || e.props.hasSurvey) return below
    const p = SKINS[now.skin]
    const t = $.ui.resolve(e)
    const { Box, Text } = t
    const banner =
      e.surface !== 'terminal' && 'Svg' in t ? (
        <t.Svg source={bannerSvg(now, p, e.props.isWorking)} alt="Neon banner" height={104} isInteractive />
      ) : (
        <Text color={p.primary} bold wrap="truncate-end">
          ▌{p.claude} ▐ {now.name === '' ? '' : `◢ ${now.name} ◣ `}
          <Text color={e.props.isWorking ? p.accent : p.secondary}>● {e.props.isWorking ? 'PROCESSING' : 'ONLINE'}</Text>
        </Text>
      )

    return (
      <Box flexDirection="column">
        {banner}
        {below}
      </Box>
    )
  })

  // A slash command's output: a terminal readout in the skin's colours.
  on('ui.render', { component: 'CommandOutput' }, async ($, e, next) => {
    const now = await read($, look)
    if (now.skin === 'off') return next(e)
    const p = SKINS[now.skin]
    const { Box, Text, Markdown } = $.ui.resolve(e)
    const color = e.props.isErrored ? ERROR : p.accent

    return (
      <Box flexDirection="column" borderStyle="round" borderColor={color} paddingX={1}>
        <Text color={color} bold>
          ▸ /{e.props.command}
          {e.props.args === '' ? '' : ` ${e.props.args}`}
        </Text>
        <Markdown text={e.props.text} />
      </Box>
    )
  })

  // Tool calls and folded runs of them: the engine's own row, framed.
  on('ui.render', { component: 'ToolGroup' }, async ($, e, next) => {
    const inner = await next(e)
    const now = await read($, look)
    if (now.skin === 'off') return inner
    const { Box } = $.ui.resolve(e)

    return (
      <Box borderStyle="round" borderColor={SKINS[now.skin].dim} paddingX={1}>
        {inner}
      </Box>
    )
  })

  on('ui.render', { component: 'ToolUse' }, async ($, e, next) => {
    const inner = await next(e)
    const now = await read($, look)
    if (now.skin === 'off' || e.props.isExpanded === true) return inner
    const p = SKINS[now.skin]
    const { Box } = $.ui.resolve(e)

    return (
      <Box borderStyle="round" borderColor={e.props.isErrored ? ERROR : e.props.isRunning ? p.accent : p.dim} paddingX={1}>
        {inner}
      </Box>
    )
  })

  // The spinner speaks the skin's language: its own words on the terminal,
  // the step it names in capitals on the desktop.
  on('ui.render', { component: 'Spinner' }, async ($, e, next) => {
    const now = await read($, look)
    if (now.skin === 'off' || e.props.mode === 'tool-use') return next(e)
    if (e.surface !== 'terminal') {
      return next({ ...e, props: { ...e.props, word: `▸ ${e.props.word.toUpperCase()}` } })
    }
    let hash = 0
    for (const ch of e.props.word) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0

    return next({ ...e, props: { ...e.props, word: SPIN_WORDS[hash % SPIN_WORDS.length] ?? e.props.word } })
  })
}
