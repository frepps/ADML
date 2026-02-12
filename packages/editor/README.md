# @adml/editor

Web-based editor component for ADML (Article Data Markup Language) with syntax highlighting, autocomplete, and smart bracket handling.

## Features

✨ **Syntax Highlighting** - Colors for properties, values, comments, and brackets
🎯 **Autocomplete** - Context-aware suggestions for keys and values
🔧 **Auto-Closing Brackets** - Smart completion for `{`, `[`, and proper indentation
⌨️ **Keyboard Shortcuts** - Tab indentation, Ctrl+Space autocomplete
💡 **Smart Formatting** - Automatic indentation and structure

See [FEATURES.md](./FEATURES.md) for detailed documentation.

## Installation

```bash
npm install @adml/editor
```

## Usage

### Vanilla JavaScript

```typescript
import { ADMLEditor } from '@adml/editor';

const editor = new ADMLEditor(document.getElementById('editor'), {
  initialValue: 'title: My Article',
  onChange: (value) => {
    console.log('Content changed:', value);
  }
});
```

### React

```tsx
import { ADMLEditorReact } from '@adml/editor/react';

function App() {
  const [value, setValue] = useState('title: My Article');

  return (
    <ADMLEditorReact
      value={value}
      onChange={setValue}
    />
  );
}
```

## API

### `ADMLEditor`

Constructor options:
- `initialValue?: string` - Initial editor content
- `onChange?: (value: string) => void` - Called when content changes
- `extensions?: Extension[]` - Additional CodeMirror extensions
- `theme?: 'light' | 'dark'` - Editor theme

Methods:
- `getValue(): string` - Get current editor content
- `setValue(value: string): void` - Set editor content
- `destroy(): void` - Cleanup editor instance

## License

MIT
