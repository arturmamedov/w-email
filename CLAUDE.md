# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**w-email (withEmail)** is a small, drop-in contact/booking form widget: a dependency-free (vanilla JS) front-end plus a thin PHP proxy that forwards submissions to the **InCMS REST API** (`insuperadmin.buonsito.net/api`), which sends the email and stores the lead. It is published both as an npm package (`withemail`) and a Composer package, and is designed to be dropped into a host site's `node_modules/withemail/`. Defaults are Italian and hotel/camping/village-booking oriented. There is no build step and no test suite.

> **Note:** `js/w-email.js` was converted from a jQuery plugin to plain browser APIs (no third-party JS deps). The wire format sent to `form_request.php` is unchanged. The demo *page* (`index.html`) still loads jQuery via the `withfront` bundle for its Bootstrap/FontAwesome theme, but the **widget itself no longer needs jQuery**.

## Architecture — the request flow

A submission travels through four layers. Understanding this end-to-end path is the key to working here:

1. **`js/w-email.js`** — A dependency-free vanilla-JS widget (IIFE with a `DOMContentLoaded` guard). It `addEventListener`s `submit` on every `<form class="w-email">`, builds the payload via `getData()`, and does a `fetch` POST to the form's `action` (default `/node_modules/withemail/helpers/form_request.php`) with `Content-Type: application/x-www-form-urlencoded; charset=UTF-8` (critical — a string body without this header makes PHP's `$_POST` empty). It expects a JSON response of the shape `{ success, message, errors, string_errors }` and renders it into `.w-success` / `.w-error` blocks (and `withAlert()` if present, else native `alert()`).

2. **`helpers/form_request.php`** — The server-side proxy endpoint the browser actually hits. It resolves the locale (`locale` → `lang_code` → `'it'`), instantiates `wApi`, and forwards the **entire `$_POST`** to the fixed InCMS endpoint `POST /v01/email/form/submit`. It echoes the API's JSON straight back to the browser. This file is the only server entry point.

3. **`helpers/api/api.php`** — The `wApi` class: a self-contained cURL REST client (vendored copy of the Composer package `arturmamedov/w-api`). It sets the auth/tenant/locale headers: `Authorization: Bearer <token>`, `Accept: application/json`, `X-Requested-With: XMLHttpRequest`, `X-Lang`, `X-Tenant`. Note this class is **bundled directly** — `form_request.php` `require`s it by path and does *not* use Composer autoload, so the widget runs without `composer install`.

4. **`config/config.php`** — Defines `$wEmailConfig` (`api_host`, `api_access_token`, `tenant`). Copy from `config.example.php` and fill in `api_access_token`. This file is listed in `.gitignore` (line 2) for real deployments, though a placeholder copy is committed in this repo.

`index.html` is the GitHub Pages demo (a complete example form + a Postman-style API reference table). `css/style.css` is compiled-from-SASS theme styling for that demo form only — it is not required for the widget to function.

## Configuration

`config/autoconfig.php` is an **incomplete/unused** auto-configurator intended to pull `api_access_token` from a host CakePHP/Laravel app (via `WE_API_ACCESS_TOKEN` constant, `env()`, or `config()`). `form_request.php` currently requires `config.php` directly, **not** `autoconfig.php` — so editing `autoconfig.php` alone has no effect on the running flow.

## How the front-end collects data (`getData()`)

The `data-w-form-type` attribute on the form selects one of four payload-building strategies in `getData()`:

- `serialize` (**default**) — `serializeForm()` (a `FormData` → `URLSearchParams` equivalent of jQuery's `.serialize()`), i.e. submits raw input `name=""` values as-is. `checkin`/`checkout` are reformatted from the native `<input type="date">` `YYYY-MM-DD` to the API's `dd/mm/YYYY`, and textarea newlines are normalized to CRLF to match the old jQuery `.serialize()`.
- `name` — reads specific fields by `input[name=...]` and reshapes into the API's nested structure (`_form[extra][telephone]`, `_form[extra][message]`, etc.), serialized with `param()` (a `jQuery.param()` equivalent that emits deep-bracket keys and encodes `null` → empty).
- `data` — same reshaping but reads fields by their `data-w-email="..."` attribute instead of `name`.
- `custom` — returns a passed-in callback verbatim.

Because `serialize` is the default, the HTML `name` attributes must match the API contract directly (see the field map in `README.md` and the API table in `index.html`), e.g. `_form[extra][message]`, `_form[extra][telephone]`, `lang_code`, `type_id`. The `name`/`data` modes have **commented-out, unfinished** `children_age` handling (marked `@todo`).

## Conventions & gotchas

- **Analytics fire only on `json.success`.** Three trackers are auto-called if their globals exist: GA (`ga send pageview`), **GA4** (`gtag('event', …)`), and Facebook Pixel (`fbq('track','Lead')`). Each is configurable/disable-able per-form via data attributes read as `form.dataset.*`: `data-ga-send-pageview`, `data-ga4-send-event`, `data-fbq-lead` — set the value to `'off'` to disable, or to a custom string to override the default event/pageview name.
- **Honeypot spam trap:** the `._the_email_confirm_group` wrapper is hidden and `._the_email_confirm_` is emptied on load; a real (non-bot) submit therefore sends it blank.
- The InCMS API host is **hardcoded** in `config.php` (`insuperadmin.buonsito.net/api`) and the submit endpoint (`/v01/email/form/submit`) is hardcoded in `form_request.php`.

## Commands

There is no build, lint, or test tooling — `npm test` is a stub that intentionally errors.

```bash
npm install          # pulls the `withfront` peer bundle (jQuery, Bootstrap, FontAwesome, datepicker, js-cookie, nicescroll) into node_modules
composer install     # optional; installs arturmamedov/w-api — NOT required since api.php is vendored in helpers/api/
```

The widget has no dev server; open `index.html` against a host that also serves the `node_modules/withfront/dist/*` assets it links, and point a real PHP host at `helpers/form_request.php` to exercise the full round-trip. Versioning: bump `version` in `package.json` (and re-tag) for npm releases.

## Runtime dependencies (loaded by the host page, not bundled here)

The **widget itself has no runtime JS dependencies** — it uses only standard browser APIs (`querySelectorAll`/`addEventListener`, `dataset`, `classList`, `FormData`/`URLSearchParams`, `fetch`). `withAlert` and `clog` (from `withfront`) and the analytics globals (`ga`, `gtag`, `fbq`) remain **optional**: every use is `typeof`-guarded, so the code degrades gracefully to native `alert()` / no-op logging / no tracking when they are absent.

For a host that drops in the widget without Bootstrap, `css/w-email-fallback.css` supplies the minimal baseline styling the widget's feedback classes need (honeypot hidden; `.w-error`/`.w-success` hidden **without** `!important` so the JS can reveal them via an inline `display:block`; `.has-error`/`.help-block` styling). The demo *page* still loads the full **`withfront`** dist bundle (which includes jQuery, Bootstrap, FontAwesome) for its theme — that is a demo concern, not a widget requirement.
