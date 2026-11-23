---
title: BEacon HTTP API
description: The JSON API that BEacon, the web app on every 5x1 robot, serves on port 8123.
---

BEacon is the web app that runs on the robot. Everything its pages do goes through a small HTTP API that you can call yourself.

## Basics

**Base URL:** `http://<jibo-ip>:8123`

**Format.** Requests and responses are JSON (`Content-Type: application/json`), except where an endpoint says it takes raw bytes (ZIP, PNG, audio) or returns an image or stream. Responses are sent with `Cache-Control: no-store`. A `HEAD` request is treated like `GET`.

**Errors.** A failed request gets a non-2xx status and this body:

```json
{ "error": "Theme not found" }
```

Some errors add a `detail` string, for example the permissions list on a skill upload `409`:

```json
{ "error": "Confirm before installing Hello Jibo", "detail": "microphone,background" }
```

| Status | When |
| --- | --- |
| 400 | Bad input, failed validation, or a body that is not valid JSON (`"Body is not valid JSON"`). Most handler errors use 400. |
| 401 | An endpoint that needs a bearer token (see below) got none or a wrong one. |
| 403 | A cross-site browser request (see below). |
| 404 | Unknown endpoint (`"Unknown endpoint: GET /api/nope"`), or a missing item. Missing files are a plain-text `Not found`. |
| 408 | A ZIP or file upload took more than 120 seconds. |
| 409 | A confirmation is needed, or the robot is busy (camera streaming, privacy mode). |
| 413 | The body is over the endpoint's size limit (`"Upload is larger than the 32 MB limit"`). |
| 503 | The robot feature is not available (for example screen capture outside Be). |
| 504 | A long operation (install, refresh, apply) hit its time limit. You can retry. |
| 500 | A bug. |

**Body size limits.** JSON bodies default to 1 MB; most endpoints set a smaller one (4 KB for simple settings, 8 KB for Agent Mode, 64 KB for skill settings, 128 KB for the menu). ZIP uploads are limited to 32 MB. Other upload limits are listed with each endpoint.

**No login.** BEacon has no accounts and no login. Anyone who can reach port 8123 can use the API, so BEacon is meant for your home network only. Do not forward or expose port 8123 to the internet.

Two checks still apply:

- **Cross-site requests.** Any non-`GET` request whose `Origin` (or, if missing, `Referer`) header names a different host than the `Host` header is refused with `403 {"error":"Cross-site requests are not allowed"}`. Tools like `curl` send neither header, so they are not affected. BEacon sends no CORS headers.
- **Bearer token on a few endpoints.** `/api/battery`, `/api/telemetry`, `/api/activity`, `POST /api/sleep` and the camera stream's `status`, `control`, `image` and `video` endpoints are made for the Home Assistant integration. They need an `Authorization: Bearer <password>` header, where the password is the one the robot generates when you pair it with Home Assistant (you approve that on Jibo's screen). Without it they return `401 {"error":"Camera authentication failed"}` (the same message for all of them).

**Camera streaming lock.** While a camera stream is running, every non-`GET` request except `/api/camera-stream/control` and `/api/camera-stream/settings` returns `409 {"error":"Stop camera streaming before using other robot controls"}`.

**IDs.** Installed skills and themes have a 24-character hex `id`. Store entries also have a 24-character hex `id`, which is different from the ID of the installed copy. Skill settings use the skill's package name (for example `@be/hello-jibo`) instead.

## Status and device

### GET /api/status

Robot and BEacon status. No token needed.

```bash
curl http://<jibo-ip>:8123/api/status
```

```json
{
  "name": "BEacon",
  "host": { "name": "@be/be", "version": "3.2.0" },
  "robot": true,
  "hostname": "<robot-name>",
  "platform": "linux 3.10.104",
  "versions": { "node": "6.5.0", "electron": "1.4.3", "chrome": "53.0.2785.113" },
  "uptimeSeconds": 43811,
  "addresses": [ { "iface": "wlan0", "address": "<jibo-ip>" } ],
  "paths": {
    "beRoot": "/opt/jibo/Jibo/Skills/@be/be",
    "skillsRoot": "/opt/jibo/Jibo/Skills/@be/be/skills",
    "photosDir": "/opt/jibo/Photos",
    "photosDirExists": true,
    "texturesDir": "...",
    "dataDir": "/opt/jibo/Knowledge/beacon",
    "jetstreamConfig": "/usr/local/etc/jibo-jetstream-service.json",
    "credentialsPath": "/var/jibo/credentials.json"
  },
  "theme": { "name": "None", "live": true },
  "skill": "idle",
  "battery": { "level": 100, "pluggedIn": true }
}
```

- `host.version` is the 5x1 release the robot runs.
- `theme.name` is the active theme's name, `"3D Eye"`, `"Mixed (<eye>, <menu>, <extras>)"` or `"None"`. `theme.live` is `false` when the theme is saved but only shows after a restart.
- `skill` is `"idle"`, the running skill's name without the `@be/` prefix, or `null`.
- `battery` is `null` when there is no reading.

### GET /api/battery

Needs the bearer token. Returns the battery level, rounded to one decimal.

```json
{ "battery": 87.5 }
```

`503` when no reading is available.

### GET /api/telemetry

Needs the bearer token. Each value is `null` when the robot cannot read it.

```json
{
  "battery": 87.5,
  "battery_temperature": 31.2,
  "main_board_temperature": 45.1,
  "cpu_temperature": 52.3,
  "system_voltage": 4.1,
  "plugged_in": true,
  "charging_state": "Charging",
  "fan_speed": 40,
  "speaker_volume": 60,
  "hatch_open": false
}
```

`charging_state` is `"Charging"`, `"Not Charging"`, `"Not Plugged In"` or `null`. `fan_speed` and `speaker_volume` are percentages.

### GET /api/activity

Needs the bearer token.

```json
{ "audio_level": -42.7, "head_touch": false, "sleeping": false }
```

- `audio_level`: microphone input level (RMS, dB).
- `head_touch`: `true` while any head touch pad is pressed.
- `sleeping`: `true` when Jibo is asleep or napping.

### GET /api/services

Jibo's own system services from the robot's service registry, and whether each one has a web page.

```json
{
  "services": [
    { "name": "body", "port": 8282, "page": false, "title": null, "up": true }
  ]
}
```

## Skills

### GET /api/skills

Every skill Be knows: built-in skills from `@be/be` plus installed custom skills (custom ones have `"custom": true`).

```json
{
  "skillsRoot": "/opt/jibo/Jibo/Skills/@be/be/skills",
  "host": { "name": "@be/be", "version": "3.2.0" },
  "counts": { "registered": 40, "eager": 12, "lazy": 28, "onDisk": 40, "unregistered": 0 },
  "skills": [
    {
      "name": "@be/hello-jibo",
      "dir": "/opt/jibo/Knowledge/beacon/skills/packages/<revision>/hello/",
      "installed": true,
      "version": "1.0.0",
      "displayName": "Hello Jibo",
      "prompt": "Hello Jibo",
      "description": "# Hello Jibo\n\n...",
      "type": "asset-pack",
      "registered": true,
      "load": "lazy",
      "roles": [],
      "custom": true
    }
  ]
}
```

Built-in entries also have `hasLaunchRule`, and `roles` such as `"default"` or `"first contact"`.

### GET /api/skills/custom

Installed custom skills.

```json
{
  "skills": [
    {
      "id": "34cb47bc33e9c95a5fa6d7b8",
      "manifest": {
        "name": "Hello Jibo",
        "version": "1.0.0",
        "supported": "3.2.0",
        "type": "skill",
        "themes": true,
        "menuButton": true,
        "phrases": ["say hello world"],
        "buttonColor": ["#29D780", "#0F6B3D"]
      },
      "packageName": "@be/hello-jibo",
      "packageRoot": "hello/",
      "images": { "icon.png": { "width": 330, "height": 330 } },
      "readme": "# Hello Jibo\n\n...",
      "revision": "80b0ac1b61e98b7c21d281a5",
      "origin": { "kind": "zip", "name": "hello-jibo.zip" },
      "installedAt": "2026-11-23T16:43:22.246Z",
      "compatibility": { "current": "3.2.0", "minimum": "3.2.0", "status": "compatible" }
    }
  ]
}
```

- `origin.kind` is `"zip"` for uploads or `"store"` for Store installs. Store installs also have `url`, `commit`, `release`, `readmeUrl`, `developer` and `stars`.
- `compatibility.status` is `"compatible"`, `"incompatible"` or `"unverified"`. A skill whose `supported` is older than 3.2.0 stays installed but is turned off: its status is `"incompatible"` and it has `outdated: true` and a `message`.

### POST /api/skills/install

Download and install a skill from the Store.

| Field | Type | |
| --- | --- | --- |
| `entryId` | string | Store entry ID from `GET /api/store`. |
| `requestId` | string, optional | 1–80 of `A-Z a-z 0-9 _ -`. Use it to poll `/api/skills/progress`. |
| `accept` | string[], optional | Permissions the owner agreed to. |

```bash
curl -X POST http://<jibo-ip>:8123/api/skills/install \
  -H 'Content-Type: application/json' \
  -d '{"entryId":"<store-entry-id>","requestId":"dl1","accept":["microphone"]}'
```

Returns the same shape as `GET /api/skills/custom`.

Errors:

- `409 {"error":"<name> asks for: camera, background. Allow it to install.","detail":"camera,background"}` when the skill needs permissions that are not in `accept`. An update keeps permissions that were agreed to before.
- `400` when another skill download is running, the entry is unknown (`"Refresh the storefront before installing this skill"`), the skill is incompatible, or the same skill is installed from another source.

### GET /api/skills/progress

`?id=<requestId>`. Progress of the current Store download.

```json
{ "id": "dl1", "entryId": "<store-entry-id>", "state": "downloading", "percent": 42, "received": 120000, "total": 285000 }
```

`state` is `"resolving"`, `"downloading"`, `"validating"`, `"complete"` or `"failed"` (with `error`). An ID that is not the current download returns `{ "id": "<id>", "state": "idle" }`.

### PUT /api/skills/upload

Install a skill ZIP. Body: the raw ZIP (up to 32 MB). Query: `name` (file name, for the record) and `accept` (comma-separated permissions).

This installs at once, without the confirmation step that `PUT /api/store/upload` has. If the skill needs permissions missing from `accept`, it returns `409` with the missing ones in `detail`. Returns the same shape as `GET /api/skills/custom`. Prefer `PUT /api/store/upload`, which handles skills and themes.

### DELETE /api/skills

`?id=<installed skill id>` (the 24-character `id`, not the package name). Stops and removes the skill. Returns the same shape as `GET /api/skills/custom`. `400 {"error":"Skill not found"}` if unknown.

### GET /api/skills/asset

`?id=<installed skill id>&name=icon.png` (or `banner.png`). Returns the PNG. `400 {"error":"Unknown skill asset"}` for other names or an unknown skill.

## Skill settings

Custom skills can declare settings in `manifest.json` (`settings`). These endpoints read and change their values. `id` is the skill's **package name**, for example `?id=@be/hello-jibo`. A skill without settings returns `404 {"error":"That skill has no settings."}`.

### GET /api/skills/settings

```json
{
  "settings": [
    { "id": "greeting", "type": "text", "label": "Greeting", "maxLength": 200, "default": "" },
    { "id": "loud", "type": "boolean", "label": "Loud", "default": false },
    { "id": "speed", "type": "slider", "label": "Speed", "min": 0, "max": 100, "step": 1, "default": 0 },
    { "id": "photo", "type": "image", "label": "Photo", "default": null }
  ],
  "values": {
    "greeting": "Hi!",
    "loud": false,
    "speed": 50,
    "photo": "/opt/jibo/Knowledge/hello-jibo/settings/photo.png"
  }
}
```

`settings` is the list from the manifest. `values` has every setting's current value, or its default if never set. File settings (`image`, `music`) hold an absolute path on the robot, or `null`.

### POST /api/skills/settings

Save text, switch and slider values. Body: `{ "values": { "<setting id>": <value> } }`. Only the listed settings change.

```bash
curl -X POST 'http://<jibo-ip>:8123/api/skills/settings?id=@be/hello-jibo' \
  -H 'Content-Type: application/json' \
  -d '{"values":{"greeting":"Hi!","loud":true,"speed":50}}'
```

Returns `{ "values": { ... } }`. `400` if a value has the wrong type, is out of range, is too long, or belongs to a file setting.

### PUT /api/skills/settings/file

Upload a file for an `image` or `music` setting. Query: `id`, `setting` (setting id), `name` (original file name; its extension decides the type). Body: the raw file. Replaces the previous file.

- `image`: png, jpg, jpeg, gif or webp, up to 10 MB.
- `music`: mp3, m4a, aac, wav or ogg, up to 30 MB.

Returns `{ "values": { ... } }`.

### GET /api/skills/settings/file

`?id=<package name>&setting=<setting id>`. Returns the file. `404 {"error":"No file is set."}` when there is none.

### DELETE /api/skills/settings/file

`?id=<package name>&setting=<setting id>`. Deletes the file and sets the value to `null`. Returns `{ "values": { ... } }`.

## Store

The Store lists skills and themes from storefronts. The default storefront is `https://store.5x1.com/manifest.json`. Listings refresh every 30 minutes in the background, and starring needs no GitHub account.

### GET /api/store

```json
{
  "sources": [
    {
      "id": "615bb048d499e51a669b8bb6",
      "url": "https://store.5x1.com/manifest.json",
      "entries": [ ... ],
      "refreshedAt": "2026-11-23T16:36:51.961Z",
      "error": null,
      "attemptedAt": "2026-11-23T16:36:51.982Z"
    }
  ],
  "entries": [
    {
      "name": "Hello Jibo",
      "type": "skill",
      "url": "https://github.com/<owner>/<repo>",
      "manifest": { "name": "Hello Jibo", "version": "1.0.0", "supported": "3.2.0", "type": "skill" },
      "readme": "...",
      "readmeUrl": "https://raw.githubusercontent.com/<owner>/<repo>/v1.0.0/README.md",
      "description": "...",
      "commit": null,
      "release": { "id": 123456789, "tag": "v1.0.0", "name": "v1.0.0", "url": "...", "publishedAt": "2026-11-20T12:00:00Z", "asset": null },
      "bannerUrl": "https://raw.githubusercontent.com/<owner>/<repo>/v1.0.0/banner.png",
      "developer": "<owner>",
      "stars": 3,
      "id": "<store-entry-id>",
      "sourceId": "615bb048d499e51a669b8bb6",
      "starred": false,
      "compatibility": { "current": "3.2.0", "minimum": "3.2.0", "status": "compatible" }
    }
  ],
  "jiboTbdVersion": "3.2.0",
  "catalogVersion": 2
}
```

`entries` is every source's listings in one list, each with `id`, `sourceId`, `starred` and `compatibility` added. Use the entry `id` for installs, details, banners and stars.

### GET /api/store/details

`?id=<id>`. If `id` is an installed skill or theme, returns that item (same shape as in `/api/skills/custom` or `/api/themes`; themes also get a `readmeUrl`). Otherwise, returns the Store entry with that ID. `400 {"error":"Store entry not found"}` if neither.

### GET /api/store/banner

`?id=<store-entry-id>`. Returns the entry's banner as PNG (cached on the robot). `404 {"error":"No banner is available"}` if it has none.

### POST /api/store/refresh

Fetch listings again. Body (all optional):

| Field | Type | |
| --- | --- | --- |
| `id` | string | Refresh only this source. Omit to refresh all. |
| `automatic` | boolean | `true` skips sources refreshed in the last ~29 minutes. |

Returns the same shape as `GET /api/store`. A source that fails keeps its old entries and gets an `error` message. `400 {"error":"Storefront not found"}` for an unknown `id`.

### POST /api/store/star

Body: `{ "id": "<store-entry-id>", "starred": true }`. Stars or unstars a GitHub listing. The robot signs the vote with its own identity. Returns the same shape as `GET /api/store`, with the new star count. `400` for listings that are not on GitHub, or `"Unable to star"` if the vote failed.

### GET /api/store/sources

The `sources` array from `GET /api/store`.

### POST /api/store/sources

Add a storefront. Body: `{ "url": "<manifest URL or GitHub repository URL>" }`. The URL must be HTTP or HTTPS without credentials. GitHub repository URLs are normalized to `https://github.com/<owner>/<repo>`. Up to 20 sources. Adding a URL that is already listed just refreshes it. The new source is refreshed right away. Returns the same shape as `GET /api/store`.

### DELETE /api/store/sources

`?id=<source id>`. Removes the source. Returns the same shape as `GET /api/store`.

### PUT /api/store/upload

Install a skill or theme from a ZIP on your computer. This is the endpoint to use while developing a skill. It is the same one BEacon's Store › Upload ZIP button uses.

- **Body:** the raw ZIP bytes (up to 32 MB). Uploads must finish within 120 seconds.
- **`name`:** the ZIP's file name, for example `?name=hello-jibo.zip`.
- **`accept`:** comma-separated permissions the owner agreed to. Use an empty value (`&accept=`) if the skill asks for none.

The type comes from `manifest.json`'s `type` (`"skill"` or `"theme"`).

**Skills install in two steps.** The first call without `accept` validates the ZIP and installs nothing. It returns `409` with the skill's requested permissions in `detail`, so a UI can show them ("Just so you know") before installing. `detail` is left out when the skill asks for no permissions.

```bash
curl -X PUT --data-binary @hello-jibo.zip \
  "http://<jibo-ip>:8123/api/store/upload?name=hello-jibo.zip"
```

```json
{ "error": "Confirm before installing Hello Jibo" }
```

Call it again with `accept`. If it lists every permission the skill asks for, the skill installs:

```bash
curl -X PUT --data-binary @hello-jibo.zip \
  "http://<jibo-ip>:8123/api/store/upload?name=hello-jibo.zip&accept="
# a skill that asks for permissions:
#   ...&accept=microphone,background
```

```json
{
  "type": "skill",
  "skills": [ { "id": "34cb47bc33e9c95a5fa6d7b8", "packageName": "@be/hello-jibo", "manifest": { ... }, ... } ]
}
```

The response is `"type": "skill"` plus the custom skill list (as in `GET /api/skills/custom`). Uploading the same package again replaces it. The new skill is added to the main menu and its background part, if any, restarts.

If `accept` is missing permissions, the response is `409 {"error":"<name> asks for: <list>. Allow it to install.","detail":"<missing,list>"}`. Permission names are `microphone`, `camera`, `background`, `local-network`, `jibo-apis`, `read-jibo-files`, `edit-jibo-files`, `read-kb`, `edit-kb` and `run-programs`.

Other `400` errors explain what is wrong with the package, for example `"Skill needs icon.png at the manifest root"`, `"Skill package name must be @be/<skill-name>"`, `"Custom skills cannot replace a built-in skill or host dependency"`, or the incompatibility message when `supported` is too old.

**Themes** install on the first call. `accept` is ignored. The response is:

```json
{ "type": "theme", "installed": "<theme id>", "themes": { ...same as GET /api/themes... } }
```

## Themes

### GET /api/themes

```json
{
  "active": null,
  "mix": null,
  "jiboTbdVersion": "3.2.0",
  "live": { "live": true, "reason": null },
  "themes": [
    {
      "id": "f1b3f49b091574ad12dc6e58",
      "manifest": { "name": "Green Eye", "version": "1.0.0", "supported": "3.1.6", "type": "theme" },
      "face": { "backgroundColor": "#000000", "eyeSize": 100 },
      "menu": { "menuType": "native", "buttonColors": false, "backgroundColor": "#000000", "buttonSize": 42, "iconSize": 70, "textSize": 15,
                "iconPlacement": { "x": 0, "y": 0 }, "textPlacement": { "x": 0, "y": -40 } },
      "images": { "face/eye.png": { "width": 832, "height": 832 } },
      "animationAssets": [],
      "icons": [],
      "hasFace": true,
      "hasMenu": false,
      "readme": "...",
      "revision": "c4e291cd21f7ad2b29173af5",
      "origin": { "kind": "zip", "name": "green-eye.zip" },
      "readmeUrl": null,
      "installedAt": "2026-10-25T06:08:48.095Z",
      "compatibility": { "current": "3.2.0", "minimum": "3.1.6", "status": "compatible" },
      "active": false,
      "pending": false
    }
  ]
}
```

- `active`: the active theme's ID, `"3d-eye"`, `"mix"`, or `null` for None.
- `mix`: when `active` is `"mix"`, `{ "parts": ["<eye name>", "<menu name>", "<extras name>"], "eye": ..., "menu": ..., "extras": ... }`, otherwise `null`.
- `live.live`: `false` means the change only shows after Jibo restarts.
- A theme's `pending`: it is active but an updated version is waiting to be applied.

### GET /api/themes/progress

`?id=<requestId>`. Like `/api/skills/progress`, with `themeId`, `received`, `total` and `error` fields. `state` can also be `"installing"`.

### POST /api/themes/install

Download a theme from the Store, or update an installed one.

| Field | Type | |
| --- | --- | --- |
| `entryId` | string | Store entry ID (for a new install). |
| `themeId` | string | Installed theme ID to update from its source instead (Store installs only). |
| `requestId` | string, optional | For `/api/themes/progress`. |

Returns `{ "installed": "<theme id>", "themes": { ...GET /api/themes... } }`. `400` if another theme download is running. Installing does not apply the theme.

### PUT /api/themes/upload

Install a theme ZIP. Body: raw ZIP (up to 32 MB). Query: `name`. Returns the same shape as `/api/themes/install`. Only accepts themes. Use `PUT /api/store/upload` for skills.

### POST /api/themes/apply

Make a theme active. Body:

```json
{ "id": "f1b3f49b091574ad12dc6e58" }
```

`id` can be:

- an installed theme's ID,
- `null` (or left out) for None, the stock look,
- `"3d-eye"` for the built-in 3D Eye theme,
- `"mix"` to combine parts of different themes. Add a `mix` object with `eye`, `menu` and `extras` keys. Each is an installed theme ID or `null` for stock, and `eye` can also be `"3d-eye"`:

```bash
curl -X POST http://<jibo-ip>:8123/api/themes/apply \
  -H 'Content-Type: application/json' \
  -d '{"id":"mix","mix":{"eye":"3d-eye","menu":"<theme id>","extras":null}}'
```

`eye` takes the theme's `face/` files, `menu` takes `menu/` and `icons/`, and `extras` takes the `atex/` animation art and `asfx/` sounds.

Returns the same shape as `GET /api/themes`. Check `live.live` to see whether it shows now or after a restart. `400` for an unknown or incompatible theme, or for a `mix` with keys other than `eye`, `menu` and `extras`.

### DELETE /api/themes

`?id=<theme id>`. If the theme is active, BEacon switches to None first. Returns the same shape as `GET /api/themes`.

### GET /api/themes/asset

`?id=<theme id>&name=<path in the theme>`, for example `name=face/eye.png`. Returns a PNG or SVG file from the installed theme. `400` for other file types or an unknown theme.

## Main menu

### GET /api/menu

```json
{
  "tree": [
    { "type": "skill", "id": "@be/hello-jibo" },
    { "type": "skill", "id": "clock" },
    {
      "type": "folder",
      "id": "folder-fun",
      "name": "Fun stuff",
      "colors": ["#e81853", "#850f40"],
      "icon": "resources/icons/fun-stuff.png",
      "children": [ { "type": "skill", "id": "joke" }, { "type": "skill", "id": "dance" } ]
    }
  ],
  "skills": [
    {
      "id": "clock",
      "type": "skill",
      "label": "Clock",
      "colors": ["#3765AB", "#1A2563"],
      "icon": "resources/icons/clock.png",
      "iconUrl": "/api/menu/icon?name=resources%2Ficons%2Fclock.png"
    },
    {
      "id": "@be/hello-jibo",
      "type": "skill",
      "label": "Hello Jibo",
      "colors": ["#29D780", "#0F6B3D"],
      "icon": "...",
      "customId": "34cb47bc33e9c95a5fa6d7b8",
      "iconUrl": "/api/skills/asset?id=34cb47bc33e9c95a5fa6d7b8&name=icon.png"
    }
  ],
  "icons": ["resources/icons/clock.png", "resources/icons/fun-stuff.png"],
  "favorite": null
}
```

- `tree`: the menu layout.
- `skills`: every skill that can have a button. Custom skills with `"menuButton": false` and turned-off skills are left out.
- `icons`: built-in icons you can use for folders.
- `favorite`: the shortcut panel's favorite skill ID, or `null`.

Built-in skill entries also carry the stock menu's `iconSrc` and `action` fields.

### POST /api/menu

Save the layout. Body: `{ "tree": [ ... ] }`, the same node shapes as above.

- A skill node is `{ "type": "skill", "id": "<skill id>" }`.
- A folder is `{ "type": "folder", "id": "folder-<a-z0-9->", "name": "<1-80 chars>", "colors": ["#rrggbb", "#rrggbb"], "icon": "<built-in icon or custom-….png>", "children": [ ... ] }`.

Folders can be nested up to 5 levels deep. Empty folders are dropped. Skills you leave out are added back at the top. Returns the same shape as `GET /api/menu`. `400` for duplicates, bad folders, or a skill that is no longer installed.

### POST /api/menu/favorite

Body: `{ "id": "<skill id>" }` or `{ "id": null }`. Sets the shortcut panel's favorite. Returns the same shape as `GET /api/menu`.

### GET /api/menu/icon

`?name=<icon>`, a built-in `resources/icons/<file>.png` or an uploaded `custom-<hash>.png`. Returns the PNG.

### PUT /api/menu/icon

Upload a folder icon. Body: a raw PNG up to 2 MB and at most 330 × 330 pixels. Returns `{ "icon": "custom-<24 hex>.png" }`. Use that name as a folder's `icon`.

## Screen

The screen is 1280 × 720. Captures are 640 × 360 JPEGs.

### GET /api/screen

```json
{ "available": true, "width": 1280, "height": 720, "method": "blit", "control": true }
```

### GET /api/screen.jpg

One JPEG of the screen. Optional `?q=<quality>` (20–90; default 42). `503` when not running on the robot.

### GET /api/screen/stream

A live MJPEG stream (`multipart/x-mixed-replace; boundary=jiboscreen`, about 30 fps at most). Use it as an `<img>` source.

### POST /api/screen/input

Touch the screen. Coordinates are in screen pixels (0–1279, 0–719).

| `type` | Other fields |
| --- | --- |
| `"tap"` | `x`, `y` |
| `"swipe"` | `direction`: `"up"`, `"down"`, `"left"` or `"right"` |
| `"pointer"` | `phase` (`"down"`, `"move"` or `"up"`), `x`, `y` |
| `"batch"` | `events`: up to 40 `{ "phase", "x", "y" }` objects |

```bash
curl -X POST http://<jibo-ip>:8123/api/screen/input \
  -H 'Content-Type: application/json' -d '{"type":"tap","x":640,"y":360}'
```

```json
{ "ok": true, "method": "electron", "x": 640, "y": 360, "phase": "up" }
```

A swipe also returns `gesture` (for example `"swipedown"`) and `direction`. A batch also returns `count`. Returns `409` while Jibo is asking on screen to approve a Home Assistant pairing, because that question must be answered on the robot.

## Photos

Photo IDs are UUIDs.

### GET /api/photos

The photos in Jibo's Gallery, newest first.

```json
{
  "available": true,
  "dir": "/opt/jibo/Photos",
  "count": 1,
  "photos": [
    { "id": "3f2b8c1e-9a4d-4e2f-8b1a-0c6d5e7f9a12", "file": "3f2b8c1e-9a4d-4e2f-8b1a-0c6d5e7f9a12.jpg", "created": 1763912345000, "size": 183422, "available": true }
  ]
}
```

When the media library is unavailable: `available: false`, an empty list and an `error` message.

### GET /api/photos/file

`?id=<photo id>`. Returns the JPEG. Add `&download=1` to get it as an attachment. `404` (plain text) if the photo is not found.

### DELETE /api/photos

`?id=<photo id>`. Returns `{ "ok": true, "removed": "<photo id>" }`. `404` if the photo is not in the Gallery.

## Camera stream

Streams Jibo's camera as 640 × 360 video at 15 fps. The owner must allow camera streaming in BEacon › More (on by default). Privacy mode blocks it. While a stream runs, other controls are locked (see Basics).

### GET /api/camera-stream/settings

No token needed. Returns `{ "enabled": true }`.

### POST /api/camera-stream/settings

No token needed. Body: `{ "enabled": false }` (boolean). Turning it off stops a running stream. Returns `{ "enabled": false }`.

### GET /api/camera-stream/status

Needs the bearer token.

```json
{ "state": "off", "streaming": false, "allowed": true, "width": 640, "height": 360, "targetFps": 15, "error": null }
```

`state` is `"off"`, `"starting"`, `"streaming"` or `"stopping"`.

### POST /api/camera-stream/control

Needs the bearer token. Body: `{ "action": "start" }`. The action is `"start"`, `"stop"` or `"toggle"`. Returns the status object. `409` if streaming is turned off in settings, if privacy mode is on, or if a stop has not finished yet.

```bash
curl -X POST http://<jibo-ip>:8123/api/camera-stream/control \
  -H 'Authorization: Bearer <password>' -H 'Content-Type: application/json' \
  -d '{"action":"start"}'
```

### GET /api/camera-stream/image

Needs the bearer token. One JPEG from the running stream. `409 {"error":"Camera stream is inactive"}` when it is not streaming.

### GET /api/camera-stream/video

Needs the bearer token. The live stream as `video/webm` (VP8). `409` when it is not streaming.

## Settings

### GET /api/units

```json
{ "temperature": "fahrenheit", "path": "/opt/jibo/Knowledge/beacon/units.json" }
```

### POST /api/units

Body: `{ "temperature": "celsius" }` (`"fahrenheit"` or `"celsius"`). Returns `{ "ok": true, "temperature": "celsius", "path": "..." }`.

### GET /api/wake-time

When Jibo wakes up from overnight sleep.

```json
{ "time": "06:45", "isDefault": true }
```

### POST /api/wake-time

Body: `{ "time": "07:30" }`. Must be `HH:MM` between `02:00` and `11:00`. Returns `{ "time": "07:30", "isDefault": false }`.

### GET /api/auto-update

`{ "enabled": true }`. When on (the default), skills and themes installed from the Store are updated after each background Store refresh. Uploaded ZIPs are never updated.

### POST /api/auto-update

Body: `{ "enabled": false }` (boolean). Returns `{ "enabled": false }`.

### POST /api/sleep

Needs the bearer token. Puts Jibo to sleep (if a skill is open, it is closed first). No body. Returns `{ "ok": true }`. `409` during camera streaming or privacy mode, or if the switch to sleep was denied or interrupted.

## Agent Mode

### GET /api/agent/settings

```json
{
  "provider": "openai",
  "endpoint": "",
  "model": "<model id>",
  "hasApiKey": true,
  "ready": true,
  "memory": false,
  "nickname": ""
}
```

The API key is never returned. `hasApiKey` only tells you whether one is saved. `ready` is `true` when everything the provider needs is set.

### POST /api/agent/settings

Save the settings. Body (up to 8 KB):

| Field | Type | |
| --- | --- | --- |
| `provider` | string | `free`, `openai`, `claude`, `gemini`, `openrouter`, `ollama`, `openclaw`, `hermes` or `custom`. |
| `endpoint` | string | Base URL (HTTP or HTTPS, no credentials, query or fragment). Required for `ollama`, `openclaw`, `hermes` and `custom`. Ignored for others. |
| `model` | string | Model ID, up to 256 characters. Required, except for `free`. |
| `apiKey` | string | The provider's key. Leave it out or send `""` to keep the saved key (only if provider and endpoint are unchanged). Required for the cloud providers and `hermes`. |
| `clearApiKey` | boolean | `true` deletes the saved key. |
| `memory` | boolean | Let Agent Mode keep memory notes. |
| `nickname` | string | Up to 30 letters, numbers, spaces, `'`, `.` or `-`. |

Fields you leave out keep their saved value. Returns the same shape as `GET /api/agent/settings`. `400` with a message such as `"Enter an API key."` or `"Select or enter a model."`.

### POST /api/agent/models

List the models a provider offers, using the settings in the body (same fields as above, nothing is saved). Fields you leave out come from the saved settings.

```json
{ "models": [ { "id": "<model id>", "name": "<display name>" } ] }
```

`400` if a key is needed but missing, or the provider cannot list models.

### GET /api/agent/memory

```json
{ "entries": [ { "id": "a1b2c3d4e5f60718", "text": "The owner's cat is called Miso.", "time": 1763912345000 } ] }
```

Memory notes are kept even while memory is turned off.

### DELETE /api/agent/memory

`?id=<entry id>`. Deletes one note and returns `{ "entries": [ ... ] }`. `400 {"error":"Missing id."}` without `id`.

### DELETE /api/agent/memory/all

Deletes every note. Returns `{ "entries": [] }`.

---

BEacon has other endpoints used by its own pages; they are internal and may change.
