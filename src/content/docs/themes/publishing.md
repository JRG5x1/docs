---
title: Publishing to the 5x1 Store
description: Share a theme or skill through GitHub releases and the 5x1 Store, or run your own storefront.
---

Every 5x1 robot's Store lists what is in the [5x1 Store](https://store.5x1.com). Listings come from public GitHub repositories: you publish releases on GitHub, and robots download them from there. This page covers themes and skills alike.

## 1. Set up a public GitHub repository

Put the package's files at the **root** of the repository, exactly as they go in the ZIP:

```text
manifest.json     required
README.md         what it is and does
banner.png        16:9 picture for the Store card
icon.png          skills only: the menu icon (required for skills)
face/ menu/ ...   the rest of your theme (or your skill's files)
```

- **`manifest.json`** must be at the repository root. Skills also need their `package.json`, and their manifest's `supported` must be `3.2.0` or newer, or robots refuse to install it.
- **`README.md`**: the first paragraph that isn't a heading becomes the card's description; the whole README shows in the details popup. Images in it can use paths relative to the README.
- **`banner.png`**: shown on the card, cropped to fill it. Use 16:9, for example 1280 × 720, and keep it under 2 MB. Without one, the card shows a placeholder.

Look at [Astra](https://github.com/ZaneThePython/Astra) or [Rewind16](https://github.com/ZaneThePython/Rewind16) for real examples.

## 2. Publish a release

Robots only install **published GitHub releases**, never the default branch. Drafts and pre-releases are ignored; the Store always uses your latest stable release.

1. On GitHub, open **Releases → Draft a new release**.
2. Create a tag such as `v1.0.0`.
3. Either attach a ZIP of the package, or attach nothing:
   - **Attached ZIP:** if the release has one ZIP, it is used. If it has several, name the one to install `<repository>.zip` (for example `Astra.zip`).
   - **No ZIP attached:** the tag's source code ZIP is used. This works because a manifest one folder deep is allowed.
4. Publish the release.

Rules the download is checked against:

- The ZIP must be **32 MB or smaller**, plus all the limits in the [Theme reference](/themes/reference/#limits).
- The `manifest.json` inside the ZIP must match the `manifest.json` in the repository at that tag. If you attach a ZIP, build it from the tagged files.
- The Store card's manifest, README and banner are read from the release tag, not from your latest commits.

## 3. Ship updates

To update, raise `version` in `manifest.json`, commit, and publish a **new release**. Then:

- The Store shows **Update** on robots that have an older release installed.
- Robots with **automatic updates** on (in BEacon under More; on unless the owner turned it off) install newer releases by themselves after a Store refresh. If the theme is in use, it is applied again so the new version shows.
- Copies installed by **Upload ZIP** are never updated automatically.

The 5x1 Store's copy of your repository refreshes every 15 minutes, and robots refresh the Store every 30 minutes, so a release can take a little while to appear.

## 4. Get listed in the 5x1 Store

The 5x1 Store's list lives in [JRG5x1/store](https://github.com/JRG5x1/store). Open a pull request that adds your repository to the `themes` or `skills` array of `manifest.json`, in the same style as the entries already there:

```json
{
  "themes": [
    "Astra", { "url": "https://github.com/ZaneThePython/Astra" },
    "Green Eye", { "url": "https://github.com/your-name/green-eye" }
  ]
}
```

Make sure the repository already has a published release, since the Store shows an error card for repositories without one. Each listing is reviewed by a person before it is merged.

Themes known to risk screen burn-in may get `"burnInWarning": true` next to their `url`, which shows a warning on the card. See the [Theme reference](/themes/reference/#burn-in-warning).

## Store Guidelines

Read the full [Store Guidelines](https://store.5x1.com/guidelines.html) before submitting. In short:

- **Submitting:** public repository with `manifest.json` (skills also need `icon.png`), a README that says what it does, an optional `banner.png`, and an installable ZIP of 32 MB or less. Updates go live from your repository, so they must follow the guidelines too.
- **Safety and privacy:** no malware, hidden behavior, tracking, ads or crypto mining. Skills ask only for permissions they use, explain each in the README, use the microphone and cameras only while open (unless they say otherwise and have the background permission), and never send recordings, photos, names or Jibo's memories off the robot without saying so clearly.
- **Quality:** it must install, open, close and uninstall cleanly. Test skills on a real robot and set `supported` to the lowest 5x1 version it works with. Voice-only skills should not add menu buttons. Name and describe it honestly.
- **Content and rights:** friendly for the whole home; you must have the right to share every image, sound, song and font; credit third-party licences; don't pretend to be Jibo Inc., 5x1, the Jibo Revival Group or anyone else.
- **Removal:** listings that break the guidelines, stop working or are abandoned may be removed.

Things installed from other storefronts or ZIP files are not reviewed.

## Custom storefronts

Anyone can host a storefront. In BEacon, open **Store → three-dot menu → Manage Storefronts → Add storefront** and enter either:

- the URL of a storefront `manifest.json`, or
- a single GitHub repository URL, which lists just that theme or skill.

A robot can have up to 20 storefronts, each with up to 100 entries per section. Storefronts refresh every 30 minutes; if a refresh fails, the last good listings stay usable.

### Storefront manifest

```json
{
  "themes": [
    { "name": "Astra", "url": "https://github.com/ZaneThePython/Astra" }
  ],
  "skills": [
    { "name": "Example", "url": "https://github.com/owner/skill" }
  ]
}
```

The alternating style used by the 5x1 Store also works: a name string followed by an object with the `url`. Entries can also carry `"burnInWarning": true`. Relative URLs are resolved against the storefront's own address, and only HTTP or HTTPS URLs without credentials are accepted.

Repositories that aren't in the 5x1 Store are fetched straight from GitHub without signing in, which GitHub limits to 60 requests an hour per network.

### Hosting without GitHub

An entry's `url` can point at a theme's `manifest.json` on any web server instead. Then:

- If the manifest has a `download` field with a ZIP URL (relative or absolute), that ZIP is installed. Skills must use this or GitHub.
- Otherwise BEacon fetches the standard files next to the manifest (`README.md`, `banner.png`, `face/...`, `menu/...`). Files in `icons/`, `atex/` and `asfx/` can't be discovered, so list them in the manifest:

```json
{
  "name": "Example",
  "version": "1.0.0",
  "type": "theme",
  "icons": ["clock.png", "radio.svg"],
  "atex": ["blackeye_blur1.png", "bg/black.png"],
  "asfx": ["device/ds_completion_01.m4a"]
}
```

Listed files must exist; a missing one stops the install.
