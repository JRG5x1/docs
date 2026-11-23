---
title: Launch phrases
description: Let people open your skill by voice with "Hey Jibo, …" phrases, including spoken values with {slots}.
---

Add `phrases` to `manifest.json` and people can open your skill by voice:

```json
{
  "phrases": ["start a pizza order", "order a {topping} pizza"]
}
```

"Hey Jibo, start a pizza order" opens the skill. "Hey Jibo, order a pepperoni pizza" opens it with `topping` set to `"pepperoni"`.

No permission is needed, and nothing has to be set up on 5x1's servers: the matching happens on the robot, on what the cloud already heard.

## Slots

A `{name}` in a phrase matches **one or more spoken words**. Your skill gets them in `open(result)`:

```js
open(result) {
    const entities = (result && result.nlu && result.nlu.entities) || {};
    if (entities.topping) {
        jibo.embodied.speech.speak('One ' + entities.topping + ' pizza, coming up.');
    }
}
```

Slot names use letters, numbers and `_`, starting with a letter or `_`. Slot values arrive in lower case with punctuation removed. When the skill is opened from the menu, `entities` is empty.

## How matching works

What was said is cleaned up first:

- lower case, with apostrophes removed and other punctuation turned into spaces
- a leading "hey Jibo" or "Jibo" is dropped
- leading "please", "can you", "could you", "will you" and "would you" are dropped, and so is a trailing "please"

The phrase must then match **the whole** cleaned-up sentence. So "start a pizza order" also matches "Hey Jibo, could you start a pizza order please?" but not "start a pizza order for me".

If two skills have a phrase that matches, the one installed first wins.

## Rules

BEacon refuses a ZIP whose phrases break these rules:

- 1 to 20 phrases, each up to 100 characters.
- Each phrase needs at least one real word, and two slots can't be next to each other (`{a} {b}`); put a word between them.
- **Be specific.** The words before the first slot (or the whole phrase, if there's no slot) must include at least one word that isn't an everyday word like *what, how, is, can, tell, play, show, open, start, me, the, my, please*. So:

| Phrase | OK? |
| --- | --- |
| `play {song}` | No: "play" is an everyday word |
| `what is {thing}` | No |
| `tell me a {kind} joke` | No: only everyday words before `{kind}` |
| `call {name}` | Yes: "call" isn't on the list |
| `order a {topping} pizza` | Yes: "order" |
| `open the garage door` | Yes: "garage" |

The full list of everyday words is in [the BEacon source](https://github.com/Jibo-Revival-Group/BEam/blob/master/%40be/be/beacon/lib/launch-phrases.js). It exists so a skill can't take over requests that belong to Jibo or other skills.

## Tips

- Put the specific word first: "pizza order for {name}" is easier to hit than a long sentence.
- Test by saying it to Jibo. If nothing opens, Jibo heard something slightly different: add a second phrase for that wording.
- Phrases only work while the skill is turned on, so a skill made for an older Jibo doesn't answer to them.
