import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  // Handle [[ → ]] auto-closing
  // VSCode's declarative autoClosingPairs can't handle [[ / ]] because
  // the first [ already auto-closes to [], so the second [ produces [[]
  // instead of [[ ]]. We intercept the second [ and fix it up.
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((e) => {
      if (e.document.languageId !== 'adml') return;
      if (e.contentChanges.length !== 1) return;

      const change = e.contentChanges[0];
      if (change.text !== '[') return;

      const editor = vscode.window.activeTextEditor;
      if (!editor || editor.document !== e.document) return;

      const pos = change.range.start;
      const line = e.document.lineAt(pos.line);
      const textAfterInsert = line.text.substring(pos.character);

      // After the auto-close of first [, we have: ...[|]
      // User types second [, now we have: ...[[|]
      // We want: ...[[|]]
      // Check: character before cursor is [, character at cursor is ]
      if (textAfterInsert.startsWith('[]')) {
        // The [ was just inserted before [], making it [[]
        // Replace the ] with ]]
        const closeBracketPos = new vscode.Position(pos.line, pos.character + 2);
        editor.edit((editBuilder) => {
          editBuilder.insert(closeBracketPos, ']');
        }, { undoStopBefore: false, undoStopAfter: false });
      }
    })
  );

  // Handle :: multiline string auto-closing
  // When user types the second : after key:, insert newline + :: closing delimiter
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((e) => {
      if (e.document.languageId !== 'adml') return;
      if (e.contentChanges.length !== 1) return;

      const change = e.contentChanges[0];
      if (change.text !== ':') return;

      const editor = vscode.window.activeTextEditor;
      if (!editor || editor.document !== e.document) return;

      const pos = change.range.start;
      const line = e.document.lineAt(pos.line);
      const textBeforeInsert = line.text.substring(0, pos.character);

      // Check pattern: word characters followed by single colon, then we just typed another
      // e.g. "description:" + ":" → "description::" should auto-insert closing ::
      if (/[a-zA-Z_][\w.]*:$/.test(textBeforeInsert)) {
        const afterInsert = line.text.substring(pos.character + 1);
        // Only if nothing meaningful follows
        if (afterInsert.trim() === '') {
          const insertPos = new vscode.Position(pos.line, line.text.length + 1);
          editor.edit((editBuilder) => {
            editBuilder.insert(
              new vscode.Position(pos.line, pos.character + 1),
              '\n\n::'
            );
          }, { undoStopBefore: false, undoStopAfter: false }).then(() => {
            // Position cursor on the empty line between :: delimiters
            const newPos = new vscode.Position(pos.line + 1, 0);
            editor.selection = new vscode.Selection(newPos, newPos);
          });
        }
      }
    })
  );
}

export function deactivate() {}
