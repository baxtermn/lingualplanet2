# English Academy landing page — implementation handoff

## Deliverable

`index.html` is the approved standalone landing-page mockup. It contains the full HTML and CSS in one file. The `assets/` directory contains the six final WebP photographs used by the page.

## Final image manifest

| File | Placement |
| --- | --- |
| `assets/hero-study-group.webp` | Main landing-page hero |
| `assets/skill-reading.webp` | Reading skill card |
| `assets/skill-writing.webp` | Writing skill card |
| `assets/skill-listening.webp` | Listening skill card |
| `assets/skill-speaking.webp` | Speaking skill card |
| `assets/teacher-classroom.webp` | Teacher/classroom section |

All image paths in `index.html` are relative to the mockup directory. The images are WebP at quality 82.

## Integration instructions

1. Copy the six files from `assets/` into the production English Academy asset directory. Preserve their filenames or update the corresponding CSS URLs.
2. Port the markup inside `<main>` into the public English Academy landing-page template. Do not replace authenticated dashboard routes or application logic.
3. Port the CSS custom properties and component rules from the `<style>` block. Scope them to the landing page if the production stylesheet is shared with authenticated pages.
4. Replace placeholder `href="#"` links with the production destinations for sign-in, registration, pricing, progress, classroom accounts, and each learning path.
5. Preserve the final approved copy, including:
   - “Build your English skills with confidence.”
   - “Bring your class. We can help them learn”
   - “Your English journey begins today.”
6. Preserve the approved palette: navy `#153f61`, deep navy `#0b304b`, wine red `#c84257`, warm ivory `#f7f5f0`, and white paper `#fffdf9`.
7. The English Academy logo mark uses wine red and navy. The hero background circle is soft pink.
8. Test at desktop, tablet, and 390px mobile widths after integrating. The standalone mockup has no horizontal overflow at 390px.

## Important implementation notes

- The Google Fonts imports currently load Manrope, Newsreader, and DM Mono. If production has a font pipeline or CSP, self-host or register these fonts there instead of retaining the external import.
- The standalone page intentionally contains no framework or JavaScript dependency.
- Keep semantic headings, landmarks, and visible focus behavior when adapting the markup.
- Optimize cache headers for WebP assets in production.
