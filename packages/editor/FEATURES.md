# ADML Editor Features

The ADML editor provides a rich editing experience with syntax highlighting, autocomplete, and smart bracket handling.

## Syntax Highlighting

The editor provides syntax highlighting for all ADML features:

- **Property names** - Highlighted in a distinct color
- **Strings** - Regular string values
- **Numbers** - Numeric values (integers and floats)
- **Booleans** - `true` and `false` keywords
- **Comments** - Both single-line `//` and multiline `/* */`
- **Brackets** - Object `{ }` and array `[ ]` delimiters
- **Multiline delimiters** - The `::` markers for multiline strings

## Autocomplete

Press `Ctrl+Space` (or `Cmd+Space` on Mac) to trigger autocomplete suggestions:

### Value Suggestions
When you're after a colon (`:`), you'll get:
- `true` - Boolean true value
- `false` - Boolean false value

### Structure Suggestions
At the beginning of a line, you'll get:
- `key: value` - Simple key-value pair
- `key: {` - Object block with auto-closing
- `key: [` - Array block with auto-closing
- `key::` - Multiline value template

## Auto-Closing Brackets

The editor automatically closes brackets and provides smart indentation:

### Objects (`{`)
When you type `key: {`, the editor automatically:
1. Inserts the closing `}`
2. Adds proper indentation
3. Positions cursor at the indented line

**Example:**
```
Type: author: {
Result:
author: {
  |cursor here
}
```

### Arrays (`[`)
When you type `key: [`, the editor automatically:
1. Inserts the closing `]`
2. Adds a blank line
3. Positions cursor at the empty line

**Example:**
```
Type: tags: [
Result:
tags: [
|cursor here
]
```

### Enter Key Behavior

When pressing Enter between brackets, the editor:
- Maintains proper indentation
- Adds extra indent inside blocks
- Preserves the closing bracket position

**Example:**
```
Before: author: {|}
After pressing Enter:
author: {
  |cursor here
}
```

## Keyboard Shortcuts

- `Tab` - Indent line/selection
- `Shift+Tab` - Dedent line/selection
- `Ctrl+Space` / `Cmd+Space` - Trigger autocomplete
- `Enter` - Smart newline with indentation
- `{` - Auto-close object bracket (after `:`)
- `[` - Auto-close array bracket (after `:`)

## Usage

### Vanilla JavaScript
```javascript
import { ADMLEditor } from '@adml/editor';

const editor = new ADMLEditor(document.getElementById('editor'), {
  initialValue: 'title: Hello World',
  onChange: (value) => {
    console.log('ADML changed:', value);
  }
});
```

### React
```jsx
import { ADMLEditorReact } from '@adml/editor/react';

function MyComponent() {
  const [value, setValue] = useState('title: Hello World');

  return (
    <ADMLEditorReact
      value={value}
      onChange={setValue}
      className="my-editor"
    />
  );
}
```

## Customization

You can disable features by passing custom extensions:

```javascript
import { ADMLEditor, admlLanguage, autoCloseBrackets } from '@adml/editor';

// Only syntax highlighting, no autocomplete or auto-closing
const editor = new ADMLEditor(container, {
  extensions: [admlLanguage()]
});

// Only syntax highlighting and auto-closing, no autocomplete
const editor = new ADMLEditor(container, {
  extensions: [admlLanguage(), autoCloseBrackets()]
});
```

## Tips

1. **Try autocomplete** - Type `Ctrl+Space` at the start of a line to see structure templates
2. **Fast object creation** - Type `key: {` and let auto-close handle the rest
3. **Array shortcuts** - Type `key: [` for instant array structure
4. **Comment blocks** - Use `/*` for multiline comments that span multiple lines
5. **Multiline strings** - Type `key::` and the editor will help format it
