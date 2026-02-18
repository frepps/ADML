# ADML Architecture

This document describes the architecture of the ADML monorepo and how to extend it with new features.

## Project Structure

```
ADML/
├── packages/
│   ├── parser/          # Core ADML parser (@adml/parser)
│   │   ├── src/
│   │   │   ├── index.ts        # Main parser and stringify logic (~990 lines)
│   │   │   └── index.test.ts   # Test suite (~1650 lines, 133 tests)
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── README.md
│   │
│   ├── editor/          # Web editor component (@adml/editor)
│   │   ├── src/
│   │   │   ├── index.ts        # Vanilla JS editor (CodeMirror)
│   │   │   ├── react.tsx       # React wrapper
│   │   │   ├── lang-adml.ts    # ADML syntax highlighting (Lezer grammar)
│   │   │   └── auto-close.ts   # Auto-closing brackets and smart indentation
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── vite.config.ts
│   │   └── README.md
│   │
│   └── vscode/          # VS Code extension (@adml/vscode)
│       ├── src/                 # Extension source
│       ├── syntaxes/
│       │   └── adml.tmLanguage.json  # TextMate grammar
│       ├── snippets/
│       │   └── adml.json        # Code snippets
│       ├── language-configuration.json
│       └── package.json
│
├── apps/
│   ├── docs/           # Documentation site & playground
│   │   ├── src/
│   │   │   ├── App.tsx         # Main playground app
│   │   │   ├── main.tsx
│   │   │   ├── App.css
│   │   │   └── index.css
│   │   ├── index.html
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── vite.config.ts
│   │
│   └── example/        # CMS + Article renderer (Astro SSR)
│       ├── src/
│       │   ├── components/
│       │   │   ├── renderer/    # ContentRenderer, registry
│       │   │   └── cms/         # CmsEditor (React island)
│       │   ├── templates/       # Page-level Astro layouts
│       │   ├── pages/           # Routes + API endpoints
│       │   ├── styles/          # base.css, utilities.css
│       │   └── lib/             # Render utilities
│       └── package.json
│
├── package.json        # Root workspace config
├── tsconfig.json       # Base TypeScript config
├── README.md           # Project overview
└── ARCHITECTURE.md     # This file
```

## Parser Architecture

The parser (`packages/parser/src/index.ts`) is structured as follows:

### Core Functions

1. **`parseValue(value: string): any`**
   - Converts string values to appropriate types
   - Priority: booleans → numbers → strings
   - Called for all leaf values in the parse tree

2. **`parseArray(lines: string[], startIndex: number)`**
   - Parses array blocks `[ ... ]`
   - Supports nested arrays
   - Returns `{ value: any[], endIndex: number }`

3. **`parseContentHeader(text: string)`**
   - Parses `#type.mod1.mod2: value` into `{ type, value, mods }`
   - Used by content arrays and inline content

4. **`parseContentArray(lines: string[], startIndex: number)`**
   - Parses `[[ ... ]]` content array blocks
   - Handles typed entries with modifiers, props, and nested content arrays
   - Returns `{ value: ContentItem[], endIndex: number }`

5. **`parseObjectLike(lines, startIndex, inComment, closer)`**
   - Generic recursive object block parser
   - Configurable closing delimiter (`}` for objects, `>` for props)
   - Handles all features inside blocks: arrays, content arrays, multiline, nesting, comments

6. **`parseObject(lines: string[], startIndex: number)`**
   - Wrapper for `parseObjectLike` with `}` closer

7. **`parseProps(lines: string[], startIndex: number)`**
   - Wrapper for `parseObjectLike` with `>` closer (for content entry props)

8. **`setByPath(obj, path, value)`**
   - Sets a value at a dot-separated path (e.g., `"a.b.c"`)
   - Creates intermediate objects as needed
   - Merges into existing objects

9. **`parse(input: string, options?: ADMLParseOptions): ADMLResult`**
   - Main entry point for parsing ADML to JSON
   - Line-by-line state machine parser
   - Handles: multiline (`::`), arrays (`[]`), content arrays (`[[]]`), objects (`{}`), dot notation, comments

10. **`parseContentValue(input: string): ContentItem[]`**
    - Parses inline content markup within string values
    - Handles brackets `[value | #type.mod | prop: val]`, links, special cases
    - Text substitutions: `"` → smart quote, `--` → en dash

11. **`stringifyContentValue(content: ContentItem[]): string`**
    - Converts a content array back to an inline content string
    - Inverse of `parseContentValue`

12. **`stringify(data: ADMLResult, options?: ADMLParseOptions): string`**
    - Main entry point for converting JSON to ADML

13. **`stringifyObjectEntries(data, indent)`**
    - Recursive object-to-ADML converter
    - Handles nested objects to any depth

14. **`stringifyArray(arr: any[], indent: string)`**
    - Array to ADML format converter with proper indentation

15. **`stringifyContentArray(arr, indent)`**
    - Content array to ADML format converter

16. **`isContentArray(arr)`**
    - Detects if an array contains content objects
    - Key whitelist: item must have `type` and all keys must be from `{type, value, mods, props}`

### Type Detection Priority

The `parseValue` function checks types in this order:
1. Boolean (`true` or `false`)
2. Number (regex: `/^-?\d+(\.\d+)?$/`)
3. String (fallback)

### Parser State Machine

The parser processes ADML line-by-line, tracking:
- Current object scope (for bracket `{}` syntax, recursive via `parseObjectLike`)
- Array depth (for nested arrays)
- Content array depth (for `[[...]]` blocks)
- Multiline string state (between `::` delimiters)
- Comment state (between `/* ... */` delimiters)
- Dot notation paths (e.g., `a.b.c` creates deeply nested structure via `setByPath`)

**Important:** `[[` detection must come BEFORE `[` detection at all parse locations.

## Adding New Features

### 1. Adding a New Data Type

To add a new primitive type (e.g., `null`, `undefined`, dates):

**Step 1: Update `parseValue` in `packages/parser/src/index.ts`**
```typescript
function parseValue(value: string): any {
  // Add your type check BEFORE the number check
  if (value === 'null') {
    return null;
  }

  // Check if value is a boolean
  if (value === 'true') {
    return true;
  }
  // ... rest of function
}
```

**Step 2: Update `stringify` and `stringifyObjectEntries` to handle the new type**

**Step 3: Update `stringifyArray` and `stringifyContentArray` if needed**

**Step 4: Add tests in `packages/parser/src/index.test.ts`**
```typescript
it('should parse null values', () => {
  const input = `value: null`.trim();
  const result = parse(input);
  expect(result.value).toBe(null);
});

it('should stringify null values', () => {
  const data = { value: null };
  const result = stringify(data);
  expect(result).toContain('value: null');
});

it('should roundtrip null values', () => {
  const input = `value: null`.trim();
  const parsed = parse(input);
  const stringified = stringify(parsed);
  const reparsed = parse(stringified);
  expect(reparsed).toEqual(parsed);
});
```

### 2. Adding New Syntax Features

To add a new syntax construct:

**Step 1: Add parsing logic**

For top-level features, add to the main `parse()` loop. For features inside objects/props blocks, add to `parseObjectLike()`.

**Step 2: Add stringify support** in `stringifyObjectEntries()` for recursive output.

**Step 3: Add comprehensive tests** (parse, stringify, roundtrip, edge cases).

**Step 4: Update documentation** — parser README, docs playground, and CHANGELOG.

### 3. Extending the Editor

The editor (`packages/editor`) uses CodeMirror 6 with custom ADML support:

**Syntax highlighting** is implemented in `src/lang-adml.ts` using a Lezer-based grammar. It highlights property names, values, comments, brackets, content array headers, and multiline delimiters.

**Auto-closing brackets** is implemented in `src/auto-close.ts`. It handles `{`, `[`, `[[`, `<`, and `::` with smart indentation and cursor placement.

**Autocomplete** provides context-aware suggestions for structure templates and boolean values.

### 4. Extending the Playground

The playground (`apps/docs`) is a React + Vite app:

**Add New Examples:**
Edit `apps/docs/src/App.tsx` — add to the `examples` array and update the `fullExample` string.

### 5. Adding Renderer Components (Example App)

The example app (`apps/example/`) uses a component-based rendering system:

1. Create an `.astro` file in `src/components/renderer/`
2. Import and register it in `src/components/renderer/registry.ts`
3. The `ContentRenderer.astro` component will automatically use it when matching by `type`

## Testing Strategy

### Parser Tests

Located in `packages/parser/src/index.test.ts` (133 tests):

1. **Parse tests** - Test input → JSON conversion
2. **Stringify tests** - Test JSON → ADML conversion
3. **Roundtrip tests** - Test parse → stringify → parse preserves data
4. **Inline content tests** - parseContentValue / stringifyContentValue

**Test template:**
```typescript
it('should parse [feature name]', () => {
  const input = `[ADML input]`.trim();
  const result = parse(input);
  expect(result).toEqual([expected output]);
});

it('should stringify [feature name]', () => {
  const data = { [test data] };
  const result = stringify(data);
  expect(result).toContain('[expected ADML]');
});

it('should roundtrip [feature name]', () => {
  const input = `[ADML input]`.trim();
  const parsed = parse(input);
  const stringified = stringify(parsed);
  const reparsed = parse(stringified);
  expect(reparsed).toEqual(parsed);
});
```

## Build & Development

### Building

```bash
# Build all packages (topological order)
npm run build

# Build specific package
cd packages/parser && npm run build
cd packages/editor && npm run build
```

**Note:** The editor build runs `build:lib` (Vite) before `build:types` (tsc) because Vite cleans the `dist/` directory.

### Testing

```bash
# Run all tests
npm test

# Run parser tests
cd packages/parser && npm test

# Run tests in watch mode
cd packages/parser && npm test -- --watch
```

### Development

```bash
# Start playground
cd apps/docs && npm run dev

# Start example app
cd apps/example && npm run dev

# Watch mode for parser
cd packages/parser && npm run dev

# Watch mode for editor
cd packages/editor && npm run dev
```

## Publishing

The packages use npm workspaces. To publish:

1. Update version in individual `package.json` files
2. Build all packages: `npm run build`
3. Publish individually:
   ```bash
   cd packages/parser && npm publish
   cd packages/editor && npm publish
   ```

## Common Patterns

### Handling Whitespace

- Multiline blocks preserve all whitespace (including indentation)
- Single-line values are trimmed
- Empty lines are skipped in arrays and objects

### Performance

- Parser is O(n) - single pass through lines
- No backtracking
- Optimize with early returns in `parseValue`

## Current Limitations

1. **No null/undefined** - Cannot explicitly represent null values
2. **No error reporting** - Parser doesn't throw helpful errors with line numbers
3. **Arrays must be multiline** - No inline array syntax like `tags: [a, b, c]`
4. **No escape sequences** - Special characters in strings not supported yet

## Resources

- [ArchieML Spec](http://archieml.org/) - Original inspiration
- [CodeMirror 6](https://codemirror.net/) - Editor library
- [Vite](https://vitejs.dev/) - Build tool
- [Vitest](https://vitest.dev/) - Test framework
