# Contributing to ADML

Thank you for your interest in contributing to ADML!

## Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ADML.git
   cd ADML
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build all packages**
   ```bash
   npm run build
   ```

4. **Run tests**
   ```bash
   npm test
   ```

5. **Start the playground**
   ```bash
   cd apps/docs
   npm run dev
   ```
   Then visit http://localhost:3000

## Project Structure

```
ADML/
├── packages/
│   ├── parser/          # Core ADML parser
│   │   ├── src/
│   │   │   ├── index.ts      # Parser implementation
│   │   │   └── index.test.ts # Tests (133 tests)
│   │   └── package.json
│   │
│   ├── editor/          # Web editor component
│   │   ├── src/
│   │   │   ├── index.ts      # Vanilla JS editor
│   │   │   ├── react.tsx     # React wrapper
│   │   │   ├── lang-adml.ts  # ADML syntax highlighting
│   │   │   └── auto-close.ts # Smart bracket handling
│   │   └── package.json
│   │
│   └── vscode/          # VS Code extension
│       ├── syntaxes/         # TextMate grammar
│       ├── snippets/         # Code snippets
│       └── package.json
│
└── apps/
    ├── docs/           # Documentation & playground
    │   ├── src/
    │   │   ├── App.tsx # Playground app
    │   │   └── main.tsx
    │   └── package.json
    │
    └── example/        # CMS + Article renderer (Astro)
        ├── src/
        │   ├── components/
        │   │   ├── renderer/  # Content renderer & registry
        │   │   └── cms/       # CMS editor (React island)
        │   ├── templates/     # Page layouts
        │   ├── pages/         # Routes & API
        │   └── styles/        # CSS
        └── package.json
```

## Development Workflow

### Working on the Parser

```bash
cd packages/parser
npm run dev      # Watch mode
npm test         # Run tests
npm test -- --watch  # Tests in watch mode
```

### Working on the Editor

```bash
cd packages/editor
npm run dev      # Watch mode
```

### Working on the VS Code Extension

```bash
cd packages/vscode
npm run build    # Build extension
npm run package  # Package as .vsix
```

### Working on the Docs

```bash
cd apps/docs
npm run dev      # Start dev server
```

### Working on the Example App

```bash
cd apps/example
npm run dev      # Start dev server
```

## Testing

Run tests for all packages:
```bash
npm test
```

Run tests for a specific package:
```bash
cd packages/parser
npm test
```

## Building

Build all packages:
```bash
npm run build
```

Build a specific package:
```bash
cd packages/parser
npm run build
```

**Note:** The editor build runs `build:lib` (Vite) before `build:types` (tsc) because Vite cleans the `dist/` directory.

## Submitting Changes

1. Create a new branch for your feature/fix
2. Make your changes
3. Add tests if applicable
4. Run tests and ensure they pass
5. Build the project and ensure it compiles
6. Commit your changes with a descriptive message
7. Push to your fork and submit a pull request

## Code Style

- Use TypeScript for all new code
- Follow existing code style and conventions
- Write clear, descriptive commit messages

## Questions?

Feel free to open an issue for questions or discussion.
