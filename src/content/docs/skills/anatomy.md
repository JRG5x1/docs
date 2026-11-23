---
title: Anatomy of a skill
description: Every file in a skill ZIP, what Jibo checks when you install it, and the rules your code runs under.
---

## The ZIP

```text
my-skill.zip
  manifest.json        required: name, version, type "skill", supported, and options
  icon.png             required: the main-menu button icon
  README.md            optional: shown in the Store details
  banner.png           optional: the Store card image (16:9)
  my-skill/            your skill package (any folder name)
    package.json       required: name "@be/<id>", jibo.type "asset-pack"
    index.html         loads index.js
    index.js           your BeSkill class
    background.js      optional: a background script
    ...                any other files your skill uses (images, sounds, more .js)
```

`manifest.json` must be at the top of the ZIP, or inside one top-level folder. There must be exactly **one** `package.json` at the top or one folder down (files deeper inside, like a `node_modules` you ship, don't count). Jibo never runs `npm install`, so ship any dependencies inside the ZIP.

## What Jibo checks at install

BEacon refuses the ZIP, with a message, if any of these fail:

- The ZIP is at most **32 MB**, has at most **1024** files, and unpacks to at most **64 MB**.
- `manifest.json` is valid (see [manifest.json](/reference/manifest/)) and its `type` is `"skill"`.
- `package.json` has a `name` of `@be/` plus lower-case letters, numbers and dashes (up to 80), not taken by a built-in skill, and `jibo.type` is `"asset-pack"`.
- `main` in `package.json` points to a `.js` file that exists in the ZIP.
- `icon.png` is at the manifest's level.
- `supported` is **3.2.0 or newer**, and not newer than the robot's version. Skills without it, or made for an older Jibo, are refused. (Ones installed before a robot updated to 3.2.0 stay installed but turned off until their developer updates them.)
- If the skill asks for [permissions](/skills/api/permissions/), the owner agrees to them.

## The package

**package.json**

```json
{
  "name": "@be/my-skill",
  "version": "1.0.0",
  "main": "index.js",
  "config": { "standalone": true },
  "jibo": {
    "main": "index.html",
    "type": "asset-pack",
    "display-name": "my-skill",
    "prompt": "My Skill",
    "background": "background.js"
  }
}
```

- `name` is your skill's ID forever. If you change it, Jibo treats it as a different skill.
- `jibo.background` is only for [background scripts](/skills/background/); leave it out otherwise.

**index.html** is always the same small page that creates your skill:

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>body { margin: 0; overflow: hidden; background: #000; } #face { width: 1280px; height: 720px; }</style>
</head>
<body>
    <div id="face"></div>
    <script>const Skill = require('./index'); const skill = new Skill();</script>
</body>
</html>
```

**index.js** exports a class that extends `BeSkill`. See [Lifecycle](/skills/api/lifecycle/).

You can `require()` your own files with relative paths (`require('./timer')`), plus `jibo`, `@be/be-framework` and Node's built-in modules (`fs`, `path`, `events`, …).

## The JavaScript you can use

Skills run in Chrome 53 with Node 6:

| Works | Doesn't work |
| --- | --- |
| `class`, `extends`, `super` | `async` / `await` |
| arrow functions, `const`, `let` | object spread `{ ...a }` and rest in objects |
| template strings, destructuring | optional chaining `a?.b`, `??` |
| `Promise`, `Map`, `Set`, `fetch` | `Object.values`, `String.prototype.padStart` |

Putting `'use strict';` at the top of every file is a good habit; the examples here do.

## Where things are on the robot

After install, your package lives in Jibo's custom skills folder, and each installed version gets a fresh folder, so don't store data next to your code. Use your skill's Knowledge folder instead, `/opt/jibo/Knowledge/<id-without-@be/>/`, which survives updates. See [Camera, storage and network](/skills/api/media-and-data/).

## Updating

Upload a ZIP with the same package name and a version of your choice. BEacon replaces the old one. If the skill is open, the new version runs the next time it opens. If the update asks for new permissions, the owner is asked again.
