# Alternatives to ADML for Flexible Web Content

## Structured Content (similar space)

**ArchieML** — ADML's direct inspiration. Used by NYT for interactive articles. Simpler but lacks ADML's content arrays, nested objects, and props system.

**MDX** — Markdown + JSX components. Huge ecosystem, great DX, but couples content to React. Better if your team already writes Markdown and you want component islands.

**Portable Text (Sanity)** — JSON-based rich text as structured data. Very flexible, framework-agnostic, but verbose to write by hand. Best paired with Sanity's visual editor.

**Contentlayer / content collections (Astro)** — Markdown/MDX with typed frontmatter. Good for static sites with predictable content shapes.

## Full CMS platforms

**Sanity / Strapi / Payload CMS** — Visual editors, APIs, user management, media handling. Far more feature-complete but heavier, hosted, and opinionated.

**Builder.io / Storyblok** — Visual, drag-and-drop. Better for non-technical editors.

## When ADML makes more sense

- You want **human-readable/writable structured content** without a CMS dependency
- Content needs a **component-like structure** (typed blocks with mods and props) but you don't want JSX in your content files
- You need **framework-agnostic** structured output (just JSON)
- You value **git-based content** workflows (plain text files, diffs, PRs)
- You're building **editorial tools** where writers need something between Markdown and a full CMS

## When something else is better

- **Markdown is enough** — If your content is mostly prose with headings and links, MDX or plain Markdown is simpler and has massive tooling support
- **Non-technical editors** — A visual CMS (Sanity, Storyblok) will always be easier for people who don't write markup
- **Scale / collaboration** — Real CMS platforms handle auth, media, versioning, workflows, localization out of the box
- **Ecosystem maturity** — ADML is a custom format; MDX/Portable Text have years of community plugins, parsers, and documentation

## Bottom line

ADML occupies a niche between "Markdown isn't structured enough" and "a full CMS is overkill." If your content is inherently **component-structured** (think: interactive articles, design system-driven pages, editorial layouts) and you want to keep it in **plain text files**, it's a solid fit. For most other cases, you'd get further faster with an established tool.
