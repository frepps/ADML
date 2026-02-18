import { useState, useCallback } from 'react';
import { parse, parseContentValue } from '@adml/parser';
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
  {
    title: 'Content Arrays',
    description:
      'Structured content blocks using double brackets. Each entry has a required type, with optional value, modifiers, and props \u2014 empty keys are omitted.',
    adml: `content: [[
  #heading: Welcome to ADML
  This is a paragraph of text.
  #image.hero: banner.jpg
  <#button.primary: Click Me
    href: /get-started
    target: _blank
  >
]]`,
  },

];

const inlineExamples = [
  'A [strong part] of string',
  'Click [here|/about/links] to learn more',
  '[the value | #em.underlined | style.color:red | id: 1]',
  'Have a look at this [<code>example</code>]',
  'Use [] for space, [/] for break, [-] for shy',
  'He said "hello" -- and left',
];

const fullExample = `/*
ADML - Article Data Markup Language
Try editing the markup below!
*/

// Article metadata
title: Welcome to ADML
template: default
date: 2026-02-12

author: {
  name: John Doe
  email: john@example.com
}

tags: [
  markup
  json
  articles
]

// Type detection
settings.port: 3000
settings.debug: false
settings.label: 34px

// Multiline text
description::
ADML is a markup language for structured
article data. It compiles to JSON and can
render directly to web pages.
::

// Content array — use to render components and html (see example app in repo)
content: [[
  #h1: Welcome to [ADML]

  This is the opening paragraph with [inline formatting]
  and a [link to the docs | /docs].

  <#blockquote.accent: To be or not to be, that is the question.
    author: William Shakespeare
    source: Hamlet
  >

  #h2.large: Getting Started

  <#ul: [[
    #li: Write content in ADML
    #li: Parse to JSON with the [parser | #strong]
    #li: Render to HTML with templates
  ]]
  >

  <#div.border.rounded.p-2.shadow: [[
    #h3: A Boxed Section
    Nested content inside a styled div using
    mods as utility classes.
  ]]
  >

  #p.center.muted: Built with ADML
]]

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

function InlineContentPlayground({
  initial,
}: {
  initial: string;
}) {
  const [value, setValue] = useState(initial);
  const [json, setJson] = useState(() =>
    JSON.stringify(parseContentValue(initial), null, 2),
  );

  return (
    <div className="inline-playground">
      <input
        className="inline-input"
        type="text"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          try {
            setJson(JSON.stringify(parseContentValue(e.target.value), null, 2));
          } catch (err) {
            setJson(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
          }
        }}
      />
      <pre className="inline-output">{json}</pre>
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

      <section className="learn">
        <div className="example">
          <div className="example-text">
            <h2>Inline Content</h2>
            <p>
              A separate parser for rich content within strings. Use{' '}
              <code>parseContentValue()</code> on string values to get
              structured content arrays. Edit the strings below to try it.
            </p>
          </div>
          <div className="inline-examples">
            {inlineExamples.map((ex, i) => (
              <InlineContentPlayground key={i} initial={ex} />
            ))}
          </div>
        </div>
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
