import { useState, useCallback } from 'react';
import { parse } from '@adml/parser';
import { ADMLEditorReact } from '@adml/editor';
import './App.css';

// --- Example definitions ---

const examples: { title: string; description: string; adml: string }[] = [
  {
    title: 'Key-Value Pairs',
    description: 'The simplest syntax. Keys and values are separated by a colon.',
    adml: `title: Welcome to ADML
author: John Doe
date: 2026-02-12`,
  },
  {
    title: 'Type Detection',
    description:
      'Numbers and booleans are automatically detected. Everything else stays a string.',
    adml: `port: 3000
timeout: 30.5
label: 34px
enabled: true
debug: false`,
  },
  {
    title: 'Objects',
    description:
      'Group related fields with bracket syntax or dot notation — or mix both freely.',
    adml: `// Bracket syntax
author: {
  name: John Doe
  email: john@example.com
}

// Dot notation (same result)
metadata.version: 1.0
metadata.status: draft`,
  },
  {
    title: 'Nested Objects',
    description:
      'Objects can nest to any depth. Brackets, dot notation, and combinations all produce the same result.',
    adml: `// Nested brackets
theme: {
  colors: {
    primary: blue
    secondary: green
  }
}

// Dot notation inside brackets
layout: {
  sidebar.width: 250
  sidebar.visible: true
}

// Dot notation opening a bracket block
page.header: {
  title: My Site
  sticky: true
}

// Pure dot notation
nav.links.home: /`,
  },
  {
    title: 'Arrays',
    description:
      'Lists of values enclosed in square brackets, one item per line. Nesting is supported.',
    adml: `tags: [
  javascript
  typescript
  nodejs
]

matrix: [
  [
    1
    2
  ]
  [
    3
    4
  ]
]`,
  },
  {
    title: 'Multiline Strings',
    description:
      'Wrap long text between double-colon delimiters. Leading/trailing whitespace on each line is trimmed.',
    adml: `summary: A single-line string

description::
This is a multiline string.
It can span as many lines as you need.

Perfect for long-form content!
::`,
  },
  {
    title: 'Comments',
    description: 'Single-line and multi-line comments are both supported.',
    adml: `// This is a single-line comment
title: Hello

/* This is a
   multi-line comment */
author: World`,
  },
];

const fullExample = `/*
ADML - Article Data Markup Language
Try editing the markup below!
*/

title: Welcome to ADML
date: 2026-02-12

// Objects with bracket syntax
author: {
  name: John Doe
  email: john@example.com
  role: Writer
}

// Nested objects
theme: {
  colors: {
    primary: blue
    secondary: green
  }
  font.size: 16
  font.family: sans-serif
}

// Arrays
tags: [
  javascript
  typescript
  markup
  json
]

// Type detection
port: 3000
timeout: 30.5
label: 34px
enabled: true
debug: false

// Dot notation
metadata.version: 1.0
metadata.year: 2026
metadata.status: draft

// Multiline text
description::
ADML supports multiple data types:
- Strings, numbers, and booleans
- Multiline strings with ::
- Objects with { } or dot notation
- Nested objects to any depth
- Arrays with [ ]
- Single-line // and /* multiline */ comments

Perfect for structured article data!
::

category: documentation
`;

// --- Components ---

function MiniPlayground({
  adml,
}: {
  adml: string;
}) {
  const [value, setValue] = useState(adml);
  const [json, setJson] = useState(() =>
    JSON.stringify(parse(adml), null, 2),
  );

  const handleChange = useCallback((v: string) => {
    setValue(v);
    try {
      setJson(JSON.stringify(parse(v), null, 2));
    } catch (e) {
      setJson(`Error: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  }, []);

  return (
    <div className="mini-playground">
      <div className="mini-editor-wrapper">
        <ADMLEditorReact
          value={value}
          onChange={handleChange}
          className="editor"
        />
      </div>
      <pre className="mini-output">{json}</pre>
    </div>
  );
}

function App() {
  const [admlValue, setAdmlValue] = useState(fullExample);
  const [jsonOutput, setJsonOutput] = useState(() =>
    JSON.stringify(parse(fullExample), null, 2),
  );

  const handleChange = useCallback((value: string) => {
    setAdmlValue(value);
    try {
      setJsonOutput(JSON.stringify(parse(value), null, 2));
    } catch (error) {
      setJsonOutput(
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }, []);

  return (
    <div className="app">
      <header className="header">
        <h1>ADML</h1>
        <p className="subtitle">Article Data Markup Language</p>
      </header>

      <section className="learn">
        {examples.map((ex, i) => (
          <div className="example" key={i}>
            <div className="example-text">
              <h2>{ex.title}</h2>
              <p>{ex.description}</p>
            </div>
            <MiniPlayground adml={ex.adml} />
          </div>
        ))}
      </section>

      <section className="playground-section" id="playground">
        <h2>Playground</h2>
        <p>Combine everything — edit freely and see the JSON output live.</p>
        <main className="main">
          <div className="panel">
            <h3>ADML Input</h3>
            <div className="editor-wrapper">
              <ADMLEditorReact
                value={admlValue}
                onChange={handleChange}
                className="editor"
              />
            </div>
          </div>

          <div className="panel">
            <h3>JSON Output</h3>
            <pre className="output">{jsonOutput}</pre>
          </div>
        </main>
      </section>

      <footer className="footer">
        <p>
          ADML is inspired by{' '}
          <a
            href="http://archieml.org/"
            target="_blank"
            rel="noopener noreferrer"
          >
            ArchieML
          </a>
        </p>
      </footer>
    </div>
  );
}

export default App;
