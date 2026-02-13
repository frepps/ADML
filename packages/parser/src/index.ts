/**
 * ADML Parser
 * Converts ADML markup to JSON
 */

export interface ADMLParseOptions {
  strict?: boolean;
}

export interface ADMLResult {
  [key: string]: any;
}

/**
 * Helper function to strip multiline comments from a line
 */
function stripMultilineComments(line: string, inComment: boolean): { line: string; inComment: boolean } {
  let result = '';
  let i = 0;
  let currentlyInComment = inComment;

  while (i < line.length) {
    if (currentlyInComment) {
      // Look for closing */
      if (i < line.length - 1 && line[i] === '*' && line[i + 1] === '/') {
        currentlyInComment = false;
        i += 2; // Skip */
        continue;
      }
      i++;
    } else {
      // Look for opening /*
      if (i < line.length - 1 && line[i] === '/' && line[i + 1] === '*') {
        currentlyInComment = true;
        i += 2; // Skip /*
        continue;
      }
      result += line[i];
      i++;
    }
  }

  return { line: result, inComment: currentlyInComment };
}

/**
 * Helper function to parse a value and convert to appropriate type
 */
function parseValue(value: string): any {
  // Check if value is a boolean
  if (value === 'true') {
    return true;
  }
  if (value === 'false') {
    return false;
  }

  // Check if value is a number
  if (/^-?\d+(\.\d+)?$/.test(value)) {
    return parseFloat(value);
  }

  return value;
}

/**
 * Helper function to parse array blocks
 */
function parseArray(lines: string[], startIndex: number, inComment: boolean = false): { value: any[]; endIndex: number; inComment: boolean } {
  const arr: any[] = [];
  let i = startIndex;
  let inMultilineComment = inComment;

  while (i < lines.length) {
    const line = lines[i];

    // Strip multiline comments
    const stripped = stripMultilineComments(line, inMultilineComment);
    inMultilineComment = stripped.inComment;
    const trimmed = stripped.line.trim();

    // Check for closing bracket
    if (trimmed === ']') {
      return { value: arr, endIndex: i + 1, inComment: inMultilineComment };
    }

    // Skip empty lines and single-line comments
    if (!trimmed || trimmed.startsWith('//')) {
      i++;
      continue;
    }

    // Check for nested content array
    if (trimmed === '[[') {
      const contentArr = parseContentArray(lines, i + 1, inMultilineComment);
      arr.push(contentArr.value);
      i = contentArr.endIndex;
      inMultilineComment = contentArr.inComment;
      continue;
    }

    // Check for nested array
    if (trimmed === '[') {
      const nestedArray = parseArray(lines, i + 1, inMultilineComment);
      arr.push(nestedArray.value);
      i = nestedArray.endIndex;
      inMultilineComment = nestedArray.inComment;
      continue;
    }

    // Add value to array (parse as number if applicable)
    arr.push(parseValue(trimmed));
    i++;
  }

  return { value: arr, endIndex: i, inComment: inMultilineComment };
}

/**
 * Parse a content object header like "#type.mod1.mod2: value"
 */
function parseContentHeader(text: string): { type: string; value: string; mods: string[] } {
  const trimmed = text.trim();

  if (!trimmed.startsWith('#')) {
    return { type: 'p', value: trimmed, mods: [] };
  }

  const withoutHash = trimmed.substring(1);
  const colonIndex = withoutHash.indexOf(':');

  let typeMods: string;
  let value: string;

  if (colonIndex < 0) {
    typeMods = withoutHash.trim();
    value = '';
  } else {
    typeMods = withoutHash.substring(0, colonIndex).trim();
    value = withoutHash.substring(colonIndex + 1).trim();
  }

  const parts = typeMods.split('.');
  const type = parts[0];
  const mods = parts.slice(1);

  return { type, value, mods };
}

/**
 * Helper to set a value at a dot-separated path within an object
 */
function setByPath(obj: ADMLResult, path: string, value: any): void {
  const parts = path.split('.');
  let current = obj;

  for (let p = 0; p < parts.length - 1; p++) {
    const part = parts[p];
    if (!current[part] || typeof current[part] !== 'object' || Array.isArray(current[part])) {
      current[part] = {};
    }
    current = current[part];
  }

  const lastKey = parts[parts.length - 1];
  if (typeof value === 'object' && value !== null && !Array.isArray(value) &&
      typeof current[lastKey] === 'object' && current[lastKey] !== null && !Array.isArray(current[lastKey])) {
    // Merge into existing object
    Object.assign(current[lastKey], value);
  } else {
    current[lastKey] = value;
  }
}

/**
 * Helper function to parse a content array block (lines after `[[` until matching `]]`)
 */
function parseContentArray(lines: string[], startIndex: number, inComment: boolean = false): { value: any[]; endIndex: number; inComment: boolean } {
  const arr: any[] = [];
  let i = startIndex;
  let inMultilineComment = inComment;

  while (i < lines.length) {
    const line = lines[i];

    // Strip multiline comments
    const stripped = stripMultilineComments(line, inMultilineComment);
    inMultilineComment = stripped.inComment;
    const trimmed = stripped.line.trim();

    // Check for closing ]]
    if (trimmed === ']]') {
      return { value: arr, endIndex: i + 1, inComment: inMultilineComment };
    }

    // Skip empty lines and single-line comments
    if (!trimmed || trimmed.startsWith('//')) {
      i++;
      continue;
    }

    // Props block: <#type.mod: value ... >
    if (trimmed.startsWith('<')) {
      const headerText = trimmed.substring(1).trim();
      const header = parseContentHeader(headerText);

      // Check if value is an inline content array: <#type: [[
      let contentValue: any = header.value;
      if (typeof header.value === 'string' && header.value.endsWith('[[')) {
        // Value before [[ (if any, e.g. could just be "[[")
        const beforeBrackets = header.value.substring(0, header.value.length - 2).trim();
        const nestedContent = parseContentArray(lines, i + 1, inMultilineComment);
        contentValue = nestedContent.value;
        i = nestedContent.endIndex;
        inMultilineComment = nestedContent.inComment;

        // If there was text before [[, it's discarded — the content array IS the value
        // (matches spec: `<#div.border: [[`)
        void beforeBrackets;
      } else {
        i++; // Move past the header line
      }

      // Parse props until >
      const propsResult = parseProps(lines, i, inMultilineComment);
      const props = propsResult.value;
      i = propsResult.endIndex;
      inMultilineComment = propsResult.inComment;

      // Special keys: "value" overrides content value
      if ('value' in props) {
        contentValue = props.value;
        delete props.value;
      }

      // Special keys: "mods" (array) overrides content mods
      let mods = header.mods;
      if ('mods' in props && Array.isArray(props.mods)) {
        mods = props.mods;
        delete props.mods;
      }

      arr.push({ type: header.type, value: contentValue, mods, props });
      continue;
    }

    // Content line with # prefix: #type.mod1.mod2: value
    if (trimmed.startsWith('#')) {
      const header = parseContentHeader(trimmed);
      arr.push({ type: header.type, value: header.value, mods: header.mods, props: {} });
      i++;
      continue;
    }

    // Plain text line → default type "p"
    arr.push({ type: 'p', value: trimmed, mods: [], props: {} });
    i++;
  }

  return { value: arr, endIndex: i, inComment: inMultilineComment };
}

/**
 * Generic object-like block parser. Closes on the given delimiter ('}' or '>').
 */
function parseObjectLike(lines: string[], startIndex: number, inComment: boolean, closer: string): { value: ADMLResult; endIndex: number; inComment: boolean } {
  const obj: ADMLResult = {};
  let i = startIndex;
  let inMultilineComment = inComment;

  while (i < lines.length) {
    const line = lines[i];

    // Strip multiline comments
    const stripped = stripMultilineComments(line, inMultilineComment);
    inMultilineComment = stripped.inComment;
    const trimmed = stripped.line.trim();

    if (trimmed === closer) {
      return { value: obj, endIndex: i + 1, inComment: inMultilineComment };
    }

    // Skip empty lines and single-line comments
    if (!trimmed || trimmed.startsWith('//')) {
      i++;
      continue;
    }

    // Check for multiline syntax inside object: propKey::
    if (trimmed.endsWith('::')) {
      const propKey = trimmed.substring(0, trimmed.length - 2).trim();
      const multilineContent: string[] = [];

      i++; // Move to next line after propKey::

      while (i < lines.length) {
        const contentLine = lines[i];

        if (contentLine.trim() === '::') {
          setByPath(obj, propKey, multilineContent.join('\n'));
          i++;
          break;
        }

        multilineContent.push(contentLine.trim());
        i++;
      }

      continue;
    }

    const colonIndex = trimmed.indexOf(':');

    // Check for content array syntax: propKey: [[
    if (colonIndex > 0 && trimmed.endsWith('[[')) {
      const propKey = trimmed.substring(0, colonIndex).trim();
      const contentArr = parseContentArray(lines, i + 1, inMultilineComment);

      setByPath(obj, propKey, contentArr.value);
      i = contentArr.endIndex;
      inMultilineComment = contentArr.inComment;
      continue;
    }

    // Check for array syntax inside object: propKey: [
    if (colonIndex > 0 && trimmed.endsWith('[')) {
      const propKey = trimmed.substring(0, colonIndex).trim();
      const arr = parseArray(lines, i + 1, inMultilineComment);

      setByPath(obj, propKey, arr.value);
      i = arr.endIndex;
      inMultilineComment = arr.inComment;
      continue;
    }

    // Check for nested object syntax: propKey: {
    if (colonIndex > 0 && trimmed.endsWith('{')) {
      const propKey = trimmed.substring(0, colonIndex).trim();
      const nested = parseObjectLike(lines, i + 1, inMultilineComment, '}');

      setByPath(obj, propKey, nested.value);
      i = nested.endIndex;
      inMultilineComment = nested.inComment;
      continue;
    }

    // Parse property (supports dot notation via setByPath)
    if (colonIndex > 0) {
      const propKey = trimmed.substring(0, colonIndex).trim();
      const propValue = trimmed.substring(colonIndex + 1).trim();
      setByPath(obj, propKey, parseValue(propValue));
    }

    i++;
  }

  return { value: obj, endIndex: i, inComment: inMultilineComment };
}

/**
 * Helper function to parse an object block (lines after `{` until matching `}`)
 */
function parseObject(lines: string[], startIndex: number, inComment: boolean = false): { value: ADMLResult; endIndex: number; inComment: boolean } {
  return parseObjectLike(lines, startIndex, inComment, '}');
}

/**
 * Helper function to parse a props block (lines after `<` header until matching `>`)
 */
function parseProps(lines: string[], startIndex: number, inComment: boolean = false): { value: ADMLResult; endIndex: number; inComment: boolean } {
  return parseObjectLike(lines, startIndex, inComment, '>');
}

/**
 * Parse ADML markup string to JSON
 */
export function parse(input: string, options: ADMLParseOptions = {}): ADMLResult {
  const result: ADMLResult = {};
  const lines = input.split('\n');

  let i = 0;
  let inMultilineComment = false;

  while (i < lines.length) {
    const line = lines[i];

    // Strip multiline comments
    const stripped = stripMultilineComments(line, inMultilineComment);
    inMultilineComment = stripped.inComment;
    const trimmed = stripped.line.trim();

    // Skip empty lines and single-line comments
    if (!trimmed || trimmed.startsWith('//')) {
      i++;
      continue;
    }

    // Check for multiline syntax: key::
    if (trimmed.endsWith('::')) {
      const key = trimmed.substring(0, trimmed.length - 2).trim();
      const multilineContent: string[] = [];

      i++; // Move to next line after key::

      // Collect lines until we find ::
      while (i < lines.length) {
        const contentLine = lines[i];

        if (contentLine.trim() === '::') {
          // End of multiline block
          setByPath(result, key, multilineContent.join('\n'));
          i++; // Move past the closing ::
          break;
        }

        // Trim leading and trailing spaces from each line
        multilineContent.push(contentLine.trim());
        i++;
      }

      continue;
    }

    // Check for content array syntax: key: [[
    const colonIndex = trimmed.indexOf(':');
    if (colonIndex > 0 && trimmed.endsWith('[[')) {
      const key = trimmed.substring(0, colonIndex).trim();
      const contentArr = parseContentArray(lines, i + 1, inMultilineComment);

      setByPath(result, key, contentArr.value);
      i = contentArr.endIndex;
      inMultilineComment = contentArr.inComment;

      continue;
    }

    // Check for array syntax: key: [
    if (colonIndex > 0 && trimmed.endsWith('[')) {
      const key = trimmed.substring(0, colonIndex).trim();
      const arr = parseArray(lines, i + 1, inMultilineComment);

      setByPath(result, key, arr.value);
      i = arr.endIndex;
      inMultilineComment = arr.inComment;

      continue;
    }

    // Check for object syntax: key: {
    if (colonIndex > 0 && trimmed.endsWith('{')) {
      const key = trimmed.substring(0, colonIndex).trim();
      const nested = parseObject(lines, i + 1, inMultilineComment);

      setByPath(result, key, nested.value);
      i = nested.endIndex;
      inMultilineComment = nested.inComment;

      continue;
    }

    // Basic key-value parsing (supports dot notation via setByPath)
    if (colonIndex > 0 && !trimmed.endsWith('::')) {
      const key = trimmed.substring(0, colonIndex).trim();
      const value = trimmed.substring(colonIndex + 1).trim();
      setByPath(result, key, parseValue(value));
    }

    i++;
  }

  return result;
}

/**
 * Check if an array is a content array (all items have type, value, mods, props shape)
 */
function isContentArray(arr: any[]): boolean {
  if (arr.length === 0) return false;
  return arr.every(item =>
    typeof item === 'object' &&
    item !== null &&
    !Array.isArray(item) &&
    'type' in item &&
    'value' in item &&
    'mods' in item &&
    'props' in item
  );
}

/**
 * Stringify a content object's type header: #type.mod1.mod2: value
 */
function stringifyContentHeader(item: any): string {
  const typeMods = item.mods.length > 0
    ? `${item.type}.${item.mods.join('.')}`
    : item.type;

  if (typeof item.value === 'string' && item.value) {
    return `#${typeMods}: ${item.value}`;
  } else if (typeof item.value === 'string') {
    return `#${typeMods}`;
  } else {
    // Value is a content array or other complex type — handled by caller
    return `#${typeMods}`;
  }
}

/**
 * Helper function to stringify content arrays
 */
function stringifyContentArray(arr: any[], indent: string): string[] {
  const lines: string[] = [];

  for (const item of arr) {
    const hasProps = typeof item.props === 'object' && Object.keys(item.props).length > 0;
    const valueIsContentArray = Array.isArray(item.value) && isContentArray(item.value);

    if (hasProps || valueIsContentArray) {
      // Use <...> block syntax
      const typeMods = item.mods.length > 0
        ? `${item.type}.${item.mods.join('.')}`
        : item.type;

      if (valueIsContentArray) {
        lines.push(`${indent}<#${typeMods}: [[`);
        lines.push(...stringifyContentArray(item.value, indent + '    '));
        lines.push(`${indent}  ]]`);
      } else if (typeof item.value === 'string' && item.value) {
        lines.push(`${indent}<#${typeMods}: ${item.value}`);
      } else {
        lines.push(`${indent}<#${typeMods}`);
      }

      lines.push(...stringifyObjectEntries(item.props, indent + '  '));
      lines.push(`${indent}>`);
    } else if (item.type === 'p' && item.mods.length === 0) {
      // Plain text
      lines.push(`${indent}${item.value}`);
    } else {
      // Simple #type.mods: value
      lines.push(`${indent}${stringifyContentHeader(item)}`);
    }
  }

  return lines;
}

/**
 * Helper function to stringify arrays
 */
function stringifyArray(arr: any[], indent: string = ''): string[] {
  const lines: string[] = [];

  for (const item of arr) {
    if (Array.isArray(item)) {
      if (isContentArray(item)) {
        // Nested content array
        lines.push(`${indent}[[`);
        lines.push(...stringifyContentArray(item, indent + '  '));
        lines.push(`${indent}]]`);
      } else {
        // Nested array
        lines.push(`${indent}[`);
        lines.push(...stringifyArray(item, indent + '  '));
        lines.push(`${indent}]`);
      }
    } else if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') {
      lines.push(`${indent}${item}`);
    } else {
      // Fallback to JSON for complex types
      lines.push(`${indent}${JSON.stringify(item)}`);
    }
  }

  return lines;
}

/**
 * Helper function to stringify object contents at a given indentation level
 */
function stringifyObjectEntries(data: ADMLResult, indent: string): string[] {
  const lines: string[] = [];

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      if (value.includes('\n')) {
        lines.push(`${indent}${key}::`);
        lines.push(value);
        lines.push('::');
      } else {
        lines.push(`${indent}${key}: ${value}`);
      }
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      lines.push(`${indent}${key}: ${value}`);
    } else if (Array.isArray(value)) {
      if (isContentArray(value)) {
        lines.push(`${indent}${key}: [[`);
        lines.push(...stringifyContentArray(value, indent + '  '));
        lines.push(`${indent}]]`);
      } else {
        lines.push(`${indent}${key}: [`);
        lines.push(...stringifyArray(value, indent + '  '));
        lines.push(`${indent}]`);
      }
    } else if (typeof value === 'object' && value !== null) {
      lines.push(`${indent}${key}: {`);
      lines.push(...stringifyObjectEntries(value, indent + '  '));
      lines.push(`${indent}}`);
    }
  }

  return lines;
}

/**
 * Stringify JSON back to ADML format
 */
export function stringify(data: ADMLResult, options: ADMLParseOptions = {}): string {
  const lines = stringifyObjectEntries(data, '');
  return lines.join('\n');
}

export default { parse, stringify };
