---
title: Listening
description: Open your skill with launch phrases like "Hey Jibo, call Jackson", and listen to the user from inside your skill.
---

There are two ways your skill can hear people:

1. **[Launch phrases](/skills/phrases/)** in `manifest.json` open your skill from "Hey Jibo, ...". They need no permission.
2. **Listening turns** inside your open skill (`jibo.jetstream.startLocalTurn`). They need the `microphone` [permission](/skills/api/permissions/).

## Launch phrases

Add `phrases` to `manifest.json`, like `["order a {size} pizza"]`, and "Hey Jibo, order a large pizza" opens your skill with `result.nlu.entities.size === 'large'`. See [Launch phrases](/skills/phrases/) for how matching works and the rules phrases must follow.

## Listening inside your skill

While your skill is open, it can start a listening turn and get back what the user said. This needs `"permissions": ["microphone"]` in `manifest.json`, and it only works while your skill's screen is open.

```js
listen() {
    const js = jibo.jetstream;
    return js.startLocalTurn({
        nluRules: ['launch'],
        ignoreGlobalRules: true,     // don't let "what time is it" etc. jump out of your skill
        sosTimeout: 7,               // seconds to wait for the user to start speaking
        maxSpeechTimeout: 15,        // longest the user may speak
        hintPhrases: ['pepperoni', 'cheese', 'veggie']   // words to listen for
    }).then(turn => {
        if (this.closed) { turn.cancel(); return null; }
        this.turn = turn;
        return turn.promise;
    }).then(result => {
        this.turn = null;
        if (!result || this.closed) return null;
        const r = result.result || result;
        const text = (r.asr && r.asr.text) || r.text || '';
        return text.trim();          // '' when nothing was heard
    });
}

close(done) {
    this.closed = true;
    if (this.turn) { try { this.turn.cancel(); } catch (e) {} this.turn = null; }
    // ...
}
```

`startLocalTurn(options)` resolves to a turn. `turn.promise` resolves with the result, and `turn.cancel()` stops listening.

| Option | Meaning |
|---|---|
| `nluRules` | Required list of rule names. Skills on 5x1 pass `['launch']` or a name of their own (see the note below). |
| `ignoreGlobalRules` | `true` keeps global commands from taking over during this turn. |
| `sosTimeout` | Seconds to wait for speech to start. If nobody speaks, the turn ends with an empty transcript. |
| `maxSpeechTimeout` | Maximum seconds of speech. |
| `hintPhrases` | Words or phrases the speech recognizer should favor. |
| `earlyEOS` | Phrases that end listening as soon as they're heard. |

`result.status` is one of `jibo.jetstream.types.TurnResultType`: `SUCCEEDED`, `TIMEOUT`, `CANCELED`, `INTERRUPTED` (for example, someone said "Hey Jibo") or `FAILED`. When nobody speaks, the turn usually still ends as `SUCCEEDED` with an empty transcript, so check the text, not only the status. On success, the transcript is in `result.result.asr.text`.

While a turn is listening, Jibo shows his own listening eye and light ring.

Note: custom skills can't ship their own server-side intent rules. Rely on the transcript (`asr.text`) and do your matching in your skill. Some versions return the text at `result.asr.text` instead of `result.result.asr.text`, which is why the sample checks both places.

Note: a cancelled turn sends no result, so Jibo's listening eye and light ring can stay on after `cancel()` until something else changes them.

### Other gated listening APIs

These also need `microphone` and an open screen: `jibo.jetstream.subscribeGlobal`, `setHJMode`, `setHotwordMode`, speaker enrollment and identification (`startEnrollmentTurn`, `createSpeakerModel`, `getEnrolledSpeakers`, `startNameLearningTurn`, `initNameLearning`), and listeners on the transcript events `jibo.jetstream.events.localTurnResult`, `globalTurnResult`, `speakerID`, `speakerEnrollment`, `untyped`, `jibo.globalEvents.skillLaunch` and `skillRelaunch`. Without the permission, these event handlers are never called. No error is thrown.
