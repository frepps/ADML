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
 * Helper function to parse an object block (lines after `{` until matching `}`)
 */
function parseObject(lines: string[], startIndex: number, inComment: boolean = false): { value: ADMLResult; endIndex: number; inComment: boolean } {
  const obj: ADMLResult = {};
  let i = startIndex;
  let inMultilineComment = inComment;

  while (i < lines.length) {
    const line = lines[i];

    // Strip multiline comments
    const stripped = stripMultilineComments(line, inMultilineComment);
    inMultilineComment = stripped.inComment;
    const trimmed = stripped.line.trim();

    if (trimmed === '}') {
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
      const nested = parseObject(lines, i + 1, inMultilineComment);

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

    // Check for array syntax: key: [
    const colonIndex = trimmed.indexOf(':');
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
 * Helper function to stringify arrays
 */
function stringifyArray(arr: any[], indent: string = ''): string[] {
  const lines: string[] = [];

  for (const item of arr) {
    if (Array.isArray(item)) {
      // Nested array
      lines.push(`${indent}[`);
      lines.push(...stringifyArray(item, indent + '  '));
      lines.push(`${indent}]`);
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
      lines.push(`${indent}${key}: [`);
      lines.push(...stringifyArray(value, indent));
      lines.push(`${indent}]`);
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
