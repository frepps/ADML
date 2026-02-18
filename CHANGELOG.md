# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [0.1.0] - 2026-02-12

### Added

#### Core Parser Features
- **Primitive types** with automatic detection:
  - Strings (default type)
  - Numbers (integers and floats, including negative numbers)
  - Booleans (`true` and `false`)
- **Multiline strings** using `::` delimiter syntax
- **Objects** with two syntaxes:
  - Bracket syntax: `key: { prop: value }`
  - Dot notation: `key.prop: value`
  - Nested objects to any depth (brackets, dot notation, or mixed)
  - Dot notation merges into existing objects
- **Arrays** with `[ ]` syntax
  - Simple arrays: `[item1 item2]`
  - Nested arrays: `[[item1] [item2]]`
  - Mixed content arrays
- **Content arrays** with `[[ ]]` syntax
  - Typed entries: `#type.mod1.mod2: value`
  - Plain text defaults to `p` type
  - Entry props with `< ... >` blocks
  - Nested content arrays inside props
  - `ContentItem` type: required `type`, optional `value`, `mods`, `props` (empty keys omitted)
- **Inline content** parser for rich text within string values
  - `parseContentValue()` / `stringifyContentValue()`
  - Bracket syntax: `[value | #type.mod | prop: value]`
  - Auto-detected links: `[text|/url]` → `{ type: 'a', props: { href: '/url' } }`
  - Special cases: `[]` (nbsp), `[/]` (br), `[-]` (shy)
  - Text substitutions: `"` → smart quote, `--` → en dash
  - Escape sequences: `\[`, `\]`, `\|`
- **Comments**:
  - Line comments: `//`
  - Block comments: `/* ... */`
  - Inline block comments
- **Bidirectional conversion**:
  - `parse()` - ADML to JSON
  - `stringify()` - JSON to ADML
- **Roundtrip support** - Parse → stringify → parse preserves data

#### Editor Package
- **Vanilla JavaScript editor** using CodeMirror 6
- **React wrapper component** (`ADMLEditorReact`)
- **Real-time onChange callbacks**
- **ADML syntax highlighting** via custom Lezer grammar (`lang-adml.ts`)
- **Auto-closing brackets** with smart indentation (`auto-close.ts`)
- **Autocomplete** - context-aware suggestions for structure and values
- **Line wrapping** and standard editor features

#### VS Code Extension
- **Syntax highlighting** for `.adml` files via TextMate grammar
- **Comment toggling** with `Cmd/Ctrl+/`
- **Bracket matching** and auto-closing for `{}`, `[]`, `[[]]`, `<>`
- **Auto-indentation**
- **Code snippets**

#### Documentation & Playground
- **Interactive playground** with live ADML editor and JSON output
- **Step-by-step examples** for each feature
- **Full example** showing all features combined
- **Responsive design** for desktop and mobile

#### Example App
- **Astro SSR** application combining CMS and article renderer
- **Recursive content renderer** with component registry
- **Template system** for page-level layouts
- **File-based CMS** with API routes, editor, and live preview

#### Development Infrastructure
- **Monorepo structure** using npm workspaces
- **TypeScript** throughout the project
- **133 comprehensive tests** using Vitest
- **Vite** for fast builds and development
- **Full type definitions** for all packages

#### Documentation
- **README** with quick start and examples
- **ARCHITECTURE.md** with detailed implementation guide
- **DEVELOPMENT.md** with development workflow
- **CONTRIBUTING.md** with contribution guidelines
- **Package READMEs** with API documentation

### Type Detection Rules

The parser automatically detects types in this order:
1. Boolean: Exactly `true` or `false`
2. Number: Matches regex `/^-?\d+(\.\d+)?$/`
3. String: Everything else (fallback)

### Syntax Examples

```adml
// Strings
title: My Article

// Numbers
port: 3000
price: 29.99

// Booleans
enabled: true
debug: false

// Multiline
description::
Multi-line content
with newlines
::

// Objects (bracket, nestable to any depth)
author: {
  name: John Doe
  address: {
    city: Stockholm
  }
}

// Objects (dot notation)
author.name: John Doe
author.address.city: Stockholm

// Arrays
tags: [
  javascript
  typescript
]

// Nested arrays
matrix: [
  [
    1
    2
  ]
  [
    3
    4
  ]
]

// Content arrays
body: [[
  #heading.large: Welcome
  A paragraph of text.
  <#image.hero: banner.jpg
    alt: A photo
    width: 1200
  >
]]

// Comments
// Line comment
/* Block comment */
```

### Technical Details

- **Parser**: Single-pass O(n) algorithm
- **Line-based**: Processes ADML line by line
- **No backtracking**: Efficient parsing
- **Whitespace preservation**: Multiline blocks preserve indentation
- **Trimming**: Single-line values are automatically trimmed

### Known Limitations

- No inline array syntax (e.g., `tags: [tag1, tag2]`)
- No escape sequences in strings (outside inline content)
- No null/undefined values
- No date types
- Minimal error reporting (planned for future)

### Breaking Changes

N/A - Initial release

---

## Future Enhancements (Planned)

The following features are planned for future releases:

- Error reporting with line numbers
- Null/undefined values
- Date parsing (ISO 8601)
- Inline array syntax
- Escape sequences for special characters
- Include directives (import other ADML files)
- Variables and references
- Schema validation

---

## Development

See [DEVELOPMENT.md](DEVELOPMENT.md) for:
- Build commands
- Testing workflow
- Common tasks

See [ARCHITECTURE.md](ARCHITECTURE.md) for:
- How to add new features
- Parser architecture
- Extension points
