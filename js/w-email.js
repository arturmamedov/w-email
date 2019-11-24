/**
 * wEmail (withEmail) - Send emails trough API
 * https://documenter.getpostman.com/view/2926391/RVu7D833
 *
 * .w-email (class to add on form)
 * data-ga-send-pageview="/email-form-contatti" (data-api for define Google Analytics Event, not set it: for disable)
 * data-gaq-track-pageview="/email-form-contatti" // for use the old version of Google Analytics
 *
 *
 * method: same as form method="POST"
 * url: same as form action=""
 * data: all form fields with jQuery.serialize()
 * dataType: json
 *
 * success expect: {
 *      success: true/false,
 *      message: 'string', // for show an alert with this message
 *      errors: array/object, // with index like the name of input that have error
 *      string_error: 'all errors in one string', // for show in <div class="errors"></div>
 * }
 *
 * @dependencies jquery[, w-alert(optional)], [font-awesome(opt)]]
 **/
$(function () {
    $(".w-email").submit(function (e) {
        e.preventDefault();

        var _Form = $(this),
            _formType = _Form.attr('data-w-form-type') || 'serialize',
            _action = _Form.attr('action') || 'helpers/form_request.php',
            _method = _Form.attr('method') || 'POST';


        // loader
        var submit_btn = _Form.find('[type=submit]');
        var submit_btn_text = submit_btn.text();
        // submit_btn.html(submit_btn_text + ' &nbsp; <i class="fa fa-spinner fa-pulse"></i>').prop('disabled', true);
        // errors
        $('input, select, textarea').parent().removeClass('has-error').find('.help-block').remove();
        _Form.find('.w-error, .w-success').hide();

        // #Email API v01 - https://documenter.getpostman.com/view/2926391/RVtvqDNH
        var _formData = getData(_Form, _formType);

        $.ajax({
            method: _method,
            url: _action,
            data: _formData,
            dataType: "json",
            success: function (json) {
                // loader
                submit_btn.text(submit_btn_text).prop('disabled', false);

                if (json.success) {
                    // Google Analytics track
                    if (typeof ga !== "undefined" && typeof _Form.data('gaSendPageview') != 'undefined') {
                        ga('send', 'pageview', _Form.data('gaSendPageview'));
                    }
                    if (typeof _gaq !== "undefined" && typeof _Form.data('gaqTrackPageview') != 'undefined') {
                        _gaq.push(['_trackPageview', _Form.data('gaqTrackPageview')]);
                    }

                    if (json.message.length) {
                        if (typeof withAlert == 'function') {
                            withAlert(json.message, 'success');
                        } else {
                            alert(json.message);
                        }
                    }

                    _Form.find('.w-success').show().html('<h3>' + json.message + '</h3><h1 class="text-center"><i class="fa fa-check fa-5x text-success"></i></h1>', 1500);
                    $('.on-target').css('background-color', '#00E095');
                    // setTimeout(function(){
                    //   $('.on-target').css('background-color', 'transparent');
                    // }, 8000);

                    _Form.find(".range").val('');
                    wCookies().remove('date_in');
                    wCookies().remove('date_out');
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
                        withAlert(json.message, 'danger', {autohide: false});
                    } else {
                        alert(json.message);
                    }

                    // show errors on form
                    for (err in json.errors) {
                        _Form.find('[name="' + err + '"]').parent()
                            .after('<span class="help-block alert alert-danger">' + json.errors[err] + '</span>')
                            .addClass('has-error');
                    }

                    // show errors on form
                    _Form.find('.w-error').show();
                    _Form.find('.w-error').html('<h4>' + json.message + '</h4><p>' + json.string_errors + '</p>', 1500);
                }
            },
            error: function (e) {
                // reset submit btn text
                submit_btn.text(submit_btn_text).prop('disabled', false);

                // show error message
                if (typeof withAlert == 'function') {
                    withAlert('Unexpected error! Errore inaspettato! :( ', 'danger', {autohide: false});
                } else {
                    alert('Unexpected error! Errore inaspettato! :( ');
                }

                // show errors on form
                $('.w-error', _Form).show();
                $('.w-error', _Form).html('<h4>Unexpected error! Errore inaspettato! :( </h4>', 1500);
            }
        });

        return false;
    });


    /**
     * Get _formData object with all key: values ready for API
     *
     * @param _Form
     * @param data_type
     * @param _callback
     *
     * @return object {
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
    function getData(_Form, data_type, _callback) {
        switch (data_type) {
            case 'custom':
                return _callback;
                break;
            case 'name':
                var _formData = {
                    // _email: {
                    //     // to_email: _Form.find('input[name=email]').val(),
                    //     // to_name: _Form.find('input[name=nome]').val() + ' ' + _Form.find('input[name=cognome]').val(),
                    //     // to_subject: true,
                    //     // extra: {
                    //     //     template: 'forms.simple_html.campingenatura',
                    //     // },
                    // },
                    lang_code: _Form.find('input[name=lang_code]').val(),

                    checkin: _Form.find('input[name=checkin]').val(),
                    checkout: _Form.find('input[name=checkout]').val(),

                    email: _Form.find('input[name=email]').val(),
                    first_name: _Form.find('input[name=first_name]').val(),
                    last_name: _Form.find('input[name=last_name]').val(),

                    adults: _Form.find('[name=adults]').val(),
                    // children: added below with children_age

                    type_id: null,

                    _form: {
                        extra: {
                            telephone: _Form.find('input[name=telephone]').val(),
                            message: _Form.find('[name=message]').val(),
                        }
                        // @todo: custom extra with a for loop on extra[whatever] input attr
                    }
                };

                /*var children_age = _Form.find('input[name="children_age[]"]');
                if (children_age.length) {
                    var age = [];
                    children_age.each(function () {
                        if ($(this).val().length) {
                            age.push($(this).val());
                        }
                    });
                    _formData.children = age.length;
                    _formData.children_age = _formData + '&' + age.toString();
                }*/
                break;
            case 'data':
                var _formData = {
                    // _email: {
                    //     // to_email: _Form.find('input[name=email]').val(),
                    //     // to_name: _Form.find('input[name=nome]').val() + ' ' + _Form.find('input[name=cognome]').val(),
                    //     // to_subject: true,
                    //     // extra: {
                    //     //     template: 'forms.simple_html.campingenatura',
                    //     // },
                    // },
                    lang_code: _Form.find('input[data-w-email="lang_code"]').val(),

                    checkin: _Form.find('input[data-w-email="checkin"]').val(),
                    checkout: _Form.find('input[data-w-email="checkout"]').val(),

                    email: _Form.find('input[data-w-email="email"]').val(),
                    first_name: _Form.find('input[data-w-email="first_name"]').val(),
                    last_name: _Form.find('input[data-w-email="last_name"]').val(),

                    adults: _Form.find('input[data-w-email="adults"]').val(),
                    // children: added below with children_age

                    type_id: null,

                    _form: {
                        extra: {
                            telephone: _Form.find('input[data-w-email="telephone"]').val(),
                            message: _Form.find('textarea[data-w-email="message"]').val(),
                        }
                        // @todo: custom extra with a for loop on extra[whatever] data attr
                    }
                };

                /*var children_age = _Form.find('input[name="children_age[]"]');
                if (children_age.length) {
                    var age = [];
                    children_age.each(function () {
                        if ($(this).val().length) {
                            age.push($(this).val());
                        }
                    });
                    _formData.children = age.length;
                    _formData.children_age = _formData + '&' + age.toString();
                }*/
                break;
            default:
                var _formData = _Form.serialize();
        }

        return _formData;
    }
});
