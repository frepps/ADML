import { useState } from 'react';
import { parse } from '@adml/parser';
import { ADMLEditorReact } from '@adml/editor';
import './App.css';

const initialValue = `// ADML - Article Data Markup Language
// Try editing the markup below!

title: Welcome to ADML
date: 2026-02-12

// Objects with bracket syntax
author: {
  name: John Doe
  email: john@example.com
  role: Writer
}

// Arrays with bracket syntax
tags: [
javascript
typescript
markup
json
]

// Numbers are automatically detected
port: 3000
timeout: 30.5
label: 34px

// Booleans are automatically detected
enabled: true
debug: false

// Objects with dot notation (numbers are parsed as numbers)
metadata.version: 1.0
metadata.year: 2026
metadata.status: draft

// Single-line text
summary: ADML is a markup language inspired by ArchieML that compiles to JSON.

// Multiline text using :: syntax
description::
ADML supports multiple data types:
- Strings, numbers, and booleans
- Multiline strings with ::
- Objects with { } or dot notation
- Arrays with [ ]
- Automatic type detection
- Comments with //

Perfect for structured article data!
::

category: documentation
`;

function App() {
  const [admlValue, setAdmlValue] = useState(initialValue);
  const [jsonOutput, setJsonOutput] = useState(() =>
    JSON.stringify(parse(initialValue), null, 2)
  );

  const handleChange = (value: string) => {
    setAdmlValue(value);
    try {
      const parsed = parse(value);
      setJsonOutput(JSON.stringify(parsed, null, 2));
    } catch (error) {
      setJsonOutput(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>ADML Playground</h1>
        <p className="subtitle">Article Data Markup Language</p>
      </header>

      <main className="main">
        <div className="panel">
          <h2>ADML Input</h2>
          <div className="editor-wrapper">
            <ADMLEditorReact
              value={admlValue}
              onChange={handleChange}
              className="editor"
            />
          </div>
        </div>

        <div className="panel">
          <h2>JSON Output</h2>
          <pre className="output">{jsonOutput}</pre>
        </div>
      </main>

      <footer className="footer">
        <p>
          ADML is inspired by <a href="http://archieml.org/" target="_blank" rel="noopener noreferrer">ArchieML</a>
        </p>
        <p>
          <a href="https://github.com/yourusername/adml" target="_blank" rel="noopener noreferrer">
            View on GitHub
          </a>
        </p>
      </footer>
    </div>
  );
}

export default App;
