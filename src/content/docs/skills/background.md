---
title: Background scripts
description: Run part of your skill all the time, with no screen, and bring the skill up when something happens.
---

A background script runs as soon as Jibo starts and keeps running while he does other things. Use it to wait for something, like a message from your server or a doorbell on your network, and then open your skill's screen.

It needs the `background` [permission](/skills/api/permissions/), which the owner agrees to at install.

## Set it up

1. Add `"background"` to `permissions` in `manifest.json`:

   ```json
   { "permissions": ["background"] }
   ```

2. Name the script in `package.json`:

   ```json
   { "jibo": { "main": "index.html", "type": "asset-pack", "background": "background.js" } }
   ```

3. The script exports `start(api)`, and optionally `stop()`:

   ```js
   'use strict';

   let timer = null;

   exports.start = function (api) {
       api.log.info('started from', api.rootPath);
       timer = setInterval(() => {
           // Only interrupt Jibo when he's idle, and not when we're already showing.
           if (api.isIdle() && !api.isOpen() && somethingHappened()) {
               api.open({ reason: 'doorbell' });
           }
       }, 30 * 1000);
   };

   exports.stop = function () {
       clearInterval(timer);
   };

   function somethingHappened() { return false; }
   ```

## The api object

| | |
| --- | --- |
| `api.skillId` | Your package name, like `@be/doorbell` |
| `api.rootPath` | The folder the script is in |
| `api.log.info/warn/error(...)` | Logs to Jibo's console with your skill's name in front |
| `api.isOpen()` | `true` while your skill's screen is showing |
| `api.isIdle()` | `true` when Jibo is idle, with no skill open |
| `api.open(data)` | Opens your skill over whatever is showing. Returns `false` if it's already open or can't load |

## When your skill opens this way

`open(result)` gets `result.nlu.intent === 'background'` and your `data` as `result.nlu.entities`:

```js
open(result) {
    const nlu = (result && result.nlu) || {};
    if (nlu.intent === 'background' && nlu.entities.reason === 'doorbell') {
        this.showDoorbell();
    } else {
        this.showHome();
    }
}
```

## When it runs and stops

- It starts when Jibo starts, and right after the skill is installed or updated.
- `stop()` runs when the skill is removed or updated (the new version's script starts right after).
- It doesn't run if the owner didn't allow `background`, or if the skill is turned off because it was made for an older Jibo.
- If `start` throws, Jibo logs the error and carries on without it.

The script runs inside Be, like the rest of your skill, so keep it light: no busy loops, and clear every timer in `stop()`.
