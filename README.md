# ADML

**Article Data Markup Language** - A markup language inspired by ArchieML that compiles to JSON.

## Overview

ADML is designed for structured article data, making it easy to write and parse content with a human-friendly syntax that compiles to JSON.

### Features

- ✅ **Primitive types**: Strings, numbers, booleans with automatic type detection
- ✅ **Multiline strings**: Using `::` delimiters
- ✅ **Objects**: Both bracket `{ }` and dot notation syntax
- ✅ **Arrays**: Including nested arrays with `[ ]` syntax
- ✅ **Comments**: Line comments with `//`
- ✅ **Roundtrip support**: Parse ADML → JSON → ADML preserves data
- ✅ **41 comprehensive tests**: Ensuring reliability

## Monorepo Structure

```
ADML/
├── packages/
│   ├── parser/          # @adml/parser - Core ADML parser
│   └── editor/          # @adml/editor - Web-based editor component
├── apps/
│   └── docs/           # Documentation site with interactive playground
└── package.json        # Workspace configuration
```

## Packages

### [@adml/parser](packages/parser/)
Core parser that converts ADML markup to JSON and back.

```bash
npm install @adml/parser
```

```typescript
import { parse, stringify } from '@adml/parser';

const adml = `
title: My Article
author: John Doe
`;

const data = parse(adml);
console.log(data); // { title: 'My Article', author: 'John Doe' }
```

### [@adml/editor](packages/editor/)
Web-based editor component with syntax highlighting powered by CodeMirror.

```bash
npm install @adml/editor
```

```typescript
import { ADMLEditor } from '@adml/editor';

const editor = new ADMLEditor(document.getElementById('editor'), {
  initialValue: 'title: My Article',
  onChange: (value) => console.log(value)
});
```

## Development

### Prerequisites
- Node.js 20+
- npm 9+

### Getting Started

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Run tests
npm run test

# Start documentation site
cd apps/docs
npm run dev
```

### Workspace Commands

```bash
# Build all packages
npm run build

# Run tests in all packages
npm run test

# Development mode (watch)
npm run dev
```

## Documentation & Playground

Visit the [documentation site](apps/docs/) to try ADML in an interactive playground.

```bash
cd apps/docs
npm run dev
# Open http://localhost:3000
```

## Documentation

- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Detailed architecture and how to extend ADML
- **[DEVELOPMENT.md](DEVELOPMENT.md)** - Development guide and common tasks
- **[Parser README](packages/parser/README.md)** - Full syntax reference
- **[Editor README](packages/editor/README.md)** - Editor API documentation

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and workflow.

For architecture details and how to add new features, see [ARCHITECTURE.md](ARCHITECTURE.md).

## Inspiration

ADML is inspired by [ArchieML](http://archieml.org/), a markup language developed by The New York Times for writing structured text.

## License

MIT
