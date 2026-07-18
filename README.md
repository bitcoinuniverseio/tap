# TAP Protocol documentation

Bitcoin Universe documentation for TAP Protocol on Bitcoin.

## What this covers

TAP begins with deploy, mint, and two-step transfer operations, then adds authorities, P2P, mass-send, and decentralized token functionality. Basic operations use JSON inscriptions with p set to tap.

## State model

The basic transfer mirrors Ordinal transferables: create a transfer inscription, then move it. Extended functions can add approval and authority state, so every participant needs the same parser and feature support.

## Documentation site

- Overview: [index.html](index.html)
- Field reference: [reference.html](reference.html)
- Build and verification playbook: [guide.html](guide.html)

## Core rules

- Basic operation values are token-deploy, token-mint, and token-transfer.
- Tickers can use one to 32 visual Unicode symbols under TAP rules.
- Existing tickers cannot be deployed again.
- A basic transfer completes only after its transferable is sent.
- Sending a transferable to yourself cancels it.
- Authority and DMT workflows have their own approval and validation rules.

## Source material

- [TAP documentation](https://docs.tap-protocol.com/)
- [TAP basic functions](https://docs.tap-protocol.com/functions/quickstart)

## Scope

TAP extensions are protocol features, not cosmetic aliases. Gate them behind explicit parser and wallet compatibility checks.
