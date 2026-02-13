import { describe, it, expect } from 'vitest';
import { parse, stringify } from './index';

describe('ADML Parser', () => {
  describe('parse', () => {
    it('should parse simple key-value pairs', () => {
      const input = `
title: Hello World
author: John Doe
      `.trim();

      const result = parse(input);

      expect(result).toEqual({
        title: 'Hello World',
        author: 'John Doe'
      });
    });

    it('should skip empty lines', () => {
      const input = `
title: Test

author: Test Author
      `.trim();

      const result = parse(input);

      expect(result.title).toBe('Test');
      expect(result.author).toBe('Test Author');
    });

    it('should skip comments', () => {
      const input = `
// This is a comment
title: Test
// Another comment
author: Test Author
      `.trim();

      const result = parse(input);

      expect(result).toEqual({
        title: 'Test',
        author: 'Test Author'
      });
    });

    it('should skip multiline comments', () => {
      const input = `
/*
This is a multiline comment
spanning multiple lines
*/
title: Test
/* Another comment */
author: Test Author
      `.trim();

      const result = parse(input);

      expect(result).toEqual({
        title: 'Test',
        author: 'Test Author'
      });
    });

    it('should handle multiline comments in arrays', () => {
      const input = `
tags: [
  javascript
  /* comment in array */
  typescript
  nodejs
]
      `.trim();

      const result = parse(input);

      expect(result.tags).toEqual(['javascript', 'typescript', 'nodejs']);
    });

    it('should handle multiline comments in objects', () => {
      const input = `
author: {
  /* comment before property */
  name: John Doe
  /* another comment */
  email: john@example.com
}
      `.trim();

      const result = parse(input);

      expect(result.author).toEqual({
        name: 'John Doe',
        email: 'john@example.com'
      });
    });

    it('should handle inline multiline comments', () => {
      const input = `
title: Test /* inline comment */ value
author: John Doe
      `.trim();

      const result = parse(input);

      expect(result.title).toBe('Test  value');
      expect(result.author).toBe('John Doe');
    });

    it('should parse multiline strings with :: syntax', () => {
      const input = `
title: My Article
description::
this is
a multiline
string
::
author: John Doe
      `.trim();

      const result = parse(input);

      expect(result.title).toBe('My Article');
      expect(result.description).toBe('this is\na multiline\nstring');
      expect(result.author).toBe('John Doe');
    });

    it('should strip leading and trailing spaces from multiline content lines', () => {
      const input = `
content::
  Line 1 with indent
  Line 2 with indent
::
      `.trim();

      const result = parse(input);

      expect(result.content).toBe('Line 1 with indent\nLine 2 with indent');
    });

    it('should preserve internal spaces in multiline content', () => {
      const input = `
content::
Line with  multiple  spaces
Another   line
::
      `.trim();

      const result = parse(input);

      expect(result.content).toBe('Line with  multiple  spaces\nAnother   line');
    });

    it('should handle empty multiline blocks', () => {
      const input = `
empty::
::
      `.trim();

      const result = parse(input);

      expect(result.empty).toBe('');
    });

    it('should parse objects with bracket syntax', () => {
      const input = `
title: My Article
author: {
  name: John Doe
  email: john@example.com
}
      `.trim();

      const result = parse(input);

      expect(result.title).toBe('My Article');
      expect(result.author).toEqual({
        name: 'John Doe',
        email: 'john@example.com'
      });
    });

    it('should parse objects with dot notation', () => {
      const input = `
title: My Article
author.name: John Doe
author.email: john@example.com
      `.trim();

      const result = parse(input);

      expect(result.title).toBe('My Article');
      expect(result.author).toEqual({
        name: 'John Doe',
        email: 'john@example.com'
      });
    });

    it('should handle mixed object syntax', () => {
      const input = `
metadata.version: 1.0
metadata.created: 2026-02-12
author: {
  name: John Doe
  role: Writer
}
      `.trim();

      const result = parse(input);

      expect(result.metadata).toEqual({
        version: 1.0,
        created: '2026-02-12'
      });
      expect(result.author).toEqual({
        name: 'John Doe',
        role: 'Writer'
      });
    });

    it('should handle empty objects', () => {
      const input = `
empty: {
}
      `.trim();

      const result = parse(input);

      expect(result.empty).toEqual({});
    });

    it('should parse multiline strings inside objects', () => {
      const input = `
article: {
  title: My Article
  description::
this is a
multiline description
::
  author: John Doe
}
      `.trim();

      const result = parse(input);

      expect(result.article).toEqual({
        title: 'My Article',
        description: 'this is a\nmultiline description',
        author: 'John Doe'
      });
    });

    it('should handle multiple multiline strings in objects', () => {
      const input = `
post: {
  title::
First Line
Second Line
::
  content::
Content line 1
Content line 2
Content line 3
::
  author: Jane
}
      `.trim();

      const result = parse(input);

      expect(result.post).toEqual({
        title: 'First Line\nSecond Line',
        content: 'Content line 1\nContent line 2\nContent line 3',
        author: 'Jane'
      });
    });

    it('should strip spaces from multiline strings in objects', () => {
      const input = `
article: {
  description::
  Line with leading spaces
    Line with more spaces
  Last line
::
}
      `.trim();

      const result = parse(input);

      expect(result.article.description).toBe('Line with leading spaces\nLine with more spaces\nLast line');
    });

    it('should parse simple arrays', () => {
      const input = `
title: My Article
tags: [
  javascript
  typescript
  nodejs
]
      `.trim();

      const result = parse(input);

      expect(result.title).toBe('My Article');
      expect(result.tags).toEqual(['javascript', 'typescript', 'nodejs']);
    });

    it('should parse nested arrays', () => {
      const input = `
matrix: [
  [
    1
    2
  ]
  [
    3
    4
  ]
]
      `.trim();

      const result = parse(input);

      expect(result.matrix).toEqual([[1, 2], [3, 4]]);
    });

    it('should parse mixed arrays', () => {
      const input = `
items: [
  [
    nested1
    nested2
  ]
  single value
  [
    nested3
  ]
]
      `.trim();

      const result = parse(input);

      expect(result.items).toEqual([['nested1', 'nested2'], 'single value', ['nested3']]);
    });

    it('should handle empty arrays', () => {
      const input = `
empty: [
]
      `.trim();

      const result = parse(input);

      expect(result.empty).toEqual([]);
    });

    it('should parse numeric values as numbers', () => {
      const input = `
integer: 42
float: 37.38
negative: -15
negativeFloat: -3.14
      `.trim();

      const result = parse(input);

      expect(result.integer).toBe(42);
      expect(typeof result.integer).toBe('number');
      expect(result.float).toBe(37.38);
      expect(typeof result.float).toBe('number');
      expect(result.negative).toBe(-15);
      expect(result.negativeFloat).toBe(-3.14);
    });

    it('should keep non-numeric strings as strings', () => {
      const input = `
withUnit: 34px
text: hello
mixed: 42abc
      `.trim();

      const result = parse(input);

      expect(result.withUnit).toBe('34px');
      expect(typeof result.withUnit).toBe('string');
      expect(result.text).toBe('hello');
      expect(result.mixed).toBe('42abc');
    });

    it('should parse numbers in objects', () => {
      const input = `
config: {
  port: 3000
  timeout: 5.5
}
      `.trim();

      const result = parse(input);

      expect(result.config.port).toBe(3000);
      expect(typeof result.config.port).toBe('number');
      expect(result.config.timeout).toBe(5.5);
    });

    it('should parse numbers in arrays', () => {
      const input = `
numbers: [
  1
  2.5
  -3
]
      `.trim();

      const result = parse(input);

      expect(result.numbers).toEqual([1, 2.5, -3]);
      expect(typeof result.numbers[0]).toBe('number');
    });

    it('should parse numbers with dot notation', () => {
      const input = `
config.port: 8080
config.timeout: 30.5
      `.trim();

      const result = parse(input);

      expect(result.config.port).toBe(8080);
      expect(result.config.timeout).toBe(30.5);
    });

    it('should parse boolean values', () => {
      const input = `
isActive: true
isDisabled: false
      `.trim();

      const result = parse(input);

      expect(result.isActive).toBe(true);
      expect(typeof result.isActive).toBe('boolean');
      expect(result.isDisabled).toBe(false);
      expect(typeof result.isDisabled).toBe('boolean');
    });

    it('should keep non-boolean strings as strings', () => {
      const input = `
text: trueish
value: false positive
      `.trim();

      const result = parse(input);

      expect(result.text).toBe('trueish');
      expect(typeof result.text).toBe('string');
      expect(result.value).toBe('false positive');
      expect(typeof result.value).toBe('string');
    });

    it('should parse booleans in objects', () => {
      const input = `
config: {
  enabled: true
  debug: false
}
      `.trim();

      const result = parse(input);

      expect(result.config.enabled).toBe(true);
      expect(result.config.debug).toBe(false);
    });

    it('should parse booleans in arrays', () => {
      const input = `
flags: [
  true
  false
  true
]
      `.trim();

      const result = parse(input);

      expect(result.flags).toEqual([true, false, true]);
      expect(typeof result.flags[0]).toBe('boolean');
    });

    it('should parse booleans with dot notation', () => {
      const input = `
feature.enabled: true
feature.beta: false
      `.trim();

      const result = parse(input);

      expect(result.feature.enabled).toBe(true);
      expect(result.feature.beta).toBe(false);
    });

    it('should parse nested objects with bracket syntax', () => {
      const input = `
obj: {
  key: {
    subkey: value
  }
}
      `.trim();

      const result = parse(input);

      expect(result).toEqual({
        obj: { key: { subkey: 'value' } }
      });
    });

    it('should parse dot notation inside brackets', () => {
      const input = `
obj: {
  key.subkey: value
}
      `.trim();

      const result = parse(input);

      expect(result).toEqual({
        obj: { key: { subkey: 'value' } }
      });
    });

    it('should parse dot notation key with bracket value', () => {
      const input = `
obj.key: {
  subkey: value
}
      `.trim();

      const result = parse(input);

      expect(result).toEqual({
        obj: { key: { subkey: 'value' } }
      });
    });

    it('should produce same result for all mixed object syntaxes', () => {
      const bracketNested = parse(`
obj: {
  key: {
    subkey: value
  }
}
      `.trim());

      const dotInsideBracket = parse(`
obj: {
  key.subkey: value
}
      `.trim());

      const dotWithBracket = parse(`
obj.key: {
  subkey: value
}
      `.trim());

      const pureDot = parse(`
obj.key.subkey: value
      `.trim());

      expect(bracketNested).toEqual(dotInsideBracket);
      expect(dotInsideBracket).toEqual(dotWithBracket);
      expect(dotWithBracket).toEqual(pureDot);
      expect(pureDot).toEqual({
        obj: { key: { subkey: 'value' } }
      });
    });

    it('should parse deep dot notation (3+ levels)', () => {
      const input = `
a.b.c.d: deep
      `.trim();

      const result = parse(input);

      expect(result).toEqual({
        a: { b: { c: { d: 'deep' } } }
      });
    });

    it('should merge dot notation into existing objects', () => {
      const input = `
obj: {
  key1: val1
}
obj.key2: val2
      `.trim();

      const result = parse(input);

      expect(result).toEqual({
        obj: { key1: 'val1', key2: 'val2' }
      });
    });
  });

  describe('stringify', () => {
    it('should convert JSON to ADML format', () => {
      const data = {
        title: 'Hello World',
        author: 'John Doe'
      };

      const result = stringify(data);

      expect(result).toContain('title: Hello World');
      expect(result).toContain('author: John Doe');
    });

    it('should use multiline syntax for strings with newlines', () => {
      const data = {
        title: 'Hello World',
        content: 'Line 1\nLine 2\nLine 3'
      };

      const result = stringify(data);

      expect(result).toContain('title: Hello World');
      expect(result).toContain('content::');
      expect(result).toContain('Line 1\nLine 2\nLine 3');
      expect(result).toContain('::');
    });

    it('should roundtrip parse and stringify', () => {
      const input = `
title: My Article
description::
this is
a multiline
description
::
author: John Doe
      `.trim();

      const parsed = parse(input);
      const stringified = stringify(parsed);
      const reparsed = parse(stringified);

      expect(reparsed).toEqual(parsed);
    });

    it('should stringify objects with bracket syntax', () => {
      const data = {
        title: 'My Article',
        author: {
          name: 'John Doe',
          email: 'john@example.com'
        }
      };

      const result = stringify(data);

      expect(result).toContain('title: My Article');
      expect(result).toContain('author: {');
      expect(result).toContain('name: John Doe');
      expect(result).toContain('email: john@example.com');
      expect(result).toContain('}');
    });

    it('should roundtrip objects with bracket syntax', () => {
      const input = `
title: My Article
author: {
  name: John Doe
  email: john@example.com
}
      `.trim();

      const parsed = parse(input);
      const stringified = stringify(parsed);
      const reparsed = parse(stringified);

      expect(reparsed).toEqual(parsed);
    });

    it('should roundtrip objects with dot notation', () => {
      const input = `
title: My Article
author.name: John Doe
author.email: john@example.com
      `.trim();

      const parsed = parse(input);
      const stringified = stringify(parsed);
      const reparsed = parse(stringified);

      expect(reparsed).toEqual(parsed);
    });

    it('should roundtrip objects with multiline strings', () => {
      const input = `
article: {
  title: My Article
  description::
this is a
multiline description
::
  author: John Doe
}
      `.trim();

      const parsed = parse(input);
      const stringified = stringify(parsed);
      const reparsed = parse(stringified);

      expect(reparsed).toEqual(parsed);
      expect(reparsed.article.description).toBe('this is a\nmultiline description');
    });

    it('should stringify simple arrays', () => {
      const data = {
        title: 'My Article',
        tags: ['javascript', 'typescript', 'nodejs']
      };

      const result = stringify(data);

      expect(result).toContain('title: My Article');
      expect(result).toContain('tags: [');
      expect(result).toContain('  javascript');
      expect(result).toContain('  typescript');
      expect(result).toContain('  nodejs');
      expect(result).toContain(']');
    });

    it('should stringify nested arrays', () => {
      const data = {
        matrix: [[1, 2], [3, 4]]
      };

      const result = stringify(data);

      expect(result).toContain('matrix: [');
      expect(result).toContain('  [');
      expect(result).toContain('    1');
      expect(result).toContain('    2');
      expect(result).toContain('    3');
      expect(result).toContain('    4');
      expect(result).toContain('  ]');
    });

    it('should roundtrip simple arrays', () => {
      const input = `
tags: [
  javascript
  typescript
  nodejs
]
      `.trim();

      const parsed = parse(input);
      const stringified = stringify(parsed);
      const reparsed = parse(stringified);

      expect(reparsed).toEqual(parsed);
    });

    it('should roundtrip nested arrays', () => {
      const input = `
matrix: [
  [
    1
    2
  ]
  [
    3
    4
  ]
]
      `.trim();

      const parsed = parse(input);
      const stringified = stringify(parsed);
      const reparsed = parse(stringified);

      expect(reparsed).toEqual(parsed);
    });

    it('should stringify numbers correctly', () => {
      const data = {
        integer: 42,
        float: 37.38,
        negative: -15
      };

      const result = stringify(data);

      expect(result).toContain('integer: 42');
      expect(result).toContain('float: 37.38');
      expect(result).toContain('negative: -15');
    });

    it('should roundtrip numbers', () => {
      const input = `
integer: 42
float: 37.38
text: 34px
      `.trim();

      const parsed = parse(input);
      const stringified = stringify(parsed);
      const reparsed = parse(stringified);

      expect(reparsed).toEqual(parsed);
      expect(reparsed.integer).toBe(42);
      expect(reparsed.float).toBe(37.38);
      expect(reparsed.text).toBe('34px');
    });

    it('should roundtrip numbers in objects', () => {
      const input = `
config: {
  port: 3000
  timeout: 5.5
}
      `.trim();

      const parsed = parse(input);
      const stringified = stringify(parsed);
      const reparsed = parse(stringified);

      expect(reparsed).toEqual(parsed);
      expect(reparsed.config.port).toBe(3000);
    });

    it('should stringify booleans correctly', () => {
      const data = {
        enabled: true,
        disabled: false
      };

      const result = stringify(data);

      expect(result).toContain('enabled: true');
      expect(result).toContain('disabled: false');
    });

    it('should roundtrip booleans', () => {
      const input = `
isActive: true
isDisabled: false
      `.trim();

      const parsed = parse(input);
      const stringified = stringify(parsed);
      const reparsed = parse(stringified);

      expect(reparsed).toEqual(parsed);
      expect(reparsed.isActive).toBe(true);
      expect(reparsed.isDisabled).toBe(false);
    });

    it('should roundtrip booleans in objects', () => {
      const input = `
config: {
  enabled: true
  debug: false
}
      `.trim();

      const parsed = parse(input);
      const stringified = stringify(parsed);
      const reparsed = parse(stringified);

      expect(reparsed).toEqual(parsed);
      expect(reparsed.config.enabled).toBe(true);
      expect(reparsed.config.debug).toBe(false);
    });

    it('should stringify nested objects recursively', () => {
      const data = {
        obj: { key: { subkey: 'value' } }
      };

      const result = stringify(data);

      expect(result).toContain('obj: {');
      expect(result).toContain('key: {');
      expect(result).toContain('subkey: value');
    });

    it('should roundtrip nested objects', () => {
      const input = `
obj: {
  key: {
    subkey: value
  }
}
      `.trim();

      const parsed = parse(input);
      const stringified = stringify(parsed);
      const reparsed = parse(stringified);

      expect(reparsed).toEqual(parsed);
      expect(reparsed).toEqual({
        obj: { key: { subkey: 'value' } }
      });
    });

    it('should roundtrip deep dot notation', () => {
      const input = `
a.b.c: deep
      `.trim();

      const parsed = parse(input);
      const stringified = stringify(parsed);
      const reparsed = parse(stringified);

      expect(reparsed).toEqual(parsed);
    });

    it('should roundtrip mixed types', () => {
      const input = `
title: My Article
count: 42
price: 29.99
active: true
disabled: false
      `.trim();

      const parsed = parse(input);
      const stringified = stringify(parsed);
      const reparsed = parse(stringified);

      expect(reparsed).toEqual(parsed);
      expect(typeof reparsed.title).toBe('string');
      expect(typeof reparsed.count).toBe('number');
      expect(typeof reparsed.price).toBe('number');
      expect(typeof reparsed.active).toBe('boolean');
      expect(typeof reparsed.disabled).toBe('boolean');
    });
  });
});
