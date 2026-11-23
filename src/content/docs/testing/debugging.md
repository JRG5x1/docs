---
title: Debugging
description: See your skill's console output and errors live with Chrome DevTools, over an SSH tunnel.
---

Skills run inside Be, Jibo's Electron app, which has Chrome's remote debugger turned on (port 9222, reachable only from the robot itself). With an SSH tunnel you get full Chrome DevTools: console, errors with line numbers, breakpoints and the network tab.

## Connect

1. Open a tunnel from your computer (the SSH password is `jibo`):

   ```sh
   ssh -N -L 9222:127.0.0.1:9222 root@<jibo-ip>
   ```

   Leave it running.

2. In Chrome or Edge on your computer, open `chrome://inspect`, choose **Configure…**, and add `localhost:9222`.

3. Jibo's page shows up under **Remote Target**. Click **inspect**.

Jibo's DevTools is from Chrome 53, so if the inspect window is blank, open `http://localhost:9222` instead and use the page's `devtoolsFrontendUrl` link.

## What to look at

- **Console:** your `console.log` and `this.log.info/warn/error` output, plus uncaught errors with the file and line. Your files show up under their install path.
- **Sources:** your skill's files. Set breakpoints in `open()` and open the skill again.
- **Network:** your `fetch` calls, if your skill uses the internet.

You can also type in the console. Everything the skills see is there, for example:

```js
require('jibo').embodied.speech.speak("Testing, <anim cat='happy' nonBlocking='true' /> one two.")
```

:::caution
The console runs code inside Jibo's main program. Reading things is safe; changing things can make Jibo misbehave until he restarts.
:::

## Common problems

| What you see | Usual cause |
| --- | --- |
| `Unexpected token` or `Unexpected identifier` at install or open | Modern JavaScript Node 6 doesn't support: `async`/`await`, `{...spread}`, `?.`. See [Anatomy of a skill](/skills/anatomy/#the-javascript-you-can-use) |
| The menu button opens nothing | An error in your constructor or `open()`. Check the console |
| Jibo stays on your screen after you leave | `close(done)` threw or never called `done()` |
| A sound keeps playing after you leave | Stop timers, audio and speech in `close()` |
| `@be/my-skill needs the camera permission to do this` | Your skill used something it didn't ask for in `permissions`. See [Permissions](/skills/api/permissions/) |
| The skill is missing from the menu | `menuButton` is `false`, or it was installed before 3.2.0 with an older `supported` |
| Nothing opens with a launch phrase | Jibo heard a different wording. The console logs `[launch-phrases] opening …` when one matches |
