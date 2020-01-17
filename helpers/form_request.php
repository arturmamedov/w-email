<?php
$root = dirname(__DIR__);
$ds = DIRECTORY_SEPARATOR;

require_once 'api'.$ds.'api.php';
require_once $root.$ds.'config'.$ds.'config.php';

//$id = rawurlencode($_POST['id']);
// locale of request
$locale = isset($_POST['locale']) ? $_POST['locale'] : false;
if (!$locale && isset($_POST['lang_code'])) {
    $locale = $_POST['lang_code'];
} elseif (!$locale) {
    $locale = 'it';
}

// endpoint for submit form
$endpoint = "/v01/email/form/submit";
$method = 'POST';

// array with params to send
$params = [ 'locale' => $locale ];

$w_api = new wApi('Bearer', $wEmailConfig['api_access_token'], $wEmailConfig['tenant']);
$w_api->host = $wEmailConfig['api_host'];
# 2 - Make call
$json_response = $w_api->http($endpoint, 'POST', $_POST, $params);

if ($json_response === false) {
    $json_response = json_encode([ 'success' => false, 'message' => 'API ERROR (C)', $w_api->lastAPICall() ]);
}

header('Content-Type: application/json');
echo $json_response;
