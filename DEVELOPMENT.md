# Development Guide

Quick reference for developing ADML.

## Quick Start

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Run tests
npm test

# Start playground
cd apps/docs
npm run dev
```

## Project Commands

### Root Level

```bash
npm install          # Install all dependencies
npm run build        # Build all packages (topological order)
npm test             # Run all tests
npm run dev          # Start dev mode for all packages
```

### Parser Package

```bash
cd packages/parser

npm run build        # Compile TypeScript
npm run dev          # Watch mode
npm test             # Run tests
npm test -- --watch  # Watch mode for tests
```

### Editor Package

```bash
cd packages/editor

npm run build        # Build with Vite, then generate .d.ts files
npm run build:lib    # Build with Vite only
npm run build:types  # Generate .d.ts files only
npm run dev          # Watch mode
```

**Note:** Build order matters — `build:lib` (Vite) runs before `build:types` (tsc) because Vite cleans the `dist/` directory.

### VS Code Extension

```bash
cd packages/vscode

npm run build        # Compile TypeScript
npm run package      # Package as .vsix file
```

### Docs/Playground

```bash
cd apps/docs

npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Build for production
npm run preview      # Preview production build
```

### Example App

```bash
cd apps/example

npm run dev          # Start dev server (http://localhost:4000)
npm run build        # Build for production
npm run preview      # Preview production build
```

## Development Workflow

### Adding a New Parser Feature

1. **Write tests first** (TDD approach)
   ```bash
   cd packages/parser
   # Edit src/index.test.ts
   npm test -- --watch
   ```

2. **Implement the feature**
   ```bash
   # Edit src/index.ts
   # Tests will auto-run in watch mode
   ```

3. **Update documentation**
   ```bash
   # Edit packages/parser/README.md
   # Add example in apps/docs/src/App.tsx (examples array + fullExample)
   ```

4. **Test in playground**
   ```bash
   cd apps/docs
   npm run dev
   ```

### Making Changes to Parser

1. Edit `packages/parser/src/index.ts`
2. Add tests in `packages/parser/src/index.test.ts`
3. Run tests: `npm test`
4. Build: `npm run build`
5. Rebuild editor (depends on parser): `cd packages/editor && npm run build`
6. Test in playground: `cd apps/docs && npm run dev`

### Making Changes to Editor

1. Edit files in `packages/editor/src/`
   - `index.ts` — Vanilla JS editor class
   - `react.tsx` — React wrapper
   - `lang-adml.ts` — Syntax highlighting
   - `auto-close.ts` — Smart bracket handling
2. Rebuild: `npm run build`
3. Test in playground: `cd apps/docs && npm run dev`

## Code Style

- Use TypeScript for all code
- Follow existing patterns and conventions
- Keep functions small and focused
- Use descriptive variable names

## Testing Guidelines

### Test Structure

```typescript
describe('Feature Name', () => {
  describe('parse', () => {
    it('should parse basic case', () => {
      const input = `...`.trim();
      const result = parse(input);
      expect(result).toEqual(...);
    });
  });

  describe('stringify', () => {
    it('should stringify basic case', () => {
      const data = { ... };
      const result = stringify(data);
      expect(result).toContain('...');
    });
  });
});
```

### Test Coverage

Aim for:
- All parsing features
- All stringify features
- Roundtrip tests (parse → stringify → parse)
- Edge cases (empty values, special characters)

## File Structure

```
packages/parser/
├── src/
│   ├── index.ts           # Main parser logic (~990 lines)
│   │   ├── parseValue()        # Type detection
│   │   ├── parseArray()        # Array parsing
│   │   ├── parseContentHeader()# Content entry parsing
│   │   ├── parseContentArray() # Content array parsing
│   │   ├── parseObjectLike()   # Generic object block parser
│   │   ├── parseObject()       # Object wrapper (} closer)
│   │   ├── parseProps()        # Props wrapper (> closer)
│   │   ├── setByPath()         # Dot notation path setter
│   │   ├── parse()             # Main parser
│   │   ├── parseContentValue() # Inline content parser
│   │   ├── stringifyContentValue()# Inline content stringifier
│   │   ├── stringifyObjectEntries()# Recursive object stringifier
│   │   ├── stringifyArray()    # Array stringification
│   │   ├── stringifyContentArray()# Content array stringification
│   │   ├── isContentArray()    # Content array detection
│   │   └── stringify()         # Main stringifier
│   └── index.test.ts      # All tests (133 tests, ~1650 lines)
├── dist/                  # Built files (generated)
├── package.json
├── tsconfig.json
└── README.md
```

## Dependencies

### Parser
- No runtime dependencies
- Dev: TypeScript, Vitest

### Editor
- Runtime: CodeMirror 6 packages
- Peer: React, React-DOM (optional, for React wrapper)
- Dev: TypeScript, Vite

### VS Code Extension
- Dev: TypeScript, @vscode/vsce

### Docs
- Runtime: React, Parser, Editor
- Dev: Vite, TypeScript

### Example App
- Runtime: Astro, @astrojs/node, @astrojs/react, @adml/parser, @adml/editor
- Dev: TypeScript

## Common Tasks

### Update Parser Examples

1. Edit `packages/parser/README.md`
2. Edit `apps/docs/src/App.tsx` — update `examples` array and `fullExample` string

### Fix Type Errors

If docs app can't find editor types:
```bash
cd packages/editor
npm run build:types
```

### Clean Build

```bash
# Remove all node_modules
rm -rf node_modules packages/*/node_modules apps/*/node_modules

# Remove all dist folders
rm -rf packages/*/dist apps/*/dist

# Reinstall and rebuild
npm install
npm run build
```

## Troubleshooting

### Tests Failing

1. Check test file syntax
2. Run `npm run build` to ensure parser is built
3. Check for typos in expected values

### Playground Not Updating

1. Hard refresh browser (Cmd+Shift+R / Ctrl+Shift+R)
2. Rebuild packages: `npm run build`
3. Restart dev server

### Import Errors

Workspace dependencies use `"@adml/parser": "*"` syntax.
After adding new exports, rebuild all packages.

## Git Workflow

### Commit Messages

Use conventional commits:
- `feat: add null type support`
- `fix: handle empty arrays correctly`
- `docs: update parser README`
- `test: add roundtrip tests for booleans`
- `refactor: extract parseValue helper`

### Before Committing

```bash
npm run build  # Ensure everything builds
npm test       # Ensure all tests pass
```

## Next Steps

See [ARCHITECTURE.md](./ARCHITECTURE.md) for:
- Detailed architecture explanation
- How to add new features
- Extension points
