# Lingual Planet authenticated diagnostic report

Audit date: 15 September 2026  
Scope: `lingualplanet.com`, English Academy, and MedicomSkills  
Account: supplied instructor/admin test account (credentials intentionally omitted)

## Executive summary

Both authenticated applications are broadly navigable and visually coherent. The audit covered the public Lingual Planet landing page, more than 40 English Academy routes, all 21 MedicomSkills routes exposed from the instructor dashboard, representative learning content, the reading quiz catalogue, one reading exercise, the English Academy game/word-list flow, and representative 390 × 844 mobile layouts.

No broken images were detected on the audited routes. No page-not-found result occurred when following the applications' own links. The only reproducible browser exception belongs to the MedicomSkills case editor. Five actionable defects were found: one high-priority JavaScript failure, two layout-overflow problems, untranslated Maelstrom strings, and accessibility gaps in dense English Academy admin forms.

## Findings

### LP-001 — High — MedicomSkills Case Editor throws a JavaScript exception

- Route: `https://lingualplanet.com/medicomskills/cases.php`
- Evidence: browser console reports `TypeError: Cannot set properties of null (setting 'onclick')` at `cases.php:240:41`.
- Reproduction:
  1. Sign in with the instructor/admin account.
  2. Open **Cases**.
  3. Inspect the browser console.
- Expected: the page initializes without exceptions and attaches handlers only to controls that exist.
- Actual: initialization attempts to assign `onclick` to `null`.
- Risk: the missing element's intended interaction may be unavailable, and later initialization in the same script may not run.
- Recommendation: resolve the selector mismatch and guard optional elements before binding, for example `element?.addEventListener(...)`. Add a browser smoke test that fails on uncaught exceptions.

### LP-002 — Medium — English Academy Pricing creates horizontal scrolling

- Route: `https://lingualplanet.com/English_Academy/index.php?p=pricing`
- Evidence:
  - Desktop viewport: 1,280 px; document width: 1,404 px.
  - Mobile viewport: 390 px; document width: 408 px.
- Reproduction: open **Pricing**, then attempt to scroll horizontally at desktop or mobile width.
- Expected: document width equals the viewport and all pricing content remains inside the page.
- Actual: content extends beyond the right edge.
- Likely cause: the main pricing surface appears to retain full viewport width in addition to the fixed desktop sidebar; a smaller fixed/minimum-width element remains on mobile.
- Recommendation: size the main region with the remaining width (`min-width: 0`, `width: auto`, or `calc(100vw - sidebar-width)`), constrain pricing children with `max-width: 100%`, and identify the 18 px mobile overrun. Add 390, 768, and 1,280 px overflow assertions.

### LP-003 — Medium — English Academy Runbook overflows on mobile

- Route: `https://lingualplanet.com/English_Academy/index.php?p=runbook`
- Evidence: at a 390 px viewport, document width is 443 px.
- Reproduction: open **Site tools → Runbook** at phone width.
- Expected: tables, controls, and diagnostic content wrap or scroll inside a bounded region.
- Actual: the full document becomes 53 px wider than the viewport.
- Recommendation: apply `min-width: 0` to grid/flex descendants, wrap long values, and place intrinsically wide tables/code/status rows in an explicit `overflow-x: auto` container.

### LP-004 — Medium — Maelstrom exposes untranslated localization keys

- Routes:
  - `https://lingualplanet.com/English_Academy/index.php?p=maelstrom`
  - `https://lingualplanet.com/English_Academy/index.php?p=words`
- Visible keys: `mx.play.lede`, `mx.played`, and `mx.met`.
- Reproduction:
  1. Open **Games → Play Maelstrom** with no selected word list.
  2. Follow **Back to My words**.
- Expected: learner-facing explanatory and progress copy.
- Actual: raw message identifiers are displayed.
- Recommendation: add the missing English translations and make the localization helper fall back to readable source copy rather than returning the key.

### LP-005 — Medium — English Academy admin controls lack programmatic names

- Routes:
  - `https://lingualplanet.com/English_Academy/index.php?p=topics`
  - `https://lingualplanet.com/English_Academy/index.php?p=design`
- Evidence:
  - The Topics page contains many repeated `input[name="label"]` controls with no associated `<label>`, `aria-label`, `aria-labelledby`, title, or placeholder.
  - The Design page contains unlabeled text fields, range inputs, and file inputs, including `site_name`, `tagline`, colour values, opacity/size controls, and image uploads.
- Expected: every input has a unique accessible name that describes both its field and, for repeated rows, its record context.
- Actual: assistive technology cannot reliably identify these controls.
- Recommendation: give every control an `id` and associated `<label for>`. For repeated Topic rows, include the topic/level context in an `aria-label`. Give range inputs visible labels plus current values; give each file input a purpose-specific label.

### LP-006 — Low — Clinical workflow headings concatenate icon letters and titles

- Routes:
  - `/medicomskills/assess.php` announces `AClinical Reasoning`.
  - `/medicomskills/objective.php` announces `OExamination & Investigations`.
  - `/medicomskills/plan.php` announces `PManagement`.
- Expected: the decorative SOAP letter is hidden from assistive technology or separated from the title.
- Recommendation: mark the decorative letter `aria-hidden="true"` and keep the complete readable title in the heading, or add an explicit separating space.

## Verified behavior

- The `.co.cp` account signs in successfully to both products and exposes the intended instructor/admin navigation.
- The `.co.jp` variation is correctly rejected by both login forms with clear, nontechnical feedback.
- Public Lingual Planet links resolve to the official lowercase `/medicomskills/` and `/English_Academy/` entry points.
- All 21 MedicomSkills routes exposed from the dashboard render authenticated content.
- More than 40 English Academy learner/admin routes render, including all skill and exam module landing pages.
- No broken images were found on the audited routes.
- Apart from LP-001, no route-specific browser-console errors were detected.
- English Academy reading catalogue filters expose the expected A1–C2 and format options and list 32 quizzes.
- A representative reading activity (`p=read&id=25`) renders its passage and four question groups.
- Reading **bigger text** changes the passage from 17.5 px to 20.125 px.
- **Looser lines** changes line height from 32.375 px to 44.275 px.
- Reading **Listen** activates without a console error.
- Representative mobile pages in both products fit a 390 px viewport except LP-002 and LP-003.
- The earlier apparent mobile navigation delays on MedicomSkills dashboard/objective were not reproducible on immediate direct recheck and are not classified as defects.

## Deliberately not executed

The audit was non-destructive. The following workflows were inspected but not submitted because they create, edit, delete, publish, message, charge, upload, run paid AI work, or permanently alter learner records:

- Creating/editing/deleting cases, blueprints, topics, people, classes, OSCE circuits, or content
- Activating, publishing, approving, rejecting, or bulk-cleaning generated material
- Sending contact/help messages or replying to inbox messages
- Changing account, country, role, language, design, pricing, subscription, or billing state
- Running backups, generators, validity harness jobs, or full self-tests
- Uploading content kits, images, audio, or other files
- Submitting quiz answers or completing practice/OSCE sessions that would change learner progress
- Microphone/camera permission and real voice-interview capture
- Logout/session invalidation

Those workflows require a disposable staging dataset plus explicit authorization to create and remove test records. They should be tested after the five issues above are addressed, using named fixtures that can be safely deleted.

## Recommended order

1. Fix LP-001 and add a no-console-errors smoke test for every instructor route.
2. Fix LP-002 and LP-003 with desktop/mobile overflow assertions.
3. Resolve LP-004 before exposing Maelstrom to learners.
4. Correct LP-005 and LP-006, then run a keyboard and screen-reader pass.
5. Prepare disposable staging fixtures and execute the mutation workflows listed above.
