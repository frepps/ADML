/**
 * ADML Language Support for CodeMirror
 * Provides syntax highlighting, autocomplete, and bracket matching
 */

import { StreamLanguage, syntaxHighlighting, HighlightStyle } from '@codemirror/language';
import { CompletionContext, autocompletion } from '@codemirror/autocomplete';
import { Extension } from '@codemirror/state';
import { tags } from '@lezer/highlight';

/**
 * ADML Stream Parser
 * Tokenizes ADML syntax for syntax highlighting
 */
const admlStreamParser = {
  name: 'adml',
  startState: () => ({
    inMultilineComment: false,
    inMultilineValue: false,
    afterColon: false, // Track if we just saw a colon
    inContentArray: 0, // Depth counter for [[ ]] content arrays
  }),
  token: (stream: any, state: any) => {
    // Handle multiline comments
    if (state.inMultilineComment) {
      if (stream.match('*/')) {
        state.inMultilineComment = false;
        return 'comment';
      }
      stream.next();
      return 'comment';
    }

    if (stream.match('/*')) {
      state.inMultilineComment = true;
      return 'comment';
    }

    // Handle single-line comments
    if (stream.match('//')) {
      stream.skipToEnd();
      return 'comment';
    }

    // Handle multiline value delimiters
    if (stream.match('::')) {
      state.inMultilineValue = !state.inMultilineValue;
      state.afterColon = false;
      return 'keyword';
    }

    // Inside multiline value - everything is a string
    if (state.inMultilineValue) {
      stream.skipToEnd();
      return 'string';
    }

    // Skip whitespace
    if (stream.eatSpace()) {
      return null;
    }

    // Handle brackets - double brackets [[ ]] must come before single
    if (stream.match(']]')) {
      state.inContentArray = Math.max(0, state.inContentArray - 1);
      state.afterColon = false;
      return 'squareBracket';
    }

    if (stream.match('[[')) {
      state.inContentArray++;
      state.afterColon = false;
      return 'squareBracket';
    }

    if (stream.match(/[{}]/)) {
      state.afterColon = false;
      return 'bracket';
    }

    // Content array props delimiters < >
    if (state.inContentArray > 0) {
      if (stream.match('<')) {
        state.afterColon = false;
        return 'bracket';
      }
      if (stream.match('>')) {
        state.afterColon = false;
        return 'bracket';
      }
    }

    if (stream.match(/[\[\]]/)) {
      state.afterColon = false;
      return 'squareBracket';
    }

    // Inside content array: #type and .mod highlighting
    if (state.inContentArray > 0) {
      if (stream.match(/#[a-zA-Z_]\w*/)) {
        return 'keyword';
      }
      // Modifier dots after type (e.g. .large.bold)
      if (stream.match(/\.[a-zA-Z_]\w*/)) {
        return 'propertyName';
      }
    }

    // Check for property name (at start of line or after whitespace)
    // Property name is: word characters followed by a colon
    const startPos = stream.pos;
    const match = stream.match(/[a-zA-Z_][a-zA-Z0-9_\.]*/);

    if (match) {
      // Check if followed by colon
      if (stream.peek() === ':') {
        // This is a property name
        return 'propertyName';
      } else {
        // Not a property name, backtrack and treat as value
        stream.pos = startPos;
      }
    }

    // Handle colon
    if (stream.match(':')) {
      state.afterColon = true;
      return 'operator';
    }

    // After colon, check for values
    if (state.afterColon) {
      // Check for boolean values (exact match)
      if (stream.match(/\b(true|false)\b/)) {
        return 'bool';
      }

      // Check for pure numbers (no letters after)
      const numMatch = stream.match(/^-?\d+(\.\d+)?(?!\w)/);
      if (numMatch) {
        return 'number';
      }
    }

    // Everything else is a string value (including "34px", "v1.2.3", etc)
    stream.next();
    return 'string';
  },
  languageData: {
    commentTokens: { line: '//', block: { open: '/*', close: '*/' } }
  }
};

/**
 * ADML Syntax Highlighting Theme
 */
const admlHighlightStyle = HighlightStyle.define([
  { tag: tags.propertyName, color: '#0077aa', fontWeight: '600' },
  { tag: tags.operator, color: '#666' },
  { tag: tags.bool, color: '#219', fontWeight: '600' },
  { tag: tags.number, color: '#164' },
  { tag: tags.string, color: '#a11' },
  { tag: tags.comment, color: '#a50', fontStyle: 'italic' },
  { tag: tags.bracket, color: '#905', fontWeight: 'bold' },
  { tag: tags.squareBracket, color: '#905', fontWeight: 'bold' },
  { tag: tags.keyword, color: '#708', fontWeight: 'bold' },
]);

/**
 * ADML Autocomplete
 */
function admlAutocomplete(context: CompletionContext) {
  const word = context.matchBefore(/\w*/);
  const line = context.state.doc.lineAt(context.pos);
  const lineText = line.text;
  const beforeCursor = lineText.substring(0, context.pos - line.from);

  // Check if we're typing after a colon (for value suggestions)
  const afterColonPattern = /:\s+(\w*)$/;
  const afterColonMatch = beforeCursor.match(afterColonPattern);

  // After a colon, only suggest booleans if user starts typing 't' or 'f'
  if (afterColonMatch && !beforeCursor.trim().endsWith('::')) {
    const typedWord = afterColonMatch[1];

    // Only show boolean suggestions if user typed 't' or 'f'
    if (typedWord && (typedWord[0] === 't' || typedWord[0] === 'f')) {
      return {
        from: word ? word.from : context.pos,
        options: [
          { label: 'true', type: 'keyword', info: 'Boolean true value' },
          { label: 'false', type: 'keyword', info: 'Boolean false value' },
        ].filter(opt => opt.label.startsWith(typedWord))
      };
    }

    // Don't show any suggestions right after typing just the colon
    return null;
  }

  // At start of line or after whitespace, suggest property syntax
  if (!beforeCursor.includes(':')) {
    return {
      from: word ? word.from : context.pos,
      options: [
        { label: 'key: value', type: 'text', info: 'Simple key-value pair', apply: 'key: value' },
        { label: 'key: {', type: 'text', info: 'Object block', apply: 'key: {\n  \n}' },
        { label: 'key: [', type: 'text', info: 'Array block', apply: 'key: [\n\n]' },
        { label: 'key: [[', type: 'text', info: 'Content array block', apply: 'key: [[\n  \n]]' },
        { label: 'key::', type: 'text', info: 'Multiline value', apply: 'key::\n\n::' },
      ]
    };
  }

  return null;
}

/**
 * Create ADML language support extension
 */
export function admlLanguage(): Extension {
  return [
    StreamLanguage.define(admlStreamParser),
    syntaxHighlighting(admlHighlightStyle),
    autocompletion({ override: [admlAutocomplete] })
  ];
}

export default admlLanguage;
