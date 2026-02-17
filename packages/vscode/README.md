# ADML for VS Code

Language support for ADML (Article Data Markup Language) files in Visual Studio Code.

## Features

- Syntax highlighting for `.adml` files
- Comment toggling with `Cmd+/` (Mac) or `Ctrl+/` (Windows/Linux)
- Bracket matching and auto-closing for `{}`, `[]`, `[[]]`, and `<>`
- Auto-indentation

## Installation

### From this repository

1. Make sure you have [Node.js](https://nodejs.org/) installed (version 16 or later).

2. Open a terminal and navigate to the root of this repository:

   ```bash
   cd path/to/ADML
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Build the extension and package it as a `.vsix` file:

   ```bash
   cd packages/vscode
   npm run build
   npm run package
   ```

   This creates a file called `adml-vscode-0.1.0.vsix` in the `packages/vscode/` folder.

5. Install the `.vsix` file in VS Code:

   - Open VS Code
   - Open the Command Palette: `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
   - Type **"Install from VSIX"** and select it
   - Browse to `packages/vscode/adml-vscode-0.1.0.vsix` and select it
   - Restart VS Code when prompted

6. Open any `.adml` file and you should see syntax highlighting.

### Updating

After pulling new changes from the repository, repeat steps 3-5 to rebuild and reinstall.

## Supported syntax

The extension highlights all ADML language features:

```
// Line comments
/* Block comments */

title: Hello World        // key: value (strings)
count: 42                 // numbers
enabled: true             // booleans

author.name: John Doe     // dot notation

settings: {               // objects
  theme: dark
}

tags: [                   // arrays
  javascript
  typescript
]

body: [[                  // content arrays
  #heading.large: Welcome
  A paragraph of text.
  <#image.hero: banner.jpg
    alt: A photo
    width: 1200
  >
]]

description::             // multiline strings
This is a multiline
string value.
::
```
