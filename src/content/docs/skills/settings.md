---
title: Settings
description: Give your skill a Settings popup in BEacon (text, switches, sliders, images and music) and read the values in your code.
---

List `settings` in `manifest.json` and BEacon shows a **Settings** button on your skill in the Store's Skills tab. The owner's choices are saved in your skill's Knowledge folder, which your skill can read without any permission.

```json
{
  "settings": [
    { "id": "name", "type": "text", "label": "Your name", "default": "friend", "maxLength": 40 },
    { "id": "chime", "type": "boolean", "label": "Chime when done", "default": true },
    { "id": "minutes", "type": "slider", "label": "Minutes", "min": 1, "max": 60, "step": 1, "default": 25 },
    { "id": "picture", "type": "image", "label": "Background picture", "description": "PNG or JPG, shown behind the timer" },
    { "id": "song", "type": "music", "label": "Alarm song" }
  ]
}
```

## Fields

Every setting needs:

- `id`: unique; starts with a letter, then letters, numbers, `_` or `-`, up to 40 characters.
- `type`: `text`, `boolean`, `slider`, `image` or `music`.
- `label`: up to 60 characters.
- `description` (optional): up to 200 characters, shown under the label.

By type:

| Type | Extra fields | Default if left out |
| --- | --- | --- |
| `text` | `maxLength` 1–1000 (default 200), `default` text | `""` |
| `boolean` | `default` true/false | `false` |
| `slider` | `min` (0), `max` (100), `step` (1), `default` between them | `min` |
| `image` | — | none until the owner uploads one: PNG, JPG, GIF or WebP up to 10 MB |
| `music` | — | none until the owner uploads one: MP3, M4A, AAC, WAV or OGG up to 30 MB |

A skill can have 1 to 20 settings.

## Reading them

The values are in `/opt/jibo/Knowledge/<id>/settings.json`, where `<id>` is your package name without `@be/` (so `@be/pomodoro` → `/opt/jibo/Knowledge/pomodoro/settings.json`):

```json
{ "name": "Sam", "chime": false, "minutes": 15, "picture": "/opt/jibo/Knowledge/pomodoro/settings/picture.png" }
```

Settings the owner never changed are missing from the file, so fall back to your defaults. `image` and `music` values are full paths to the uploaded file.

Read the file every time the skill opens, so changes show up without a restart:

```js
'use strict';
const fs = require('fs');

const DEFAULTS = { name: 'friend', chime: true, minutes: 25, picture: null, song: null };

function readSettings() {
    let saved = {};
    try {
        saved = JSON.parse(fs.readFileSync('/opt/jibo/Knowledge/pomodoro/settings.json', 'utf8'));
    } catch (err) {
        // No file yet: the owner hasn't changed anything.
    }
    return Object.assign({}, DEFAULTS, saved);
}
```

They're ordinary files, so load them the same way you load your skill's own images. Music plays with an `Audio` element: `new global.Audio('file://' + settings.song).play()`.

You can also read and change the same values from a script with the [BEacon API](/reference/beacon-api/) (`/api/skills/settings`).
