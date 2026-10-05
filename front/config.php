<?php

/**
 * GLPI Ticket Guided Wizard Plugin — config.php
 * Renders the admin settings to allow hiding/unhiding steps.
 *
 * License: MIT
 */

// Define GLPI root path relative to this file (3 levels up)
if (!defined('GLPI_ROOT')) {
    define('GLPI_ROOT', dirname(__DIR__, 3));
}
include_once (GLPI_ROOT . "/inc/includes.php");

// GLPI loads an active plugin's setup.php during bootstrap, which is where the
// shared step/config helpers live. Include it defensively so this page does not
// depend on plugin load ordering. Guarded on the function rather than
// include_once, which dedupes by realpath and would fatally redeclare if GLPI
// reached the same file through a symlinked path.
if (!function_exists('plugin_ticketwizard_get_config')) {
    include_once (__DIR__ . '/../setup.php');
}

// Check Setup > Plugins permission
Session::checkRight("config", UPDATE);

// The steps an admin can toggle — shared with ajax/config.php (see setup.php).
$steps = plugin_ticketwizard_get_steps();

// Handle form submission
if (isset($_POST['submit'])) {
    $values = [];
    foreach (array_keys($steps) as $key) {
        // Save '1' for Yes, '0' for No
        $values[$key] = (isset($_POST[$key]) && $_POST[$key] === '1') ? '1' : '0';
    }
    Config::setConfigurationValues('plugin:ticketwizard', $values);

    // Success notification
    Session::addMessageAfterRedirect(__('Configuration updated successfully!', 'ticketwizard'), true, INFO);
    Html::back();
}

// Render GLPI header
Html::header(__('Ticket Guided Wizard Configuration', 'ticketwizard'), $_SERVER['PHP_SELF'], 'config', 'plugin');

// Load active configuration (unset steps default to visible)
$config = plugin_ticketwizard_get_config();

// Post back to this exact page. Using a resolved GLPI URL (rather than
// $_SERVER['PHP_SELF']) guarantees the CSRF token is validated against the
// same endpoint under the GLPI 11 router — otherwise the save returns HTTP 403.
$form_target = plugin_ticketwizard_web_dir() . '/front/config.php';

echo "<div class='center'>";
echo "<form action='" . htmlspecialchars($form_target, ENT_QUOTES) . "' method='post'>";
echo "<table class='tab_cadre_fixe'>";

echo "<tr class='tab_bg_1'><th colspan='2'>" . __s('Configure Step Visibility in the Wizard', 'ticketwizard') . "</th></tr>";

foreach ($steps as $key => $label) {
    echo "<tr class='tab_bg_2'>";
    // Labels live untranslated in setup.php and are translated here, so the
    // settings page follows the same locales the wizard itself ships.
    // (__s() escapes; GLPI 10 has no htmlescape().)
    echo "<td>" . __s($label, 'ticketwizard') . "</td>";
    echo "<td>";
    Dropdown::showYesNo($key, $config[$key]);
    echo "</td>";
    echo "</tr>";
}

echo "<tr class='tab_bg_1'>";
echo "<td colspan='2' class='center'>";
echo "<input type='submit' name='submit' class='btn btn-primary' value='" . _sx('button', 'Save') . "'>";
echo "</td>";
echo "</tr>";

echo "</table>";
// Html::closeForm() outputs the required CSRF token AND the closing </form> tag.
Html::closeForm();
echo "</div>";

// Render GLPI footer
Html::footer();
