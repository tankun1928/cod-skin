import type { On } from 'claude-code'
import { expect, mock, test } from 'claude-code/testing'

const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

const USER = (text: string) =>
  ({
    plugin: 'cod-skin',
    component: 'UserMessage',
    props: { text, origin: { kind: 'composer' }, isExpanded: true },
  }) as const

const REPLY = (text: string, isFirstOfReply = true) =>
  ({
    plugin: 'cod-skin',
    component: 'AssistantMessage',
    props: { text, isFirstOfReply },
  }) as const

const BAND = {
  plugin: 'cod-skin',
  component: 'AbovePrompt',
  props: { hasSurvey: false, isWorking: true, maxRows: 24, bodyColumns: 80, scroll: { offset: 0, bodyRows: 24 }, view: {} },
} as const

const RUN = (args: string) => ({
  command: 'skin',
  args,
  origin: { kind: 'composer' as const },
  presentation: { isFullscreen: false, columns: 80 },
})

function setUp(on: On) {
  mock.store(on)
  on('command.register', () => ({ value: { command: 'skin' } }))
  on('tool.register', () => ({ value: { tool: 'mcp__cod-skin__customize' } }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)

    return <Text>engine</Text>
  })
}

test('messages draw as neon cards on every surface', async ($, on) => {
  setUp(on)
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

  for (const surface of ['terminal', 'desktop', 'vscode', 'mobile'] as const) {
    const mine = await $.ui.mount({ ...USER('hello there'), surface })
    expect((await mine.find({ type: 'Text', text: /◢ YOU/ }))?.text).toBeTruthy()
    expect((await mine.find({ type: 'Text', text: /hello there/ }))?.text).toBe('hello there')
    await mine.unmount()

    const reply = await $.ui.mount({ ...REPLY('**hi**'), surface })
    expect((await reply.find({ type: 'Text', text: /CLAUDE \/\/ NEURAL LINK/ }))?.text).toBeTruthy()
    await reply.unmount()
  }
})

test('the banner sits above whatever else draws there', async ($, on) => {
  setUp(on)
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

  const terminal = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect((await terminal.find({ type: 'Text', text: /PROCESSING/ }))?.text).toBeTruthy()
  expect((await terminal.find({ type: 'Text', text: /engine/ }))?.text).toBe('engine')
  await terminal.unmount()

  const desktop = await $.ui.mount({ ...BAND, surface: 'desktop' })
  expect((await desktop.find({ type: 'Text', text: /engine/ }))?.text).toBe('engine')
  const drawn = JSON.stringify(await desktop.drawn())
  expect(drawn).toContain('"type":"Svg"')
  expect(drawn).toContain('NEURAL LINK // PROCESSING')
  expect(drawn).toContain('animateTransform')
  await desktop.unmount()
})

test('/skin switches skins and off gives the chat back', async ($, on) => {
  setUp(on)
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

  expect((await $.command.run(RUN('synthwave'))).text).toBe('Skin: synthwave.')
  const sunset = await $.ui.mount({ ...USER('hi'), surface: 'desktop' })
  expect((await sunset.find({ type: 'Text', text: /▲ YOU/ }))?.text).toBeTruthy()
  await sunset.unmount()

  expect((await $.command.run(RUN('nope'))).text).toMatch(/No skin called "nope"/)

  await $.command.run(RUN('off'))
  const plain = await $.ui.mount({ ...USER('hi'), surface: 'desktop' })
  expect((await plain.find({ type: 'Text', text: /engine/ }))?.text).toBe('engine')
  await plain.unmount()
})

test('an avatar and a name show on the messages', async ($, on) => {
  setUp(on)
  on('fs.read', () => ({ value: { base64: PNG } }))
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

  expect((await $.command.run(RUN('avatar /pics/me.png'))).text).toBe('Avatar set from /pics/me.png.')
  expect((await $.command.run(RUN('name Neo'))).text).toBe('Name: Neo.')
  const mine = await $.ui.mount({ ...USER('hi'), surface: 'desktop' })
  expect((await mine.find({ type: 'Text', text: /◢ YOU · Neo/ }))?.text).toBeTruthy()
  expect(JSON.stringify(await mine.drawn())).toContain('data:image/png;base64,' + PNG.slice(0, 20))
  await mine.unmount()
  const band = await $.ui.mount({ ...BAND, surface: 'desktop' })
  const drawn = JSON.stringify(await band.drawn())
  expect(drawn).toContain('data:image/png;base64,' + PNG.slice(0, 20))
  expect(drawn).toContain('>Neo<')
  await band.unmount()
  expect((await $.command.run(RUN(''))).text).toMatch(/avatar: set/)
})

test('a picture too big or not a picture is refused with a reason', async ($, on) => {
  setUp(on)
  on('fs.read', (_, e) => ({ value: { base64: e.path.endsWith('.txt') ? 'aGVsbG8=' : PNG + 'A'.repeat(200_000) } }))
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

  expect((await $.command.run(RUN('bg /pics/huge.png'))).text).toMatch(/Shrink it first/)
  expect((await $.command.run(RUN('avatar /notes.txt'))).text).toMatch(/not a PNG, JPEG, GIF or WebP/)
  expect((await $.command.run(RUN(''))).text).toMatch(/background: none/)
})

test('Claude can change the look through its tool', async ($, on) => {
  setUp(on)
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

  const ran = await $.tool.call({ tool: 'mcp__cod-skin__customize', skin: 'matrix', layout: 'bubbles' })
  expect(ran.result).toBe('Skin: matrix.\nLayout: bubbles.')
  const mine = await $.ui.mount({ ...USER('hi'), surface: 'desktop' })
  expect((await mine.find({ type: 'Text', text: /> USER/ }))?.text).toBeTruthy()
  await mine.unmount()
})
