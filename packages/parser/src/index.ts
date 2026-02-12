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
function parseArray(lines: string[], startIndex: number): { value: any[]; endIndex: number } {
  const arr: any[] = [];
  let i = startIndex;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Check for closing bracket
    if (trimmed === ']') {
      return { value: arr, endIndex: i + 1 };
    }

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('//')) {
      i++;
      continue;
    }

    // Check for nested array
    if (trimmed === '[') {
      const nestedArray = parseArray(lines, i + 1);
      arr.push(nestedArray.value);
      i = nestedArray.endIndex;
      continue;
    }

    // Add value to array (parse as number if applicable)
    arr.push(parseValue(trimmed));
    i++;
  }

  return { value: arr, endIndex: i };
}

/**
 * Parse ADML markup string to JSON
 */
export function parse(input: string, options: ADMLParseOptions = {}): ADMLResult {
  const result: ADMLResult = {};
  const lines = input.split('\n');

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines and comments
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
          result[key] = multilineContent.join('\n');
          i++; // Move past the closing ::
          break;
        }

        multilineContent.push(contentLine);
        i++;
      }

      continue;
    }

    // Check for array syntax: key: [
    const colonIndex = trimmed.indexOf(':');
    if (colonIndex > 0 && trimmed.endsWith('[')) {
      const key = trimmed.substring(0, colonIndex).trim();
      const arr = parseArray(lines, i + 1);

      result[key] = arr.value;
      i = arr.endIndex;

      continue;
    }

    // Check for object syntax: key: {
    if (colonIndex > 0 && trimmed.endsWith('{')) {
      const key = trimmed.substring(0, colonIndex).trim();
      const obj: ADMLResult = {};

      i++; // Move to next line after key: {

      // Collect properties until we find }
      while (i < lines.length) {
        const objLine = lines[i];
        const objTrimmed = objLine.trim();

        if (objTrimmed === '}') {
          // End of object block
          result[key] = obj;
          i++; // Move past the closing }
          break;
        }

        // Skip empty lines and comments inside object
        if (!objTrimmed || objTrimmed.startsWith('//')) {
          i++;
          continue;
        }

        // Parse property inside object
        const propColonIndex = objTrimmed.indexOf(':');
        if (propColonIndex > 0) {
          const propKey = objTrimmed.substring(0, propColonIndex).trim();
          const propValue = objTrimmed.substring(propColonIndex + 1).trim();
          obj[propKey] = parseValue(propValue);
        }

        i++;
      }

      continue;
    }

    // Check for dotted notation: key.prop: value
    if (colonIndex > 0 && trimmed.includes('.')) {
      const fullKey = trimmed.substring(0, colonIndex).trim();
      const value = trimmed.substring(colonIndex + 1).trim();

      // Split on first dot
      const dotIndex = fullKey.indexOf('.');
      if (dotIndex > 0) {
        const objKey = fullKey.substring(0, dotIndex).trim();
        const propKey = fullKey.substring(dotIndex + 1).trim();

        // Initialize object if it doesn't exist
        if (!result[objKey] || typeof result[objKey] !== 'object') {
          result[objKey] = {};
        }

        result[objKey][propKey] = parseValue(value);
        i++;
        continue;
      }
    }

    // Basic key-value parsing for single-line values
    if (colonIndex > 0 && !trimmed.endsWith('::')) {
      const key = trimmed.substring(0, colonIndex).trim();
      const value = trimmed.substring(colonIndex + 1).trim();
      result[key] = parseValue(value);
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
 * Stringify JSON back to ADML format
 */
export function stringify(data: ADMLResult, options: ADMLParseOptions = {}): string {
  const lines: string[] = [];

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      // Check if string contains newlines - use multiline syntax
      if (value.includes('\n')) {
        lines.push(`${key}::`);
        lines.push(value);
        lines.push('::');
      } else {
        // Single line value
        lines.push(`${key}: ${value}`);
      }
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      // Numbers and booleans - output as-is
      lines.push(`${key}: ${value}`);
    } else if (Array.isArray(value)) {
      // Arrays - use bracket syntax
      lines.push(`${key}: [`);
      lines.push(...stringifyArray(value));
      lines.push(']');
    } else if (typeof value === 'object' && value !== null) {
      // Object - use bracket syntax
      lines.push(`${key}: {`);
      for (const [propKey, propValue] of Object.entries(value)) {
        if (typeof propValue === 'string' || typeof propValue === 'number' || typeof propValue === 'boolean') {
          lines.push(`  ${propKey}: ${propValue}`);
        } else {
          // Nested objects - fallback to JSON
          lines.push(`  ${propKey}: ${JSON.stringify(propValue)}`);
        }
      }
      lines.push('}');
    }
  }

  return lines.join('\n');
}

export default { parse, stringify };
