# Contributing

Corrections are welcome, especially ones that catch a claim this site cannot
support.

## The one rule that matters

**Every factual claim must be traceable to code.** A pull request that adds a
protocol rule, a field, a limit, a support claim or a test vector must say where
it comes from: a file in a Bitcoin Universe repository, an entry in the protocol
registry, or an explicitly labelled upstream reference.

If a claim cannot be traced, it does not go on the site. Saying "this is not
documented here, see upstream" is a better outcome than a plausible guess.

## Specific expectations

- **Support claims.** Only claim wallet, inscribe or marketplace support that is
  visible in the product code. Code presence is not the same as production
  enablement, and the site says so. When in doubt, omit.
- **Upstream behaviour.** TAP is defined in the Trac ecosystem. Where behaviour
  is upstream and not implemented in Bitcoin Universe's code, label it and link
  upstream rather than restating field level rules.
- **Test vectors.** Derive them from an indexer or parser test suite. Do not
  invent a vector to illustrate a rule.
- **Rule identifiers.** Identifiers such as `EN-7` are stable within a major
  document version. Do not renumber existing rules; append instead, and record
  the change in `changelog.html`.

## House style

- No em dash characters anywhere. Use commas, colons, periods or parentheses.
- Plain, direct writing. No filler, no superlatives that cannot be supported, no
  placeholder sections and no "coming soon".
- Prefer a table or a diagram over a wall of text.
- British or American spelling is fine, but be consistent within a page.

## Technical constraints

- Hand authored HTML, one stylesheet, vanilla JavaScript. No build step, no
  framework, no bundler, no external fonts, no content delivery network, no
  analytics.
- Every page must work with JavaScript disabled. JavaScript may only enhance:
  search, the theme toggle, and the validator.
- Both themes must meet WCAG 2.2 AA contrast, and the site must work down to a
  320 pixel viewport with no horizontal page overflow. Wide tables and code
  blocks scroll inside their own container.
- Every diagram is inline SVG with a `<title>` and `<desc>`, and uses CSS custom
  properties so it stays legible in both themes.
- Keep the budget: under 50 KB of CSS and under 60 KB of JavaScript in total.

## Making a change

1. Edit the relevant HTML file directly. There is no source directory and no
   generated output.
2. If you add or move a heading, add or update its record in
   `search-index.json`, including sensible aliases.
3. If you add a page, add it to the navigation on every page, to `sitemap.xml`,
   to `llms.txt`, to the list in `404.html` and to the table in `README.md`.
4. Add a changelog entry in `changelog.html` and bump the document version in the
   page footers if a rule changed.
5. Preview locally with any static server and check the page at 320 pixels wide,
   in both themes, and with JavaScript disabled.
6. Open a pull request against `main` describing the source of every factual
   change.

## Security

Do not open a public issue for a security problem. Use
[private vulnerability reporting](https://github.com/bitcoinuniverseio/tap/security/advisories/new).
See [SECURITY.md](SECURITY.md).
