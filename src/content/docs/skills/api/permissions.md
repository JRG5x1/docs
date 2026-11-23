---
title: Permissions
description: The permissions a skill can ask for, what each one unlocks, how owners approve them, and what happens when a skill uses something it wasn't given.
---

A skill can always show its screen, speak, animate, play sounds, use the internet, and read and write its own Knowledge folder. Anything more private needs a permission listed in `manifest.json`. The owner agrees to it when installing:

```json
{
  "name": "Video Call",
  "version": "1.0.0",
  "supported": "3.2.0",
  "type": "skill",
  "permissions": ["microphone", "camera", "background"]
}
```

Ask only for what you use. Owners see the list before they install.

## The permissions

| Permission | What it unlocks |
|---|---|
| `microphone` | Listening and transcripts: `jibo.jetstream.startLocalTurn`, `subscribeGlobal`, `setHJMode`, `setHotwordMode`, speaker enrollment/ID (`startEnrollmentTurn`, `startNameLearningTurn`, `initNameLearning`, `createSpeakerModel`, `getEnrolledSpeakers`), the transcript events (`jibo.jetstream.events.localTurnResult`, `globalTurnResult`, `speakerID`, `speakerEnrollment`, `untyped`, `jibo.globalEvents.skillLaunch`, `skillRelaunch`), and `getUserMedia({ audio: true })`. **Only while your skill's screen is open.** |
| `camera` | `jibo.media.takePhoto`, `getCameraStream`, `getUserMedia`, `getPreviewUrl`, `setViewfinder`, `getPhoto`, `getUrl`, `getUrlById`, and `getUserMedia({ video: true })`. **Only while your skill's screen is open.** |
| `background` | Running the `jibo.background` script from your `package.json`. Without it, the script is never started. |
| `local-network` | Connecting to other devices on the home network: private IP ranges (`10.x`, `172.16–31.x`, `192.168.x`, `169.254.x`, `100.64–127.x`, IPv6 `fc00::/7`, `fe80::/10`), `.local`, `.lan`, `.home` and `.internal` names, and names without a dot. |
| `jibo-apis` | Connecting to Jibo himself: `localhost`, `127.x`, `::1`, `0.0.0.0`, the robot's own addresses, and local sockets. This includes BEacon and Jibo's internal services. |
| `read-jibo-files` | Reading files outside `/opt/jibo/Knowledge` (other than your own installed files). |
| `edit-jibo-files` | Creating, changing or deleting files outside `/opt/jibo/Knowledge`. |
| `read-kb` | Reading other parts of the Knowledge base: other folders in `/opt/jibo/Knowledge`, or other `jibo.kb` slices. |
| `edit-kb` | Changing other parts of the Knowledge base. |
| `run-programs` | Starting programs (`child_process`: `spawn`, `exec`, `execFile`, `fork` and their `Sync` versions). A program can do anything, so this is **full access** to the robot, and BEacon tells the owner so. |

The manifest may only list these names, each once. Anything else stops the install with "permissions must list any of: ...".

### What needs no permission

- Your screen, speech, animations, sounds and `localStorage`.
- Internet requests to public addresses.
- Reading and writing your own Knowledge folder, `/opt/jibo/Knowledge/<name>/` (and `jibo.kb` slice `/<name>`), where `<name>` is your package name without `@be/`.
- Reading your own installed files.
- Launch phrases (they're matched by Jibo, not by your skill).

### How files are checked

Paths are resolved first (symlinks and `..`), so a link out of your folder doesn't get around the check. Write access is checked for `writeFile`, `appendFile`, `createWriteStream`, `mkdir`, `rmdir`, `unlink`, `rename`, `truncate`, `chmod`, `chown`, `utimes`, `symlink`, `link` and `copyFile` (and their `Sync` versions), and for `open` with a write flag. Reads are checked for `readFile`, `createReadStream`, `readdir`, `readlink` and `open`. Browser `file://` URLs count as file reads.

### Microphone and camera only while open

`microphone` and `camera` work only while your skill is the one on screen. A background script, or a timer left over after `close()`, can't listen or take photos. Call `api.open()` from your background script first.

## How owners are asked

- **Installing:** before BEacon installs a skill that has permissions, it shows the owner what each one allows and asks them to agree. If they don't, nothing is installed.
- **Updating:** an update keeps what the owner already agreed to. If the new version asks for **new** permissions, BEacon asks again for just those, and the update installs only once the owner allows them.
- **Removing** a permission from your manifest takes effect with the update.

After an update, the old copy of your skill can keep running until it closes. That old copy has **no** permissions, so close and reopen the skill after updating it.

## When a call is blocked

A blocked call throws an `Error`:

```
@be/my-skill needs the camera permission and its screen open to do this
@be/my-skill needs the local-network permission to do this
```

- Most calls (`fs`, `child_process`, `XMLHttpRequest.open`, `new WebSocket`, Node sockets, and the gated `jibo.jetstream` / `jibo.media` calls) **throw** right away. Wrap them in `try/catch`.
- `fetch` returns a **rejected Promise**.
- A Node socket to a host name that turns out to point at a private address is closed with the error once the name is resolved.
- Transcript **event handlers are simply not called**. No error is thrown.

```js
try {
    jibo.jetstream.startLocalTurn({ nluRules: ['launch'] }).then(/* ... */);
} catch (err) {
    this.log.warn(err.message);     // e.g. missing the microphone permission
    this.showMessage('Listening is turned off for this skill.');
}
```

## How a call is attributed to your skill

Jibo decides whose call it is by looking at the JavaScript call stack:

- For Jibo's own APIs (`jibo.jetstream`, `jibo.media`, `jibo.kb`), the call is yours if any of your skill's files are on the stack.
- For files, network and programs, the call is yours if the nearest real caller is one of your skill's files. Node's own modules and common helper libraries such as `axios`, `request`, `ws`, `node-fetch`, `fs-extra`, `graceful-fs`, `mkdirp`, `rimraf` and `glob` are skipped. So when Jibo's own code does work for you (for example loading your images), it isn't blocked.

Libraries you bundle inside your skill's ZIP count as your skill.

## This is not a sandbox

Permissions stop skills from reaching private things **by accident or casually**. They're not a security boundary. Custom skills run inside Jibo's own program, so a deliberately malicious skill can get around them, for example through native code, timing tricks through Jibo's libraries, or browser requests to names that point at the home network. `run-programs` is full access by design.

Owners should only install skills from people they trust. As a developer, ask for the fewest permissions you can and say in your README why you need each one.
