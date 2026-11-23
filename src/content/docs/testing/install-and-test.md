---
title: Install and test
description: Install your skill or theme from BEacon or one command, check it on the robot, update it, and remove it.
---

## From BEacon

1. Open `http://<jibo-ip>:8123` and go to **Store**.
2. Open the three-dot menu at the top and choose **Upload ZIP**.
3. Pick your ZIP. For a skill, BEacon shows a "Just so you know" notice, including any [permissions](/skills/api/permissions/) it asks for. Confirm to install.

Your package now shows up in the Store's **Skills** or **Themes** tab with **Remove** (and **Settings**, for skills that have them). Themes also get **Apply**.

If something is wrong with the ZIP, BEacon says what, for example *Skill needs icon.png at the manifest root* or *"play {song}" is too general to be a launch phrase*.

## From the command line

Everything BEacon does is an [HTTP API](/reference/beacon-api/), so you can install with `curl`. Uploading needs two calls for a skill: the first returns **409** with what to confirm, and the second says yes with `accept` (the permissions to allow, comma-separated, or empty):

```sh
JIBO=192.168.1.42
curl -X PUT --data-binary @hello-jibo.zip "http://$JIBO:8123/api/store/upload?name=hello-jibo.zip"
# 409 {"error":"Confirm before installing Hello Jibo"}

curl -X PUT --data-binary @hello-jibo.zip "http://$JIBO:8123/api/store/upload?name=hello-jibo.zip&accept="
# 200 {"skills":[...]}
```

For a skill that asks for permissions, list them: `&accept=microphone,camera`.

A tiny script makes edit, zip and install one step:

```sh
#!/bin/sh
# install.sh: zip the folder and install it on Jibo
set -e
JIBO=${JIBO:-192.168.1.42}
rm -f /tmp/skill.zip
(cd hello-jibo && zip -qr /tmp/skill.zip .)
curl -sf -X PUT --data-binary @/tmp/skill.zip \
  "http://$JIBO:8123/api/store/upload?name=skill.zip&accept=" > /dev/null && echo installed
```

## Testing a skill

Open it from the main menu, or say one of its launch phrases. Then check:

- **It opens** and draws its screen. If it doesn't, the error is in the [console](/testing/debugging/).
- **Swipe down** leaves the skill, and Jibo goes back to his eye.
- **Leaving cleans up**: no sound keeps playing, no timer fires later, no leftover graphics on the next screen.
- **Opening again** works, from the menu and by voice. Jibo creates your skill once and calls `open()` every time.
- **Speech and animations** look right with the volume up. Mute Jibo while you repeat a test many times.
- **Updating** works: upload a new version while the skill is installed. It's used the next time the skill opens.

A [background script](/skills/background/) restarts right away when you install an update.

## Testing a theme

Apply it from the Store's **Themes** tab, then check the eye (blinking, looking around, listening), the main menu, and a few skills. Go back to Jibo's normal look with **None** at the top of the Themes list. See [Your first theme](/themes/first-theme/).

## Removing

**Remove** in the Store, or:

```sh
curl -X DELETE "http://$JIBO:8123/api/skills?id=<id>"
```

where `<id>` is the `id` field from `GET /api/skills/custom`.

## If Jibo gets stuck

A skill runs inside the same program as Jibo's face. If it throws while drawing, or never calls `done()` in `close()`, Jibo can get stuck on its screen. BEacon keeps working when that happens: remove the skill there, then restart Jibo if his screen is still stuck (unplug him and plug him back in).
