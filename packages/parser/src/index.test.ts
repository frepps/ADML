import { describe, it, expect } from 'vitest';
import { parse, stringify, parseContentValue, stringifyContentValue } from './index';

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

  describe('content arrays', () => {
    it('should parse content array with typed entries', () => {
      const input = `
content: [[
  #heading: Welcome
  #image: photo.jpg
]]`.trim();
      const result = parse(input);
      expect(result.content).toEqual([
        { type: 'heading', value: 'Welcome' },
        { type: 'image', value: 'photo.jpg' },
      ]);
    });

    it('should parse content entries with modifiers', () => {
      const input = `
content: [[
  #heading.large.bold: Title
]]`.trim();
      const result = parse(input);
      expect(result.content[0]).toEqual({
        type: 'heading', value: 'Title', mods: ['large', 'bold']
      });
    });

    it('should parse plain text as paragraph type', () => {
      const input = `
content: [[
  This is a paragraph.
]]`.trim();
      const result = parse(input);
      expect(result.content[0]).toEqual({
        type: 'p', value: 'This is a paragraph.'
      });
    });

    it('should parse content entries with props', () => {
      const input = `
content: [[
  <#image.hero: banner.jpg
    alt: A beautiful banner
    width: 1200
  >
]]`.trim();
      const result = parse(input);
      expect(result.content[0]).toEqual({
        type: 'image', value: 'banner.jpg', mods: ['hero'],
        props: { alt: 'A beautiful banner', width: 1200 }
      });
    });

    it('should allow props value key to override content value', () => {
      const input = `
content: [[
  <#heading: Original
    value: Overridden
  >
]]`.trim();
      const result = parse(input);
      expect(result.content[0].value).toBe('Overridden');
      expect(result.content[0].props?.value).toBeUndefined();
    });

    it('should allow props mods key to override content mods', () => {
      const input = `
content: [[
  <#heading.small: Title
    mods: [
      large
      bold
    ]
  >
]]`.trim();
      const result = parse(input);
      expect(result.content[0].mods).toEqual(['large', 'bold']);
      expect(result.content[0].props?.mods).toBeUndefined();
    });

    it('should parse nested content arrays as value', () => {
      const input = `
content: [[
  <#div.border: [[
      #h3: Hello fellow coder
      This is awesome!
    ]]
    style.color: blue
  >
]]`.trim();
      const result = parse(input);
      expect(result.content[0].type).toBe('div');
      expect(result.content[0].mods).toEqual(['border']);
      expect(result.content[0].value).toEqual([
        { type: 'h3', value: 'Hello fellow coder' },
        { type: 'p', value: 'This is awesome!' },
      ]);
      expect(result.content[0].props).toEqual({
        style: { color: 'blue' }
      });
    });

    it('should parse nested content arrays in props', () => {
      const input = `
content: [[
  <#section: Main
    children: [[
      #heading: Nested Title
      Some paragraph text.
    ]]
  >
]]`.trim();
      const result = parse(input);
      expect(result.content[0].props.children).toEqual([
        { type: 'heading', value: 'Nested Title' },
        { type: 'p', value: 'Some paragraph text.' },
      ]);
    });

    it('should parse mixed content types', () => {
      const input = `
content: [[
  #heading: Welcome
  This is body text.
  <#image: photo.jpg
    alt: A photo
  >
  Another paragraph.
]]`.trim();
      const result = parse(input);
      expect(result.content).toHaveLength(4);
      expect(result.content[0].type).toBe('heading');
      expect(result.content[1].type).toBe('p');
      expect(result.content[2].type).toBe('image');
      expect(result.content[3].type).toBe('p');
    });

    it('should parse empty content array', () => {
      const input = `
content: [[
]]`.trim();
      const result = parse(input);
      expect(result.content).toEqual([]);
    });

    it('should parse content arrays inside objects', () => {
      const input = `
article: {
  title: My Article
  body: [[
    #heading: Introduction
    Some text here.
  ]]
}`.trim();
      const result = parse(input);
      expect(result.article.body).toEqual([
        { type: 'heading', value: 'Introduction' },
        { type: 'p', value: 'Some text here.' },
      ]);
    });

    it('should parse content arrays with dot notation keys', () => {
      const input = `
page.content: [[
  #heading: Hello
]]`.trim();
      const result = parse(input);
      expect(result.page.content).toEqual([
        { type: 'heading', value: 'Hello' },
      ]);
    });

    it('should parse props with dot notation and nested objects', () => {
      const input = `
content: [[
  <#component: Button
    style.color: blue
    style.fontSize: 14
    onClick: handleClick
  >
]]`.trim();
      const result = parse(input);
      expect(result.content[0].props).toEqual({
        style: { color: 'blue', fontSize: 14 },
        onClick: 'handleClick',
      });
    });

    it('should parse type without colon as empty value', () => {
      const input = `
content: [[
  <#divider
    width: 100
  >
]]`.trim();
      const result = parse(input);
      expect(result.content[0].type).toBe('divider');
      expect(result.content[0].value).toBeUndefined();
      expect(result.content[0].props).toEqual({ width: 100 });
    });

    it('should parse type with colon but no value', () => {
      const input = `
content: [[
  <#divider:
    width: 100
  >
]]`.trim();
      const result = parse(input);
      expect(result.content[0].type).toBe('divider');
      expect(result.content[0].value).toBeUndefined();
    });

    it('should parse content arrays inside regular arrays', () => {
      const input = `
items: [
  [[
    #heading: Hello
  ]]
]`.trim();
      const result = parse(input);
      expect(result.items[0]).toEqual([
        { type: 'heading', value: 'Hello' },
      ]);
    });

    it('should stringify content arrays', () => {
      const data = {
        content: [
          { type: 'heading', value: 'Title' },
          { type: 'p', value: 'Body text' },
        ]
      };
      const result = stringify(data);
      expect(result).toContain('content: [[');
      expect(result).toContain('#heading: Title');
      expect(result).toContain('Body text');
      expect(result).toContain(']]');
    });

    it('should stringify content entries with modifiers', () => {
      const data = {
        content: [
          { type: 'heading', value: 'Title', mods: ['large', 'bold'] },
        ]
      };
      const result = stringify(data);
      expect(result).toContain('#heading.large.bold: Title');
    });

    it('should stringify content entries with props using angle brackets', () => {
      const data = {
        content: [
          { type: 'image', value: 'photo.jpg', mods: ['hero'], props: { alt: 'A photo', width: 1200 } },
        ]
      };
      const result = stringify(data);
      expect(result).toContain('<#image.hero: photo.jpg');
      expect(result).toContain('alt: A photo');
      expect(result).toContain('width: 1200');
      expect(result).toContain('>');
    });

    it('should stringify plain text entries without # prefix', () => {
      const data = {
        content: [
          { type: 'p', value: 'Just a paragraph.' },
        ]
      };
      const result = stringify(data);
      expect(result).toContain('Just a paragraph.');
      expect(result).not.toContain('#p');
    });

    it('should roundtrip simple content array', () => {
      const input = `
content: [[
  #heading: Welcome
  This is a paragraph.
  #image: photo.jpg
]]`.trim();
      const parsed = parse(input);
      const stringified = stringify(parsed);
      const reparsed = parse(stringified);
      expect(reparsed).toEqual(parsed);
    });

    it('should roundtrip content with mods and props', () => {
      const input = `
content: [[
  <#image.hero.featured: banner.jpg
    alt: A beautiful banner
    width: 1200
  >
]]`.trim();
      const parsed = parse(input);
      const stringified = stringify(parsed);
      const reparsed = parse(stringified);
      expect(reparsed).toEqual(parsed);
    });

    it('should roundtrip nested content arrays', () => {
      const input = `
content: [[
  <#div.container: [[
      #h1: Title
      Some text here.
    ]]
    class: main
  >
]]`.trim();
      const parsed = parse(input);
      const stringified = stringify(parsed);
      const reparsed = parse(stringified);
      expect(reparsed).toEqual(parsed);
    });

    it('should roundtrip mixed content', () => {
      const input = `
content: [[
  #heading.large: Article Title
  This is the opening paragraph.
  <#image.hero: banner.jpg
    alt: Article banner
    width: 1200
  >
  Another paragraph follows.
]]`.trim();
      const parsed = parse(input);
      const stringified = stringify(parsed);
      const reparsed = parse(stringified);
      expect(reparsed).toEqual(parsed);
    });

    it('should allow value and mods override with omitted header values', () => {
      const input = `
content: [[
  <#type
    value: override value
    mods: [
      mod1
      mod2
    ]
  >
]]`.trim();
      const result = parse(input);
      expect(result.content[0]).toEqual({
        type: 'type',
        value: 'override value',
        mods: ['mod1', 'mod2']
      });
    });
  });

  describe('inline content parser', () => {
    describe('parseContentValue basics', () => {
      it('should return empty array for empty string', () => {
        expect(parseContentValue('')).toEqual([]);
      });

      it('should parse plain text as single text item', () => {
        expect(parseContentValue('A normal string')).toEqual([
          { type: 'text', value: 'A normal string' }
        ]);
      });

      it('should parse bracketed text as strong by default', () => {
        expect(parseContentValue('A [strong part] of string')).toEqual([
          { type: 'text', value: 'A ' },
          { type: 'strong', value: 'strong part' },
          { type: 'text', value: ' of string' }
        ]);
      });

      it('should handle multiple brackets', () => {
        expect(parseContentValue('Hello [world] and [universe]')).toEqual([
          { type: 'text', value: 'Hello ' },
          { type: 'strong', value: 'world' },
          { type: 'text', value: ' and ' },
          { type: 'strong', value: 'universe' }
        ]);
      });

      it('should handle adjacent brackets', () => {
        expect(parseContentValue('[a][b]')).toEqual([
          { type: 'strong', value: 'a' },
          { type: 'strong', value: 'b' }
        ]);
      });

      it('should handle bracket at start of string', () => {
        expect(parseContentValue('[bold] is first')).toEqual([
          { type: 'strong', value: 'bold' },
          { type: 'text', value: ' is first' }
        ]);
      });

      it('should handle bracket at end of string', () => {
        expect(parseContentValue('last is [bold]')).toEqual([
          { type: 'text', value: 'last is ' },
          { type: 'strong', value: 'bold' }
        ]);
      });

      it('should handle only a bracket', () => {
        expect(parseContentValue('[just this]')).toEqual([
          { type: 'strong', value: 'just this' }
        ]);
      });
    });

    describe('parseContentValue special cases', () => {
      it('should parse [] as non-breaking space', () => {
        expect(parseContentValue('[]')).toEqual([
          { type: 'html', value: '&nbsp;' }
        ]);
      });

      it('should parse [/] as line break', () => {
        expect(parseContentValue('[/]')).toEqual([
          { type: 'html', value: '<br>' }
        ]);
      });

      it('should parse [-] as soft hyphen', () => {
        expect(parseContentValue('[-]')).toEqual([
          { type: 'html', value: '&shy;' }
        ]);
      });

      it('should handle special cases within text', () => {
        expect(parseContentValue('word[]word')).toEqual([
          { type: 'text', value: 'word' },
          { type: 'html', value: '&nbsp;' },
          { type: 'text', value: 'word' }
        ]);
      });
    });

    describe('parseContentValue type detection', () => {
      it('should detect HTML value and use html type', () => {
        expect(parseContentValue('Have a look at this [<code>example</code>]')).toEqual([
          { type: 'text', value: 'Have a look at this ' },
          { type: 'html', value: '<code>example</code>' }
        ]);
      });

      it('should allow overriding HTML detection with explicit type', () => {
        expect(parseContentValue('[<code>example</code> | #text]')).toEqual([
          { type: 'text', value: '<code>example</code>' }
        ]);
      });

      it('should detect link-like second param and create anchor', () => {
        expect(parseContentValue('[click here|/about/links]')).toEqual([
          { type: 'a', value: 'click here', props: { href: '/about/links' } }
        ]);
      });

      it('should detect https links', () => {
        expect(parseContentValue('[click|https://svt.se]')).toEqual([
          { type: 'a', value: 'click', props: { href: 'https://svt.se' } }
        ]);
      });

      it('should detect http links', () => {
        expect(parseContentValue('[click|http://svt.se]')).toEqual([
          { type: 'a', value: 'click', props: { href: 'http://svt.se' } }
        ]);
      });

      it('should detect mailto links with @', () => {
        expect(parseContentValue('[email|@mailto:mail@to.me]')).toEqual([
          { type: 'a', value: 'email', props: { href: '@mailto:mail@to.me' } }
        ]);
      });

      it('should parse explicit type with #', () => {
        expect(parseContentValue('[text | #em]')).toEqual([
          { type: 'em', value: 'text' }
        ]);
      });

      it('should parse type with mods', () => {
        expect(parseContentValue('[the value | #em.underlined]')).toEqual([
          { type: 'em', value: 'the value', mods: ['underlined'] }
        ]);
      });

      it('should handle link with explicit type override', () => {
        expect(parseContentValue('[click|https://x.com|#button]')).toEqual([
          { type: 'button', value: 'click', props: { href: 'https://x.com' } }
        ]);
      });
    });

    describe('parseContentValue props', () => {
      it('should parse props with key: value', () => {
        expect(parseContentValue('[the value | #em.underlined | style.color:red | id: 1]')).toEqual([
          {
            type: 'em',
            value: 'the value',
            mods: ['underlined'],
            props: { style: { color: 'red' }, id: 1 }
          }
        ]);
      });

      it('should parse multiple props', () => {
        expect(parseContentValue('[text | #span | class: foo | id: bar]')).toEqual([
          { type: 'span', value: 'text', props: { class: 'foo', id: 'bar' } }
        ]);
      });

      it('should parse dot notation props as nested objects', () => {
        expect(parseContentValue('[text | #span | style.color: red]')).toEqual([
          { type: 'span', value: 'text', props: { style: { color: 'red' } } }
        ]);
      });

      it('should produce same result as explicit href prop', () => {
        const shorthand = parseContentValue('[click here|/about/links]');
        const explicit = parseContentValue('[ click here| #a | href:/about/links ]');
        expect(shorthand).toEqual(explicit);
      });
    });

    describe('parseContentValue substitutions', () => {
      it('should replace " with left double quote', () => {
        const result = parseContentValue('He said "hello"');
        expect(result[0].value).toBe('He said \u201Dhello\u201D');
      });

      it('should replace -- with en dash', () => {
        const result = parseContentValue('2020--2025');
        expect(result[0].value).toBe('2020\u20132025');
      });

      it('should preserve escaped quotes as literal "', () => {
        const result = parseContentValue('\\" is the sign for inch');
        expect(result[0].value).toBe('" is the sign for inch');
      });

      it('should skip substitutions for html type', () => {
        const result = parseContentValue('[<p>"hello"</p>]');
        expect(result[0].value).toBe('<p>"hello"</p>');
        expect(result[0].type).toBe('html');
      });

      it('should apply substitutions to bracket value when not html', () => {
        const result = parseContentValue('[said "hello" | #em]');
        expect(result[0].value).toBe('said \u201Dhello\u201D');
      });
    });

    describe('parseContentValue escaping', () => {
      it('should handle escaped brackets in plain text', () => {
        const result = parseContentValue('a \\[not bracket\\] b');
        expect(result).toEqual([
          { type: 'text', value: 'a [not bracket] b' }
        ]);
      });

      it('should handle escaped pipe inside brackets', () => {
        const result = parseContentValue('[a\\|b]');
        expect(result).toEqual([
          { type: 'strong', value: 'a|b' }
        ]);
      });
    });

    describe('stringifyContentValue', () => {
      it('should return empty string for empty array', () => {
        expect(stringifyContentValue([])).toBe('');
      });

      it('should stringify plain text without brackets', () => {
        const result = stringifyContentValue([
          { type: 'text', value: 'Hello world' }
        ]);
        expect(result).toBe('Hello world');
      });

      it('should stringify strong as [value]', () => {
        const result = stringifyContentValue([
          { type: 'strong', value: 'bold' }
        ]);
        expect(result).toBe('[bold]');
      });

      it('should stringify special HTML as [], [/], [-]', () => {
        expect(stringifyContentValue([
          { type: 'html', value: '&nbsp;' }
        ])).toBe('[]');
        expect(stringifyContentValue([
          { type: 'html', value: '<br>' }
        ])).toBe('[/]');
        expect(stringifyContentValue([
          { type: 'html', value: '&shy;' }
        ])).toBe('[-]');
      });

      it('should stringify link with href shorthand', () => {
        const result = stringifyContentValue([
          { type: 'a', value: 'click', props: { href: '/about' } }
        ]);
        expect(result).toBe('[click | /about]');
      });

      it('should stringify custom type with #type', () => {
        const result = stringifyContentValue([
          { type: 'em', value: 'text' }
        ]);
        expect(result).toBe('[text | #em]');
      });

      it('should stringify type with mods', () => {
        const result = stringifyContentValue([
          { type: 'em', value: 'text', mods: ['italic', 'underline'] }
        ]);
        expect(result).toBe('[text | #em.italic.underline]');
      });

      it('should stringify props as key: value params', () => {
        const result = stringifyContentValue([
          { type: 'span', value: 'text', props: { class: 'foo' } }
        ]);
        expect(result).toBe('[text | #span | class: foo]');
      });

      it('should stringify nested props with dot notation', () => {
        const result = stringifyContentValue([
          { type: 'span', value: 'text', props: { style: { color: 'red' } } }
        ]);
        expect(result).toBe('[text | #span | style.color: red]');
      });

      it('should stringify mixed content', () => {
        const result = stringifyContentValue([
          { type: 'text', value: 'Hello ' },
          { type: 'strong', value: 'world' },
          { type: 'text', value: '!' }
        ]);
        expect(result).toBe('Hello [world]!');
      });

      it('should escape brackets in text segments', () => {
        const result = stringifyContentValue([
          { type: 'text', value: 'a [bracket] b' }
        ]);
        expect(result).toBe('a \\[bracket\\] b');
      });
    });

    describe('roundtrip', () => {
      it('should roundtrip plain text', () => {
        const input = 'Hello world';
        const parsed = parseContentValue(input);
        const stringified = stringifyContentValue(parsed);
        const reparsed = parseContentValue(stringified);
        expect(reparsed).toEqual(parsed);
      });

      it('should roundtrip bracketed content', () => {
        const input = 'A [strong part] of string';
        const parsed = parseContentValue(input);
        const stringified = stringifyContentValue(parsed);
        const reparsed = parseContentValue(stringified);
        expect(reparsed).toEqual(parsed);
      });

      it('should roundtrip special cases', () => {
        const input = 'word[]word[/]end[-]hy';
        const parsed = parseContentValue(input);
        const stringified = stringifyContentValue(parsed);
        const reparsed = parseContentValue(stringified);
        expect(reparsed).toEqual(parsed);
      });

      it('should roundtrip link content', () => {
        const input = '[click here|/about/links]';
        const parsed = parseContentValue(input);
        const stringified = stringifyContentValue(parsed);
        const reparsed = parseContentValue(stringified);
        expect(reparsed).toEqual(parsed);
      });

      it('should roundtrip complex content with type, mods, and props', () => {
        const input = '[the value | #em.underlined | style.color: red | id: 1]';
        const parsed = parseContentValue(input);
        const stringified = stringifyContentValue(parsed);
        const reparsed = parseContentValue(stringified);
        expect(reparsed).toEqual(parsed);
      });

      it('should roundtrip mixed content', () => {
        const input = 'Hello [world | #em] and [click|/home] done';
        const parsed = parseContentValue(input);
        const stringified = stringifyContentValue(parsed);
        const reparsed = parseContentValue(stringified);
        expect(reparsed).toEqual(parsed);
      });
    });
  });
});
