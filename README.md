### w-email (withEmail)

[see Demo for more](https://arturmamedov.github.io/w-email/)


Send Email's trough API

**Dependency-free:** `js/w-email.js` is now plain vanilla JavaScript — it has **no third-party JS dependencies** (jQuery is no longer required). It uses only standard browser APIs (`querySelectorAll`/`addEventListener`, `dataset`, `classList`, `FormData`/`URLSearchParams`, `fetch`). The request it sends to `helpers/form_request.php` is unchanged (same `$_POST` keys/values, including the nested `_form[extra][telephone]` / `_form[extra][message]` structure).

`withAlert`, `clog`, `ga`, `gtag` and `fbq` remain **optional** globals (all `typeof`-guarded); the widget works with or without them. When Bootstrap/withFront are not present, drop in `css/w-email-fallback.css` for the minimal styling the widget's `.w-error` / `.w-success` / `.has-error` / `.help-block` classes need.

Date fields can be plain `<input type="date">` (as in the demo): the widget reformats their `YYYY-MM-DD` value to the API's `dd/mm/YYYY` on submit, so no date-picker library is needed.

> The demo **page** (`index.html`) still ships jQuery via the `withfront` bundle for its Bootstrap/FontAwesome theme, but that is a demo concern — the **widget** itself is jQuery-free.

Field | Input name="" | data-w-email="" | Default 
------|---------------|-----------------|---------
Firstname| first_name | first_name | 
Lastname| last_name | last_name | 
Email | email | email | 
Telephone | _form[extra][telephone] | telephone |
Num. Adults | adults | adults |
Num. Children | children | children |
Children age | children_age | children_age |
Checkin | checkin | checkin | 
Checkout | checkout | checkout | 
Message | _form[extra][message] | message
Accommodation | _form[extra][accomodation] | - |
Room | _form[extra][room] | - |
Utm Referral | _form[extra][utm_referral] | utm_referral |
Config of email template | _email[extra][template] | template | 
Locale | lang_code | lang_code | request locale 
Type | type_id | type_id | none
