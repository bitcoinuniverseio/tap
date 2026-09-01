# TAP protocol documentation

Authoritative documentation for **TAP** on Bitcoin mainnet: an inscribed token
protocol from the Trac ecosystem that keeps the familiar deploy, mint and two
step transfer of an inscribed token, and adds delegated authority over a token.

**Site: <https://bitcoinuniverseio.github.io/tap/>**

TAP did not originate here. It is an upstream protocol that Bitcoin Universe
indexes. Every rule published on this site is traced to code that Bitcoin
Universe runs, or to the protocol registry it maintains. Where TAP defines
behaviour that does not appear in that code, the site says so and points
upstream rather than restating rules it cannot verify.

## Pages

| Page | What it holds |
| --- | --- |
| [Overview](https://bitcoinuniverseio.github.io/tap/) | What TAP is, who it is for, the protocol facts, operations at a glance, the Bitcoin Universe support matrix |
| [Specification](https://bitcoinuniverseio.github.io/tap/spec.html) | Numbered normative rules: carrier, payload encoding, tickers, amounts, operations, authority, state, invalidity |
| [Guide](https://bitcoinuniverseio.github.io/tap/guide.html) | The two step inscribe then send transfer worked end to end, with payloads |
| [Reference](https://bitcoinuniverseio.github.io/tap/reference.html) | Terminology, indexer semantics, BRC-20 differences, fees, limitations, security, implementation checklist |
| [Test vectors](https://bitcoinuniverseio.github.io/tap/vectors.html) | Accepted and rejected payloads with the rule behind each outcome |
| [Validator](https://bitcoinuniverseio.github.io/tap/validator.html) | Client side TAP payload validator |
| [Changelog](https://bitcoinuniverseio.github.io/tap/changelog.html) | Document version history and known gaps |

## Key facts

- **Chain and network:** Bitcoin, mainnet.
- **Protocol tag:** `"p": "tap"`, exact and lower case.
- **Carrier:** Ordinal inscriptions, written by Bitcoin Universe as
  `text/plain;charset=utf-8`.
- **Ticker:** NFC lower case, at most 32 UTF-16 code units and 128 UTF-8 bytes,
  no Unicode control, format or separator characters. A negative inscription
  number puts the ticker in a namespace prefixed with `-`.
- **Amounts:** exact JSON strings matching `^(0|[1-9]\d*)(?:\.(\d+))?$`, with no
  more fractional digits than the deployment's decimal scale (0 to 18), an
  atomic value of at most 78 digits, converted by string padding rather than
  floating point.
- **Transfer content contract:** required `p`, `op`, `tick`, `amt`; optional
  `dta` capped at 512 UTF-8 bytes. No unknown field, no duplicate field, no non
  string value, no byte order mark, no trailing comma, no trailing data.
- **Two step transfer:** inscribing a `token-transfer` moves the amount into a
  transferable balance bound to that inscription; sending the inscription
  credits the recipient and consumes it.
- **Authority:** a deployment may name a privilege authority inscription in
  `prv`. Privileged operations on that ticker then need that authority's
  authorisation. Ordinary transfers never do.
- **Indexer coverage:** `partial`, confirmed state only, no mempool feed. Reorg
  detection is tail replacement only and requires positive evidence.
- **Marketplace:** feature gated behind `tapMarketplaceV1`, in app execution,
  settlement at one Bitcoin confirmation, automatic reorg reconciliation. The
  `sell` action is unsupported, with the recorded reason "TAP has no executable
  offer workflow on this marketplace surface."

## Support in Bitcoin Universe

| Surface | Actions |
| --- | --- |
| Core | view, discover, view collection, view activity, view transaction, list, update listing, unlist, buy, make offer, accept offer, cancel offer, settle, reconcile |
| Wallet | view, send, receive |
| Inscribe | deploy, mint, transfer |

This records what the product code implements. It is not a statement that a
surface is enabled in production, which the status pages report separately.
Authority bearing operations are not indexed or executed by any Bitcoin Universe
surface.

## Related

- [TAP on Doge](https://bitcoinuniverseio.github.io/tap-on-doge/), the Dogecoin
  variant, documented in its own repository.
- [docs.bitcoinuniverse.io](https://docs.bitcoinuniverse.io/), the central
  documentation portal.
- [docs.tap-protocol.com](https://docs.tap-protocol.com/), upstream TAP
  documentation from the Trac ecosystem.

## Building and running

There is nothing to build. The site is hand authored HTML, one stylesheet and
two small vanilla JavaScript files, with no framework, no bundler, no external
fonts, no content delivery network and no trackers. Every page works with
JavaScript disabled; JavaScript only adds search, the theme toggle and the
validator.

To preview locally, serve the directory with any static file server, for example:

```
python -m http.server 8000
```

Then open <http://localhost:8000/>.

Deployment is GitHub Pages from `main` at the repository root. `.nojekyll` keeps
Pages from running Jekyll over the files.

## Repository layout

```
index.html          Overview
spec.html           Normative specification
guide.html          Walkthrough and worked examples
reference.html      Terminology, indexer semantics, checklist
vectors.html        Test vectors
validator.html      Interactive payload validator
changelog.html      Document version history
404.html            Not found page
styles.css          The whole stylesheet
site.js             Theme toggle, heading anchors, client side search
validator.js        The payload validator
search-index.json   Hand authored search records
docs.manifest.json  Documentation manifest for the portal
llms.txt            Machine readable description of the site
sitemap.xml         Sitemap
robots.txt          Robots policy
favicon.svg         Site icon
og.svg              Open Graph image
```

## Contributing

Corrections are welcome, especially ones that catch a claim this site cannot
support. See [CONTRIBUTING.md](CONTRIBUTING.md). Security issues go through
[private vulnerability reporting](https://github.com/bitcoinuniverseio/tap/security/advisories/new),
not public issues; see [SECURITY.md](SECURITY.md).

## Licence

[MIT](LICENSE).
