# Feature request: let people make the Claude desktop app their own

**สรุปภาษาไทย:** ขอให้ทีม Claude เปิดให้ผู้ใช้และ plugin แต่งหน้าตาแอป Claude desktop ได้ทั้งหน้าต่าง: ธีมสี ภาพพื้นหลังเต็มหน้าต่าง รูปโปรไฟล์และชื่อที่แสดงในแชท ฟอนต์ และแกลเลอรีให้แชร์ธีมกัน เหตุผลคือการแต่งหน้าตาได้ทำให้คนรู้สึกว่าเป็นของตัวเองและอยากใช้ทุกวัน และยังไม่มีผู้ช่วย AI เจ้าไหนทำแบบนี้ ถ้า Claude ทำก่อนจะเป็นจุดขายที่ดึงผู้ใช้ใหม่ได้

---

## The idea

Let people style the whole Claude desktop app, not only the chat inside it: the colours, a background picture, their own avatar and name, the fonts. Let plugins do the same, and let people share what they make.

I built two Claude Code plugins to see how far the plugin API goes today:

- [hacker-screen](https://github.com/tankun1928/hacker-screen): a movie-style screen above the prompt where the code Claude writes pours out as it streams.
- [cod-skin](https://github.com/tankun1928/cod-skin): neon skins for the chat, with an animated banner, your own avatar and a background picture.

The render hooks for messages, the band above the prompt and panes go a long way. These are the walls I hit.

## What I'd like to see

1. **A theme for the whole window.** An accent colour, background and surface colours, and fonts for the sidebar, title bar, chat and prompt box, set in Settings and readable/writable by plugins (for example a `$.theme` noun, or a theme file a plugin ships).
2. **A full-window background picture.** Uploaded from Settings, with dim and blur sliders so text stays readable.
3. **A profile in the chat.** An avatar and display name beside the person's messages, set once and synced across the desktop, web and phone apps.
4. **More render sites for plugins on the desktop.** The sidebar, the header, the empty/home screen of a new chat, and the tool-call cards there.
5. **A picture picker for plugins.** Today a plugin can only take a picture by file path, and the desktop draws it only inside an SVG of at most 131,072 characters, so an avatar has to stay under about 44 KB. An upload control in the plugin UI, plus an `Image` element on the desktop that takes a plugin asset, would remove both limits.
6. **A theme gallery.** Browse, preview and install themes made by others with one click, the way plugins install from a marketplace today.

## Why it's worth it

- **People use what feels like theirs.** Custom themes, wallpapers and avatars are some of the most-loved features in code editors, terminals, chat apps and phones. People stay with tools they have made their own.
- **No AI assistant does this yet.** ChatGPT, Gemini and Copilot all look the same for everyone. Claude would be the first assistant you can truly personalise, which is easy to show off and share.
- **Every shared theme is free marketing.** A themes gallery turns users into creators, and every screenshot of a beautiful setup on social media brings new people to Claude.
- **The groundwork is already there.** Claude Code plugins can already draw messages, panes and animated SVG. Opening the rest of the window to the same API is an extension of what exists, not a new system.

## How it could start small

1. Settings: an accent colour and a background picture with dim/blur.
2. An avatar and display name in the chat.
3. A plugin API for the theme colours, then more render sites, then the gallery.

---

*Submitted by [@tankun1928](https://github.com/tankun1928). Built and tested with Claude Code plugins.*
