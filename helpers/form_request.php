<?php
$root = dirname(__DIR__);
$ds = DIRECTORY_SEPARATOR;

require_once 'api'.$ds.'api.php';
require_once $root.$ds.'config'.$ds.'autoconfig.php';

//$id = rawurlencode($_POST['id']);
$lang = (isset($_POST['lang_code'])) ? $_POST['lang_code'] : 'it';

// endpoint for submit form
$endpoint = "/v01/email/form/submit";
$method = 'POST';

// array with params to send
$params = [ 'lang' => $lang ];

$w_api = new wApi('Bearer', $wEmailConfig['api_access_token']);
$w_api->host = $wEmailConfig['api_host'];
# 2 - Make call
$json_response = $w_api->http($endpoint, 'POST', $_POST, $params);

if ($json_response === false) {
    $json_response = json_encode([ 'success' => false, 'message' => 'API ERROR (C)', $w_api->lastAPICall() ]);
}

header('Content-Type: application/json');
echo $json_response;
