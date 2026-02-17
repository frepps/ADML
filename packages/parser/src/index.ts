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

export interface ContentItem {
  type: string;
  value: string;
  mods: string[];
  props: Record<string, any>;
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
 * Apply text substitutions: " -> \u201D, -- -> \u2013
 * Skips substitution when escaped with \
 */
function applySubstitutions(text: string): string {
  let result = '';
  let i = 0;

  while (i < text.length) {
    // Escaped quote: \" stays as literal "
    if (text[i] === '\\' && i + 1 < text.length && text[i + 1] === '"') {
      result += '"';
      i += 2;
      continue;
    }

    // En dash: -- -> \u2013
    if (text[i] === '-' && i + 1 < text.length && text[i + 1] === '-') {
      result += '\u2013';
      i += 2;
      continue;
    }

    // Smart quote: " -> \u201D (Swedish)
    if (text[i] === '"') {
      result += '\u201D';
      i++;
      continue;
    }

    result += text[i];
    i++;
  }

  return result;
}

/**
 * Reverse text substitutions for stringify: \u201D -> ", \u2013 -> --
 * Also escapes [ and ] in plain text
 */
function reverseSubstitutions(text: string): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '\u201D') { result += '"'; continue; }
    if (ch === '\u2013') { result += '--'; continue; }
    if (ch === '[' || ch === ']') { result += '\\' + ch; continue; }
    result += ch;
  }
  return result;
}

/**
 * Split string by | respecting \| escapes
 */
function splitByPipe(content: string): string[] {
  const parts: string[] = [];
  let current = '';
  let i = 0;

  while (i < content.length) {
    if (content[i] === '\\' && i + 1 < content.length && content[i + 1] === '|') {
      current += '|';
      i += 2;
      continue;
    }
    if (content[i] === '|') {
      parts.push(current);
      current = '';
      i++;
      continue;
    }
    current += content[i];
    i++;
  }
  parts.push(current);

  return parts;
}

/**
 * Check if a string looks like a link (starts with /, http://, https://, or @)
 */
function isLinkLike(value: string): boolean {
  const trimmed = value.trim();
  return (
    trimmed.startsWith('/') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('@')
  );
}

/**
 * Parse the content inside brackets into a ContentItem
 */
function parseBracketContent(content: string): ContentItem {
  // Special cases
  if (content === '') {
    return { type: 'html', value: '&nbsp;', mods: [], props: {} };
  }
  if (content === '/') {
    return { type: 'html', value: '<br>', mods: [], props: {} };
  }
  if (content === '-') {
    return { type: 'html', value: '&shy;', mods: [], props: {} };
  }

  // Split by pipe
  const params = splitByPipe(content);

  // First param is the value
  let value = params[0].trim();
  let type: string | null = null;
  let mods: string[] = [];
  const props: Record<string, any> = {};

  // Process remaining params
  for (let p = 1; p < params.length; p++) {
    const param = params[p].trim();

    // Type/mods param: starts with #
    if (param.startsWith('#')) {
      const withoutHash = param.substring(1);
      const parts = withoutHash.split('.');
      type = parts[0];
      mods = parts.slice(1);
      continue;
    }

    // Link-like detection: only for 2nd param (index 1)
    if (p === 1 && isLinkLike(param)) {
      if (!type) type = 'a';
      props.href = param;
      continue;
    }

    // Props param: key: value
    const colonIdx = param.indexOf(':');
    if (colonIdx > 0) {
      const propKey = param.substring(0, colonIdx).trim();
      const propValue = param.substring(colonIdx + 1).trim();
      setByPath(props as ADMLResult, propKey, parseValue(propValue));
      continue;
    }
  }

  // Default type
  if (!type) {
    if (value.trimStart().startsWith('<')) {
      type = 'html';
    } else {
      type = 'strong';
    }
  }

  // Apply substitutions to value (skip for html)
  if (type !== 'html') {
    value = applySubstitutions(value);
  }

  return { type, value, mods, props };
}

/**
 * Parse a string containing inline content markup into a content array
 */
export function parseContentValue(input: string): ContentItem[] {
  if (!input) return [];

  const items: ContentItem[] = [];
  let i = 0;
  let textBuffer = '';

  while (i < input.length) {
    // Escaped bracket in plain text
    if (input[i] === '\\' && i + 1 < input.length && (input[i + 1] === '[' || input[i + 1] === ']')) {
      textBuffer += input[i + 1];
      i += 2;
      continue;
    }

    // Start of bracket segment
    if (input[i] === '[') {
      // Flush accumulated plain text
      if (textBuffer) {
        items.push({ type: 'text', value: applySubstitutions(textBuffer), mods: [], props: {} });
        textBuffer = '';
      }

      // Collect until matching ]
      i++; // skip [
      let bracketContent = '';
      while (i < input.length) {
        if (input[i] === '\\' && i + 1 < input.length && input[i + 1] === ']') {
          bracketContent += ']';
          i += 2;
          continue;
        }
        if (input[i] === '\\' && i + 1 < input.length && input[i + 1] === '|') {
          bracketContent += '\\|'; // preserve escape for splitByPipe
          i += 2;
          continue;
        }
        if (input[i] === ']') {
          i++; // skip ]
          break;
        }
        bracketContent += input[i];
        i++;
      }

      items.push(parseBracketContent(bracketContent));
      continue;
    }

    textBuffer += input[i];
    i++;
  }

  // Flush remaining text
  if (textBuffer) {
    items.push({ type: 'text', value: applySubstitutions(textBuffer), mods: [], props: {} });
  }

  return items;
}

/**
 * Flatten nested props object into dot-notation keys
 */
function flattenProps(props: Record<string, any>, prefix: string = ''): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, val] of Object.entries(props)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      Object.assign(result, flattenProps(val, fullKey));
    } else {
      result[fullKey] = String(val);
    }
  }
  return result;
}

/**
 * Check if type needs explicit #type param (differs from auto-detected default)
 */
function needsExplicitType(item: ContentItem): boolean {
  if (item.mods.length > 0) return true;

  const isHtmlValue = typeof item.value === 'string' && item.value.trimStart().startsWith('<');
  const hasLinkHref = item.props && 'href' in item.props && typeof item.props.href === 'string' && isLinkLike(item.props.href);

  if (hasLinkHref && item.type === 'a') return false;
  if (isHtmlValue && item.type === 'html') return false;
  if (!isHtmlValue && !hasLinkHref && item.type === 'strong') return false;

  return true;
}

/**
 * Check if item can use href shorthand (link-like href as 2nd pipe param)
 */
function canUseHrefShorthand(item: ContentItem): boolean {
  return (
    item.props != null &&
    'href' in item.props &&
    typeof item.props.href === 'string' &&
    isLinkLike(item.props.href) &&
    item.type === 'a'
  );
}

/**
 * Escape pipe characters in a value inside brackets
 */
function escapeValueForBracket(value: string): string {
  let result = '';
  for (let i = 0; i < value.length; i++) {
    if (value[i] === '|') { result += '\\|'; continue; }
    result += value[i];
  }
  return result;
}

/**
 * Convert a content array back to an inline content string
 */
export function stringifyContentValue(content: ContentItem[]): string {
  if (!content || content.length === 0) return '';

  let result = '';

  for (const item of content) {
    // Plain text segment
    if (item.type === 'text' && item.mods.length === 0 && (!item.props || Object.keys(item.props).length === 0)) {
      result += reverseSubstitutions(item.value);
      continue;
    }

    // Special HTML cases
    if (item.type === 'html' && item.mods.length === 0 && (!item.props || Object.keys(item.props).length === 0)) {
      if (item.value === '&nbsp;') { result += '[]'; continue; }
      if (item.value === '<br>') { result += '[/]'; continue; }
      if (item.value === '&shy;') { result += '[-]'; continue; }
    }

    // Build bracketed segment
    const params: string[] = [];

    // First param: the value
    params.push(escapeValueForBracket(item.value));

    // Link shorthand: href as 2nd param
    const useHrefShorthand = canUseHrefShorthand(item);
    if (useHrefShorthand) {
      params.push(item.props.href);
    }

    // Type param if needed
    if (needsExplicitType(item)) {
      const typePart = item.mods.length > 0
        ? `#${item.type}.${item.mods.join('.')}`
        : `#${item.type}`;
      params.push(typePart);
    }

    // Props (excluding href if used as shorthand)
    const propsToEmit = { ...item.props };
    if (useHrefShorthand) delete propsToEmit.href;

    const flat = flattenProps(propsToEmit);
    for (const [key, val] of Object.entries(flat)) {
      params.push(`${key}: ${val}`);
    }

    result += '[' + params.join(' | ') + ']';
  }

  return result;
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

export default { parse, stringify, parseContentValue, stringifyContentValue };
