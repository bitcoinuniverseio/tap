# Security policy

## Reporting a vulnerability

Report privately through GitHub, not in a public issue:

**<https://github.com/bitcoinuniverseio/tap/security/advisories/new>**

Please include what you observed, how to reproduce it, and what you think the
impact is. You will get an acknowledgement, and the advisory thread is the place
for everything that follows.

## What is in scope

This repository is documentation. The things worth reporting here are:

- A published rule that disagrees with how TAP is actually indexed, in a way
  that could cause a reader to lose funds or to build a divergent indexer.
- A test vector whose stated outcome is wrong.
- A validator result that accepts a payload a strict indexer rejects, or rejects
  one it accepts.
- A support claim on this site that the product code does not back.
- Anything on this site that discloses non public infrastructure detail.

Report a flaw in a Bitcoin Universe product or indexer through that component's
own repository. If you are not sure where it belongs, report it here and it will
be routed.

## What is out of scope

- Missing security headers on GitHub Pages, which this repository does not
  control.
- Findings that require an already compromised device or browser.
- Automated scanner output with no demonstrated impact.
- Requests to add content, which belong in a normal issue.

## Disclosure

Please give a reasonable window to publish a correction before disclosing
publicly. Documentation fixes usually ship the same day they are confirmed.
