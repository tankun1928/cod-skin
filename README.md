# cod-skin

Neon skins for the Claude Code chat. Your messages and Claude's become glowing cyberpunk cards, an animated banner sits above the prompt box, and you can put your own avatar and background picture on it.

![Preview of the three skins](docs/preview.png)

*Preview: the banners are the real SVG the plugin draws; the message cards are a mock-up of how the app lays them out.*

## What it does

- **3 skins:** `cyberpunk` (magenta, cyan and yellow on deep violet), `synthwave` (sunset pink and orange), `matrix` (phosphor green). `off` gives the chat back as usual.
- **Neon message cards:** your messages and Claude's replies get glowing frames, headers and portraits.
- **The rest of the chat:** slash-command output becomes a neon readout, tool calls ("Running a command") get neon frames that light up while they run, and the working indicator shows the step in capitals.
- **Animated banner:** a scrolling neon grid, a scanline, your portrait with a pulsing ring, and your name with a glitch effect. It shows `PROCESSING` while Claude works and `ONLINE` when idle.
- **Your avatar and background:** any PNG, JPEG, GIF or WebP picture on your computer.
- **Two layouts:** `cards` (full width) or `bubbles` (your messages on the right, like a chat app).
- Works alongside [hacker-screen](https://github.com/tankun1928/hacker-screen) 0.3.1 or later: the banner stacks with its screen.

## Requirements

Claude Code running on your own computer: the **Claude desktop app's Code tab** (a local session, not a cloud one) or **Claude Code in a terminal**. A cloud session watched from the claude.ai web page can't draw it.

## Install

### Claude desktop app

1. Open the Claude app, go to the **Code** tab, and start a session on your computer (pick a local folder, not cloud).
2. Click **+** next to the prompt box → **Plugins**.
3. Click **Add marketplace** and enter `tankun1928/cod-skin`.
4. Click **Add plugin** and pick **cod-skin**.
5. Restart the app. The chat switches to the cyberpunk skin.

### Terminal

Run `claude` to open Claude Code, then type at its prompt:

```
/plugin install cod-skin --marketplace tankun1928/cod-skin
```

Answer `y`, then press Enter.

## Use

Type `/skin` for the menu:

| Command | What it does |
| --- | --- |
| `/skin cyberpunk` / `synthwave` / `matrix` | Switch skins |
| `/skin off` | Turn the skin off; the chat draws as usual |
| `/skin layout bubbles` | Your messages on the right, like a chat app (`cards` = full width) |
| `/skin name Neo` | Your name on the banner and on your messages |
| `/skin avatar C:\Users\me\Pictures\me.jpg` | Set your avatar |
| `/skin bg C:\Users\me\Pictures\city.jpg` | Set the banner's background picture |
| `/skin clear avatar` / `/skin clear bg` | Remove a picture |
| `/skin banner off` | Hide the banner |
| `/skin reset` | Back to the defaults |

**Easier still:** just ask Claude, for example *"use C:\Users\me\Pictures\me.jpg as my avatar and switch to synthwave"*. If the picture is too large, Claude makes a smaller copy first.

**Picture sizes:** an avatar can be up to about 44 KB and a background up to about 80 KB, because the app draws them inside an SVG of limited size. A JPEG 256 px wide works well for an avatar, and 800 px wide for a background.

Every setting is remembered across chats.

## Update

- **Terminal:** run these, then restart Claude Code:
  ```
  claude plugin marketplace update cod-skin
  claude plugin update cod-skin@cod-skin
  ```
- **Desktop app:** click **+** → **Plugins**, remove **cod-skin** and the **cod-skin** marketplace, install again as above, then restart the app.

## Uninstall

- **Terminal:** `claude plugin uninstall cod-skin@cod-skin`
- **Desktop app:** click **+** → **Plugins** → remove **cod-skin**

## What a plugin can't change (yet)

The app's window itself (sidebar, title bar, fonts, a full-window background) is out of a plugin's reach. See [docs/feature-request.md](docs/feature-request.md) for the proposal to the Claude team.

## Develop

```
claude plugin validate .
claude plugin test .
claude --plugin-dir .
```
