# Support

## Start here

- **What TAP is, and the rules:**
  <https://bitcoinuniverseio.github.io/tap/>
- **Checking a payload:** the
  [validator](https://bitcoinuniverseio.github.io/tap/validator.html) runs in your
  browser and names the rule behind any rejection.
- **Why a payload was rejected:** the
  [test vectors](https://bitcoinuniverseio.github.io/tap/vectors.html) list the
  common failures with worked cases.
- **All Bitcoin Universe documentation:** <https://docs.bitcoinuniverse.io/>

## Where to ask

| You want to | Go to |
| --- | --- |
| Report an error in this documentation | [Open an issue](https://github.com/bitcoinuniverseio/tap/issues) in this repository |
| Report a security problem | [Private vulnerability reporting](https://github.com/bitcoinuniverseio/tap/security/advisories/new) |
| Ask about the TAP protocol itself | The upstream Trac ecosystem, starting at <https://docs.tap-protocol.com/> |
| Ask about TAP on Dogecoin | The [tap-on-doge](https://github.com/bitcoinuniverseio/tap-on-doge) repository |
| Ask about a Bitcoin Universe product | That product's own repository |

## What this repository cannot help with

- **Recovering a lost balance.** If a transfer inscription was spent as change
  or as a fee, the parked amount went with it. Nothing in this repository can
  reverse that. The [guide](https://bitcoinuniverseio.github.io/tap/guide.html#mistakes)
  explains how it happens so it does not happen again.
- **Whether a specific token is worth holding.** This is protocol documentation.
  It will tell you what `prv` means and how to check for it. It will not tell you
  whether to trust a project.
- **Live balances and indexed state.** This site is static documentation. It has
  no index and no API.
- **Authority bearing operations in Bitcoin Universe products.** They are not
  indexed or executed there, so there is no Bitcoin Universe surface to support.

## Before you open an issue

Please include the exact payload, the deployment's decimal scale if you know it,
the inscription number if it matters, and what you expected. A validator result
pasted into the issue makes it much faster to answer.
