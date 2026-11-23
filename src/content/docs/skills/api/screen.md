---
title: Screen and touch
description: Build your skill's screen with jibo.face.views, use Jibo's stock components and icons, handle taps and swipes, and draw your own graphics or video.
---

Jibo's face is a **1280 × 720** screen drawn with [PIXI.js](https://pixijs.com/) 4. You build a screen ("view") from a list of components, put it on the face with `changeView`, and take it off again in `close()`.

## A minimal screen

```js
const jibo = require('jibo');

open() {
    const views = jibo.face.views;
    const view = this.view = views.createView('View', {
        viewConfig: { type: 'View', id: 'my-skill', category: 'gui', ignoreSwipeDown: true },
        componentConfigs: [
            { type: 'Label', id: 'title', text: 'Hello!',
              position: { x: 640, y: 170 }, targetAnchor: { x: 0.5, y: 0.5 },
              style: { fontFamily: 'Proxima Nova Soft', fontSize: 64, fill: '#FFFFFF', fontWeight: 'bold' } },
            { type: 'ActionButton', id: 'go', iconSrc: 'jibo://resources/actionIcons/play.png',
              colors: [0x29D780, 0x0F6B3D], position: { x: 541, y: 290 },
              transform: { scaleX: 0.75, scaleY: 0.75 },
              action: { type: views.ActionData.CALLBACK, data: { callback: () => this.go() } } }
        ]
    });
    // Swipe down leaves the skill, like every Jibo screen.
    view.addAction(views.ActionData.CALLBACK, { callback: () => this.exit({ noElementsOfSurprise: true }) },
        true, false, views.GESTURE.SWIPE_DOWN);
    views.changeView({ addView: view });
}

close(done) {
    jibo.face.views.changeView({ removeAll: true, leaveEmpty: true }, () => done(), () => done());
}
```

## createView

```js
jibo.face.views.createView('View', { viewConfig: {...}, componentConfigs: [...] })
```

`viewConfig` fields that skills use:

| Field | Meaning |
|---|---|
| `type` | `'View'` |
| `id` | A name for your view. Use something unique to your skill. |
| `category` | `'gui'` for a skill screen. |
| `ignoreSwipeDown` | Set to `true` and add your own swipe-down action (see below). If you leave it `false`, a swipe down only closes the view and leaves an empty screen. |
| `transitionStageOnly` | `true` animates only your view's stage during transitions. The Store skills set it. |

`componentConfigs` is a list of components (below). After the view is created, `view.getComponentById(id)` returns a component so you can change it.

## Components

These component `type`s are built in:

| Type | What it is |
|---|---|
| `Label` | A line or block of text. |
| `ActionButton` | Jibo's round button with an icon (264 × 264 px before scaling). |
| `ActionBigButton` | A bigger round button (330 × 330 px). |
| `SkillButton` | A main-menu style button (330 × 300 px). |
| `Button` | A plain tappable image. |
| `Clip` | An Adobe Animate timeline (`.js`) exported for Jibo. |
| `List`, `ElementGroup`, `ContentButton`, `ContactButton`, `StandardButton`, `ListProgress` | Used by Jibo's own menus and lists. |

Note: this page documents `Label`, `ActionButton`, `Button` and `Clip` the way real skills use them. The other types exist but aren't covered here.

### Fields every component has

| Field | Meaning |
|---|---|
| `id` | Name used with `view.getComponentById(id)`. |
| `type` | One of the types above. |
| `position` | `{ x, y }` in screen pixels. `x` can also be `'LEFT'`, `'CENTER'` or `'RIGHT'`, and `y` can be `'TOP'`, `'CENTER'` or `'BOTTOM'`. An optional `margin` (number or `{ x, y }`) is added. |
| `transform` | E.g. `{ scaleX: 0.5, scaleY: 0.5 }`. |
| `action` | What a tap does. Usually `{ type: views.ActionData.CALLBACK, data: { callback: fn } }`. |
| `hitArea` | `{ x, y, width, height }` tap area. |

### Label

```js
{ type: 'Label', id: 'status', text: 'Ready',
  position: { x: 640, y: 600 }, targetAnchor: { x: 0.5, y: 0.5 },
  style: { fontFamily: 'Proxima Nova Light', fontSize: 40, fill: '#B0BBB2' } }
```

- `targetAnchor`: which point of the text sits on `position`. `{ x: 0.5, y: 0.5 }` centres it; `{ x: 0, y: 0 }` is the top-left corner.
- `style`: a [PIXI.TextStyle](https://pixijs.download/v4.6.2/docs/PIXI.TextStyle.html) object (`fontFamily`, `fontSize`, `fill`, `fontWeight`, `align`, `wordWrap`, ...).
- `bounds`: `{ width, height }` to fit the text into a box.
- Change the text later with `view.getComponentById('status').text = 'Done!'`.

**Fonts** built into Jibo:

- `Proxima Nova Soft` (normal and `fontWeight: 'bold'`): titles and big numbers
- `Proxima Nova Light`: captions and body text
- `Proxima Nova` (bold)

### ActionButton

```js
{ type: 'ActionButton', id: 'ok', iconSrc: 'jibo://resources/actionIcons/ok.png',
  colors: 'confirm', position: { x: 1068, y: 212 }, transform: { scaleX: 0.75, scaleY: 0.75 },
  action: { type: views.ActionData.CALLBACK, data: { callback: () => this.save() } } }
```

- `position` is the button's **top-left** corner. The button is 264 px wide, so with `scaleX: 0.75` it is 198 px wide, and `x: 541` centres it (`640 − 99`).
- `iconSrc`: a `.png` image (or a `.js` timeline).
- `colors`: `[highlight, shadow]` as numbers like `0x25F2FB`, or one of `'default'` (cyan), `'confirm'` (green), `'cancel'` (red).

**Stock icons** live at `jibo://resources/actionIcons/<name>.png`:

`add`, `audio`, `back`, `cancel`, `default`, `delete`, `edit`, `face`, `help`, `mic`, `not-in-loop`, `ok`, `pause`, `play`, `post`, `reply`, `restart`, `send`, `share`, `shutdown`, `stop`, `tag`, `time`

### Button and Clip

A `Button` shows your own image. A `Clip` plays an exported timeline. Both list their files in `assets`:

```js
const path = require('path');
const res = name => path.join(__dirname, 'resources', name);

{ id: 'up', type: 'Button', position: { x: 300, y: 190 },
  assets: [{ id: 'chevron', src: res('chevron.png'), type: 'texture' }],
  action: { type: views.ActionData.CALLBACK, data: { callback: () => this.up() } } }

{ id: 'panel', type: 'Clip', position: { x: 0, y: 0 },
  assets: [{ id: 'panel', src: res('panel.js'), type: 'timeline' }] }
```

After load, `view.getComponentById('panel').movieClip` is the PIXI animate MovieClip.

### Showing and hiding components

A pattern from the Store skills: put two buttons in the same place and show one at a time.

```js
show(id, visible) {
    const c = this.view.getComponentById(id);
    c.display.visible = visible;
    if (c.lockInput) c.lockInput(!visible);   // hidden buttons shouldn't take taps
}
```

`component.display` is its PIXI container. `component.setupHitArea(new PIXI.Rectangle(x, y, w, h))` enlarges a small button's tap area.

## Image paths

- **Your own files:** use an absolute path built from `__dirname`, e.g. `path.join(__dirname, 'resources', 'icon.png')`. Relative paths like `'./icon.png'` resolve against Jibo's page, not your skill.
- **Jibo's files:** `jibo://resources/...` (the `jibo` package). `core://resources/...` also works for the same stock files.
- `jibo.utils.PathUtils.getAssetUri('video/intro.mp4', this.assetPack)` turns a path inside your skill into a full path, and keeps absolute paths unchanged.

## changeView

```js
jibo.face.views.changeView(options, onComplete, onFailure, onLoaded)
```

| Option | Meaning |
|---|---|
| `addView` | The view to show (from `createView`). |
| `remove: true` | Remove the current view (shows the one under it, or the replacement in `addView`). |
| `removeAll: true` | Remove every view. |
| `leaveEmpty: true` | With `remove`/`removeAll`: leave the screen empty (Jibo's eye comes back after your skill closes). |
| `transitionOpen` / `transitionClose` | `views.TRANSITION.IN`, `OUT`, `UP`, `DOWN`, `LEFT`, `RIGHT`, `EYE` or `NONE`. |

Callbacks:

- `onComplete()`: the change finished.
- `onFailure(reason)`: it didn't happen (for example, another change interrupted it).
- `onLoaded()`: your new view's assets are loaded and `view.stage` exists. Add custom drawing here.

```js
views.changeView({ addView: view, transitionOpen: views.TRANSITION.IN, transitionClose: views.TRANSITION.OUT },
    () => { if (!this.closed) this.timer = setInterval(() => this.render(), 500); },
    () => { if (!this.closed) this.exit({ noElementsOfSurprise: true }); },
    () => { if (!this.closed) this.decorate(view); });
```

In `close()`, remove your view and call `done` in both callbacks so `close` always finishes:

```js
jibo.face.views.changeView({ removeAll: true, leaveEmpty: true }, () => done(), () => done());
```

## Taps and gestures

Components with an `action` handle their own taps. For the whole screen, use `view.addAction`:

```js
view.addAction(type, data, clearPrevious, toFront, gesture)
```

```js
const views = jibo.face.views;
// Swipe down = leave
view.addAction(views.ActionData.CALLBACK, { callback: () => this.exit({ noElementsOfSurprise: true }) },
    true, false, views.GESTURE.SWIPE_DOWN);
// Tap anywhere
view.addAction(views.ActionData.CALLBACK, { callback: () => this.next() }, true, false, views.GESTURE.TAP);
```

Gestures: `views.GESTURE.TAP`, `SWIPE_DOWN`, `SWIPE_UP`, `PAN`. Every skill should leave on swipe down.

A `TAP` action on the view catches taps **everywhere**, including on top of your buttons, so the buttons stop working. Use it only on screens without buttons.

## Drawing your own graphics

`global.PIXI` is Jibo's PIXI 4.6 and `view.stage` is your view's PIXI container (available in `onLoaded`). Anything you add there is removed with the view.

```js
decorate(view) {
    const PIXI = global.PIXI;
    const bg = new PIXI.Graphics();
    bg.beginFill(0x000000); bg.drawRect(0, 0, 1280, 720); bg.endFill();
    view.stage.addChildAt(bg, 0);                 // behind the components

    const dot = this.dot = new PIXI.Graphics();
    dot.beginFill(0x25F2FB); dot.drawCircle(790, 300, 22); dot.endFill();
    view.stage.addChild(dot);
}
```

To animate, change properties (`dot.alpha`, `x`, `rotation`) from a timer. Base animations on elapsed time (`Date.now()`), not on frame counts, because the frame rate changes with load.

## Video

Play video by drawing an HTML `<video>` element into a PIXI sprite on your view's stage. Jibo's own skills do it this way:

```js
playVideo(view, file) {
    const PIXI = global.PIXI;
    const video = this.video = document.createElement('video');
    video.src = jibo.utils.PathUtils.getAssetUri(file, this.assetPack);  // e.g. 'video/intro.mp4'
    video.volume = 0.5;
    const texture = this.videoTexture = new PIXI.Texture(new PIXI.VideoBaseTexture(video));
    const sprite = new PIXI.Sprite(texture);
    sprite.width = 1280; sprite.height = 720;
    view.stage.addChild(sprite);
    video.play();
}

close(done) {
    if (this.video) {
        this.video.pause();
        this.video.removeAttribute('src');
        this.video.load();                        // releases the decoder
        this.video = null;
    }
    if (this.videoTexture) { this.videoTexture.destroy(true); this.videoTexture = null; }
    // ...remove the view, then done()
}
```

- Encode **H.264 (baseline profile) + AAC in MP4**, 480p to 720p, with `-movflags +faststart`. Jibo's Chrome 53 can't play AV1 and struggles with heavy files.
- Keep files small. The skill ZIP limit is 32 MB, and long videos are better streamed from a URL.

Note: the video sample is a reduced version of what Jibo's built-in skills do. It hasn't been run on a robot as written.
