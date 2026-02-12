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
npm run build        # Build library with types
npm run build:types  # Generate .d.ts files only
npm run build:lib    # Build with Vite only
npm run dev          # Watch mode
```

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
3. **`parse(input: string, options?: ADMLParseOptions): ADMLResult`** - Main parser entry point
4. **`stringify(data: ADMLResult, options?: ADMLParseOptions): string`** - JSON to ADML converter
5. **`stringifyArray(arr: any[], indent: string)`** - Array to ADML format converter

### Parser State Machine

The parser processes ADML line-by-line, tracking:
- Current object scope (for bracket `{}` syntax)
- Array depth (for nested arrays)
- Multiline string state (between `::` delimiters)
- Dot notation paths (e.g., `author.name` creates nested structure)

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
   - For new types: Update `parseValue()` and `stringify()`
   - For new syntax: Add state machine logic in `parse()` main loop
4. **Update README** - Add examples to `packages/parser/README.md`
5. **Test in playground** - Update `apps/docs/src/App.tsx` with examples

### Building After Parser Changes

Since editor depends on parser, rebuild both:
```bash
cd packages/parser && npm run build
cd ../editor && npm run build
cd ../../apps/docs && npm run dev  # Test changes
```

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

1. **Objects are flat** - Can nest arrays but not objects within objects (only primitives allowed)
2. **No null/undefined** - Cannot explicitly represent null values
3. **No error reporting** - Parser doesn't throw helpful errors with line numbers
4. **Arrays must be multiline** - No inline array syntax like `tags: [a, b, c]`
5. **No escape sequences** - Special characters in strings not supported yet

## Key Files

- `packages/parser/src/index.ts` - ~200 lines, all parser logic
- `packages/parser/src/index.test.ts` - 41 tests, ~640 lines
- `packages/editor/src/index.ts` - Vanilla JS CodeMirror wrapper
- `packages/editor/src/react.tsx` - React component wrapper
- `apps/docs/src/App.tsx` - Playground UI and examples

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

All 41 tests must pass before committing changes.
