---
title: Theme reference
description: Every file, field and limit a Jibo theme can use, as checked by BEam 3.2.0.
---

This page lists everything a theme can contain. BEacon checks each theme against these rules when you upload or install it, and rejects the whole theme with an error if anything is wrong. For a walkthrough, start with [Make your first theme](/themes/first-theme/).

## Package layout

```text
manifest.json             required
README.md                 optional: Store description and details
banner.png                optional: Store card banner (16:9 recommended)
face/
  face.json               optional: background color, eye size, eye positions, 3D mode
  eye.png                 optional: open eye
  eyeClosed.png           optional: closed eye (blinks, petting, sleep)
  eyeListening.png        optional: eye while Jibo listens
  background.png          optional: face background
  eye.glb                 optional: your own 3D eye model (needs "eye3d": true)
menu/
  menu.json               optional: menu layout
  button.png              optional: button artwork
icons/                    optional: icon overrides (PNG or SVG)
atex/                     optional: animation art overrides (PNG)
asfx/                     optional: animation sound overrides
```

Everything except `manifest.json` is optional. Leave out a part and Jibo keeps his stock look for it. Other files in the ZIP (notes, source art, `.gitignore` and so on) are ignored and not installed, except that executable files (`.js`, `.sh`, `.py`, `.html`, `.exe` and similar) anywhere in the ZIP reject it, and SVG files are only allowed in `icons/`.

`manifest.json` must be at the root of the ZIP or inside exactly one folder, so GitHub's "Download ZIP" and release source archives work as they are.

## manifest.json

```json
{
  "name": "Astra",
  "version": "1.0.3",
  "supported": "3.2.0",
  "type": "theme"
}
```

| Field | Required | Meaning |
|---|---|---|
| `name` | yes | Up to 120 characters. The name identifies the theme: installing another theme with the same name replaces it. |
| `version` | yes | Semantic version, like `1.0.0` or `2.1.0-beta.1`. |
| `type` | yes | `"theme"`. |
| `supported` | no | The oldest 5x1 version the theme works with, like `"3.2.0"`. Robots that are older refuse to install or apply it. |

The fields `atex`, `asfx` and `icons` are also allowed for themes hosted as loose files; see [Custom storefronts](/themes/publishing/#custom-storefronts).

## face/face.json

```json
{
  "backgroundColor": "#000000",
  "eyeSize": 100,
  "eyes": [{ "x": 0, "y": 0 }],
  "eye3d": false
}
```

| Field | Default | Meaning |
|---|---|---|
| `backgroundColor` | `"#000000"` | Face background color, `#RRGGBB`. |
| `eyeSize` | `100` | Eye size as a percentage of the stock eye: `50` is half size, `300` triple. Greater than 0, at most 1000. |
| `eyes` | one eye | 1 to 8 eyes; see [Multiple eyes](#multiple-eyes). |
| `eye3d` | `false` | `true` draws the eye in 3D; see [3D mode](#3d-mode). |

Unknown fields are rejected.

### Eye images

All face images are PNG.

- **`face/eye.png`** replaces the open eye. Make it square with a transparent background; square images map onto the eye 1:1. The eye keeps all its normal movement and shape changes, and the picture bends with it. Pixel size does not change the displayed size; `eyeSize` does.
- **`face/eyeClosed.png`** fades in as the eye squashes shut (blinks, petting, sleep) and gets the same bending as the open eye. Without it, the open eye is used.
- **`face/eyeListening.png`** replaces the eye while Jibo shows his blue listening look. It is shown in its own colors, without the usual eye tint, lighting and glow. Without it, listening looks stock.
- **`face/background.png`** is stretched to fill the 1280 × 720 screen, over `backgroundColor`.

Animations that swap the eye for another picture (emoji, icons and so on) still show their own art; change those with [`atex/`](#animation-art-and-sounds).

### Multiple eyes

`eyes` shows several eyes at once. Each entry is an offset in screen pixels from where the eye normally sits: `x` to the right, `y` down, each from -1280 to 1280 (missing values are 0). Every eye uses the same pictures and moves and blinks together.

```json
{ "eyeSize": 60, "eyes": [{ "x": -280, "y": 0 }, { "x": 280, "y": 0 }] }
```

In 3D mode only one eye is shown.

### 3D mode

Set `"eye3d": true` in `face.json` to draw the eye as a real 3D object on top of the face. It follows every movement, blink and shape change of the normal eye.

- **Picture on a ball:** with just `face/eye.png`, your picture is wrapped onto a 3D ball, facing the viewer, so the front looks like your flat eye and it curves away at the sides. Blinks close 3D lids over it.
- **Your own model:** add `face/eye.glb`, a binary glTF 2.0 file of at most 8 MB (in Blender: File → Export → glTF 2.0, format "glTF Binary"). It is drawn instead of the ball, centered and scaled to the eye automatically, and squashed for blinks. The model's front faces the viewer along +Z, which is Blender's -Y front once exported. If the theme also has `face/eye.png`, that picture becomes the model's texture through the model's own UVs; otherwise the model keeps its own materials.

`face/eye.glb` without `"eye3d": true` is rejected.

### The built-in 3D Eye

The Store's second card, **3D Eye**, ships with 5x1: a grey 3D ball eye with no download. It is listed beside None and can be chosen as the eye in an [Advanced mix](#advanced-mix).

## menu/menu.json

```json
{
  "menuType": "native",
  "buttonColors": false,
  "backgroundColor": "#000000",
  "buttonSize": 42,
  "iconSize": 70,
  "textSize": 15,
  "iconPlacement": "x0 y0",
  "textPlacement": "x0 y-40"
}
```

The values above are the defaults.

| Field | Meaning |
|---|---|
| `menuType` | `"native"` keeps Jibo's page-by-page swiping. `"dynamic"` lays buttons out in one continuous row that you drag and that coasts to a stop anywhere, with no page dots. |
| `buttonColors` | `true` recolors `menu/button.png` with each button's own color pair: dark parts take the second color, bright parts the first, keeping shading and transparency. Grey artwork gives the most predictable result. `false` keeps the PNG's colors. |
| `backgroundColor` | Menu background, `#RRGGBB`. |
| `buttonSize` | Button height as a percentage of the 720-pixel screen height. |
| `iconSize`, `textSize` | Icon and label size as a percentage of the button height. |
| `iconPlacement`, `textPlacement` | `"x<number> y<number>"`, relative to the button center: +x right, +y up, each from -50 to 50 (50 reaches the button's edge). |

Sizes must be greater than 0 and at most 1000. Unknown fields are rejected.

`menu/button.png` replaces the button artwork and keeps its proportions. Without it, the stock buttons keep their normal colors.

Menu styling covers the main menu and skill menus that use Jibo's standard menu buttons. Titles are hidden while a menu theme is active. Without any `menu/` files, menus look stock.

## icons/

Put a PNG or SVG in `icons/` with the same file name as the icon you want to replace, for example `icons/clock.png`. Icons are matched by file name only, in the main menu, skill menus and skill screens. PNG and SVG are interchangeable: `icons/clock.svg` also replaces `clock.png`. Include only one format per name. `icons/` cannot have subfolders.

A custom skill's main-menu icon also matches its package name: the skill `@be/pizza` uses `icons/pizza.png` (or `.svg`). Icons for skills that aren't installed are kept until needed. Icons work without `menu/menu.json`.

**SVG rules:** static shapes, paths, text, gradients, masks, clipping and local `#id` references only. Scripts, event handlers, external resources, foreign markup, DTDs/entities and animation are rejected. Give positive `width` and `height` in pixels, or a `viewBox`; at most 4096 × 4096 and 1 MB. SVGs are drawn as images at least 330 pixels on their longest side.

## Animation art and sounds

`atex/` replaces PNG art used by Jibo's animations, and `asfx/` replaces their sounds. Include only the files you want to change, using the stock file name:

```text
atex/blackeye_blur1.png
atex/bg/black.png
asfx/ds_bloop_01.mp3
asfx/device/ds_completion_01.m4a
```

A plain file name finds its stock file wherever it is. If two stock files share that name, include the stock subfolder. A name that matches no stock file, or two overrides for the same stock file, rejects the theme.

- `atex/` files must be PNG. They load when an animation shows them.
- `asfx/` files can be `.wav`, `.mp3`, `.m4a`, `.ogg`, `.oga` or `.aif`, at most 16 MB each, and must really be that format.

Applying another theme or None restores the stock art and sounds.

## Limits

| What | Limit |
|---|---|
| ZIP file | 32 MB |
| Unpacked contents | 64 MB |
| Entries in the ZIP | 1024 |
| One PNG | 16 MB, at most 4096 × 4096 pixels |
| All images except `atex/` | 256 MB once decoded (width × height × 4 bytes each, summed) |
| `face/eye.glb` | 8 MB, binary glTF 2.0 |
| One SVG icon | 1 MB, at most 4096 × 4096 |
| One sound | 16 MB |
| All sounds, decoded | 64 MB |
| JSON files | 64 KB each |

ZIPs must not be encrypted, split into parts, or contain links, `..` paths, duplicate names or bad checksums. If the 256 MB image budget is exceeded, the error names the image that crossed it.

## Advanced mix

The last card under **Store → Themes**, **Advanced: mix themes**, builds a look from several installed themes:

| Part | Taken from the chosen theme |
|---|---|
| Eye | everything in `face/` (pictures, size, eye positions, background, 3D mode), or the built-in 3D Eye |
| Menus | everything in `menu/` and `icons/` |
| Sounds & animation art | everything in `asfx/` and `atex/` |

Each part can also be None. The mix keeps its own copy of the files, so it works offline and survives removing or updating the themes it came from (apply the mix again to pick up an update). Applying None or a single theme ends the mix.

## Skills that opt out

A custom skill can set `"themes": false` in its `manifest.json`. While that skill is open, only the theme's eye (`eyeSize`, eye, closed-eye and listening-eye pictures) applies; button art, icons, menu layout, backgrounds, `atex/` and `asfx/` are stock or the skill's own. The full theme returns when the skill closes.

## Burn-in warning

Some themes can cause burn-in or ghosting on certain screens. Store listings can be flagged with `"burnInWarning": true` next to the entry's `url` in the storefront's `manifest.json`; the card then says: *"This theme has been tested and may cause burn-in or ghosting on certain screens."* The flag belongs to the storefront entry, not to the theme's own manifest. See [Publishing](/themes/publishing/).
