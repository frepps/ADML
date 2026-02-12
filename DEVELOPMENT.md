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
npm run build        # Build all packages
npm test             # Run all tests
npm run lint         # Lint all packages (if configured)
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

npm run build        # Build types and library
npm run build:types  # Generate .d.ts files
npm run build:lib    # Build with Vite
npm run dev          # Watch mode
```

### Docs/Playground

```bash
cd apps/docs

npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Build for production
npm run preview      # Preview production build
```

## Development Workflow

### Adding a New Feature

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
   # Edit README.md
   # Update examples in apps/docs/src/App.tsx
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
5. Rebuild editor (depends on parser): `cd ../editor && npm run build`
6. Test in playground: `cd ../../apps/docs && npm run dev`

### Making Changes to Editor

1. Edit `packages/editor/src/index.ts` or `react.tsx`
2. Rebuild: `npm run build`
3. Test in playground: `cd ../../apps/docs && npm run dev`

## Code Style

- Use TypeScript for all code
- Follow existing patterns and conventions
- Add JSDoc comments for public APIs
- Keep functions small and focused
- Use descriptive variable names

## Testing Guidelines

### Test Structure

```typescript
describe('Feature Name', () => {
  describe('parse', () => {
    it('should parse basic case', () => {
      // Arrange
      const input = `...`.trim();

      // Act
      const result = parse(input);

      // Assert
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
- Error cases (if error handling is added)

## Debugging

### Parser Issues

Add console.logs in `packages/parser/src/index.ts`:

```typescript
export function parse(input: string, options: ADMLParseOptions = {}): ADMLResult {
  const lines = input.split('\n');
  console.log('Parsing lines:', lines); // Debug output

  // ... rest of function
}
```

### Playground Issues

Open browser DevTools (F12) and check:
1. Console for errors
2. Network tab for failed requests
3. React DevTools for component state

### Build Issues

Common issues:
- **TypeScript errors**: Check `tsconfig.json` settings
- **Missing types**: Run `npm run build:types` in editor package
- **Import errors**: Ensure all packages are built

## File Structure

```
packages/parser/
├── src/
│   ├── index.ts           # Main parser logic
│   │   ├── parseValue()        # Type detection
│   │   ├── parseArray()        # Array parsing
│   │   ├── parse()             # Main parser
│   │   ├── stringifyArray()    # Array stringification
│   │   └── stringify()         # Main stringifier
│   └── index.test.ts      # All tests
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
- Peer: React, React-DOM (optional)
- Dev: TypeScript, Vite

### Docs
- Runtime: React, Parser, Editor
- Dev: Vite, TypeScript

## Common Tasks

### Update Parser Examples

1. Edit `packages/parser/README.md`
2. Edit `apps/docs/src/App.tsx` - update `initialValue`

### Add New Test

```typescript
// In packages/parser/src/index.test.ts
it('should handle [new feature]', () => {
  const input = `
    key: value
  `.trim();

  const result = parse(input);

  expect(result).toEqual({
    key: 'value'
  });
});
```

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

### Type Errors in Playground

The docs app needs editor types:
```bash
cd packages/editor && npm run build:types
```

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

## Performance Tips

- Parser is already O(n)
- For large files, consider streaming parser (future)
- Stringify can be optimized with string builders
- CodeMirror handles large documents well

## Next Steps

See [ARCHITECTURE.md](./ARCHITECTURE.md) for:
- Detailed architecture explanation
- How to add new features
- Extension points
- Future enhancement ideas
