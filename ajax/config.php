<?php

/**
 * GLPI Ticket Guided Wizard Plugin — ajax/config.php
 * Endpoint returning active configuration as JSON: the step visibility
 * settings and, for a GLPI 11 service catalog form, the step each question
 * matches.
 *
 * License: MIT
 */

// Define GLPI root path relative to this file (3 levels up)
if (!defined('GLPI_ROOT')) {
    define('GLPI_ROOT', dirname(__DIR__, 3));
}
include_once (GLPI_ROOT . "/inc/includes.php");

// GLPI loads an active plugin's setup.php during bootstrap, which is where the
// shared step/config helpers live. Include it defensively so this endpoint does
// not depend on plugin load ordering. Guarded on the function rather than
// include_once, which dedupes by realpath and would fatally redeclare if GLPI
// reached the same file through a symlinked path.
if (!function_exists('plugin_ticketwizard_get_config')) {
    include_once (__DIR__ . '/../setup.php');
}

// Set JSON content type header
header('Content-Type: application/json');

// These are per-user, permission-checked settings — never let a shared cache
// (or the browser) serve one user's response to another.
header('Cache-Control: private, no-store');

// Check active session (requires authentication)
if (!Session::getLoginUserID()) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit();
}

// Step visibility settings, defaulted to all-visible for any unset step.
$response = ['steps' => plugin_ticketwizard_get_config()];

// On a GLPI 11 service catalog form, also say which wizard step each question
// matches (question id => step key), so the wizard gives the right advice.
$forms_id = (int) ($_GET['forms_id'] ?? 0);
if ($forms_id > 0 && !plugin_ticketwizard_is_glpi10()) {
    // The other parameters are the form page's own, which some form access
    // rules check (e.g. a direct-access token).
    $url_parameters = $_GET;
    unset($url_parameters['forms_id']);

    try {
        include_once(__DIR__ . '/../inc/formsteps.php');
        $response['questions'] = (object) plugin_ticketwizard_get_form_steps($forms_id, $url_parameters);
    } catch (\Throwable $e) {
        // A GLPI update may change the forms API: the wizard then still
        // guides through every question, just with generic advice.
        error_log(sprintf(
            '[ticketwizard] Cannot read service catalog form %d: %s in %s:%d',
            $forms_id,
            $e->getMessage(),
            $e->getFile(),
            $e->getLine()
        ));
        $response['questions'] = (object) [];
    }
}

echo json_encode($response);
