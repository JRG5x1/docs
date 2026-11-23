---
title: Set up for development
description: Find your Jibo's address, open BEacon, and (optionally) connect over SSH for debugging.
---

## 1. Find your Jibo

On Jibo, open **Settings → More Settings**. It shows his address (like `192.168.1.42`) and a QR code that opens BEacon on your phone. You can also use [portal.5x1.com](https://portal.5x1.com) from a computer on the same network.

Open `http://<jibo-ip>:8123` in a browser. That's **BEacon**. Check the version on its **Status** page: you need **3.2.0** or newer.

:::caution
BEacon has no login. It's meant for your home network only, so never forward port 8123 to the internet.
:::

## 2. Tools on your computer

- A text editor.
- Something that makes ZIP files (every OS has one built in; on the command line `zip -r` or Python's `zipfile`).
- Optional: `curl`, to install from a script ([Install and test](/testing/install-and-test/)).
- Optional: Node.js, if you want to unit-test your skill's logic on your computer. Keep the code Node 6 compatible (no `async`/`await`).

Skills don't need a build step. If you prefer TypeScript or a bundler, that's fine: ship the compiled JavaScript in the ZIP, because Jibo never runs `npm install` or build scripts.

## 3. SSH (optional, for debugging)

5x1 robots accept SSH as `root` with the password `jibo`:

```sh
ssh root@<jibo-ip>
```

You only need it to see your skill's console output and errors live, through Chrome DevTools. See [Debugging](/testing/debugging/).

:::tip
Use a robot you don't mind restarting. A skill runs inside the same program as Jibo's face, so a crashing skill can freeze his screen until Be restarts by itself, or until you reboot him.
:::
