# Component Charades, and what Jev actually is

**Play it:** https://component-charades.southleft-llc.workers.dev
**Code:** https://github.com/southleft/component-charades

## The short version

Component Charades is Taboo for design systems. You are dealt a UI component (say, Toast). You describe it without using its name or any of its aliases. As you type, a model called Jev ranks all 135 components in a library and puts a probability on each one. When it is sure enough, it buzzes in. Fewer words, better score.

Jev is not a chat model. It cannot write a sentence. That is the whole point of this project, and the reason the game works the way it does.

## What Jev is

Jev is made by TypeSafe AI. They call it a System One model, after Kahneman's fast, intuitive System 1 thinking. The comparison to ChatGPT, Claude, or Gemini is misleading in both directions: it does not do what they do, and they do not do what it does well.

An LLM takes text and produces text. You ask a question, it writes an answer. If your code needs a decision out of that answer, you have to parse the prose, or ask for JSON and hope the JSON is valid and the values are the ones you asked for.

Jev takes text and produces **typed decisions with calibrated probabilities**. You send it a `state` (any text or JSON) and a set of questions, and each question is one of exactly three kinds:

| Type | Question shape | What comes back |
| --- | --- | --- |
| Choice | Which of these options? (up to 255) | the winning option, a probability for every option, and a confidence |
| Score | Where on this rubric? (2–10 described levels) | a fractional position, a probability per level, and a confidence |
| Noul | Is this true? | one probability, 0 to 1 |

Every question in a request is evaluated in parallel and independently against the same state, in roughly 150–400 ms, at $0.042 per million input tokens. Output is free. There is no text generation anywhere in the pipeline: your code never parses a reply, because there is no reply to parse. The answer is a number under the key you chose.

Jev is trained with what TypeSafe calls RLCD, reinforcement learning for calibrated decisions. The claim is that when it says 0.8, the thing is true about 80% of the time across many predictions. That is a different objective from RLHF, which trains a model to produce responses people prefer to read.

## What Jev is not

- It is not a chatbot and cannot hold a conversation.
- It does not generate text, code, or explanations.
- It does not reason step by step. TypeSafe's own docs say it struggles with multi-hop indirection, counting, arithmetic, and date comparison, and recommend keeping all of that in ordinary code.
- It is not fine-tuned per customer. Every account gets the same weights. You shape its behavior through the wording of your questions and the options you offer.
- It is not a replacement for Claude or GPT in a coding assistant or writing tool. TypeSafe's docs have a page saying exactly this.

If you read the game's output and think "that's a clever AI", the honest correction is: there is no model in this app that could write the sentence you are reading. Every word of copy in the interface was written by a person. Jev only ever supplies numbers, and the app's code turns those numbers into behavior.

## Why a guessing game

We looked at what Jev is good at, according to its own documentation and our own testing, and the list is short and specific: ranking a catalog against a plain-language description, classifying with an honest confidence, scoring against a rubric, and yes/no checks. It is fast enough and cheap enough to run on every keystroke.

Taboo-style charades is that list, exactly:

- **Ranking a catalog against a description.** One Choice question with 136 options (135 components plus "not a component"). The player's text is the state. Jev returns a full probability distribution across the whole library.
- **Honest confidence.** The game's buzz-in is a threshold on Jev's `confidence`. Below 0.5 it is "listening". Between 0.5 and 0.85 it is "leaning toward X". At 0.85 it commits, right or wrong. The model does not decide to buzz; the code does, using the number the model returned.
- **Real-time.** Each request is one round trip of a few hundred milliseconds. Thirty debounced requests over a round cost well under a cent. You could not do this with a generative model at any reasonable latency or price.
- **Ambiguity is visible.** When a description could be a Toast or a Snackbar, Jev does not pick one and sound sure. The distribution shows 0.61 and 0.35 and the confidence drops. The game reports it as a toss-up. This is the property LLMs are worst at and Jev is built for.

We also ask several speculative side questions in the same request, at no extra latency: does the description mention behavior, appearance, or placement (three Nouls); how vivid is the writing (a Score); which aspect most identified the component (a four-option Choice). These power the end-of-round card ("mostly the placement gave it away") without a second request.

A second mode, Component Finder, flips the same machinery: describe a job ("submits a form", "tells me someone else is typing") and Jev says which component does it and, via a separate Noul, whether the library has anything for it at all. That second question matters because a Choice always puts its mass somewhere and can never say "none of these".

## How the interface was designed

The UI borrows the visual language of TypeSafe's own developer console: light grey ground, white cards with hairline borders and corner registration marks, a regular-weight grotesk, monospace for labels and data, thin-line probability bars.

This is deliberate beyond taste. The console draws each primitive as a schematic card labeled `INSTRUCTIONS`, `OUTPUT`, `DISTRIBUTION`. This game is literally one Jev request, so the page is drawn the same way. The panel you type into is labeled `STATE`. The odds board is `CHOICE · which_component` with its distribution. The side Nouls appear as small instruments. Playing the game teaches the API without anyone having to read documentation.

## What we measured

We wrote 40 casually-phrased descriptions the way a designer types them, not the way the catalog reads ("little popup that says saved and goes away", "red dot with a 3 on the bell icon", "are you sure you want to delete this") and asked where the intended component ranked.

| Question set | Top-1 | Top-3 |
| --- | --- | --- |
| Charades | 36 / 40 | 39 / 40 |
| Finder | 37 / 40 | 38 / 40 |

The misses were all defensible alternatives: "agree to the terms" → Button over Checkbox; "pick one shipping speed" → Select over Radio Button; "turn dark mode on" → Theme Toggle over Switch, which is arguably the better answer; "switch between overview and reviews" → Segmented Control 0.52 vs Tabs 0.47, and the confidence correctly flagged it as a coin flip.

Per request: about 5,500 input tokens, about $0.00023, 150–400 ms warm. The eval is in the repo as `npm run eval`.

## Two things we learned

**Wording is the tuning knob.** With the same question for both modes, the Finder drifted toward the container an action lives in: "submits a form" gave Form 32%, "closes the dialog" gave Modal 49%. Adding one sentence to the Finder's instructions ("choose the element that performs the action, not the form or dialog around it") moved both to Button at 99% and 94%. No thresholds changed. TypeSafe documents this as the model's literal reading, and it is real: Jev answers the question you wrote, not the one you meant.

**Jev is decisive.** Once a description contains a behavior or a placement, it usually jumps straight to 100%. "a small message" gives Toast 0.80 / Snackbar 0.12; add "in the corner" and it is Toast 1.00. The interesting part of a round is the first five or six words. That is why the score is word count: the skill is finding the one detail that ends it.

## Who built what

The catalog of 135 components, their descriptions and aliases, every question and threshold, all the interface copy, and the game rules were written by people. The code is Next.js, deployed to Cloudflare Workers. Jev's only job is to receive a description and return probabilities. If it ever seems to "know" what a Skeleton loader is, that is because a human wrote a one-line description of one into the catalog and Jev matched your words to it.

That division of labor is the argument for Jev. Code owns the workflow. A person owns the vocabulary. The model does the one thing the other two cannot: read a sentence and say, with a number attached, which of 135 things it most resembles.
