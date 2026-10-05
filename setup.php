<?php

/**
 * GLPI Ticket Guided Wizard Plugin
 * Guides users step-by-step through GLPI ticket creation.
 *
 * License: MIT
 *
 * Compatible with GLPI 10.0+ and GLPI 11.x
 */

define('TICKETWIZARD_VERSION', '1.0.1');
define('TICKETWIZARD_MIN_GLPI', '10.0.0');

/**
 * Return plugin metadata.
 *
 * NOTE: Do NOT call __() here — this runs during early GLPI bootstrap
 * before the translation system is initialised, causing fatal errors.
 *
 * @return array
 */
function plugin_version_ticketwizard(): array
{
    return [
        'name'         => 'Ticket Guided Wizard',
        'version'      => TICKETWIZARD_VERSION,
        'author'       => '',
        'license'      => 'MIT',
        'homepage'     => '',
        'requirements' => [
            'glpi' => [
                'min' => TICKETWIZARD_MIN_GLPI,
            ],
        ],
    ];
}

/**
 * The wizard steps an administrator can show or hide, in the order the guide
 * presents them, mapped to their untranslated labels.
 *
 * This is the single source of truth shared by the settings page
 * (front/config.php) and the JSON endpoint (ajax/config.php). The matching
 * defaults in public/js/wizard.js (DEFAULT_CONFIG) exist only as an offline
 * fallback for when the endpoint cannot be reached.
 *
 * Labels are returned untranslated: they are wrapped in __() at render time so
 * that this function stays safe to call during early bootstrap, before the
 * translation system is initialised.
 *
 * @return array<string, string>  config key => English label
 */
function plugin_ticketwizard_get_steps(): array
{
    return [
        'step_type'        => 'Ticket Type Selection',
        'step_category'    => 'Category Selection',
        'step_urgency'     => 'Urgency Selection',
        'step_impact'      => 'Impact Selection',
        'step_priority'    => 'Priority Override',
        'step_location'    => 'Location Selection',
        'step_asset'       => 'Associated Asset / Device Selection',
        'step_requester'   => 'Requester Selection',
        'step_observer'    => 'Observer Selection',
        'step_assignee'    => 'Assignee Selection',
        'step_title'       => 'Ticket Title',
        'step_description' => 'Description (TinyMCE / Rich Text)',
        'step_attachments' => 'File Attachments Dropzone',
        'step_other'       => 'Other Questions of Service Catalog Forms (GLPI 11)',
        'step_submit'      => 'Add / Submit Ticket Button',
    ];
}

/**
 * Effective step-visibility settings, with every unset step defaulting to
 * visible ('1'). Callers therefore never have to handle a missing key.
 *
 * @return array<string, string>  config key => '1' (visible) or '0' (hidden)
 */
function plugin_ticketwizard_get_config(): array
{
    $stored = Config::getConfigurationValues('plugin:ticketwizard');

    $config = [];
    foreach (array_keys(plugin_ticketwizard_get_steps()) as $key) {
        $config[$key] = (isset($stored[$key]) && $stored[$key] === '0') ? '0' : '1';
    }

    return $config;
}

/**
 * True on GLPI 10.0.x, false on GLPI 11 and later.
 *
 * @return bool
 */
function plugin_ticketwizard_is_glpi10(): bool
{
    return version_compare(GLPI_VERSION, '11.0.0-dev', '<');
}

/**
 * Web path of the plugin folder, e.g. "/glpi/plugins/ticketwizard".
 *
 * GLPI 11 serves every plugin under /plugins/, wherever it is installed.
 * GLPI 10 serves it from its real folder, which can also be marketplace/.
 *
 * @return string
 */
function plugin_ticketwizard_web_dir(): string
{
    /** @var array $CFG_GLPI */
    global $CFG_GLPI;

    if (plugin_ticketwizard_is_glpi10()) {
        return Plugin::getWebDir('ticketwizard');
    }
    return $CFG_GLPI['root_doc'] . '/plugins/ticketwizard';
}

/**
 * Check plugin prerequisites before install / activation.
 *
 * @return bool
 */
function plugin_ticketwizard_check_prerequisites(): bool
{
    if (version_compare(GLPI_VERSION, TICKETWIZARD_MIN_GLPI, 'lt')) {
        if (method_exists('Plugin', 'messageIncompatible')) {
            echo Plugin::messageIncompatible('glpi', TICKETWIZARD_MIN_GLPI);
        }
        return false;
    }
    return true;
}

/**
 * Check plugin configuration validity.
 *
 * @param bool $verbose
 * @return bool
 */
function plugin_ticketwizard_check_config(bool $verbose = false): bool
{
    return true;
}

/**
 * Initialise plugin hooks.
 *
 * @return void
 */
function plugin_init_ticketwizard(): void
{
    global $PLUGIN_HOOKS;

    try {
        // Make install / uninstall functions always reachable
        include_once __DIR__ . '/hook.php';

        // Required for GLPI CSRF compliance
        $PLUGIN_HOOKS['csrf_compliant']['ticketwizard'] = true;

        // Register the setup config page in GLPI Setup > Plugins
        $PLUGIN_HOOKS['config_page']['ticketwizard'] = 'front/config.php';

        // Register CSS and JS. GLPI 11 serves plugin files from public/ and
        // wants paths relative to it; GLPI 10 wants them relative to the
        // plugin folder, so it needs the public/ prefix.
        $assets = plugin_ticketwizard_is_glpi10() ? 'public/' : '';
        $PLUGIN_HOOKS['add_css']['ticketwizard']        = $assets . 'css/wizard.css';
        $PLUGIN_HOOKS['add_javascript']['ticketwizard'] = [$assets . 'js/wizard.js'];

    } catch (\Throwable $e) {
        // Log without rethrowing — keeps GLPI from auto-deactivating the plugin
        error_log(sprintf(
            '[ticketwizard] plugin_init_ticketwizard() error: %s in %s:%d',
            $e->getMessage(),
            $e->getFile(),
            $e->getLine()
        ));
    }
}
