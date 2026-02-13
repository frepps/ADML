# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ADML (Article Data Markup Language) is a markup language inspired by ArchieML that compiles to JSON. This is a monorepo with three main packages:

- `@adml/parser` - Core ADML to JSON parser (packages/parser/)
- `@adml/editor` - CodeMirror-based editor component (packages/editor/)
- `docs` - Interactive playground and documentation (apps/docs/)

## Build & Test Commands

### Root Level Commands
```bash
npm install          # Install all workspace dependencies
npm run build        # Build all packages in topological order
npm test             # Run all tests across workspaces
npm run dev          # Start dev mode for all packages
```

### Parser Package (packages/parser/)
```bash
cd packages/parser
npm run build        # Compile TypeScript to dist/
npm run dev          # Watch mode compilation
npm test             # Run Vitest tests
npm test -- --watch  # Run tests in watch mode
```

### Editor Package (packages/editor/)
```bash
cd packages/editor
npm run build        # Build with Vite, then generate .d.ts files
npm run build:lib    # Build with Vite only
npm run build:types  # Generate .d.ts files only
npm run dev          # Watch mode
```

**Note:** The editor build runs `build:lib` (Vite) before `build:types` (tsc) because Vite cleans the `dist/` directory. Reversing this order will delete the `.d.ts` files.

### Playground (apps/docs/)
```bash
cd apps/docs
npm run dev          # Start dev server at http://localhost:3000
npm run build        # Build for production
npm run preview      # Preview production build
```

## Architecture

### Parser Core (packages/parser/src/index.ts)

The parser is a single-pass, line-by-line state machine with these key functions:

1. **`parseValue(value: string): any`** - Type detection in this priority: boolean → number → string
2. **`parseArray(lines: string[], startIndex: number)`** - Handles `[...]` array blocks, supports nesting
3. **`parseContentHeader(text: string)`** - Parses `#type.mod1.mod2: value` into `{ type, value, mods }`
4. **`parseContentArray(lines: string[], startIndex: number)`** - Handles `[[...]]` content array blocks with typed entries, props, and nesting
5. **`parseObjectLike(lines, startIndex, inComment, closer)`** - Generic object block parser, configurable closing delimiter (`}` or `>`)
6. **`parseObject(lines: string[], startIndex: number)`** - Wrapper for `parseObjectLike` with `}` closer
7. **`parseProps(lines: string[], startIndex: number)`** - Wrapper for `parseObjectLike` with `>` closer (for content entry props)
8. **`setByPath(obj, path, value)`** - Sets a value at a dot-separated path (e.g., `"a.b.c"`), creating intermediate objects as needed and merging into existing ones
9. **`parse(input: string, options?: ADMLParseOptions): ADMLResult`** - Main parser entry point
10. **`stringify(data: ADMLResult, options?: ADMLParseOptions): string`** - JSON to ADML converter
11. **`stringifyObjectEntries(data, indent)`** - Recursive object-to-ADML converter (handles nested objects to any depth)
12. **`stringifyArray(arr: any[], indent: string)`** - Array to ADML format converter with proper indentation
13. **`stringifyContentArray(arr, indent)`** - Content array to ADML format converter
14. **`isContentArray(arr)`** - Detects if an array contains content objects (has type/value/mods/props shape)

### Parser State Machine

The parser processes ADML line-by-line, tracking:
- Current object scope (for bracket `{}` syntax, recursive via `parseObjectLike`)
- Array depth (for nested arrays)
- Content array depth (for `[[...]]` blocks)
- Multiline string state (between `::` delimiters)
- Dot notation paths (e.g., `a.b.c` creates deeply nested structure via `setByPath`)

### Object Nesting

Objects can be nested using any combination of bracket syntax and dot notation:
```
// All of these produce { obj: { key: { subkey: "value" } } }

obj: {
  key: {
    subkey: value
  }
}

obj: {
  key.subkey: value
}

obj.key: {
  subkey: value
}

obj.key.subkey: value
```

### Data Flow

```
ADML → parse() → JSON → stringify() → ADML
```

Roundtrip support means: `parse(stringify(parse(input))) === parse(input)`

## Development Workflow

### Adding New Parser Features

1. **Write tests first** - Edit `packages/parser/src/index.test.ts`
2. **Run tests in watch mode** - `cd packages/parser && npm test -- --watch`
3. **Implement in** `packages/parser/src/index.ts`:
   - For new types: Update `parseValue()` and `stringify()`/`stringifyObjectEntries()`
   - For new syntax: Add logic in `parseObjectLike()` for object-level features, or in `parse()` main loop for top-level features
4. **Update README** - Add examples to `packages/parser/README.md`
5. **Update docs site** - Add a new step-by-step example in `apps/docs/src/App.tsx` (in the `examples` array) and update the `fullExample` string
6. **Test in playground** - `cd apps/docs && npm run dev`

### Building After Parser Changes

Since editor depends on parser, rebuild both:
```bash
cd packages/parser && npm run build
cd ../editor && npm run build
cd ../../apps/docs && npm run dev  # Test changes
```

Or from root: `npm run build`

### Test Structure

All tests follow this pattern:
```typescript
it('should parse [feature]', () => {
  const input = `...`.trim();
  const result = parse(input);
  expect(result).toEqual(...);
});

it('should stringify [feature]', () => {
  const data = { ... };
  const result = stringify(data);
  expect(result).toContain('...');
});
```

Always add roundtrip tests for new features to ensure data preservation.

## Current Limitations

1. **No null/undefined** - Cannot explicitly represent null values
2. **No error reporting** - Parser doesn't throw helpful errors with line numbers
3. **Arrays must be multiline** - No inline array syntax like `tags: [a, b, c]`
4. **No escape sequences** - Special characters in strings not supported yet

## Key Files

- `packages/parser/src/index.ts` - All parser logic
- `packages/parser/src/index.test.ts` - 84 tests
- `packages/editor/src/index.ts` - Vanilla JS CodeMirror wrapper
- `packages/editor/src/auto-close.ts` - Auto-closing brackets and smart indentation
- `packages/editor/src/react.tsx` - React component wrapper
- `apps/docs/src/App.tsx` - Documentation site with step-by-step examples and full playground

## npm Workspaces

This monorepo uses npm workspaces. Internal dependencies use `"@adml/parser": "*"` syntax. After changing exports, run `npm run build` from root to rebuild all packages.

## Type Safety

- All packages use TypeScript with strict mode enabled
- Parser exports these types: `ADMLResult`, `ADMLParseOptions`
- Editor generates `.d.ts` files via `npm run build:types`

## Testing Requirements

When adding features:
- Parse test - input string → JSON
- Stringify test - JSON → ADML string
- Roundtrip test - parse → stringify → parse preserves data
- Edge cases - empty values, special characters, whitespace

All 84 tests must pass before committing changes.
