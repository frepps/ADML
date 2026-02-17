# @adml/parser

ADML parser - converts Article Data Markup Language (ADML) to JSON.

## Installation

```bash
npm install @adml/parser
```

## Usage

```typescript
import { parse, stringify } from '@adml/parser';

// Parse ADML to JSON
const adml = `
title: My Article
author: John Doe

// Multiline strings use :: syntax
description::
This is a multiline
description that spans
multiple lines.
::
`;

const data = parse(adml);
console.log(data);
// {
//   title: 'My Article',
//   author: 'John Doe',
//   description: 'This is a multiline\ndescription that spans\nmultiple lines.'
// }

// Convert JSON back to ADML
const admlString = stringify(data);
console.log(admlString);
```

## Syntax

### Single-line values
Strings:
```
key: value
title: Hello World
```

Numbers (automatically detected):
```
port: 3000
timeout: 30.5
negative: -15
```

String with numbers (not pure numeric):
```
size: 34px
version: v1.2.3
```

Booleans (automatically detected):
```
enabled: true
debug: false
```

Note: Only the exact strings `true` and `false` are parsed as booleans. Any other values remain strings:
```
text: trueish      // remains string
value: false positive  // remains string
```

### Multiline values
Use `::` to start and end multiline blocks. Leading and trailing whitespace on each line is automatically trimmed:
```
description::
Line 1
Line 2
Line 3
::
```

Indentation is stripped, so these are equivalent:
```
description::
Line 1
::

description::
  Line 1
::
```

Both produce: `"description": "Line 1"`

Multiline values also work inside objects:
```
article: {
  title: My Article
  description::
this is a
multiline description
::
  author: John Doe
}
```

### Objects with bracket syntax
```
author: {
  name: John Doe
  email: john@example.com
}
```

### Objects with dot notation
```
author.name: John Doe
author.email: john@example.com
```

Both syntaxes above produce the same result:
```json
{
  "author": {
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### Nested objects

Objects can nest to any depth. Bracket syntax and dot notation can be mixed freely — all of the following produce the same result:

Nested brackets:
```
obj: {
  key: {
    subkey: value
  }
}
```

Dot notation inside brackets:
```
obj: {
  key.subkey: value
}
```

Dot notation opening a bracket block:
```
obj.key: {
  subkey: value
}
```

Pure dot notation:
```
obj.key.subkey: value
```

All produce:
```json
{
  "obj": {
    "key": {
      "subkey": "value"
    }
  }
}
```

Dot notation merges into existing objects, so this works:
```
obj: {
  key1: val1
}
obj.key2: val2
```

Produces:
```json
{
  "obj": {
    "key1": "val1",
    "key2": "val2"
  }
}
```

### Arrays

Array values must be on separate lines, indented with two spaces:

```
tags: [
  javascript
  typescript
  nodejs
]
```

Produces:
```json
{
  "tags": ["javascript", "typescript", "nodejs"]
}
```

### Nested arrays

Arrays can be nested. Each value (including nested arrays) must be on its own line:

```
matrix: [
  [
    1
    2
  ]
  [
    3
    4
  ]
  single value
]
```

Produces:
```json
{
  "matrix": [
    [1, 2],
    [3, 4],
    "single value"
  ]
}
```

### Content arrays

Content arrays use double brackets `[[...]]` to define structured content blocks. Each entry has a required `type`, with optional `value`, `mods` (modifiers), and `props` (properties) — empty keys are omitted:

```
body: [[
  #heading: Welcome
  This is a paragraph.
  #image.hero: banner.jpg
]]
```

Produces:
```json
{
  "body": [
    { "type": "heading", "value": "Welcome" },
    { "type": "p", "value": "This is a paragraph." },
    { "type": "image", "value": "banner.jpg", "mods": ["hero"] }
  ]
}
```

- Lines starting with `#` define the type: `#type: value`
- Modifiers are added with dots: `#type.mod1.mod2: value`
- Plain text (no `#`) gets the default type `"p"`

#### Content entries with props

Use `<...>` to add properties to a content entry. Props use the same syntax as regular ADML values:

```
body: [[
  <#image.hero: banner.jpg
    alt: A beautiful banner
    width: 1200
    style.objectFit: cover
  >
]]
```

Special prop keys:
- `value` overrides the content value
- `mods` (with array value) overrides the content modifiers

#### Nested content arrays

Content arrays can be used as values or props, enabling component trees:

```
body: [[
  <#div.container: [[
      #h1: Title
      Some text here.
    ]]
    class: main
  >
]]
```

### Comments

Single-line comments start with `//`:
```
// This is a comment
title: My Article
```

Multiline comments use `/* ... */` syntax (like JavaScript):
```
/*
This is a multiline comment
spanning multiple lines
*/
title: My Article
/* Another comment */
author: Test Author
```

Inline multiline comments are also supported:
```
title: Test /* inline comment */ value
```

### Inline content

A separate parser for rich inline content within string values. Use `parseContentValue()` on any string to get a content array with the same shape as content arrays (required `type`, optional `value`, `mods`, `props`).

```typescript
import { parseContentValue } from '@adml/parser';

parseContentValue('A [strong part] of string');
// [
//   { type: 'text', value: 'A ' },
//   { type: 'strong', value: 'strong part' },
//   { type: 'text', value: ' of string' }
// ]
```

**Brackets `[...]`** mark inline content. The default type is `"strong"`. Use `|` to separate parameters:

```
[value | #type.mod1.mod2 | prop: value | prop2: value2]
```

- First parameter is always the value
- `#type.mod` sets the type and modifiers
- Other parameters are props (`key: value`, supports dot notation)

**Links:** If the second parameter is link-like (starts with `/`, `http://`, `https://`, or `@`), the type defaults to `"a"` and the link becomes an `href` prop:

```typescript
parseContentValue('[click here|/about]');
// [{ type: 'a', value: 'click here', props: { href: '/about' } }]
```

**HTML detection:** If the value starts with `<`, the default type is `"html"`:

```typescript
parseContentValue('[<code>example</code>]');
// [{ type: 'html', value: '<code>example</code>' }]
```

**Special cases:**
- `[]` → `{ type: 'html', value: '&nbsp;' }` (non-breaking space)
- `[/]` → `{ type: 'html', value: '<br>' }` (line break)
- `[-]` → `{ type: 'html', value: '&shy;' }` (soft hyphen)

**Text substitutions** (applied to non-HTML content):
- `"` → `\u201D` (swedish double quote)
- `--` → `\u2013` (en dash)
- `\"` → literal `"` (escaped, no substitution)

**Escaping:** Use `\` to escape special characters:
- `\[` and `\]` for literal brackets in plain text
- `\|` for literal pipe inside brackets

## API

### `parse(input: string, options?: ADMLParseOptions): ADMLResult`

Parses ADML markup string to JSON.

### `stringify(data: ADMLResult, options?: ADMLParseOptions): string`

Converts JSON back to ADML format.

### `parseContentValue(input: string): ContentItem[]`

Parses a string containing inline content markup into a content array. Each item has a required `type`, with optional `value`, `mods`, and `props`.

### `stringifyContentValue(content: ContentItem[]): string`

Converts a content array back to an inline content string.

## License

MIT
