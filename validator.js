/* TAP inscription payload validator.
   Everything here runs in your browser. The payload you paste is never
   stored, logged, or sent anywhere.

   The token-transfer path is a direct port of the content parser that
   Bitcoin Universe's index-tap service uses to prove that an inscription
   is a TAP token-transfer (src/tap-transfer-content.ts). The other
   operations are checked against the field sets that appear in the
   organisation's own payload builders and indexer normaliser. */
(function () {
  "use strict";

  var PROFILE = "index-tap, Bitcoin mainnet";

  var REQUIRED_TRANSFER_KEYS = ["p", "op", "tick", "amt"];
  var ALLOWED_TRANSFER_KEYS = ["p", "op", "tick", "amt", "dta"];
  var MAX_TICKER_UTF16 = 32;
  var MAX_TICKER_UTF8 = 128;
  var MAX_DTA_UTF8 = 512;
  var MAX_ATOMIC_DIGITS = 78;

  var OPS = {
    "token-transfer": {
      title: "Token transfer",
      authority: "none",
      required: ["p", "op", "tick", "amt"],
      optional: ["dta"],
      summary:
        "Step one of the two step transfer. Inscribing it moves the amount from the holder's available balance into a transferable balance bound to this inscription. Sending the inscription completes the transfer.",
      strict: true
    },
    "token-deploy": {
      title: "Token deployment",
      authority: "optional",
      required: ["p", "op", "tick", "max", "lim"],
      optional: ["prv", "dec"],
      summary:
        "Creates a ticker with a maximum supply and a per mint limit. A deployment that carries prv binds the ticker to a privilege authority inscription, so later privileged operations on that ticker must be authorised by that authority."
    },
    "token-mint": {
      title: "Token mint",
      authority: "optional",
      required: ["p", "op", "tick", "amt"],
      optional: ["prv", "dta"],
      summary:
        "Mints under the deployment's terms. When the deployment is bound to a privilege authority, the mint body is produced by that authority and carries a prv object holding the authority's salt."
    },
    "token-send": {
      title: "Authorised send",
      authority: "required",
      required: ["p", "op", "items"],
      optional: [],
      summary:
        "A single payload that moves balances for a list of items, each naming a ticker, an amount and a destination address. It is an authority bearing operation: it only takes effect when the token authority has authorised it.",
      items: ["tick", "amt", "address"]
    },
    "dmt-deploy": {
      title: "DMT deployment",
      authority: "required",
      required: ["p", "op", "tick", "elem", "prv", "dt"],
      optional: ["id", "prj"],
      summary:
        "A Digital Matter Theory deployment carried on the tap protocol tag. Bitcoin Universe indexes DMT with a separate service, so index-tap records these rows as consumed source offsets without normalising them as TAP assets.",
      outOfScope: true
    },
    "dmt-mint": {
      title: "DMT mint",
      authority: "none",
      required: ["p", "op", "tick"],
      optional: ["blk", "dmtblck"],
      summary:
        "A Digital Matter Theory mint carried on the tap protocol tag. Bitcoin Universe indexes DMT with a separate service, so index-tap records these rows as consumed source offsets without normalising them as TAP events.",
      outOfScope: true
    }
  };

  var BACK = String.fromCharCode(92);
  var LEGACY_UNPRINTABLE = new RegExp(
    "[" +
      BACK + "u0000-" + BACK + "u0020" +
      BACK + "u007f" +
      BACK + "u00a0" +
      BACK + "u2000-" + BACK + "u200f" +
      BACK + "u2028" + BACK + "u2029" +
      BACK + "u202f" + BACK + "u205f" +
      BACK + "u3000" + BACK + "ufeff" +
      "]"
  );
  function utf8Length(value) {
    if (window.TextEncoder) return new TextEncoder().encode(value).length;
    return unescape(encodeURIComponent(value)).length;
  }

  function tickerIsWellFormed(value) {
    if (typeof value !== "string" || value.length === 0) return false;
    if (value.length > MAX_TICKER_UTF16) return false;
    if (utf8Length(value) > MAX_TICKER_UTF8) return false;
    if (value !== value.normalize("NFC").toLowerCase()) return false;
    try {
      if (new RegExp("[" + BACK + "p{C}" + BACK + "p{Z}]", "u").test(value)) {
        return false;
      }
    } catch (e) {
      if (LEGACY_UNPRINTABLE.test(value)) return false;
    }
    return true;
  }

  function tickerFault(value) {
    if (typeof value !== "string" || value.length === 0) {
      return "the ticker is empty";
    }
    if (value.length > MAX_TICKER_UTF16) {
      return (
        "the ticker is " +
        value.length +
        " UTF-16 code units, above the limit of " +
        MAX_TICKER_UTF16 +
        " (astral characters such as emoji count as two each)"
      );
    }
    if (utf8Length(value) > MAX_TICKER_UTF8) {
      return (
        "the ticker is " +
        utf8Length(value) +
        " UTF-8 bytes, above the limit of " +
        MAX_TICKER_UTF8
      );
    }
    if (value !== value.normalize("NFC").toLowerCase()) {
      return 'the ticker is not already in NFC lower case form (it normalises to "' +
        value.normalize("NFC").toLowerCase() +
        '")';
    }
    return "the ticker contains a Unicode control, format or separator character";
  }

  /* Port of the strict flat string object reader used for token-transfer
     inscription content. Every deviation is a rejection. */
  function parseFlatStringObject(text) {
    var index = 0;
    var values = {};
    var order = [];

    function whitespace() {
      while (index < text.length && /[ \t\r\n]/.test(text.charAt(index))) {
        index += 1;
      }
    }

    function readString() {
      if (text.charAt(index) !== '"') {
        throw new Error("every key and value must be a JSON string");
      }
      var start = index;
      index += 1;
      var escaped = false;
      while (index < text.length) {
        var character = text.charAt(index);
        if (!escaped && character === '"') {
          index += 1;
          var token = text.slice(start, index);
          var parsed;
          try {
            parsed = JSON.parse(token);
          } catch (e) {
            throw new Error("a JSON string in the payload is malformed");
          }
          if (typeof parsed !== "string") {
            throw new Error("a JSON string in the payload is malformed");
          }
          return parsed;
        }
        if (!escaped && character === "\\") {
          escaped = true;
        } else {
          if (character.charCodeAt(0) < 0x20) {
            throw new Error(
              "a JSON string contains an unescaped control character"
            );
          }
          escaped = false;
        }
        index += 1;
      }
      throw new Error("a JSON string is not terminated");
    }

    whitespace();
    if (text.charAt(index) !== "{") {
      throw new Error("the payload must be a single JSON object");
    }
    index += 1;
    whitespace();
    if (text.charAt(index) === "}") {
      throw new Error("the payload object is empty");
    }
    while (index < text.length) {
      var key = readString();
      if (ALLOWED_TRANSFER_KEYS.indexOf(key) === -1) {
        throw new Error(
          'the field "' + key + '" is not part of the token-transfer contract'
        );
      }
      if (Object.prototype.hasOwnProperty.call(values, key)) {
        throw new Error('the field "' + key + '" appears more than once');
      }
      whitespace();
      if (text.charAt(index) !== ":") {
        throw new Error("the payload is not well formed JSON");
      }
      index += 1;
      whitespace();
      var value = readString();
      values[key] = value;
      order.push(key);
      whitespace();
      if (text.charAt(index) === "}") {
        index += 1;
        break;
      }
      if (text.charAt(index) !== ",") {
        throw new Error("the payload is not well formed JSON");
      }
      index += 1;
      whitespace();
      if (text.charAt(index) === "}") {
        throw new Error("the payload contains a trailing comma");
      }
    }
    whitespace();
    if (index !== text.length) {
      throw new Error("there is extra data after the closing brace");
    }
    return { values: values, order: order };
  }

  function atomicAmount(value, decimals) {
    if (typeof value !== "string" || value !== value.trim()) {
      throw new Error("the amount must be an exact JSON string");
    }
    var match = value.match(/^(0|[1-9]\d*)(?:\.(\d+))?$/);
    if (!match) {
      throw new Error(
        "the amount is not a plain decimal string (no sign, no exponent, no leading zero, no thousands separator)"
      );
    }
    var whole = match[1];
    var fraction = match[2];
    if (fraction != null && fraction.length > decimals) {
      throw new Error(
        "the amount carries " +
          fraction.length +
          " fractional digits, above the deployment scale of " +
          decimals
      );
    }
    var padded = fraction == null ? "" : fraction;
    while (padded.length < decimals) padded += "0";
    var atomic = (whole + padded).replace(/^0+(?=\d)/, "");
    if (atomic.length > MAX_ATOMIC_DIGITS) {
      throw new Error(
        "the atomic amount is " +
          atomic.length +
          " digits, above the supported range of " +
          MAX_ATOMIC_DIGITS
      );
    }
    return atomic || "0";
  }

  /* ---------- reporting ---------- */

  var out = document.getElementById("result");
  var field = document.getElementById("payload");
  var decInput = document.getElementById("decimals");
  var numInput = document.getElementById("inscription-number");

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function report(state, headline, lines, tail) {
    out.innerHTML = "";
    out.setAttribute("data-state", state);
    out.appendChild(el("h3", null, headline));
    if (lines && lines.length) {
      var ul = el("ul", "checks");
      lines.forEach(function (line) {
        var li = el("li", null, line.text);
        li.setAttribute("data-r", line.kind);
        ul.appendChild(li);
      });
      out.appendChild(ul);
    }
    if (tail) {
      tail.forEach(function (node) {
        out.appendChild(node);
      });
    }
    var foot = el(
      "p",
      "small",
      "Checked against the " +
        PROFILE +
        " profile. Nothing you paste leaves this page."
    );
    out.appendChild(foot);
  }

  function pass(text) {
    return { kind: "pass", text: text };
  }
  function fail(text) {
    return { kind: "fail", text: text };
  }
  function info(text) {
    return { kind: "info", text: text };
  }

  function detailBlock(title, body) {
    var wrap = el("div");
    wrap.appendChild(el("h4", null, title));
    wrap.appendChild(el("p", null, body));
    return wrap;
  }

  function decimals() {
    var value = parseInt(decInput.value, 10);
    if (!isFinite(value) || value < 0) value = 0;
    if (value > 18) value = 18;
    return value;
  }

  function inscriptionNumber() {
    var value = parseInt(numInput.value, 10);
    return isFinite(value) ? value : 1;
  }

  function looseOp(text) {
    try {
      var parsed = JSON.parse(text);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed;
      }
    } catch (e) {
      /* the strict path reports the real fault */
    }
    return null;
  }

  function validateTransfer(text, lines) {
    var scale = decimals();
    var number = inscriptionNumber();
    var parsed;
    try {
      parsed = parseFlatStringObject(text);
    } catch (e) {
      lines.push(fail("Rejected: " + e.message));
      report(
        "bad",
        "This is not a valid TAP token-transfer",
        lines,
        [
          detailBlock(
            "Why it matters",
            "index-tap only accepts an inscription as a TAP token-transfer when its content is unambiguous. A payload that fails any of these checks is not treated as a transfer, so the balance never becomes transferable and no marketplace listing can be built from it."
          )
        ]
      );
      return;
    }

    var values = parsed.values;
    var missing = REQUIRED_TRANSFER_KEYS.filter(function (key) {
      return !Object.prototype.hasOwnProperty.call(values, key);
    });
    if (missing.length) {
      lines.push(fail("Rejected: missing required field " + missing.join(", ")));
      report("bad", "This is not a valid TAP token-transfer", lines);
      return;
    }
    lines.push(pass("All four required fields are present: p, op, tick, amt."));
    lines.push(pass("Every key and value is a JSON string, with no duplicates and no unknown fields."));

    if (values.p !== "tap") {
      lines.push(fail('Rejected: p must be exactly "tap".'));
      report("bad", "This is not a valid TAP token-transfer", lines);
      return;
    }
    if (values.op !== "token-transfer") {
      lines.push(
        fail('Rejected: op must be exactly "token-transfer" for this contract.')
      );
      report("bad", "This is not a valid TAP token-transfer", lines);
      return;
    }
    lines.push(pass('Protocol tag and operation match: p is "tap", op is "token-transfer".'));

    var normalized = values.tick.normalize("NFC").toLowerCase();
    if (!tickerIsWellFormed(normalized)) {
      lines.push(fail("Rejected: " + tickerFault(normalized)));
      report("bad", "This is not a valid TAP token-transfer", lines);
      return;
    }
    lines.push(
      pass(
        'Ticker "' +
          values.tick +
          '" normalises to "' +
          normalized +
          '" (' +
          normalized.length +
          " UTF-16 code units, " +
          utf8Length(normalized) +
          " UTF-8 bytes)."
      )
    );

    if (Object.prototype.hasOwnProperty.call(values, "dta")) {
      var dtaBytes = utf8Length(values.dta);
      if (dtaBytes > MAX_DTA_UTF8) {
        lines.push(
          fail(
            "Rejected: dta is " +
              dtaBytes +
              " UTF-8 bytes, above the limit of " +
              MAX_DTA_UTF8 +
              "."
          )
        );
        report("bad", "This is not a valid TAP token-transfer", lines);
        return;
      }
      lines.push(
        pass("Optional dta accepted at " + dtaBytes + " of " + MAX_DTA_UTF8 + " UTF-8 bytes.")
      );
    }

    var atomic;
    try {
      atomic = atomicAmount(values.amt, decimals());
    } catch (e) {
      lines.push(fail("Rejected: " + e.message));
      report("bad", "This is not a valid TAP token-transfer", lines);
      return;
    }
    lines.push(
      pass(
        'Amount "' +
          values.amt +
          '" is exact at a decimal scale of ' +
          scale +
          ", giving the atomic value " +
          atomic +
          "."
      )
    );

    var effective = normalized;
    if (number < 0 && normalized.charAt(0) !== "-") {
      effective = "-" + normalized;
      lines.push(
        info(
          "Inscription number " +
            number +
            ' is negative, so the indexed ticker becomes "' +
            effective +
            '". Tickers inscribed at a negative inscription number live in their own namespace.'
        )
      );
    }

    var tail = [];
    var dl = el("dl", "kv");
    [
      ["Operation", "token-transfer"],
      ["Indexed ticker", effective],
      ["Amount as written", values.amt],
      ["Atomic amount", atomic + " (at a decimal scale of " + scale + ")"],
      ["Optional dta", Object.prototype.hasOwnProperty.call(values, "dta") ? values.dta : "not present"],
      ["Authority", "not required, this is an ordinary operation"]
    ].forEach(function (pair) {
      dl.appendChild(el("dt", null, pair[0]));
      dl.appendChild(el("dd", null, pair[1]));
    });
    tail.push(dl);
    tail.push(
      detailBlock(
        "What happens next",
        "Inscribing this payload moves the amount out of the holder's available balance and into a transferable balance bound to the new inscription. The transfer completes only when that inscription is sent to the destination address. Until then nothing has moved between addresses, and the transfer inscription can be spent by accident like any other ordinal."
      )
    );

    report("ok", "Valid TAP token-transfer content", lines, tail);
  }

  function validateOther(text, opName, lines) {
    var parsed = looseOp(text);
    if (!parsed) {
      lines.push(fail("Rejected: the payload is not a single JSON object."));
      report("bad", "This payload could not be read", lines);
      return;
    }
    var spec = OPS[opName];
    var missing = spec.required.filter(function (key) {
      return !Object.prototype.hasOwnProperty.call(parsed, key);
    });
    var extra = Object.keys(parsed).filter(function (key) {
      return (
        spec.required.indexOf(key) === -1 && spec.optional.indexOf(key) === -1
      );
    });

    if (missing.length === 0) {
      lines.push(pass("All required fields are present: " + spec.required.join(", ") + "."));
    } else {
      lines.push(fail("Missing required field: " + missing.join(", ") + "."));
    }
    if (extra.length) {
      lines.push(
        info(
          "Fields not recorded for this operation in the organisation's code: " +
            extra.join(", ") +
            ". They are not necessarily wrong, but this site cannot state a rule for them."
        )
      );
    }

    if (Object.prototype.hasOwnProperty.call(parsed, "tick")) {
      var raw = parsed.tick;
      if (typeof raw !== "string") {
        lines.push(fail("tick must be a JSON string."));
      } else {
        var normalized = raw.normalize("NFC").toLowerCase();
        if (tickerIsWellFormed(normalized)) {
          lines.push(
            pass(
              'Ticker "' + raw + '" normalises to "' + normalized + '" and is within the ticker limits.'
            )
          );
        } else {
          lines.push(fail("Ticker rejected: " + tickerFault(normalized) + "."));
        }
        if (normalized.length === 4) {
          lines.push(
            info(
              "This ticker is four characters long. The Bitcoin Universe Inscribe surface accepts TAP tickers of three characters or of five to thirty two characters, so a four character ticker cannot be deployed there."
            )
          );
        }
      }
    }

    if (Object.prototype.hasOwnProperty.call(parsed, "amt")) {
      try {
        var atomic = atomicAmount(parsed.amt, decimals());
        lines.push(
          pass(
            'Amount "' + parsed.amt + '" is exact at a decimal scale of ' + decimals() + ", giving " + atomic + "."
          )
        );
      } catch (e) {
        lines.push(fail("Amount rejected: " + e.message + "."));
      }
    }

    if (spec.items && Object.prototype.hasOwnProperty.call(parsed, "items")) {
      if (!Array.isArray(parsed.items) || parsed.items.length === 0) {
        lines.push(fail("items must be a non empty array."));
      } else {
        var bad = 0;
        parsed.items.forEach(function (item) {
          if (!item || typeof item !== "object") {
            bad += 1;
            return;
          }
          spec.items.forEach(function (key) {
            if (!Object.prototype.hasOwnProperty.call(item, key)) bad += 1;
          });
        });
        if (bad === 0) {
          lines.push(
            pass(
              "All " +
                parsed.items.length +
                " items carry " +
                spec.items.join(", ") +
                "."
            )
          );
        } else {
          lines.push(
            fail("At least one item is missing " + spec.items.join(", ") + ".")
          );
        }
      }
    }

    var authorityBearing =
      spec.authority === "required" ||
      (spec.authority === "optional" &&
        Object.prototype.hasOwnProperty.call(parsed, "prv"));

    if (authorityBearing) {
      lines.push(
        info(
          "This payload is authority bearing. It only takes effect when the token authority for this ticker has authorised it, and a deployment that names prv fixes which authority that is."
        )
      );
    } else if (spec.authority === "optional") {
      lines.push(
        info(
          "No prv field is present, so this payload claims no privilege authority and is an ordinary operation."
        )
      );
    }

    var tail = [detailBlock("What this operation does", spec.summary)];
    if (spec.outOfScope) {
      tail.push(
        detailBlock(
          "Scope",
          "Bitcoin Universe's TAP indexer records rows for this operation as consumed source offsets and does not normalise them into TAP assets or events. A separate service owns them."
        )
      );
    }
    tail.push(
      detailBlock(
        "How far this check goes",
        "Only token-transfer has a byte level content contract in Bitcoin Universe's code, because that is the operation the marketplace authority must prove. For every other operation this tool checks the protocol tag, the field set recorded in the organisation's own payload builders and indexer normaliser, the ticker rules and the amount grammar. It does not decide whether the operation is valid against live chain state."
      )
    );

    var state = missing.length === 0 ? "info" : "bad";
    report(
      state,
      (missing.length === 0 ? "Recognised as " : "Incomplete ") + spec.title +
        " (" + opName + ")",
      lines,
      tail
    );
  }

  function run() {
    var text = field.value;
    if (!text.trim()) {
      report("info", "Paste a TAP payload to check it", [
        info("Nothing to check yet.")
      ]);
      return;
    }

    var lines = [];
    var bytes = utf8Length(text);
    lines.push(info("Payload size: " + bytes + " UTF-8 bytes."));

    if (text.charCodeAt(0) === 0xfeff) {
      lines.push(
        fail(
          "Rejected: the content starts with a byte order mark. TAP transfer content may not carry one."
        )
      );
      report("bad", "This payload cannot be read as TAP content", lines);
      return;
    }

    var loose = looseOp(text);
    var opName = loose && typeof loose.op === "string" ? loose.op : null;
    var tag = loose && typeof loose.p === "string" ? loose.p : null;

    if (loose && tag !== null && tag !== "tap") {
      lines.push(
        fail(
          'Rejected: the protocol tag p is "' +
            tag +
            '". TAP payloads must carry p exactly equal to "tap".'
        )
      );
      report("bad", "This is not a TAP payload", lines, [
        detailBlock(
          "Close relatives",
          'A payload tagged "brc-20" belongs to BRC-20 and one tagged "tap-doge-market" belongs to the Dogecoin variant of TAP. Neither is indexed by the Bitcoin TAP indexer.'
        )
      ]);
      return;
    }

    if (opName === null) {
      lines.push(
        info(
          "No readable op field, so the strict token-transfer contract is applied to report the exact fault."
        )
      );
      validateTransfer(text, lines);
      return;
    }

    lines.push(pass('Operation identified from the op field: "' + opName + '".'));

    if (opName === "token-transfer") {
      validateTransfer(text, lines);
      return;
    }

    if (Object.prototype.hasOwnProperty.call(OPS, opName)) {
      validateOther(text, opName, lines);
      return;
    }

    lines.push(
      fail(
        'The operation "' +
          opName +
          '" is not one this site documents, and it is not one that Bitcoin Universe\'s TAP indexer normalises.'
      )
    );
    report("bad", "Unrecognised TAP operation", lines, [
      detailBlock(
        "Documented operations",
        "token-transfer, token-deploy, token-mint, token-send, dmt-deploy and dmt-mint. The wider TAP operation set is defined upstream in the Trac ecosystem, and this site does not restate rules it cannot check against the organisation's own code."
      )
    ]);
  }

  var form = document.getElementById("validator");
  if (!form || !field || !out) return;
  form.hidden = false;
  var fallback = document.getElementById("validator-fallback");
  if (fallback) fallback.hidden = true;

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    run();
  });

  var clear = document.getElementById("clear");
  if (clear) {
    clear.addEventListener("click", function () {
      field.value = "";
      report("info", "Paste a TAP payload to check it", [
        info("Cleared. Nothing was kept.")
      ]);
      field.focus();
    });
  }

  Array.prototype.forEach.call(
    document.querySelectorAll("[data-sample]"),
    function (button) {
      button.addEventListener("click", function () {
        field.value = button.getAttribute("data-sample");
        if (button.hasAttribute("data-decimals")) {
          decInput.value = button.getAttribute("data-decimals");
        }
        if (button.hasAttribute("data-number")) {
          numInput.value = button.getAttribute("data-number");
        }
        run();
      });
    }
  );

  report("info", "Paste a TAP payload to check it", [
    info("The check runs entirely in this page.")
  ]);
})();
