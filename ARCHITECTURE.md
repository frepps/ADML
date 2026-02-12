# ADML Architecture

This document describes the architecture of the ADML monorepo and how to extend it with new features.

## Project Structure

```
ADML/
├── packages/
│   ├── parser/          # Core ADML parser (@adml/parser)
│   │   ├── src/
│   │   │   ├── index.ts        # Main parser and stringify logic
│   │   │   └── index.test.ts   # Test suite
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── README.md
│   │
│   └── editor/          # Web editor component (@adml/editor)
│       ├── src/
│       │   ├── index.ts        # Vanilla JS editor (CodeMirror)
│       │   └── react.tsx       # React wrapper
│       ├── package.json
│       ├── tsconfig.json
│       ├── vite.config.ts
│       └── README.md
│
├── apps/
│   └── docs/           # Documentation site & playground
│       ├── src/
│       │   ├── App.tsx         # Main playground app
│       │   ├── main.tsx
│       │   ├── App.css
│       │   └── index.css
│       ├── index.html
│       ├── package.json
│       ├── tsconfig.json
│       └── vite.config.ts
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
   - Handles: booleans, numbers, strings
   - Called for all leaf values in the parse tree

2. **`parseArray(lines: string[], startIndex: number)`**
   - Parses array blocks `[ ... ]`
   - Supports nested arrays
   - Returns `{ value: any[], endIndex: number }`

3. **`parse(input: string, options?: ADMLParseOptions): ADMLResult`**
   - Main entry point for parsing ADML to JSON
   - Line-by-line state machine parser
   - Handles: multiline (`::`), arrays (`[]`), objects (`{}`), dot notation

4. **`stringifyArray(arr: any[], indent: string)`**
   - Converts arrays back to ADML format
   - Handles nested arrays with proper indentation

5. **`stringify(data: ADMLResult, options?: ADMLParseOptions): string`**
   - Main entry point for converting JSON to ADML
   - Handles all data types and structures

### Type Detection Priority

The `parseValue` function checks types in this order:
1. Boolean (`true` or `false`)
2. Number (regex: `/^-?\d+(\.\d+)?$/`)
3. String (fallback)

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

**Step 2: Update `stringify` to handle the new type**
```typescript
export function stringify(data: ADMLResult, options: ADMLParseOptions = {}): string {
  const lines: string[] = [];

  for (const [key, value] of Object.entries(data)) {
    // Add handling for your new type
    if (value === null) {
      lines.push(`${key}: null`);
    } else if (typeof value === 'string') {
      // ... existing code
    }
    // ... rest of function
  }
}
```

**Step 3: Update `stringifyArray` if needed**
```typescript
function stringifyArray(arr: any[], indent: string = ''): string[] {
  // Add handling in the type check
  } else if (value === null || typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') {
    lines.push(`${indent}${item}`);
  }
}
```

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
```

### 2. Adding New Syntax Features

To add a new syntax construct (e.g., sets, tuples):

**Step 1: Add parsing logic in `parse` function**

The parser uses a line-by-line state machine. Add your check in the main loop:

```typescript
export function parse(input: string, options: ADMLParseOptions = {}): ADMLResult {
  // ... existing code

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Add your syntax check here
    // Example: Set syntax - key: <( item1 item2 )>
    if (colonIndex > 0 && trimmed.endsWith('<(')) {
      const key = trimmed.substring(0, colonIndex).trim();
      const set = parseSet(lines, i + 1); // Create helper function
      result[key] = set.value;
      i = set.endIndex;
      continue;
    }

    // ... rest of parser
  }
}
```

**Step 2: Create helper function**
```typescript
function parseSet(lines: string[], startIndex: number): { value: Set<any>; endIndex: number } {
  const set = new Set<any>();
  let i = startIndex;

  while (i < lines.length) {
    const trimmed = lines[i].trim();

    if (trimmed === ')>') {
      return { value: set, endIndex: i + 1 };
    }

    if (trimmed && !trimmed.startsWith('//')) {
      set.add(parseValue(trimmed));
    }
    i++;
  }

  return { value: set, endIndex: i };
}
```

**Step 3: Add stringify support**
```typescript
export function stringify(data: ADMLResult, options: ADMLParseOptions = {}): string {
  // ... existing code

  for (const [key, value] of Object.entries(data)) {
    if (value instanceof Set) {
      lines.push(`${key}: <(`);
      for (const item of value) {
        lines.push(item);
      }
      lines.push(')>');
    }
    // ... rest of stringify
  }
}
```

**Step 4: Add comprehensive tests**

### 3. Extending the Editor

The editor (`packages/editor`) uses CodeMirror 6. To add features:

**Add Syntax Highlighting:**
1. Create a custom language mode in `src/index.ts`
2. Replace `markdown()` with your custom mode
3. See [CodeMirror 6 docs](https://codemirror.net/docs/) for language creation

**Add Custom Commands:**
```typescript
import { keymap } from '@codemirror/view';

const customKeymap = keymap.of([{
  key: "Ctrl-Space",
  run: (view) => {
    // Your autocomplete logic
    return true;
  }
}]);

// Add to extensions array in constructor
```

### 4. Extending the Playground

The playground (`apps/docs`) is a React + Vite app:

**Add New Examples:**
Edit `apps/docs/src/App.tsx` and update `initialValue`

**Add New UI Features:**
1. Edit `apps/docs/src/App.tsx` for component logic
2. Edit `apps/docs/src/App.css` for styling
3. Rebuild with `npm run build`

## Testing Strategy

### Parser Tests

Located in `packages/parser/src/index.test.ts`:

1. **Parse tests** - Test input → JSON conversion
2. **Stringify tests** - Test JSON → ADML conversion
3. **Roundtrip tests** - Test parse → stringify → parse preserves data

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
# Build all packages
npm run build

# Build specific package
cd packages/parser && npm run build
cd packages/editor && npm run build
```

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

### Error Handling

Currently minimal. To add:
1. Throw errors in parse functions
2. Catch in `parse()` main function
3. Add `strict` mode via options

### Performance

- Parser is O(n) - single pass through lines
- No backtracking
- Optimize with early returns in `parseValue`

## Future Enhancements

Suggested features to add:

1. **Error reporting** - Line numbers, helpful messages
2. **Source maps** - Track original positions
3. **Schema validation** - TypeScript types from ADML
4. **Include directives** - Import other ADML files
5. **Variables** - Reference values within document
6. **Escape sequences** - Special characters in strings
7. **Inline arrays** - `tags: [tag1, tag2, tag3]` on single line
8. **Null/undefined** - Explicit null values
9. **Dates** - ISO date parsing
10. **Custom types** - Plugin system for extensions

## Resources

- [ArchieML Spec](http://archieml.org/) - Original inspiration
- [CodeMirror 6](https://codemirror.net/) - Editor library
- [Vite](https://vitejs.dev/) - Build tool
- [Vitest](https://vitest.dev/) - Test framework
