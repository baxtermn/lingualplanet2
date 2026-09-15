# Lingual Planet copy, tone, and human-centred language assessment

Assessment date: 15 September 2026  
Surfaces reviewed: public Lingual Planet pages, English Academy learner and admin pages, and MedicomSkills learner, clinician, analytics, and admin pages.

## Overall verdict

The writing is better than the user suspected. Much of it is unusually honest, intelligent, and respectful. The strongest passages sound like a calm teacher or experienced clinical educator: encouraging without being childish, precise without being pompous, and transparent without sounding defensive.

The problem is inconsistency. Excellent human writing sometimes sits beside language that describes the database, scoring system, or platform machinery instead of the learner's experience. Empty states can sound judgmental, analytical pages use internal terminology, and a few raw localisation keys and developer phrases leak into the interface. This does not make the site broadly robotic, but it weakens an otherwise distinctive voice.

The recommended direction is not a wholesale rewrite. Preserve the warmth and candour already present, then remove system-centred language, make next steps more specific, and separate learner-facing language from operational admin language.

## Copy scorecard

| Surface | Score | Assessment |
|---|---:|---|
| Public Lingual Planet | 9/10 | Clear, confident, warm, and memorable |
| English Academy learning experience | 7.5/10 | Often excellent, but empty states and progress language sometimes feel mechanical |
| English Academy administration | 7/10 | Mostly plain and approachable; a few technical or imprecise phrases remain |
| MedicomSkills clinical practice | 8.5/10 | Credible, humane, and appropriately precise |
| MedicomSkills analytics/admin | 6.5/10 | Useful information, but internal jargon and system language are too visible |
| Voice consistency across the ecosystem | 6.5/10 | Strong individual moments without one consistently enforced editorial standard |

## What already works

Several lines should be treated as reference examples for the future voice:

- “Practise English for the conversations that matter to you.” It begins with the person's purpose rather than the product's features.
- “There is no date yet, and we would rather not invent one.” It is candid, concise, and builds trust.
- “Your first review starts with a word you notice.” It turns a feature into a simple human action.
- “Right before you forget”, “Short and regular”, and “Progress you can feel.” These are concrete, memorable, and motivating.
- “Built to fit the time you have, and to be finished. There is nothing here you are behind on.” This reduces anxiety without talking down to the learner.
- “A well-justified answer beats a lucky guess.” This expresses the educational philosophy in one strong sentence.
- “They will remember you — and how you were.” This gives the clinical work emotional and ethical weight.
- “Catch what they only hint at.” This is compact, vivid, and closely connected to a real consultation skill.
- “A person reads every message and answers here.” This is reassuring because it tells the user exactly what will happen.

These examples reveal the best shared voice: calm, adult, direct, emotionally aware, and quietly confident.

## Where the writing becomes cold

### It describes the system instead of helping the person

Phrases such as “Everything you do feeds one record” and “this is where the platform learns most about you” put the machinery in the foreground. A learner usually wants to know what the action will do for them, not how the data model behaves.

### It frames an empty state as a deficiency

“You have not shown this one yet” and “it is empty rather than encouraging right now” are factually accurate, but they sound as though the interface is assessing the person before the person has begun. An empty state should welcome, explain, and offer one manageable action.

### It uses grading language when coaching language would be better

MedicomSkills appropriately evaluates clinical reasoning, but repeated use of “graded” and “scored” can make deliberate practice feel like an examination. Keep formal scoring where it is genuinely necessary; elsewhere, lead with feedback, reasoning, and improvement.

### It exposes implementation details

“Rows”, “endpoints”, “evaluate.php”, “bumping” a version, and “plumbing” belong in developer documentation, not ordinary interface copy. Admin users can handle technical language, but they still benefit from language organised around tasks and consequences.

### It occasionally sounds translated, generated, or unfinished

Raw keys such as `mx.play.lede`, `mx.played`, and `mx.met` immediately break trust. Awkward constructions such as “choose which examinations ... judge how indicated it is” or “it is named” also feel less natural than the surrounding prose.

## Priority rewrites

| Priority | Current wording | Why it needs work | Recommended wording |
|---|---|---|---|
| Critical | `mx.play.lede`, `mx.played`, `mx.met` | Raw localisation keys make the interface look broken. | Replace each with the intended translated label and add a human-readable fallback if a key is missing. |
| High | “Everything you do feeds one record, so it does not matter where you start.” | “Feeds one record” is database language. | “Start wherever feels useful. Everything you complete contributes to one clear picture of your progress.” |
| High | “Find the part that answers the question at A1. You have not shown this one yet.” | Sounds evaluative before the learner has begun. | “Try this short A1 activity to help us find your starting point.” |
| High | “Do one activity and this page starts having something to say. It counts what you actually did, so it is empty rather than encouraging right now.” | Self-referential and unnecessarily bleak. | “Complete one activity and your progress will appear here. We only show results based on work you have actually done.” |
| High | “Nothing here yet, so this is where the platform learns most about you.” | System-centred and potentially intrusive. | “Start here so we can recommend practice that fits your level.” |
| High | “Your account and all 1 rows belonging to it…” | Exposes database terminology and contains broken pluralisation. | “Your account and everything connected to it will be permanently deleted.” |
| High | “Structured criterion coverage per session. Pick a session to see how each criterion scored.” | Dense internal jargon; unclear benefit. | “Choose a session to see what the learner covered, what they missed, and where their interviewing can improve.” |
| High | “0 scored” | Ambiguous: it may imply failure rather than pending evaluation. | Use “Not yet scored” when pending, or “0 criteria assessed” when that is the literal meaning. |
| Medium | “Choose a small amount of useful practice and leave knowing exactly what you moved forward.” | The final phrase is unnatural. | “Choose a manageable amount of practice and finish knowing exactly what you improved.” |
| Medium | “For each examination you order, judge how indicated it is.” | Clinically understandable but not natural English. | “For each examination you order, decide how strongly it is indicated.” |
| Medium | “You’re graded on your clinical reasoning, not just your choices.” | Correct but school-like for a practice environment. | “Your feedback focuses on the reasoning behind each choice, not only the choice itself.” |
| Medium | “If you cite a family history you never asked for, it is named.” | “It is named” is unnatural and vague. | “If you rely on a family history you never asked about, the feedback will point it out.” |
| Medium | “Graded against their real picture, not an ideal one.” | Awkward construction and unclear referent. | “Feedback is based on this patient's actual presentation, not a textbook ideal.” |
| Medium | “The AI drafts complete patients. They arrive as inactive drafts…” | Repetition of “draft”; foregrounds generation rather than review. | “AI can prepare a complete patient case. Every new case stays unpublished until you review and activate it.” |
| Medium | “Saving bumps the case version automatically.” | Developer slang. | “Each save creates a new case version automatically.” |
| Medium | “What kind? (leave blank for fully random)” | “Fully random” does not explain the likely result. | “Describe the cases you need, or leave this blank for a varied set.” |
| Medium | “This makes real model calls — roughly a dozen…” | Acceptable for technical admins, but “model calls” is not plain language. | “This runs about a dozen live AI checks and may incur usage costs.” |
| Medium | “The harness checks the plumbing rather than the teaching.” | Vivid but mixes metaphors and obscures the task. | “This checks whether the technical workflow is working; it does not judge teaching quality.” |
| Medium | “evaluate.php” | A filename has leaked into user-facing copy. | Use the tool's visible name, such as “Validity check”, throughout the interface. |
| Low | “Pricing for a school? pricing page has a form…” | Missing article and capitalisation. | “Pricing for a school? The pricing page has a form for your team.” |

## Recommended voice by product

### Lingual Planet

Sound like a trustworthy guide. Use short, confident sentences and connect language learning to real conversations and real goals. Be honest about what is available and what is still being built. Avoid broad claims such as “master any language” or inflated promises.

### English Academy

Sound like a perceptive adult-language coach: warm, encouraging, specific, and never childish. Reduce anxiety by making the next action small and clear. Prefer “try”, “notice”, “practise”, and “improve” over “complete”, “feed”, “process”, and “achieve”. Celebrate evidence of progress without turning the site into a stream of exaggerated praise.

### MedicomSkills

Sound like a calm senior clinician who wants the learner to think carefully. Preserve clinical precision and the strongest concise lines. Correct errors without humiliation. Prefer “feedback”, “reasoning”, “evidence”, and “consider” over constant references to being “graded”. Never make a patient sound like a puzzle object; keep the human consequence of communication visible.

### Administration and analytics

Sound operational, concise, and transparent. Admin copy can be more technical than learner copy, but every sentence should still answer one of three questions: What is this? What will happen? What should I do next? Keep filenames, database terms, endpoints, and implementation metaphors out of the interface unless the tool is explicitly for developers.

## Editorial rules for future content

1. Lead with the user's goal, then explain the feature.
2. Describe the consequence of an action, not the implementation behind it.
3. Give empty states one clear next step; never make inactivity sound like failure.
4. Use “you” when it helps the person act, not when assigning blame.
5. Prefer concrete verbs and short sentences over abstract nouns.
6. Keep encouragement truthful and proportionate.
7. Use “feedback” for formative practice and reserve “score” or “grade” for actual assessment.
8. Explain AI plainly wherever it materially affects content, cost, privacy, or evaluation.
9. Keep patient-centred language throughout MedicomSkills.
10. Test every localisation key and provide a readable fallback.
11. Avoid developer terms such as “row”, “endpoint”, “payload”, “bump”, “harness”, and filenames in ordinary UI.
12. Read copy aloud before release. If it would sound strange from a teacher or clinical supervisor, rewrite it.

## Suggested microcopy patterns

### Empty state

**Heading:** Your progress starts here  
**Body:** Complete one short activity and your first result will appear here.  
**Action:** Start a five-minute activity

### Pending score

**Label:** Feedback pending  
**Helper text:** Your session has been saved. Feedback will appear here when it is ready.

### Corrective feedback

**Heading:** One detail to revisit  
**Body:** You used the patient's family history in your reasoning, but it was not gathered during the interview. Ask about it next time before relying on it.

### AI-generated case notice

**Body:** This case was created with AI and reviewed before publication. Patient details are fictional.

### Destructive account action

**Heading:** Permanently delete your account?  
**Body:** This will delete your account, activity history, saved words, and progress. It cannot be undone.  
**Action:** Delete my account permanently

## Recommended implementation order

1. Fix raw localisation keys, broken pluralisation, grammatical errors, and leaked filenames.
2. Rewrite English Academy empty states and first-use guidance.
3. Rewrite MedicomSkills analytics labels and clarify pending versus zero scores.
4. Review every use of “graded”, “scored”, and “generated” in learner-facing screens.
5. Add the product voice guidance to the content-generation and editorial workflow.
6. Run a final mobile copy pass, because long explanations feel heavier on small screens.

## Final assessment

Lingual Planet does not need a new personality. It already has one, and at its best it is distinctive: intelligent, humane, candid, and calm. The work now is editorial discipline. Removing implementation language and making every empty state, result, and instruction feel like guidance from a thoughtful person would noticeably improve trust and motivation without changing the product's character.
