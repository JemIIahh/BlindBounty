---
name: blindbounty-design
description: Use this skill to generate well-branded interfaces and assets for BlindBounty, either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the `README.md` file within this skill, and explore the other available files (`colors_and_type.css`, `assets/`, `preview/`, `ui_kits/`).

BlindBounty is a privacy-first task marketplace. The brand runs on **one unified surface**: dark canvas, **IBM Plex Mono** across every size, cream (`#f5efe0`) as the single warm accent, no other typefaces, no chroma outside green/red terminal glyphs.

- **Marketing** (`ui_kits/marketing/`) — same surface, glass cards, looser rhythm, hero-scale display sizes (44–92px).
- **Dashboard** (`ui_kits/dashboard/`) — denser grid, sharper corners, table-first. Same family, same palette.

Mixing aesthetics is not a thing here — the monospace grid *is* the visual voice. Commit to it.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. Prefer the provided primitives from `ui_kits/<surface>/primitives.jsx` over re-inventing — they encode brand details (floret ornament, glass card blur, sidebar monochrome, etc).

If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions (which surface? which audience? how much content?), and act as an expert designer who outputs HTML artifacts *or* production code, depending on the need.
