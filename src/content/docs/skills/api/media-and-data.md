---
title: Camera, storage and network
description: Take photos and stream the camera, save data and and reach the internet and your home network.
---

## Camera

All camera APIs need the `camera` [permission](/skills/api/permissions/) and only work while your skill's screen is open. While Jibo's privacy mode is on, `getUserMedia` refuses video and live streams stop.

### Take a photo

```js
jibo.media.takePhoto().then(photo => {
    // photo.id  - the photo's id
    // photo.url - a URL you can load into an <img> or a PIXI texture
    const img = new Image();
    img.onload = () => { if (!this.closed) this.showPhoto(img); };
    img.src = photo.url;
}).catch(err => this.log.warn('no photo', err));
```

`takePhoto(options)` also accepts a Node-style callback, `takePhoto((err, photo) => ...)`. Options:

| Option | Values |
|---|---|
| `camera` | `jibo.media.CameraID.RIGHT` (default) or `LEFT` |
| `photoType` | `jibo.media.PhotoType.SNAP` (1280×720, default), `PREVIEW` (640×360) |
| `undistort`, `flip`, `colorCorrection` | `true` by default. Set to `false` for a raw frame. |

Photos aren't saved to Jibo's gallery.

### Live camera and microphone

`jibo.media.getUserMedia({ audio, video })` returns a Promise for a standard `MediaStream`: the live microphone and/or a 640×360 video track at about 6 to 7 fps. Use it for video calls with WebRTC. `audio` needs the `microphone` permission and `video` needs `camera`. Calling `navigator.mediaDevices.getUserMedia` directly is gated the same way.

```js
jibo.media.getUserMedia({ audio: true, video: true }).then(stream => {
    if (this.closed) { stream.getTracks().forEach(t => t.stop()); return; }
    this.stream = stream;
    peerConnection.addStream(stream);
});
// close(): this.stream.getTracks().forEach(t => t.stop());
```

`jibo.media.getCameraStream(onData)` gives smooth 1280×720 VP8 WebM video (about 25 fps) straight from Jibo's hardware encoder. It resolves to `{ mimeType, stop }`, and `onData(buffer)` receives the WebM bytes in order, starting with the header. Send them over an `RTCDataChannel` and play them with `MediaSource` on the other side. Call `stop()` in `close()`.

Note: Jibo's camera runs one media pipeline at a time. Starting a second stream can stop the first one.

## Storage

### localStorage

The simplest option for small data such as high scores and preferences:

```js
const KEY = 'my-skill.state';      // prefix keys with your skill's name
load() { try { return JSON.parse(global.localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
save(state) { try { global.localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }
```

`localStorage` is shared by every skill on the robot. Prefix your keys, and don't store secrets in it.

### Your Knowledge folder

Each skill has its own folder at `/opt/jibo/Knowledge/<name>/`, where `<name>` is your package name without `@be/` (`@be/pizza-time` → `pizza-time`). Your skill can read and write there with Node's `fs` without any permission. The folder survives updates and reboots. Create it if it doesn't exist yet.

```js
const fs = require('fs');
const path = require('path');

dataDir() { return path.join('/opt/jibo/Knowledge', this.assetPack.slice(4)); }   // '@be/x' -> 'x'

saveScores(scores) {
    const dir = this.dataDir();
    try { fs.mkdirSync(dir); } catch (e) { /* already there */ }
    fs.writeFileSync(path.join(dir, 'scores.json'), JSON.stringify(scores));
}
```

Your skill can also **read** its own installed files (the ZIP contents, e.g. `path.join(__dirname, 'data.json')`). Write to the Knowledge folder instead: writing to your installed files needs a permission, and an update replaces them.

Everything else on disk needs a permission: `read-kb` / `edit-kb` for other parts of `/opt/jibo/Knowledge`, and `read-jibo-files` / `edit-jibo-files` for files outside it.

### Owner settings (settings.json)

If your `manifest.json` lists `settings`, the owner's choices are saved to `settings.json` in this same folder. See [Settings](/skills/settings/).

### Jibo's knowledge base (jibo.kb)

Jibo's own skills keep data in the knowledge base with `jibo.kb.createModel('/<slice>')`. Your skill's own slice is `/<name>` and needs no permission. Other slices need `read-kb` / `edit-kb`.

Note: `jibo.kb` from a custom skill hasn't been tested. Files in your Knowledge folder or `localStorage` are simpler and known to work.

## Network

| Where | Permission |
|---|---|
| The internet (any public address) | none |
| Your home network: `10.x`, `172.16–31.x`, `192.168.x`, `169.254.x`, `100.64–127.x`, IPv6 `fc00::/7` and `fe80::/10`, names ending in `.local`, `.lan`, `.home`, `.internal`, and names without a dot | `local-network` |
| Jibo himself: `localhost`, `127.x`, `::1`, `0.0.0.0`, the robot's own IP addresses, and local (Unix) sockets | `jibo-apis` |

`fetch`, `XMLHttpRequest`, `WebSocket` and `EventSource` work, as do Node's `http`, `https`, `net` and `dgram`.

```js
fetch('https://api.example.com/joke')
    .then(res => res.json())
    .then(joke => { if (!this.closed) jibo.tts.speak(joke.text); })   // plain-text TTS: no ESML escaping needed
    .catch(err => this.log.warn('joke failed', err));
```

- Set your own timeouts. A request can outlive your skill, so check `this.closed` before using the answer.
- Jibo's certificate store is old. Some HTTPS sites with newer root certificates may fail on the robot even though they work on your computer. Test your endpoints on a robot.
- Without the right permission, `fetch` rejects with the permission error, and `XMLHttpRequest.open`, `WebSocket`, Node sockets and so on throw it.

## Background scripts

A background script keeps running while your skill is closed and can bring its screen up. See [Background scripts](/skills/background/). Note that the microphone and camera stay blocked until your skill's screen is open, so call `api.open()` first.
