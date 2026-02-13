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

### Arrays with bracket syntax

Array values must be on separate lines. Indentation is optional and stripped from values, but improves readability:

```
tags: [
  javascript
  typescript
  nodejs
]
```

Or without indentation:
```
tags: [
javascript
typescript
nodejs
]
```

Both produce:
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
    ["1", "2"],
    ["3", "4"],
    "single value"
  ]
}
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

## API

### `parse(input: string, options?: ADMLParseOptions): ADMLResult`

Parses ADML markup string to JSON.

### `stringify(data: ADMLResult, options?: ADMLParseOptions): string`

Converts JSON back to ADML format.

## License

MIT
