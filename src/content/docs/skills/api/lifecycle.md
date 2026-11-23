---
title: Skill lifecycle
description: How Jibo creates, opens, closes and unloads your skill, and what your skill must do at each step.
---

Every skill is one class that extends `BeSkill` from `@be/be-framework`. Jibo creates it once, then calls `open()` each time it comes on screen and `close()` each time it leaves.

```js
'use strict';
const jibo = require('jibo');
const BeSkill = require('@be/be-framework').BeSkill;

class MySkill extends BeSkill {
    constructor() {
        super(...arguments);      // always pass Jibo's options through
        this.timer = null;
    }
    open(result) {
        // build your screen, start timers, speak...
    }
    close(done) {
        clearInterval(this.timer);
        this.timer = null;
        jibo.tts.stop();
        jibo.face.views.changeView({ removeAll: true, leaveEmpty: true }, () => done(), () => done());
    }
}

module.exports = MySkill;
```

`module.exports` can be the class itself or an object with a `Skill` property.

## How Jibo runs your skill

1. **Load.** Before your skill first opens, Jibo `require()`s your package's `main` file and calls `new MySkill({ assetPack, rootPath })`. `assetPack` is your package name (`@be/my-skill`) and `rootPath` is the folder your skill is installed in. Both end up on `this`. (The `new Skill()` in your `index.html` is only used when the skill runs standalone. Inside Jibo, your `main` file is loaded directly.)
2. **postInit(done)** (optional) runs once after construction. Jibo waits for `done()` before the first open.
3. **preload(done)** (optional) runs before every open (not before a re-open). It must call `done()` within 5 seconds or the launch fails.
4. **open(result)** puts your skill on screen. The same instance is reused for every later open.
5. **close(done)** runs when your skill leaves the screen, for whatever reason.
6. **destroy(done)** (optional) runs when Jibo unloads the instance, for example when the skill is updated or removed.

Jibo checks your class when it loads it: `open` and `close` must be defined on your class itself, and you must **not** override `redirect` or `refresh`. A class that breaks these rules does not load.

Keep the constructor light. Do real work in `open()`.

:::caution
Always pass the constructor arguments to `super`. If `BeSkill` gets no `assetPack`, it thinks it's running standalone: it re-initialises Jibo's runtime and opens itself, which breaks inside Jibo.
:::

## open(result)

`open(result, refresh)` gets a `result` object that tells you how the skill was started. `result.asr.text` is always a string (empty when nobody spoke). `result.nlu` can be missing, so check it before you read it.

| Started by | `result.nlu.intent` | `result.nlu.entities` | `result.asr.text` |
|---|---|---|---|
| Main menu button | `'menu'` | `{ domain: ... }` | `''` |
| Launch phrase ([Listening](/skills/api/listening/)) | `'menu'` | the phrase's `{slots}`, e.g. `{ name: 'jackson' }` | what was said |
| Your background script's `api.open(data)` ([Media and data](/skills/api/media-and-data/)) | `'background'` | the `data` you passed | `''` |
| Another skill's `this.redirect(id, options)` | whatever that skill sent | whatever that skill sent | `''` unless it sent one |

```js
open(result) {
    const nlu = result && result.nlu || {};
    const entities = nlu.entities || {};
    if (nlu.intent === 'background') {
        this.showIncomingCall(entities.caller);
    } else if (entities.name) {
        this.call(entities.name);           // "Hey Jibo, call Jackson"
    } else {
        this.showHome();
    }
}
```

### Opening while already open

If your skill is asked to open while it is already on screen (for example, its launch phrase is said again), Jibo calls `open(result, true)` on the same instance **without** calling `close()` first. The second argument, `refresh`, is `true` in that case.

Your `open()` must cope with this. The simplest safe pattern, used by the skills in the Store, is to close your old screen first and then open again:

```js
open(result) {
    if (this.view) {
        this.close(() => this.open(result));
        return;
    }
    // ...build this.view...
}
```

## close(done)

`close(done, nextSkillName)` runs when your skill leaves the screen: the user swiped down, you called `this.exit()`, another skill or "Hey Jibo" took over, or Jibo needs the screen.

In `close()`:

- Stop everything you started: `clearInterval`/`clearTimeout`, Web Audio and `<video>`/`<audio>` elements, listening turns, network sockets, and gesture or event listeners.
- Stop speech with `jibo.tts.stop()` (or `jibo.embodied.speech.stop()`).
- Remove your screen with `jibo.face.views.changeView({ removeAll: true, leaveEmpty: true }, onDone, onFail)`.
- **Always call `done()`**, also when something failed. Call it once.

If `done()` is not called within **5 seconds**, Jibo logs an error and force-closes your skill anyway, and things you didn't clean up keep running in the background.

Callbacks you scheduled earlier can still fire after `close()`. Guard them:

```js
open() {
    this.closed = false;
    jibo.embodied.speech.speak('Hello!').then(() => {
        if (this.closed) return;             // the user left while Jibo was talking
        this.showNextStep();
    });
}
close(done) {
    this.closed = true;
    // ...clean up...
}
```

## destroy(done)

`destroy(done)` is called when Jibo unloads your skill instance, for example after an update or removal. Undo anything your constructor or `postInit()` set up. The default does nothing. If you override it, call `done()` when finished. Store skills commonly do:

```js
destroy(done) {
    this.close(err => super.destroy(baseErr => done(err || baseErr)));
}
```

## Leaving: this.exit(options)

Call `this.exit()` when your skill is finished, for example on swipe down or a "Done" button. Jibo then calls your `close()` and goes back to his idle eye.

```js
this.exit({ noElementsOfSurprise: true });
```

| Option | Effect |
|---|---|
| (none) | Jibo may play an "element of surprise" (a short surprise skill) before going idle. |
| `noElementsOfSurprise: true` | Go straight back to idle. Use this for a user's swipe down. |
| `globalNoMatch: true` | Go straight to idle with its "I didn't get that" handling. |

Only the skill that is currently on screen can exit. Calls from a skill that is not current are ignored (Jibo logs a warning).

## Opening another skill: this.redirect(skillId, options)

```js
this.redirect('@be/clock', {});
```

This closes your skill (your `close()` runs) and opens the other one. `skillId` is the full package name, like `@be/clock` or another custom skill's `@be/<name>`. `options` becomes the other skill's `open(result)`. Jibo always adds `options.asr = { text: '', confidence: 1 }` if you leave it out, and `nlu.entities = {}` if you send an `nlu` without entities.

Like `exit()`, it only works while your skill is the one on screen. If the target skill can't be loaded, Jibo logs the error and nothing happens. If the target is a custom skill, Jibo returns to idle.

## Logging: this.log

`this.log` is a logger tagged with your skill's name (`@be/my-skill` logs as `Be.MySkill`).

```js
this.log.info('opened with', result.nlu);
this.log.warn('weather API slow');
this.log.error('could not load', err);
```

`debug()` is also available.

## Rules of thumb

- Treat `open()` as possibly being called again at any time, and `close()` as possibly being called at any time.
- Keep `close()` fast, and always call `done()`.
- Use `exit({ noElementsOfSurprise: true })` when the user asks to leave.
- Use ES2015 only. Classes, arrow functions, `const`/`let`, template strings and Promises work. `async`/`await`, object spread (`{...a}`) and optional chaining (`a?.b`) do **not** (Jibo runs Chrome 53 / Node 6).
