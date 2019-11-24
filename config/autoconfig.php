<?php

require 'config.php';

try {
    foreach ($wEmailConfig as $key => $value) {
        // API_HOST
        if ($key == 'api_host' && empty($value)) {
            throw new Exception('Api HOST not set, please define it in `w-email/config/config.php` or in one of the following methods (constant WE_API_HOST, env(WE_API_HOST), config(we_api_host) or for all of this method with API_HOST only without WE_ prefix', 0);
        }

        // API_ACCESS_TOKEN
        if ($key == 'api_access_token' && empty($value)) {
            // try all possible auto configuration's
            if (defined('WE_API_ACCESS_TOKEN')) {
                $wEmailConfig[$key] = WE_API_ACCESS_TOKEN;
            } elseif (function_exists('env')) {
                $wEmailConfig[$key] = env('WE_API_ACCESS_TOKEN') ?: env('API_ACCESS_TOKEN');
            } elseif (function_exists('config')) {
                $wEmailConfig[$key] = config('we_api_access_token') ?: config('api_access_token');
            } elseif (defined('API_ACCESS_TOKEN')) {
                $wEmailConfig[$key] = API_ACCESS_TOKEN;
            } else {
                throw new Exception('Access Token For w-email aren\'t configured, please define it in `w-email/config/config.php` or in one of the following methods (constant WE_API_ACCESS_TOKEN, env(WE_API_ACCESS_TOKEN), config(we_api_access_token) or for all of this method with API_ACCESS_TOKEN only without WE_ prefix)', 1);
            }
        }
    }
} catch (\Exception $exception) {
    // json or normal output
    if (strstr($_SERVER['HTTP_ACCEPT'], 'application/json') ||
        strstr($_SERVER['HTTP_ACCEPT'], 'text/javascript') ||
        (isset($_SERVER['HTTP_X_REQUESTED_WITH']) &&
        strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) == 'xmlhttprequest'))
    {
        echo json_encode([
            'message' => $exception->getMessage(),
            'file' => $exception->getFile(),
            'code' => $exception->getCode(),
            'trace' => $exception->getTraceAsString(),
        ]);
    } else {
        echo '<pre style="width:100%; overflow: auto;">';
        print_r($exception);
        echo '</pre>';
    }

    exit;
}