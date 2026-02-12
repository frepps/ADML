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
Use `::` to start and end multiline blocks:
```
description::
Line 1
Line 2
Line 3
::
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
```
tags: [
javascript
typescript
nodejs
]
```

### Nested arrays
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
Lines starting with `//` are ignored:
```
// This is a comment
title: My Article
```

## API

### `parse(input: string, options?: ADMLParseOptions): ADMLResult`

Parses ADML markup string to JSON.

### `stringify(data: ADMLResult, options?: ADMLParseOptions): string`

Converts JSON back to ADML format.

## License

MIT
