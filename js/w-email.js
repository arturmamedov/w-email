/**
 * wEmail v0.x (withEmail) - Send emails trough API
 * https://documenter.getpostman.com/view/2926391/SWTG7wD8
 * inpired by: https://github.com/arturmamedov/withFront/js/form/w-ajaxsend.js
 *
 * .w-email (class to add on form)
 * data-ga-send-pageview="/email-form-contatti" (data-api for define Google Analytics Event, not set it: for disable)
 * data-gaq-track-pageview="/email-form-contatti" // for use the old version of Google Analytics
 *
 *
 * method: same as form method="POST"
 * url: same as form action=""
 * data: all form fields serialized as application/x-www-form-urlencoded
 * dataType: json
 *
 * success expect: {
 *      success: true/false,
 *      message: 'string', // for show an alert with this message
 *      errors: array/object, // with index like the name of input that have error
 *      string_error: 'all errors in one string', // for show in <div class="errors"></div>
 * }
 *
 * @dependencies none (vanilla JS)[, w-alert(optional)], [font-awesome(opt)]]
 *
 * This widget is dependency-free: it uses only standard browser APIs
 * (querySelectorAll/addEventListener, dataset, classList, FormData/URLSearchParams,
 * fetch). withAlert, clog, ga, gtag and fbq remain optional globals and are
 * typeof-guarded before use.
 **/
(function () {
    'use strict';

    /**
     * jQuery.param() equivalent: serialize a (possibly nested) object into an
     * application/x-www-form-urlencoded string using the same "deep bracket"
     * notation jQuery produces (e.g. _form[extra][telephone]=...), with null/
     * undefined encoded as an empty value and spaces as '+'.
     */
    function param(obj) {
        var s = [];
        function add(k, v) {
            v = (v == null) ? '' : v;
            s.push(encodeURIComponent(k) + '=' + encodeURIComponent(v));
        }
        function bp(p, o) {
            if (Array.isArray(o)) {
                o.forEach(function (v, i) {
                    if (/\[\]$/.test(p)) {
                        add(p, v);
                    } else {
                        bp(p + '[' + (typeof v === 'object' && v != null ? i : '') + ']', v);
                    }
                });
            } else if (o !== null && typeof o === 'object') {
                for (var n in o) {
                    bp(p + '[' + n + ']', o[n]);
                }
            } else {
                add(p, o);
            }
        }
        for (var p in obj) {
            bp(p, obj[p]);
        }
        return s.join('&').replace(/%20/g, '+');
    }

    /**
     * jQuery(form).serialize() equivalent for the default "serialize" mode.
     * Native <input type="date"> yields YYYY-MM-DD, but the API expects the
     * Italian dd/mm/YYYY format, so checkin/checkout are reformatted while
     * serializing (a type=date input would reject a dd/mm/YYYY DOM value).
     */
    function serializeForm(form) {
        var fd = new FormData(form);
        var u = new URLSearchParams();
        fd.forEach(function (value, key) {
            if (value instanceof File) {
                return;
            }
            var v = value;
            if (key === 'checkin' || key === 'checkout') {
                v = toItalianDate(v);
            }
            // Match jQuery .serialize()'s rCRLF handling: normalize newlines to
            // CRLF so textarea bodies are sent exactly as the old widget (and a
            // native form submit) send them (\r\n), not the raw \n FormData yields.
            if (typeof v === 'string') {
                v = v.replace(/\r?\n/g, '\r\n');
            }
            u.append(key, v);
        });
        return u.toString();
    }

    /**
     * Convert a native date value (YYYY-MM-DD) into the Italian dd/mm/YYYY the
     * API expects. Values that are empty or already in dd/mm/YYYY (no '-') are
     * returned unchanged.
     */
    function toItalianDate(v) {
        if (!v || v.indexOf('-') === -1) {
            return v;
        }
        var p = v.split('-');
        return p[2] + '/' + p[1] + '/' + p[0];
    }

    /**
     * Read a single field value from within the form, or undefined if the
     * field is absent (mirrors jQuery's .find(sel).val()).
     */
    function getVal(form, selector) {
        var el = form.querySelector(selector);
        return el ? el.value : undefined;
    }

    /**
     * Get _formData ready for the API.
     *
     * @param form      the <form> element
     * @param data_type serialize (default) | name | data | custom
     * @param _callback used only for the "custom" data_type
     *
     * @return string (serialize mode) or object {
     *                  checkin: *,
     *                  checkout: *,
     *                  first_name: string,
     *                  last_name: string,
     *                  email: *
     *                  lang_code: *,
     *                  type_id: null,
     *                  adults: *,
     *                  _form: {
     *                      extra: {
     *                         telephone: *,
     *                         message: *}
     *                  },
     *              }
     */
    function getData(form, data_type, _callback) {
        switch (data_type) {
            case 'custom':
                return _callback;
            case 'name':
                return {
                    lang_code: getVal(form, 'input[name=lang_code]'),

                    checkin: toItalianDate(getVal(form, 'input[name=checkin]')),
                    checkout: toItalianDate(getVal(form, 'input[name=checkout]')),

                    email: getVal(form, 'input[name=email]'),
                    first_name: getVal(form, 'input[name=first_name]'),
                    last_name: getVal(form, 'input[name=last_name]'),

                    adults: getVal(form, '[name=adults]'),
                    // children: added below with children_age

                    type_id: null,

                    _form: {
                        extra: {
                            telephone: getVal(form, 'input[name=telephone]'),
                            message: getVal(form, '[name=message]')
                        }
                        // @todo: custom extra with a for loop on extra[whatever] input attr
                    }
                };
            case 'data':
                return {
                    lang_code: getVal(form, 'input[data-w-email="lang_code"]'),

                    checkin: toItalianDate(getVal(form, 'input[data-w-email="checkin"]')),
                    checkout: toItalianDate(getVal(form, 'input[data-w-email="checkout"]')),

                    email: getVal(form, 'input[data-w-email="email"]'),
                    first_name: getVal(form, 'input[data-w-email="first_name"]'),
                    last_name: getVal(form, 'input[data-w-email="last_name"]'),

                    adults: getVal(form, 'input[data-w-email="adults"]'),
                    // children: added below with children_age

                    type_id: null,

                    _form: {
                        extra: {
                            telephone: getVal(form, 'input[data-w-email="telephone"]'),
                            message: getVal(form, 'textarea[data-w-email="message"]')
                        }
                        // @todo: custom extra with a for loop on extra[whatever] data attr
                    }
                };
            default:
                return serializeForm(form);
        }
    }

    function handleSubmit(e) {
        e.preventDefault();

        var _Form = e.currentTarget,
            _formType = _Form.getAttribute('data-w-form-type') || 'serialize',
            _action = _Form.getAttribute('action') || '/node_modules/withemail/helpers/form_request.php',
            _method = _Form.getAttribute('method') || 'POST';

        // loader
        var submit_btn = _Form.querySelector('[type=submit]');
        var submit_btn_text = submit_btn ? submit_btn.textContent : '';
        // submit_btn.innerHTML = submit_btn_text + ' &nbsp; <i class="fa fa-spinner fa-pulse"></i>'; submit_btn.disabled = true;

        // errors: clear previous validation state page-wide (document-global, as before)
        document.querySelectorAll('input, select, textarea').forEach(function (el) {
            var parent = el.parentElement;
            if (!parent) {
                return;
            }
            parent.classList.remove('has-error');
            parent.querySelectorAll('.help-block').forEach(function (hb) {
                hb.remove();
            });
        });
        _Form.querySelectorAll('.w-error, .w-success').forEach(function (el) {
            el.style.display = 'none';
        });
        document.querySelectorAll('.w-email-alert').forEach(function (el) {
            el.remove();
        });

        // #Email API v01 - https://documenter.getpostman.com/view/2926391/RVtvqDNH
        var _formData = getData(_Form, _formType);
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
            .then(function (res) {
                if (!res.ok) {
                    throw new Error('HTTP ' + res.status);
                }
                return res.text();
            })
            .then(function (text) {
                var json;
                try {
                    json = JSON.parse(text);
                } catch (err) {
                    throw new Error('parseerror');
                }

                // loader
                if (submit_btn) {
                    submit_btn.textContent = submit_btn_text;
                    submit_btn.disabled = false;
                }

                if (json.success) {
                    // Google Analytics track
                    if (typeof ga !== "undefined" && _Form.dataset.gaSendPageview != 'off') {
                        var gaSend = (typeof _Form.dataset.gaSendPageview != 'undefined') ? _Form.dataset.gaSendPageview : '/email-form-contatti';
                        ga('send', 'pageview', gaSend);

                        if (typeof clog == 'function') {
                            clog('ga send pageview: ' + gaSend)
                        }
                    }

                    // #GA4
                    if (typeof gtag !== "undefined" && _Form.dataset.ga4SendEvent != 'off') {
                        var ga4SendEvent = (typeof _Form.dataset.ga4SendEvent != 'undefined') ? _Form.dataset.ga4SendEvent : 'form_contatti';

                        gtag('event', ga4SendEvent, {
                            value: 20,
                            currency: "EUR"
                        });

                        if (typeof clog == 'function') {
                            clog('ga4 send pageview: ' + ga4SendEvent)
                        }
                    }

                    // Facebook track (custom of this installation)
                    if (typeof fbq !== "undefined" && _Form.dataset.fbqLead != 'off') {
                        var fbqLead = (typeof _Form.dataset.fbqLead != 'undefined') ? _Form.dataset.fbqLead : 'Lead';
                        fbq('track', fbqLead);

                        if (typeof clog == 'function') {
                            clog('fbq track: ' + fbqLead);
                        }
                    }

                    // Old Google analytics _gaq _trackPageview
                    // if (typeof _gaq !== "undefined" && typeof _Form.dataset.gaqTrackPageview != 'undefined') {
                    //     _gaq.push(['_trackPageview', _Form.dataset.gaqTrackPageview]);
                    // }

                    if (json.message.length) {
                        if (typeof withAlert == 'function') {
                            withAlert(json.message, 'success');
                        } else {
                            alert(json.message);
                        }
                    }

                    var successEl = _Form.querySelector('.w-success');
                    if (successEl) {
                        successEl.style.display = 'block';
                        successEl.innerHTML = '<h3>' + json.message + '</h3><h1 class="text-center"><i class="fa fa-check fa-5x text-success"></i></h1>';
                    }
                    document.querySelectorAll('.on-target').forEach(function (el) {
                        el.style.backgroundColor = '#00E095';
                    });
                    // setTimeout(function(){
                    //   document.querySelectorAll('.on-target').forEach(function(el){ el.style.backgroundColor = 'transparent'; });
                    // }, 8000);

                    _Form.querySelectorAll('.range').forEach(function (el) {
                        el.value = '';
                    });
                } else {
                    // create general error if not set
                    if (typeof json.message == 'undefined' || json.message.length == 0) {
                        json.message = 'Errori nella form, correggi e riprova! Form errors, correct and try again!';
                    }
                    if (typeof json.string_errors == 'undefined' || json.string_errors.length == 0) {
                        json.string_errors = '';
                    }

                    // show error message
                    if (typeof withAlert == 'function') {
                        withAlert(json.message, 'danger w-email-alert', {autohide: false});
                    } else {
                        alert(json.message);
                    }

                    // show errors on form
                    if (json.errors) {
                        Object.keys(json.errors).forEach(function (err) {
                            var parents = new Set();
                            _Form.querySelectorAll('[name="' + err + '"]').forEach(function (field) {
                                if (field.parentElement) {
                                    parents.add(field.parentElement);
                                }
                            });
                            parents.forEach(function (parent) {
                                parent.classList.add('has-error');
                                parent.insertAdjacentHTML('afterend', '<span class="help-block alert alert-danger">' + json.errors[err] + '</span>');
                            });
                        });
                    }

                    // show errors on form
                    var errorEl = _Form.querySelector('.w-error');
                    if (errorEl) {
                        errorEl.style.display = 'block';
                        errorEl.innerHTML = '<h4>' + json.message + '</h4><p>' + json.string_errors + '</p>';
                    }
                }
            })
            .catch(function (e) {
                // reset submit btn text
                if (submit_btn) {
                    submit_btn.textContent = submit_btn_text;
                    submit_btn.disabled = false;
                }

                // show error message
                if (typeof withAlert == 'function') {
                    withAlert('Unexpected error! Errore inaspettato! :( ', 'danger w-email-alert', {autohide: false});
                } else {
                    alert('Unexpected error! Errore inaspettato! :( ');
                }

                // show errors on form
                _Form.querySelectorAll('.w-error').forEach(function (el) {
                    el.style.display = 'block';
                    el.innerHTML = '<h4>Unexpected error! Errore inaspettato! :( </h4>';
                });
            });

        return false;
    }

    function init() {
        // w-honey_pot.js - withHoneyPot Spam Checker https://github.com/arturmamedov/withFront/blob/master/js/form/w-honey_pot.js
        document.querySelectorAll('._the_email_confirm_group').forEach(function (el) {
            el.style.display = 'none'; // or by CSS add ( ._the_email_confirm_group { display: none !important; } )
        });
        document.querySelectorAll('._the_email_confirm_').forEach(function (el) {
            el.value = '';
        });

        document.querySelectorAll('.w-email').forEach(function (form) {
            form.addEventListener('submit', handleSubmit);
        });
    }

    if (document.readyState !== 'loading') {
        init();
    } else {
        document.addEventListener('DOMContentLoaded', init);
    }
})();
