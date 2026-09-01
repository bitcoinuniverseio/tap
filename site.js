/* Progressive enhancement for the TAP documentation site.
   Theme toggle plus a build-free client-side search over search-index.json.
   Nothing on this site sends anything anywhere. */
(function () {
  "use strict";

  var root = document.documentElement;
  root.classList.add("js");

  /* ---------- theme ---------- */

  var STORE = "tap-docs-theme";

  function stored() {
    try {
      return window.localStorage.getItem(STORE);
    } catch (e) {
      return null;
    }
  }

  function persist(value) {
    try {
      window.localStorage.setItem(STORE, value);
    } catch (e) {
      /* private mode or blocked storage: the toggle still works for this page */
    }
  }

  function systemTheme() {
    return window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  function activeTheme() {
    return root.getAttribute("data-theme") || systemTheme();
  }

  function applyTheme(value) {
    root.setAttribute("data-theme", value);
    var btn = document.getElementById("theme-toggle");
    if (btn) {
      btn.setAttribute("aria-pressed", value === "dark" ? "true" : "false");
      btn.textContent = value === "dark" ? "Light" : "Dark";
      btn.setAttribute(
        "aria-label",
        "Switch to the " + (value === "dark" ? "light" : "dark") + " theme"
      );
    }
  }

  var saved = stored();
  if (saved === "dark" || saved === "light") {
    root.setAttribute("data-theme", saved);
  }

  var toggle = document.getElementById("theme-toggle");
  if (toggle) {
    toggle.hidden = false;
    applyTheme(activeTheme());
    toggle.addEventListener("click", function () {
      var next = activeTheme() === "dark" ? "light" : "dark";
      applyTheme(next);
      persist(next);
    });
  }

  /* ---------- heading anchors ---------- */

  var headings = document.querySelectorAll(".doc h2[id], .doc h3[id]");
  Array.prototype.forEach.call(headings, function (h) {
    var a = document.createElement("a");
    a.className = "anchor";
    a.href = "#" + h.id;
    a.textContent = "#";
    a.setAttribute("aria-label", "Link to this section");
    h.appendChild(a);
  });

  /* ---------- search ---------- */

  var input = document.getElementById("site-search");
  var list = document.getElementById("site-search-results");
  if (!input || !list) return;

  var form = input.closest("form");
  if (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
    });
  }
  input.hidden = false;
  if (input.parentNode && input.parentNode.classList.contains("searchbox")) {
    input.parentNode.hidden = false;
  }

  var records = null;
  var loading = false;
  var failed = false;
  var base = input.getAttribute("data-base") || "";

  function load() {
    if (records || loading || failed) return;
    loading = true;
    var request = new XMLHttpRequest();
    request.open("GET", base + "search-index.json", true);
    request.onload = function () {
      loading = false;
      if (request.status >= 200 && request.status < 300) {
        try {
          var parsed = JSON.parse(request.responseText);
          records = parsed && parsed.records ? parsed.records : [];
        } catch (e) {
          failed = true;
        }
      } else {
        failed = true;
      }
      render(input.value);
    };
    request.onerror = function () {
      loading = false;
      failed = true;
      render(input.value);
    };
    request.send();
  }

  function fold(value) {
    return String(value)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "");
  }

  function score(record, terms) {
    var title = fold(record.title);
    var page = fold(record.page);
    var body = fold(record.text);
    var aliases = fold((record.aliases || []).join(" "));
    var total = 0;
    for (var i = 0; i < terms.length; i += 1) {
      var term = terms[i];
      var hit = 0;
      if (title.indexOf(term) === 0) hit += 12;
      else if (title.indexOf(term) > -1) hit += 8;
      if (aliases.indexOf(term) > -1) hit += 6;
      if (page.indexOf(term) > -1) hit += 3;
      if (body.indexOf(term) > -1) hit += 2;
      if (hit === 0) return 0;
      total += hit;
    }
    return total;
  }

  function clip(text, terms) {
    var folded = fold(text);
    var at = -1;
    for (var i = 0; i < terms.length && at < 0; i += 1) {
      at = folded.indexOf(terms[i]);
    }
    if (at < 0) at = 0;
    var start = Math.max(0, at - 42);
    var slice = text.slice(start, start + 160).trim();
    return (start > 0 ? "..." : "") + slice + (start + 160 < text.length ? "..." : "");
  }

  function message(text) {
    list.innerHTML = "";
    var li = document.createElement("li");
    li.className = "note";
    li.textContent = text;
    list.appendChild(li);
  }

  function render(raw) {
    var query = raw.trim();
    if (query.length < 2) {
      list.innerHTML = "";
      return;
    }
    if (failed) {
      message("The search index could not be loaded. Use the page navigation instead.");
      return;
    }
    if (!records) {
      message("Loading the search index.");
      return;
    }
    var terms = fold(query).split(/\s+/).filter(Boolean);
    var hits = [];
    for (var i = 0; i < records.length; i += 1) {
      var value = score(records[i], terms);
      if (value > 0) hits.push({ record: records[i], value: value });
    }
    hits.sort(function (a, b) {
      return b.value - a.value;
    });
    hits = hits.slice(0, 12);

    if (hits.length === 0) {
      message(
        'Nothing matches "' +
          query +
          '". Try an operation name such as token-transfer, a field name such as tick or prv, or a term such as authority, reorg, or transferable.'
      );
      return;
    }

    list.innerHTML = "";
    hits.forEach(function (hit) {
      var li = document.createElement("li");
      var a = document.createElement("a");
      a.href = base + hit.record.url;
      var b = document.createElement("b");
      b.textContent = hit.record.title;
      var span = document.createElement("span");
      span.textContent = hit.record.page + " . " + clip(hit.record.text, terms);
      a.appendChild(b);
      a.appendChild(span);
      li.appendChild(a);
      list.appendChild(li);
    });
  }

  input.addEventListener("focus", load);
  input.addEventListener("input", function () {
    load();
    render(input.value);
  });

  input.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      input.value = "";
      list.innerHTML = "";
      input.blur();
    }
    if (event.key === "ArrowDown") {
      var first = list.querySelector("a");
      if (first) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  list.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      list.innerHTML = "";
      input.focus();
    }
  });

  document.addEventListener("click", function (event) {
    if (!list.contains(event.target) && event.target !== input) {
      list.innerHTML = "";
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key !== "/" || event.ctrlKey || event.metaKey || event.altKey) return;
    var el = document.activeElement;
    var tag = el ? el.tagName : "";
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
    if (el && el.isContentEditable) return;
    event.preventDefault();
    input.focus();
    input.select();
  });
})();
