# Human input

This file summarises every message the human sent during the session that produced this repo, in order. Each one is paraphrased rather than quoted. Word counts are approximate.

Messages are marked as one of three kinds:
- **Discussion:** questions and conversation that didn't direct any code.
- **Steering:** an instruction that directly shaped what got built.
- **Packaging:** instructions about publishing the finished work.

| # | Kind | Summary of the message |
|---|---|---|
| 1 | Discussion | Asked whether Claude could watch a gameplay video of a small indie game and use it as a starting point for a clone. |
| 2 | Discussion | Asked Claude to pick a reasonably doable game from itch.io's front page and outline, in near-pseudocode, how it could be cloned with no human help. Said explicitly that it wouldn't be built. |
| 3 | Discussion | Legal hypothetical: if a game's licence forbade looking at its code with AI, would working from video alone avoid agreeing to it? |
| 4 | Discussion | Asked for real examples of licences that forbid decompiling being enforced in court. |
| 5 | Discussion | Asked whether anyone has tried a "by watching this video you agree…" licence. |
| 6 | Discussion | Named a specific commercial game and asked Claude to look at its itch.io store page and say whether it could recreate the game without downloading it. Claude's answer included a proposal to build a "greybox vertical slice". |
| 7 | **Steering** | Told Claude to build that greybox vertical slice. (About 5 words.) |
| 8 | **Steering** | Said they were going to dinner and wouldn't be available. Gave permission to do anything legal and ethical. Repeated the build request and asked whether a GitHub repo was needed. (About 55 words.) |
| 9 | **Steering** | Hypothetical: a "spiritual clone" of the same idea set in space, kept greybox, 2D acceptable. How long would it take, and could Claude do it without assistance? This set the brief for Orbit Line, so it counts as steering. (About 75 words.) |
| 10 | **Steering** | Explained that someone claims Claude would need heavy hand-holding. Said they would not answer follow-up questions, told Claude to do what's best, and asked for the result as a separate artifact. Claude's open question about the view model went unanswered by design. (About 45 words.) |
| 11 | Packaging | Asked how many tokens the first build took, and raised posting the code to GitHub for review. |
| 12 | Packaging | Explained the context (an online argument) and asked for a way to make the point firmly without undermining it. |
| 13 | Packaging | Asked whether to use one repo or two. |
| 14 | Packaging | Created this repo and asked for everything Claude had proposed, with instructions summarised rather than quoted. |

## Totals

- **Steering:** 4 messages, about 180 words in all. For Route 9 that was about 60 words across two messages. For Orbit Line it was about 120 words across two messages: the brief, then an instruction not to ask questions.
- **Code written or edited by the human:** none.
- **Bugs reported by the human:** none. Every bug in the README's bug list was found by Claude from its own test runs and screenshots.
- **Design questions answered by the human:** none. One was asked before the space version and deliberately left unanswered.
- **Playtesting by the human before publication:** none.
- **Assets supplied by the human:** none.

## What the human did contribute

- **Chose the reference game** and asked whether it could be rebuilt from its store page.
- **Approved building it,** with permission to work unattended.
- **Proposed the space setting,** noting 2D was acceptable, and asked for it as a separate deliverable.
- **Created this repository** and asked for it to be filled.

## What Claude decided on its own

- **The design of both slices:**
  - Which systems to build, and the rules, stops, stations, unlocks and variants.
  - The stop and station names, the passengers and their behaviours.
  - All of the writing.
- **The visual style of both games.**
- **Orbit Line's view model:** turning round to face the cabin while the shuttle keeps drifting under inertia. This was the question it asked and didn't get an answer to.
- **The engineering:**
  - Choosing the libraries.
  - Writing the physics.
  - Building the testing approach, including autopilots that play each game end to end.
- **Every bug fix,** and the decision about what counted as "done".
- **The structure and contents of this repo,** including the decision to publish a self-critical code review alongside the code.
