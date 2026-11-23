---
title: manifest.json
description: Every field of manifest.json for skills and themes, with the rules BEacon checks at install.
---

Every skill and theme ZIP has a `manifest.json` at its top (or inside one top-level folder). It's at most 64 KB of JSON.

## Fields for everything

| Field | Required | Rules |
| --- | --- | --- |
| `name` | Yes | The display name, up to 120 characters |
| `version` | Yes | A semantic version like `1.0.0` or `1.2.0-beta.1` |
| `type` | Yes | `"skill"` or `"theme"` |
| `supported` | Skills: yes, `3.2.0` or newer. Themes: optional | The lowest Jibo version it works on |

Jibo compares `supported` with his own version (the Jibo-TBD version, shown on BEacon's Status page). If he's older, BEacon refuses the package.

## Skill fields

```json
{
  "name": "Pizza Timer",
  "version": "1.0.0",
  "supported": "3.2.0",
  "type": "skill",
  "buttonColor": "#F5A623 #9B5F0B",
  "menuButton": true,
  "themes": true,
  "phrases": ["start the pizza timer", "pizza timer for {minutes} minutes"],
  "permissions": ["microphone"],
  "settings": [
    { "id": "minutes", "type": "slider", "label": "Minutes", "min": 1, "max": 30, "default": 12 }
  ]
}
```

| Field | Default | Meaning |
| --- | --- | --- |
| `buttonColor` | `"#58BCEB #246487"` | The menu button's colours: one or two `#RRGGBB` values, as a string (`"#a #b"`) or a list. One colour is used for both |
| `menuButton` | `true` | `false` hides the main-menu button, for skills opened only by voice, a background script or another skill |
| `themes` | `true` | `false` turns off everything a theme changes except the eye (menu colours, icons, background, animation art and sounds) while your skill is open. Use it when your skill draws its own look |
| `phrases` | none | [Launch phrases](/skills/phrases/) |
| `permissions` | none | Private abilities the owner must allow: see [Permissions](/skills/api/permissions/) |
| `settings` | none | A Settings popup in BEacon: see [Settings](/skills/settings/) |

## Theme fields

Themes only need the four common fields. The rest of a theme lives in its own files (`face/face.json`, `menu/menu.json` and the images). See the [Theme reference](/themes/reference/).

```json
{
  "name": "Green Eye",
  "version": "1.0.0",
  "supported": "3.2.0",
  "type": "theme"
}
```

## Other files next to manifest.json

| File | Used for |
| --- | --- |
| `icon.png` | Skills: **required**, the menu button icon (330×330, white on transparent) |
| `banner.png` | Optional, the Store card picture (16:9) |
| `README.md` | Optional, the Store details. The first paragraph is the card text |
