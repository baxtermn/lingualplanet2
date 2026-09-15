# Lingual Planet UX and visual-design assessment

Assessment date: 15 September 2026  
Surfaces reviewed: public Lingual Planet site, authenticated English Academy learner/admin experience, authenticated MedicomSkills instructor/admin experience, representative practice screens, content tools, and phone-sized layouts.

Companion report: [Copy, tone, and human-centred language assessment](./LINGUAL-PLANET-COPY-TONE-ASSESSMENT-2026-09-15.md)

## Overall verdict

Lingual Planet already looks credible, thoughtful, and unusually mature for a platform still being built. It does not need a wholesale redesign. Its strongest quality is restraint: the interfaces feel calm, literate, and trustworthy rather than gamified for its own sake. The public brand is memorable, English Academy has an appealing editorial-learning character, and MedicomSkills feels appropriately clinical without becoming sterile.

The biggest UX weakness is decision architecture. New users often see many equally weighted destinations before they have achieved a first success. English Academy also exposes too much navigation on a phone, while MedicomSkills mixes personal practice, instructor work, content administration, and system diagnostics within one broad navigation model. The result is visually polished but occasionally cognitively expensive.

Recommended strategy: preserve the existing aesthetic, then simplify the first five minutes, create clearer role-based navigation, and add stronger progress/reward feedback inside activities.

## Experience scorecard

| Area | Score | Assessment |
|---|---:|---|
| Public visual identity | 9/10 | Distinctive, premium, and memorable |
| Trust and professionalism | 9/10 | Particularly strong in MedicomSkills |
| Typography and hierarchy | 8.5/10 | Strong headings and excellent reading surfaces |
| Content discoverability | 7.5/10 | Broad coverage, but choice can become overwhelming |
| First-time user guidance | 6.5/10 | The platform explains itself but does not always prescribe the next action |
| Motivation and feedback | 6.5/10 | Accurate progress language, but empty-state framing can feel daunting |
| Desktop navigation | 7.5/10 | Clear overall; MedicomSkills becomes crowded around 1,280 px |
| Mobile navigation | 6.5/10 | MedicomSkills adapts well; English Academy exposes too many links at once |
| Admin usability | 7/10 | Clear grouping, but dense tools need stronger search, filtering, and work queues |
| Accessibility readiness | 6.5/10 | Good visible clarity; programmatic labels and heading semantics need work |
| Overall | 7.8/10 | Strong foundation with focused UX improvements needed |

## What already works very well

### Public Lingual Planet

- The dark multilingual hero immediately communicates language learning without resorting to generic classroom imagery.
- The headline is excellent: direct, emotionally relevant, and differentiated from exam-only products.
- The two-product choice is understandable, and the visual distinction between clinical communication and broader English learning is immediate.
- The restrained palette, large typography, and generous whitespace create confidence and reduce the feeling of a low-cost content portal.
- Realistic imagery gives MedicomSkills credibility; English Academy’s skills panel clearly signals breadth.

### English Academy

- The navy, cream, coral, serif/sans-serif system feels warm, intelligent, and suitable for adults.
- The dashboard hero is visually strong and provides a clear primary action.
- Reading activities are exceptionally comfortable: generous measure, readable type, strong spacing, and useful text/line controls.
- Skill cards communicate scope and progress without looking like a spreadsheet.
- The Studio groups administration by intent—make, review, organise—which is much easier to understand than a raw settings list.

### MedicomSkills

- The visual language feels calm, safe, and medically credible.
- Photography supports the task rather than functioning as decoration.
- The dashboard’s SOAP-style encounter components are an effective mental model.
- Practice-mode cards use plain language and explain the consequence of each choice.
- The mobile header collapses appropriately, and the primary task remains prominent.
- The spelling note handles regional terminology transparently and increases trust.

## Priority UX recommendations

### UX-01 — High — Give every new learner one recommended first action

English Academy currently presents `0%`, `0 activities`, and `83 to explore` immediately. This is honest, but a new learner may interpret it as an enormous unfinished workload. “Choose a skill” still requires the learner to decide among many plausible paths.

Recommended change:

- Replace the initial dashboard state with a three-step welcome path: **Tell us your goal → Try one short activity → See your starting map**.
- Present one recommended five-minute activity above the full catalogue.
- Reframe `83 to explore` as positive discovery copy after the first completed activity, not as the dominant starting metric.
- Celebrate the first completion with a visible result and a single next recommendation.

### UX-02 — High — Collapse English Academy mobile navigation

At 390 px, the entire navigation occupies roughly the first 185 px and shows Practise, My skills, Review, Progress, Today, Games, Teach a class, My account, Help, Sign out, language, and Site tools simultaneously.

Recommended change:

- Keep the brand, current section, and one labelled menu button in the mobile header.
- Put secondary destinations in a drawer.
- Consider a four-item learner bottom navigation: **Home, Practise, Review, Progress**.
- Keep teaching and administration in a separate role-specific menu.

### UX-03 — High — Separate learner, teacher, content, and system modes

Both products expose learner actions beside teaching and administration. MedicomSkills also places operational tools such as Runbook alongside everyday navigation. This is efficient for builders but increases cognitive load and makes the product feel less settled.

Recommended change:

- Add an explicit workspace switcher: **My practice / Teaching / Content / Operations**.
- Show only the navigation appropriate to the active workspace.
- Move Runbook, audit harnesses, costs, setup, design, cleanup, and generation operations into an **Admin** workspace.
- Remember the last workspace per account.

### UX-04 — Medium — Simplify the MedicomSkills desktop header

At 1,280 px, the Contact link wraps onto a second line by itself, while the remaining navigation remains in the first row. This breaks polish and makes the header feel crowded.

Recommended change:

- Move Contact into the account menu.
- Move Runbook and other system destinations into Admin.
- Keep five or six top-level items at most.
- Use an overflow menu before allowing the navigation to wrap.

### UX-05 — Medium — Make the public hero action look unmistakably clickable

“Explore the programmes” is visually elegant but resembles an editorial caption more than the principal action.

Recommended change:

- Retain the understated style but add a bordered or filled button treatment.
- Add a secondary link for returning users: **Log in**.
- Use smooth scrolling and retain keyboard focus when moving to the programme cards.

### UX-06 — Medium — Strengthen cross-product brand continuity

The public site, English Academy, and MedicomSkills are each attractive, but they can feel like three related sites rather than one ecosystem. Typography, navigation models, logo treatments, and page rhythm change significantly.

Recommended change:

- Create a small shared Lingual Planet brand layer: common account control, language control, focus style, feedback/toast behaviour, and footer signature.
- Preserve the product-specific themes beneath that shared layer.
- Add a subtle “Part of Lingual Planet” link in both product headers.

### UX-07 — Medium — Turn dense admin inventories into working tools

Topics, cases, content, and audit pages are readable, but long inventories rely heavily on scrolling. The Case Editor uses a narrow case list beside a large empty detail area and does not initially explain how to find a specific record efficiently.

Recommended change:

- Add persistent search, filters, sort, status counts, and saved views.
- Keep the selected record visible in a sticky split panel.
- Add explicit empty-detail guidance: **Choose a case, search by title, or create a new one**.
- Use bulk selection only where the action is reversible and clearly previewed.
- Replace generic emoji icons in the English Academy Studio with one consistent icon family.

### UX-08 — Medium — Make learning feedback more emotionally rewarding

The visual system is polished, but many activities still feel like content forms rather than moments of mastery.

Recommended change:

- After an answer, show concise feedback explaining *why*, not only right/wrong state.
- Use a small completion animation, sound preference, and next-action card.
- Show progress as “skills strengthened” and “words now retrievable,” not only percentages.
- Use streaks carefully: reward return without punishing absence.

### UX-09 — Medium — Shorten or defer supporting guidance on mobile

The MedicomSkills spelling note is valuable, but on a phone it fills a large part of the first screen before encounter choices. It competes with the primary action despite being dismissible.

Recommended change:

- Show a one-line summary with **Why this matters** expansion.
- Preserve the full explanation in Help or account preferences.
- After first dismissal, keep it dismissed unless terminology settings change.

### UX-10 — Medium — Complete accessibility semantics

Visible labels and contrast are generally good. The earlier diagnostic audit found many programmatically unnamed controls in English Academy Topics and Design, plus concatenated clinical headings such as `AClinical Reasoning`.

Recommended change:

- Associate every input with a unique label.
- Hide decorative SOAP letters from assistive technology.
- Verify keyboard focus order in fixed sidebars, drawers, modal editors, and repeated lists.
- Add a skip-to-content link and consistent visible focus treatment across all three properties.

## Aesthetic direction

The current design should evolve rather than be replaced.

- **Lingual Planet:** keep the dramatic multilingual editorial identity. It is the strongest brand asset.
- **English Academy:** retain the warm library/editorial feeling. Add playful colour and motion inside practice outcomes and games, not across every administrative page.
- **MedicomSkills:** retain the quiet clinical palette and photography. Use colour primarily to communicate encounter stage, safety, completion, and urgency.
- **Shared principle:** use delight at moments of action and achievement; use restraint where users read, reason, or make clinical decisions.

Avoid turning the entire ecosystem into a brightly coloured game interface. That would reduce the authority of MedicomSkills and make long-form English work tiring. The right balance is serious surfaces with lively feedback.

## Suggested implementation sequence

1. Fix the previously documented functional/layout defects.
2. Introduce role/workspace navigation and the English Academy mobile menu.
3. Design the first-session guided path and first-success feedback.
4. Simplify the MedicomSkills header and mobile spelling note.
5. Add admin search/filter/split-panel patterns.
6. Apply shared accessibility and ecosystem-brand primitives.
7. Test with five new learners, three returning learners, and two instructors before broader visual changes.

## Research questions for real-user testing

- Can a first-time learner begin a useful activity within 60 seconds without explanation?
- Do learners understand the difference between Today, Practise, Review, and My skills?
- Does `83 to explore` motivate or overwhelm them?
- Can instructors distinguish class management, content creation, and personal practice immediately?
- Do clinical learners understand the difference between the SOAP components and a full OSCE?
- Do users recognise “Explore the programmes” as the main public-site action?
- After one activity, can users explain what improved and what they should do next?

The strongest outcome would not be “users think the site is beautiful.” It would be: **users trust it, know what to do next, complete something meaningful quickly, and want to return.**
