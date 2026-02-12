/**
 * ADML Editor
 * Web-based editor for ADML markup
 */

import { EditorState, Extension } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { defaultKeymap, indentWithTab } from '@codemirror/commands';
import { admlLanguage } from './lang-adml.js';
import { autoCloseBrackets } from './auto-close.js';

export interface ADMLEditorOptions {
  initialValue?: string;
  onChange?: (value: string) => void;
  extensions?: Extension[];
  theme?: 'light' | 'dark';
}

export class ADMLEditor {
  private view: EditorView;
  private onChange?: (value: string) => void;

  constructor(parent: Element, options: ADMLEditorOptions = {}) {
    this.onChange = options.onChange;

    const extensions = [
      autoCloseBrackets(), // MUST BE FIRST - Highest priority is set inside the extension
      admlLanguage(),
      keymap.of([...defaultKeymap, indentWithTab]),
      EditorView.lineWrapping,
      EditorView.updateListener.of((update) => {
        if (update.docChanged && this.onChange) {
          this.onChange(update.state.doc.toString());
        }
      }),
      ...(options.extensions || [])
    ];

    const state = EditorState.create({
      doc: options.initialValue || '',
      extensions
    });

    this.view = new EditorView({
      state,
      parent
    });
  }

  getValue(): string {
    return this.view.state.doc.toString();
  }

  setValue(value: string): void {
    this.view.dispatch({
      changes: {
        from: 0,
        to: this.view.state.doc.length,
        insert: value
      }
    });
  }

  destroy(): void {
    this.view.destroy();
  }
}

export { EditorView, EditorState };
export { ADMLEditorReact } from './react.js';
export { admlLanguage } from './lang-adml.js';
export { autoCloseBrackets } from './auto-close.js';
export default ADMLEditor;
