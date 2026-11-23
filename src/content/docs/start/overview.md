---
title: How 5x1 fits together
description: The pieces of 5x1 a skill or theme developer works with, and where your code runs.
---

5x1 brings Jibo back with new robot software and free cloud services. As a developer you mostly deal with three things on the robot itself.

## On the robot

**Be** is the program that draws Jibo's face and runs his skills (clock, weather, games, your skills). It runs in an old version of Electron, so skills run with **Chrome 53 and Node 6**. Modern JavaScript up to ES2015 works (classes, arrow functions, `const`/`let`, template strings, promises). `async`/`await`, object spread (`{...x}`) and optional chaining (`a?.b`) do **not** work, so don't use them or transpile them away.

**BEacon** is Jibo's web app at `http://<jibo-ip>:8123`. Owners use it to change settings, browse the Store and install things. You use it to upload your skill or theme while you work on it. Everything BEacon does goes through its [HTTP API](/reference/beacon-api/), so you can script installs too.

**Skills** and **themes** are ZIP files you install through BEacon:

| | Skill | Theme |
| --- | --- | --- |
| What it is | A JavaScript app with its own screen | Images, sounds and JSON |
| Runs code | Yes, inside Be | Never |
| Shows up | As a button in Jibo's main menu (optional), by voice with launch phrases | When the owner applies it |
| Can use | Screen, touch, speech, animations, sounds, camera and microphone (with permission), the internet | — |

## Versions

A Jibo on 5x1 reports its version as the **Jibo-TBD** version, for example `3.2.0`. Your package's `supported` field is the lowest version it needs. Skills must say `"supported": "3.2.0"` or newer; older skills are turned off on 3.2.0 robots. See [manifest.json](/reference/manifest/).

## In the cloud

Speech recognition, Jibo's answers to questions, and Agent Mode run on 5x1's servers. Skills don't talk to those directly: you get the result, such as the words of a launch phrase, in your skill's `open()`. The 5x1 Store lists community skills and themes from their GitHub repositories.

## Where to go next

- [Set up for development](/start/setup/) (find your robot, optional SSH access)
- [Your first skill](/skills/first-skill/)
- [Your first theme](/themes/first-theme/)
