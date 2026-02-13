/**
 * Auto-closing brackets for ADML
 * Handles automatic insertion of closing brackets with proper indentation
 */

import { Extension, Prec } from '@codemirror/state';
import { keymap, EditorView } from '@codemirror/view';

/**
 * Get indentation from a line
 */
function getIndent(line: string): string {
  const match = line.match(/^(\s*)/);
  return match ? match[1] : '';
}

/**
 * Handle opening brace { for objects
 */
function handleOpenBrace(view: any): boolean {
  const { state } = view;
  const { selection } = state;
  const { main } = selection;

  // Get the current line
  const line = state.doc.lineAt(main.head);
  const lineText = line.text;
  const beforeCursor = lineText.substring(0, main.head - line.from);

  // Check if we're after a colon (object syntax)
  if (beforeCursor.match(/:\s*$/)) {
    // Add space if not already there
    const needsSpace = !beforeCursor.endsWith(' ');
    const prefix = needsSpace ? ' ' : '';
    const insertion = `${prefix}{\n  \n}`;
    const cursorOffset = prefix.length + 4; // After prefix + "{\n  "

    view.dispatch({
      changes: { from: main.head, insert: insertion },
      selection: { anchor: main.head + cursorOffset }
    });

    return true;
  }

  // Default behavior - just insert {
  return false;
}

/**
 * Handle opening bracket [ for arrays and content arrays
 */
function handleOpenBracket(view: any): boolean {
  const { state } = view;
  const { selection } = state;
  const { main } = selection;

  // Get the current line
  const line = state.doc.lineAt(main.head);
  const lineText = line.text;
  const beforeCursor = lineText.substring(0, main.head - line.from);
  const afterCursor = lineText.substring(main.head - line.from);
  const trimmedBefore = beforeCursor.trim();

  // Check if we're inside an auto-closed [] — transform to [[ ]]
  if (beforeCursor.endsWith('[') && afterCursor.startsWith(']')) {
    const currentIndent = getIndent(lineText);
    const newIndent = currentIndent + '  ';
    // Replace the ] with [\n  \n]]
    const insertion = `[\n${newIndent}\n${currentIndent}]]`;

    view.dispatch({
      changes: { from: main.head, to: main.head + 1, insert: insertion },
      selection: { anchor: main.head + 2 + newIndent.length }
    });

    return true;
  }

  // Check if we're after a colon (array syntax) OR at start of line (nested array in array)
  const afterColon = beforeCursor.match(/:\s*$/);
  const emptyLineInArray = trimmedBefore === '';

  if (afterColon || emptyLineInArray) {
    // Add space if after colon without space
    const needsSpace = afterColon && !beforeCursor.endsWith(' ');
    const prefix = needsSpace ? ' ' : '';
    const insertion = `${prefix}[]`;
    const cursorOffset = prefix.length + 1; // After prefix + "["

    view.dispatch({
      changes: { from: main.head, insert: insertion },
      selection: { anchor: main.head + cursorOffset }
    });

    return true;
  }

  // Default behavior - just insert [
  return false;
}

/**
 * Handle colon key for :: multiline syntax
 */
function handleColon(view: any): boolean {
  const { state } = view;
  const { selection } = state;
  const { main } = selection;

  // Get the current line
  const line = state.doc.lineAt(main.head);
  const lineText = line.text;
  const beforeCursor = lineText.substring(0, main.head - line.from);

  // Check if we're about to type the second colon after a property name
  // Pattern: word characters followed by a single colon (not space, not bracket)
  if (beforeCursor.match(/[a-zA-Z_][\w.]*:$/)) {
    // Insert: ":\n\n::"
    const insertion = ':\n\n::';
    const cursorOffset = 2; // After ":\n"

    view.dispatch({
      changes: { from: main.head, insert: insertion },
      selection: { anchor: main.head + cursorOffset }
    });

    return true;
  }

  return false;
}

/**
 * Handle Enter key for smart indentation
 */
function handleEnter(view: any): boolean {
  const { state } = view;
  const { selection } = state;
  const { main } = selection;

  // Get the current line
  const line = state.doc.lineAt(main.head);
  const lineText = line.text;
  const beforeCursor = lineText.substring(0, main.head - line.from);
  const afterCursor = lineText.substring(main.head - line.from);

  // Get current indentation
  const currentIndent = getIndent(lineText);

  // Check if we're between [[ and ]] on same line
  if (beforeCursor.trim().endsWith('[[') && afterCursor.trim().startsWith(']]')) {
    const newIndent = currentIndent + '  ';
    const insertion = `\n${newIndent}\n${currentIndent}`;

    view.dispatch({
      changes: { from: main.head, insert: insertion },
      selection: { anchor: main.head + 1 + newIndent.length }
    });

    return true;
  }

  // Check if we're between < and > on same line
  if (beforeCursor.trim().endsWith('<') && afterCursor.trim().startsWith('>')) {
    const newIndent = currentIndent + '  ';
    const insertion = `\n${newIndent}\n${currentIndent}`;

    view.dispatch({
      changes: { from: main.head, insert: insertion },
      selection: { anchor: main.head + 1 + newIndent.length }
    });

    return true;
  }

  // Check if we're between opening and closing brackets on same line
  if (beforeCursor.trim().endsWith('{') && afterCursor.trim().startsWith('}')) {
    // Insert newline with increased indent, then newline with current indent
    const newIndent = currentIndent + '  ';
    const insertion = `\n${newIndent}\n${currentIndent}`;

    view.dispatch({
      changes: { from: main.head, insert: insertion },
      selection: { anchor: main.head + 1 + newIndent.length }
    });

    return true;
  }

  if (beforeCursor.trim().endsWith('[') && afterCursor.trim().startsWith(']')) {
    // Insert newline with indent for first item, then newline with current indent for closing bracket
    const newIndent = currentIndent + '  ';
    const insertion = `\n${newIndent}\n${currentIndent}`;

    view.dispatch({
      changes: { from: main.head, insert: insertion },
      selection: { anchor: main.head + 1 + newIndent.length }
    });

    return true;
  }

  // Check if previous line ends with {, [, [[, or < - add indentation
  if (beforeCursor.trim().endsWith('{') || beforeCursor.trim().endsWith('[') || beforeCursor.trim().endsWith('[[') || beforeCursor.trim().endsWith('<')) {
    // Increase indentation for nested content
    const newIndent = currentIndent + '  ';
    view.dispatch({
      changes: { from: main.head, insert: `\n${newIndent}` },
      selection: { anchor: main.head + 1 + newIndent.length }
    });
    return true;
  }

  // Check if current line is just closing bracket/delimiter - maintain parent indentation
  if (beforeCursor.trim() === '' && (afterCursor.trim() === '}' || afterCursor.trim() === ']' || afterCursor.trim() === ']]' || afterCursor.trim() === '>')) {
    // Maintain current indentation
    view.dispatch({
      changes: { from: main.head, insert: `\n${currentIndent}` },
      selection: { anchor: main.head + 1 + currentIndent.length }
    });
    return true;
  }

  // Maintain current indentation for normal enters
  if (currentIndent) {
    view.dispatch({
      changes: { from: main.head, insert: `\n${currentIndent}` },
      selection: { anchor: main.head + 1 + currentIndent.length }
    });
    return true;
  }

  return false;
}

/**
 * Create auto-closing brackets extension
 */
export function autoCloseBrackets(): Extension {
  return [
    // Use DOM event handlers for [ and { since keymap isn't catching them
    EditorView.domEventHandlers({
      keydown(event, view) {
        if (event.key === '[') {
          const handled = handleOpenBracket(view);
          if (handled) {
            event.preventDefault();
          }
          return handled;
        }

        if (event.key === '{') {
          const handled = handleOpenBrace(view);
          if (handled) {
            event.preventDefault();
          }
          return handled;
        }

        return false;
      }
    }),

    // Use keymap for : and Enter
    Prec.highest(keymap.of([
      {
        key: ':',
        run: handleColon,
      },
      {
        key: 'Enter',
        run: handleEnter,
      }
    ]))
  ];
}

export default autoCloseBrackets;
