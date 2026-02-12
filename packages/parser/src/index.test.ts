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

    it('should handle multiline with indentation', () => {
      const input = `
content::
  Line 1 with indent
  Line 2 with indent
::
      `.trim();

      const result = parse(input);

      expect(result.content).toBe('  Line 1 with indent\n  Line 2 with indent');
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

    it('should stringify simple arrays', () => {
      const data = {
        title: 'My Article',
        tags: ['javascript', 'typescript', 'nodejs']
      };

      const result = stringify(data);

      expect(result).toContain('title: My Article');
      expect(result).toContain('tags: [');
      expect(result).toContain('javascript');
      expect(result).toContain('typescript');
      expect(result).toContain('nodejs');
      expect(result).toContain(']');
    });

    it('should stringify nested arrays', () => {
      const data = {
        matrix: [[1, 2], [3, 4]]
      };

      const result = stringify(data);

      expect(result).toContain('matrix: [');
      expect(result).toContain('[');
      expect(result).toContain('1');
      expect(result).toContain('2');
      expect(result).toContain('3');
      expect(result).toContain('4');
      expect(result).toContain(']');
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
