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
- **Arrays** with `[ ]` syntax
  - Simple arrays: `[item1 item2]`
  - Nested arrays: `[[item1] [item2]]`
  - Mixed content arrays
- **Comments** using `//` line syntax
- **Bidirectional conversion**:
  - `parse()` - ADML to JSON
  - `stringify()` - JSON to ADML
- **Roundtrip support** - Parse → stringify → parse preserves data

#### Editor Package
- **Vanilla JavaScript editor** using CodeMirror 6
- **React wrapper component** (`ADMLEditorReact`)
- **Real-time onChange callbacks**
- **Syntax highlighting** (via CodeMirror markdown mode)
- **Line wrapping** and standard editor features

#### Documentation & Playground
- **Interactive playground** with live ADML editor and JSON output
- **Split-view interface** showing ADML input and JSON output side-by-side
- **Example content** demonstrating all features
- **Responsive design** for desktop and mobile

#### Development Infrastructure
- **Monorepo structure** using npm workspaces
- **TypeScript** throughout the project
- **41 comprehensive tests** using Vitest
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

// Objects (bracket)
author: {
  name: John Doe
  email: john@example.com
}

// Objects (dot notation)
author.name: John Doe
author.email: john@example.com

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

// Comments
// This is a comment
```

### Technical Details

- **Parser**: Single-pass O(n) algorithm
- **Line-based**: Processes ADML line by line
- **No backtracking**: Efficient parsing
- **Whitespace preservation**: Multiline blocks preserve indentation
- **Trimming**: Single-line values are automatically trimmed

### Known Limitations

- No inline array syntax (e.g., `tags: [tag1, tag2]`)
- No escape sequences in strings
- No null/undefined values
- No date types
- No nested objects in objects (objects can contain primitives only)
- Minimal error reporting (planned for future)

### Breaking Changes

N/A - Initial release

---

## Future Enhancements (Planned)

The following features are planned for future releases:

- Error reporting with line numbers
- Source maps
- Null/undefined values
- Date parsing (ISO 8601)
- Inline array syntax
- Escape sequences for special characters
- Nested objects
- Include directives (import other ADML files)
- Variables and references
- Schema validation
- Custom type plugins
- ADML-specific syntax highlighting for editor
- Autocomplete in editor
- VS Code extension

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
