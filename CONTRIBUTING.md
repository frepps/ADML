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
│   │   │   └── index.test.ts # Tests
│   │   └── package.json
│   │
│   └── editor/          # Web editor component
│       ├── src/
│       │   ├── index.ts  # Vanilla JS editor
│       │   └── react.tsx # React wrapper
│       └── package.json
│
└── apps/
    └── docs/           # Documentation & playground
        ├── src/
        │   ├── App.tsx # Playground app
        │   └── main.tsx
        └── package.json
```

## Development Workflow

### Working on the Parser

```bash
cd packages/parser
npm run dev      # Watch mode
npm run test     # Run tests
```

### Working on the Editor

```bash
cd packages/editor
npm run dev      # Watch mode
```

### Working on the Docs

```bash
cd apps/docs
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
- Add JSDoc comments for public APIs

## Questions?

Feel free to open an issue for questions or discussion.
