---
title: Speech, animation and sound
description: Make Jibo talk with ESML, play body animations, emojis and dances, change his light ring, and play your own sounds.
---

## Speaking

Jibo has two ways to talk:

| Call | What it does |
|---|---|
| `jibo.embodied.speech.speak(esml)` | Speaks with Jibo's personality: he moves while he talks, and ESML tags (below) play animations, emojis, dances and sounds. **Use this one.** |
| `jibo.tts.speak(text)` | Plain voice only, no movement. `text` is spoken as-is, so you don't have to escape anything. |

Both return a Promise that resolves when Jibo has finished speaking (or was stopped).

```js
jibo.embodied.speech.speak("Nice to meet you! <anim cat='happy' nonBlocking='true' />")
    .then(() => { if (!this.closed) this.showMenu(); })
    .catch(err => this.log.warn('speech failed', err));
```

Stop speech with `jibo.embodied.speech.stop()` or `jibo.tts.stop()`. Do this in `close()`.

Tips:

- ESML is markup. If you speak text you didn't write yourself (an API result, a user's name), escape `&`, `<` and `>` as `&amp;`, `&lt;` and `&gt;`.
- Keep each `speak()` call short. Jibo's own skills split long text into chunks of about 450 characters and speak them one after another.
- Only one speech plays at a time, so wait for the Promise before you speak again.

## ESML tags that work

These are the tags Jibo's own Agent Mode lets through, so they're known to play on 5x1 robots.

### Body animations: `<anim cat='...'/>`

```xml
That's great! <anim cat='happy' nonBlocking='true' />
```

`cat` picks a random animation from a category. `nonBlocking='true'` lets Jibo keep talking while it plays. Without it, speech waits for the animation to finish.

Categories that work well with speech:

`happy`, `laughing`, `excited`, `proud`, `affection`, `surprised`, `curious`, `thinking`, `question`, `confused`, `dontknow`, `yes`, `no`, `sad`, `worried`, `scared`, `oops`, `embarrassed`, `frustrated`, `disgusted`, `sleep`

Narrow the choice with `filter`, a comma-separated list of tags the animation must have. Put `!` in front of a tag to exclude animations that have it:

```xml
<anim cat='yes' filter='nod' nonBlocking='true' />
<anim cat='thinking' filter='look-up' nonBlocking='true' />
<anim cat='happy' filter='!audio-only' nonBlocking='true' />
```

Some filter words per category, from Jibo's animation database:

| Category | Some filter words |
|---|---|
| `happy` | `smile`, `wiggle`, `sway`, `spin`, `twirl`, `shake`, `success`, `small`, `big`, `short`, `long` |
| `yes` | `nod`, `bow`, `dip`, `acknowledge`, `approve`, `small`, `big` |
| `no` | `head-shake`, `nope`, `sorry`, `apologize`, `sympathy` |
| `laughing` | `chuckle`, `giggle`, `burst`, `lean-back` |
| `thinking` | `look-up`, `look-side`, `look-down`, `hesitant`, `waiting` |
| `sad` | `slump`, `look-down`, `head-tilt` |
| `question` | `head-tilt`, `curious`, `come-again` |

Many categories also have `audio-only` / `ssa-only` variants (sound with no movement) and `eye-only` / `body-only` variants.

### Emojis: `<anim cat='emoji' .../>`

An emoji shows a picture in Jibo's eye. Name it with one word in `filter`:

```xml
I love pizza. <anim cat='emoji' filter='pizza, !hf' layers='!audio' />
```

- Always add `!hf`. Otherwise you may get a "hot-frame" version that only blinks unless it's timed to a word.
- `layers='!audio'` plays the emoji without its sound.
- Emojis play **blocking** (no `nonBlocking`). A non-blocking emoji gets cut off by whatever comes next.
- Emoji words include `pizza`, `heart`, `cat`, `dog`, `star`, `fireworks`, `music`, `sun`, `cake`, `gift`, `rainbow`, `idea`, `thumbs-up`, `trophy`, and several hundred more (food, animals, sports, weather, holidays).

If the filter matches nothing, nothing plays. Test new words on a robot.

### Dances: `<anim cat='dance' .../>`

```xml
Watch this! <anim cat='dance' filter='music, rom-silly' />
```

The dance styles behind "Hey Jibo, dance" are `rom-upbeat`, `rom-ballroom`, `rom-silly`, `rom-slowdance`, `rom-electronic` and `rom-twerk`. Use `filter='music, rom-<style>'`. Dances play in full before Jibo continues.

### Sounds: `<ssa cat='...'/>`

Plays one of Jibo's little expressive sounds:

```xml
<ssa cat='laughing' /> That's funny.
```

Categories: `happy`, `affection`, `worried`, `oops`, `proud`, `sad`, `confused`, `laughing`, `question`, `embarrassed`, `scared`, `disgusted`.

### Speaking style: `<style set='...'>`

```xml
<style set='enthusiastic'>We did it!</style>
```

Styles: `enthusiastic`, `sheepish`, `confused`, `confident`. Styles don't nest.

### Pauses: `<break size='...'/>`

```xml
Ready? <break size='0.5' /> Go!
```

`size` is in seconds. Jibo's own skills use values up to 3.

### Specific animations by name

`<anim name='...'/>` plays one animation by name. Jibo's camera skills use `<anim name='ds_shutter_release_01' />` for a shutter sound and animation.

Note: other names from the animation database (for example individual dance names) haven't been tested by name from a custom skill.

## Light ring and attention

`jibo.expression` controls Jibo's body directly.

```js
// Light ring color: [red, green, blue], each 0..1. Returns a Promise.
jibo.expression.setLEDColor([0, 1, 0]);
jibo.expression.setLEDColor([0, 0, 0]);   // off
```

Jibo normally looks around at people and sounds ("attention"). If your skill moves his body, turn attention off while it runs and give it back when you finish:

```js
open() {
    const e = jibo.expression;
    this.attention = Promise.resolve(e.pushAttentionMode(e.AttentionMode.OFF));
}
close(done) {
    const attention = this.attention;
    this.attention = null;
    Promise.resolve(attention)
        .then(handle => handle && handle.release())   // you MUST release the handle
        .catch(() => {})
        .then(() => { /* remove view... */ done(); });
}
```

`pushAttentionMode` resolves to a handle. Release it even if your skill closes before the Promise resolves, or Jibo stops looking around at people after your skill ends. Modes include `OFF`, `IDLE`, `ENGAGED` and `SPEAKING`.

Note: `jibo.expression.createAnimation(...)`, `cleanup({ dofs })` and `centerRobot()` exist and are used by Store skills for custom body motion (for example a metronome sway). They are advanced and not documented here.

## Volume

```js
jibo.volume.currentVolume;                        // 0..10
jibo.volume.changeVolume('volumeToValue', 6);     // also 'volumeUp' / 'volumeDown'
```

This is Jibo's system volume (the same one as "Hey Jibo, volume up"). Only change it when the user asks to.

## Playing your own sounds

Use the Web Audio API (`global.AudioContext`). Read files from your skill's folder with Node's `fs`:

```js
const fs = require('fs');
const path = require('path');

playChime() {
    const ctx = this.audio = this.audio || new (global.AudioContext || global.webkitAudioContext)();
    const data = fs.readFileSync(path.join(__dirname, 'resources', 'chime.ogg'));
    // decodeAudioData needs its own ArrayBuffer, not a slice of Node's shared pool
    const buffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
    ctx.decodeAudioData(buffer, decoded => {
        if (this.closed) return;
        const source = ctx.createBufferSource();
        source.buffer = decoded;
        source.connect(ctx.destination);
        source.start();
    }, err => this.log.warn('decode failed', err));
}

close(done) {
    this.closed = true;
    if (this.audio) { try { this.audio.close(); } catch (e) {} this.audio = null; }
    // ...
}
```

- `.ogg`, `.mp3` and `.wav` decode fine.
- Close your `AudioContext` in `close()`. Open ones keep playing after your skill leaves, and Chrome allows only a few at a time.
- For short generated tones (clicks, beeps), an `OscillatorNode` with a `GainNode` envelope needs no files at all.
- An HTML `<audio>` element also works for streaming a URL. Pause it and clear its `src` in `close()`.
