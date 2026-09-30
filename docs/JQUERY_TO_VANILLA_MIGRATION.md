# Fresh-session prompt — convert w-email from jQuery to vanilla JS

Copy everything inside the fenced block below into a **new** Claude Code session
opened on this repo. It is self-contained; it does not depend on the
conversation that produced it. The gotchas and reference snippets in it were
verified against jQuery 3.x behaviour before being written down.

---

````text
TASK: Convert the w-email widget from jQuery to dependency-free vanilla JavaScript.

## Context (read before touching anything)

w-email (withEmail) is a drop-in contact/booking-form widget. A `<form class="w-email">`
is intercepted on submit; its fields are POSTed to a PHP proxy
(`helpers/form_request.php`) which forwards the whole `$_POST` to the InCMS REST API
(`POST /v01/email/form/submit`) and echoes the JSON `{ success, message, errors,
string_errors }` back. The browser renders that into `.w-success` / `.w-error` blocks.

The ONLY file to convert is `js/w-email.js` (~289 lines, a jQuery plugin bound in
`$(function(){…})`). jQuery is its single hard runtime dependency. `withAlert`, `clog`,
`ga`, `gtag`, `fbq` are ALL already `typeof`-guarded and optional — LEAVE those guards
exactly as they are (do NOT convert or remove them; the host may still provide them).

Read `CLAUDE.md` for the architecture and `js/w-email.js` in full before editing.

## Goal

Rewrite `js/w-email.js` to use only standard browser APIs (querySelectorAll /
addEventListener, dataset, classList, textContent / innerHTML, FormData /
URLSearchParams, fetch) with ZERO third-party JS runtime dependencies — while keeping
the HTTP request that reaches `helpers/form_request.php` SEMANTICALLY IDENTICAL: the
same `$_POST` keys and values, including the nested `_form[extra][telephone]` /
`_form[extra][message]` structure produced by the `name` / `data` form types.

Also in scope:
- Switch the demo date fields (`index.html` checkin/checkout) to native `<input type="date">`.
- Add framework-free fallback CSS for the widget's status UI (a file
  `css/w-email-fallback.css` already exists in the repo — reuse it; just link it).

## Branch & delivery

Develop on branch `claude/festive-carson-vvnag3` (create from latest `master` if it
does not exist). Commit with clear messages and push with `git push -u origin claude/festive-carson-vvnag3`.
Do NOT open a pull request unless explicitly asked.

## Wire-contract truth (why byte-for-byte parity is NOT required)

`form_request.php` reads the body into PHP `$_POST` (via `parse_str`), then `wApi`
re-encodes it before forwarding to InCMS. So browser→PHP byte differences (e.g.
`URLSearchParams` percent-encoding `! ' ( ) ~` that jQuery leaves literal) are washed
out. What the InCMS contract actually requires is SEMANTIC `$_POST` parity — same keys,
same decoded values, same nesting. Aim for that, not for identical bytes.

## The traps that WILL break a naive 1:1 port (each verified — do not skip)

1. **fetch Content-Type (CRITICAL).** `fetch(url,{body: someString})` sends
   `text/plain` (or no) Content-Type, so PHP `$_POST` arrives EMPTY and the whole
   submission is silently lost. You MUST set
   `'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'`. Pass the body
   as a pre-built STRING — do NOT pass a `URLSearchParams` object as the body (it
   overrides your header and re-encodes).

2. **`.show()` → `display:'block'`, NOT `''` (HIGH).** `.w-error`/`.w-success` are
   `display:none` by default (see `css/style.css` lines 7-9 and the new fallback CSS).
   jQuery `.show()` forces `display:block`. Setting `el.style.display = ''` only clears
   inline style and falls back to the stylesheet's `display:none`, so the panel STAYS
   HIDDEN. Use `el.style.display = 'block'`. Also: if a `display:none !important`
   utility class (e.g. withfront's `display-none`) sits on those divs, remove it.

3. **Multi-form binding + selector scope (HIGH).** `$('.w-email').submit(fn)` binds
   EVERY matching form; `querySelector('.w-email')` binds only the first. Use
   `document.querySelectorAll('.w-email').forEach(f => f.addEventListener('submit', handler))`
   with a **function expression** (so `this` / `e.currentTarget` is the form; an arrow
   function breaks it). Preserve each selector's ORIGINAL scope verbatim — do not
   "tidy" it:
     - **document-global** (page-wide): honeypot init (`._the_email_confirm_group`,
       `._the_email_confirm_`, lines 27-28); the has-error/help-block clear
       `$('input, select, textarea')` (line 44); `$('.w-email-alert')` (line 46);
       `$('.on-target')` (line 109).
     - **form-scoped**: `.w-error`/`.w-success` hide (line 45); the error-insertion
       loop (lines 132-136); `.w-error` show/fill (139/140/155/156); `.w-success`
       (108); `.range` reset (114); every `getData` field read.
   (Note: an earlier automated audit wrongly called line 44 form-scoped — it is
   document-global. Trust this list.)

4. **Nested object serialization (HIGH).** `getData` in the `name` and `data` modes
   returns a NESTED object `{ _form:{ extra:{ telephone, message } }, type_id:null, … }`.
   jQuery's `$.ajax` runs it through `$.param` (deep bracket notation →
   `_form%5Bextra%5D%5Btelephone%5D=…`, and `null` → empty `key=`). `URLSearchParams`
   canNOT flatten this (it emits `_form=[object Object]`); `JSON.stringify` produces a
   body PHP can't read. Use the `param()` helper below.

5. **Native date inputs → `dd/mm/YYYY` reformat (HIGH, conditional).** The API expects
   Italian `dd/mm/YYYY` (see the reference table in `index.html`). Native
   `<input type="date">` submits ISO `YYYY-MM-DD`. Without reformatting, InCMS
   mis-parses the date. Add `toItalianDate()` (below) and apply it to checkin/checkout
   in ALL THREE getData branches. In the default `serialize` branch you CANNOT fix it
   by setting the DOM value (a `type=date` input rejects a `25/08/2019` string and
   silently clears) — remap during serialization instead (see `serializeForm` note).

6. **fetch success/error routing + smaller traps (MEDIUM/LOW).**
     - jQuery (`dataType:'json'`) routes non-2xx AND JSON-parse failures to `error()`;
       fetch resolves on any status and doesn't auto-parse. Reproduce with
       `if(!res.ok) throw` then `res.text()` + `try{JSON.parse}catch{throw}` so all
       three (network / non-2xx / parse) land in one `.catch` == jQuery's `error:`.
       (The PHP always returns HTTP 200 + JSON, so in practice `success:` runs and the
       inner `if (json.success){…}else{…}` does the real split — keep that intact,
       incl. GA/GA4/fbq staying INSIDE the `json.success` branch.)
     - DOM-ready: use `if (document.readyState !== 'loading') init(); else
       document.addEventListener('DOMContentLoaded', init);` — a bare listener never
       fires if the script loads after DOMContentLoaded.
     - Attributes: read `form.getAttribute('action'|'method'|'data-w-form-type')`, NOT
       `form.action`/`form.method` (DOM props return a resolved URL / default 'get',
       defeating the `|| default` fallbacks). Set `btn.disabled = true/false` (property),
       never `setAttribute('disabled', false)`. Null-guard the submit button
       (`querySelector('[type=submit]')` may be null → guard before `.textContent`).
     - `.data('gaSendPageview')` → `el.dataset.gaSendPageview` (auto camelCase from
       `data-ga-send-pageview`). Safe 1:1 for the `!= 'off'` / `typeof != 'undefined'`
       sentinels; keep those comparisons byte-for-byte.
     - `.parent()` dedups: the error loop inserts one span per unique PARENT wrapper and
       adds `has-error` to the PARENT (jQuery `.after()` returns the parent set). For a
       name that matches several controls (radio group), collect unique
       `parentElement`s in a `Set` so you don't insert duplicate spans.
     - `.html(str, 1500)` — the `1500` 2nd arg is silently ignored by jQuery (dead
       no-op). Just `el.innerHTML = str`; drop the `1500`.
     - Dead/commented code to leave out: the commented loader on line 42, the `_gaq`
       block (95-98), the `.on-target` reset setTimeout (110-112), and the two
       commented `children_age` @todo blocks (225-235 / 270-280).

## Reference implementations (verified — use these)

```js
// jQuery $.param() equivalent (default / non-traditional). Serializes the nested
// objects returned by getData() in the name/data modes into deep bracket notation.
function param(obj) {
  var s = [];
  function add(key, value) {
    value = (value == null) ? '' : value;                 // null/undefined -> ''
    s.push(encodeURIComponent(key) + '=' + encodeURIComponent(value));
  }
  function buildParams(prefix, o) {
    if (Array.isArray(o)) {
      o.forEach(function (v, i) {
        if (/\[\]$/.test(prefix)) add(prefix, v);
        else buildParams(prefix + '[' + (typeof v === 'object' && v != null ? i : '') + ']', v);
      });
    } else if (o !== null && typeof o === 'object') {
      for (var name in o) buildParams(prefix + '[' + name + ']', o[name]);
    } else {
      add(prefix, o);
    }
  }
  for (var prefix in obj) buildParams(prefix, obj[prefix]);
  return s.join('&').replace(/%20/g, '+');
}
// param({_form:{extra:{telephone:'+39',message:'a\nb'}}, type_id:null})
//   -> type_id=&_form%5Bextra%5D%5Btelephone%5D=%2B39&_form%5Bextra%5D%5Bmessage%5D=a%0Ab
```

```js
// _Form.serialize() equivalent for the default mode. FormData walks form.elements
// (matches jQuery's scope, incl. inputs associated via the form= attribute).
function serializeForm(form) {
  var fd = new FormData(form);        // NOTE: no submitter arg -> submit buttons excluded
  var usp = new URLSearchParams();
  fd.forEach(function (v, k) {
    if (v instanceof File) return;    // jQuery omits file inputs; USP would emit [object File]
    usp.append(k, v);
  });
  return usp.toString();
}
// If native date inputs are used, reformat checkin/checkout DURING this iteration
// (do not mutate the DOM value): if (k==='checkin'||k==='checkout') v = toItalianDate(v);
```

```js
// Native <input type=date> value 'YYYY-MM-DD' -> API's Italian 'dd/mm/YYYY'.
// No-op on values already in dd/mm/YYYY (or empty), so safe for datepicker hosts too.
function toItalianDate(v) {
  if (!v || v.indexOf('-') === -1) return v;
  var p = v.split('-');                       // [YYYY, MM, DD]
  return p[2] + '/' + p[1] + '/' + p[0];
}
```

```js
// $.ajax(...) replacement. _formData is a STRING (serialize mode) or an OBJECT
// (name/data mode); normalize to a urlencoded string, then fetch.
var body = (typeof _formData === 'string') ? _formData : param(_formData);
fetch(_action, {
  method: _method,
  credentials: 'same-origin',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'X-Requested-With': 'XMLHttpRequest',
    'Accept': 'application/json, text/javascript, */*; q=0.01'
  },
  body: body
})
  .then(function (res) { if (!res.ok) throw new Error('HTTP ' + res.status); return res.text(); })
  .then(function (text) {
    var json;
    try { json = JSON.parse(text); } catch (e) { throw new Error('parseerror'); }
    /* ---- paste the ORIGINAL success:function(json){…} body here (unchanged) ---- */
  })
  .catch(function (e) {
    /* ---- paste the ORIGINAL error:function(e){…} body here (unchanged) ---- */
  });
```

## index.html edits

- checkin (line ~116) and checkout (line ~126): change `type="text"` → `type="date"`.
  KEEP `class="range …"` (`.range` is the widget's post-success reset hook), and keep
  `data-w-email`, `name`, `required`.
- Add in `<head>` after `css/style.css`: `<link href="/css/w-email-fallback.css" rel="stylesheet">`.
- On the `.w-error` / `.w-success` divs (lines ~243/246): drop any `display-none`
  (`!important`) utility class so the JS reveal can win. The `alert alert-*` classes can
  also be dropped once the fallback CSS styles the panels.
- The standalone jQuery CDN `<script>` (lines ~457-458) is now redundant *for the
  widget* (withfront's `libraries.min.js` still bundles jQuery for the theme). Removing
  it is safe ONLY while withfront is loaded. Do NOT remove withfront's
  `libraries.min.js`. The bootstrap-datepicker locale script (line ~465) is no longer
  needed once dates are native and may be removed.

## Scope boundary

Make the WIDGET (`js/w-email.js`) framework-free. Do NOT try to de-theme the demo
page — its Bootstrap grid / FontAwesome layout still comes from withfront, and fully
reproducing that theme is a separate, larger job. State clearly in the final report that
the widget is now jQuery-free but the demo PAGE still ships jQuery via withfront.

## Verify before you call it done (there is NO test suite)

1. Byte/semantic check of serialization: in Node or the browser console, compare the
   old jQuery output vs the new `param()` / `serializeForm()` output for: a default
   serialize form; a `name`-mode payload (assert `_form[extra][telephone]` appears
   deep-bracket-encoded and `type_id=` is empty); a message containing spaces/newlines.
2. End-to-end in a browser (Chromium + Playwright are preinstalled — do NOT run
   `playwright install`): load a page with the converted widget, submit, and inspect the
   outgoing request in the network layer. Assert: method POST, Content-Type
   `application/x-www-form-urlencoded; charset=UTF-8`, and the body carries the expected
   keys incl. the `_form[extra][…]` nesting and `dd/mm/YYYY` dates. You can point the
   form `action` at a tiny local PHP stub that `var_dump($_POST)` to confirm `$_POST` is
   populated (proves trap #1 is handled).
3. Regression checks that a single-simple-form smoke test would MISS: (a) a page with
   TWO `.w-email` forms — both must AJAX-submit and each honeypot must be hidden/reset;
   (b) an error response — confirm `.w-error` actually becomes visible (trap #2) and a
   `.help-block` appears once per field; (c) a success response — confirm `.w-success`
   shows and analytics fire only on `json.success`.
4. Confirm the file references no `$`, `jQuery`, `.ajax`, `.serialize`, `.find(`, etc.

## Deliverables

- `js/w-email.js` rewritten in vanilla JS (jQuery-free), behaviour-preserving.
- `index.html` updated (native dates, fallback CSS linked, redundant jQuery/datepicker
  includes cleaned up as noted).
- `css/w-email-fallback.css` linked (already present in the repo).
- `README.md` / `CLAUDE.md` updated to note the widget is now dependency-free and that
  jQuery is no longer a hard requirement.
- A short report of what changed and the verification results.
````

---

## Notes for whoever runs this

- `css/w-email-fallback.css` was created in the session that produced this doc, so it is
  already in the repo — the fresh session only has to link it and (optionally) tweak the
  colours.
- The migration keeps the widget's public contract (form classes, `data-*` attributes,
  the `serialize`/`name`/`data`/`custom` form types, the JSON response shape) unchanged,
  so host pages need no changes beyond dropping their jQuery dependency if they only
  loaded it for this widget.
