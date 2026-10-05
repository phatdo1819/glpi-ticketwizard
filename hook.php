<?php

/**
 * GLPI Ticket Guided Wizard Plugin — hook.php
 *
 * License: MIT
 */

/**
 * Called when an administrator installs the plugin via Setup > Plugins.
 *
 * @return bool  true on success
 */
function plugin_ticketwizard_install(): bool
{
    return true;
}

/**
 * Called when an administrator uninstalls the plugin via Setup > Plugins.
 *
 * @return bool  true on success
 */
function plugin_ticketwizard_uninstall(): bool
{
    // Remove the step visibility settings saved by front/config.php
    Config::deleteConfigurationValues('plugin:ticketwizard', array_keys(plugin_ticketwizard_get_steps()));

    return true;
}
