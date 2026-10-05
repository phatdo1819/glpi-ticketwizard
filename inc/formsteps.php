<?php

/**
 * GLPI Ticket Guided Wizard Plugin — inc/formsteps.php
 * Matches the questions of a GLPI 11 service catalog form to wizard steps.
 *
 * GLPI 11's simplified interface creates tickets through these forms instead
 * of the ticket form. Only loaded on GLPI 11 (PHP 8.2+): GLPI 10 has no forms.
 *
 * License: MIT
 */

use Glpi\Form\AccessControl\FormAccessControlManager;
use Glpi\Form\AccessControl\FormAccessParameters;
use Glpi\Form\Destination\CommonITILField\ContentField;
use Glpi\Form\Destination\CommonITILField\TitleField;
use Glpi\Form\Form;
use Glpi\Form\Question;
use Glpi\Form\QuestionType\QuestionTypeAssignee;
use Glpi\Form\QuestionType\QuestionTypeFile;
use Glpi\Form\QuestionType\QuestionTypeItem;
use Glpi\Form\QuestionType\QuestionTypeItemDropdown;
use Glpi\Form\QuestionType\QuestionTypeLongText;
use Glpi\Form\QuestionType\QuestionTypeObserver;
use Glpi\Form\QuestionType\QuestionTypeRequester;
use Glpi\Form\QuestionType\QuestionTypeRequestType;
use Glpi\Form\QuestionType\QuestionTypeShortText;
use Glpi\Form\QuestionType\QuestionTypeUrgency;
use Glpi\Form\QuestionType\QuestionTypeUserDevice;

if (!defined('GLPI_ROOT')) {
    die("Sorry. You can't access this file directly");
}

/**
 * The wizard step each question of a service catalog form matches, so the
 * wizard can give the same advice as for that field on the ticket form.
 * Questions that match no ticket field get 'step_other'.
 *
 * @param int   $forms_id
 * @param array $url_parameters  The form page's URL parameters, which some
 *                               form access rules check
 *
 * @return array<int, string>  question id => step key, e.g. 'step_urgency'.
 *                             Empty if the user may not open the form.
 */
function plugin_ticketwizard_get_form_steps(int $forms_id, array $url_parameters): array
{
    $form = Form::getById($forms_id);
    if (!$form instanceof Form || !plugin_ticketwizard_can_answer_form($form, $url_parameters)) {
        return [];
    }

    // The ticket's title and description are usually built from the answers
    // to specific questions, which the form's destinations reference.
    $title_ids = plugin_ticketwizard_get_tagged_question_ids($form, TitleField::getKey());
    $content_ids = [];
    $long_texts = 0;
    foreach ($form->getDestinations() as $destination) {
        $config = $destination->getConfig();
        // When the description is set automatically, it lists every answer
        if (($config[ContentField::getAutoConfigKey()] ?? true) === false) {
            $content_ids = array_merge(
                $content_ids,
                plugin_ticketwizard_get_tagged_question_ids($form, ContentField::getKey())
            );
        }
    }
    foreach ($form->getQuestions() as $question) {
        if ($question->getQuestionType() instanceof QuestionTypeLongText) {
            $long_texts++;
        }
    }

    $steps = [];
    foreach ($form->getQuestions() as $question) {
        $steps[$question->getID()] = plugin_ticketwizard_get_question_step(
            $question,
            $title_ids,
            $content_ids,
            $long_texts === 1
        );
    }
    return $steps;
}

/**
 * Same check as GLPI's own form page (Glpi\Controller\Form\Utils\
 * CanCheckAccessPolicies), so nobody learns anything about a form they
 * can't open.
 *
 * @param Form  $form
 * @param array $url_parameters
 *
 * @return bool
 */
function plugin_ticketwizard_can_answer_form(Form $form, array $url_parameters): bool
{
    if (Session::haveRight(Form::$rightname, READ)) {
        // Form administrators can open any form, for example to preview it
        $parameters = new FormAccessParameters(bypass_restriction: true);
    } else {
        $parameters = new FormAccessParameters(
            session_info: Session::getCurrentSessionInfo(),
            url_parameters: $url_parameters,
        );
    }

    return FormAccessControlManager::getInstance()->canAnswerForm($form, $parameters);
}

/**
 * IDs of the questions whose answers the form's destinations put into a
 * ticket field. GLPI stores the field as a template where each answer is a
 * tag: <span data-form-tag-value="<question id>"
 * data-form-tag-provider="Glpi\Form\Tag\AnswerTagProvider">.
 *
 * @param Form   $form
 * @param string $field_key  Destination field config key, e.g. TitleField::getKey()
 *
 * @return int[]
 */
function plugin_ticketwizard_get_tagged_question_ids(Form $form, string $field_key): array
{
    $ids = [];
    foreach ($form->getDestinations() as $destination) {
        $template = $destination->getConfig()[$field_key]['value'] ?? null;
        if (!is_string($template) || !preg_match_all('/<span\b[^>]*>/i', $template, $tags)) {
            continue;
        }
        foreach ($tags[0] as $tag) {
            if (
                str_contains($tag, 'AnswerTagProvider')
                && preg_match('/data-form-tag-value="(\d+)"/', $tag, $match)
            ) {
                $ids[] = (int) $match[1];
            }
        }
    }

    return array_values(array_unique($ids));
}

/**
 * @param Question $question
 * @param int[]    $title_ids        Questions that fill the ticket title
 * @param int[]    $content_ids      Questions that fill the ticket description
 * @param bool     $single_long_text Whether this form has one long text question
 *
 * @return string  Step key
 */
function plugin_ticketwizard_get_question_step(
    Question $question,
    array $title_ids,
    array $content_ids,
    bool $single_long_text
): string {
    /** @var array $CFG_GLPI */
    global $CFG_GLPI;

    $type = $question->getQuestionType();
    $id   = $question->getID();

    if ($type instanceof QuestionTypeRequestType) {
        return 'step_type';
    }
    if ($type instanceof QuestionTypeUrgency) {
        return 'step_urgency';
    }
    if ($type instanceof QuestionTypeRequester) {
        return 'step_requester';
    }
    if ($type instanceof QuestionTypeObserver) {
        return 'step_observer';
    }
    if ($type instanceof QuestionTypeAssignee) {
        return 'step_assignee';
    }
    if ($type instanceof QuestionTypeUserDevice) {
        return 'step_asset';
    }
    if ($type instanceof QuestionTypeFile) {
        return 'step_attachments';
    }
    // Checked before QuestionTypeItem, which it extends
    if ($type instanceof QuestionTypeItemDropdown) {
        $itemtype = $type->getDefaultValueItemtype($question);
        if ($itemtype === ITILCategory::class) {
            return 'step_category';
        }
        if ($itemtype === Location::class) {
            return 'step_location';
        }
        return 'step_other';
    }
    if ($type instanceof QuestionTypeItem) {
        // An item that can be linked to a ticket: a computer, a printer...
        $itemtype = $type->getDefaultValueItemtype($question);
        return in_array($itemtype, $CFG_GLPI['ticket_types'] ?? [], true) ? 'step_asset' : 'step_other';
    }
    if ($type instanceof QuestionTypeShortText && in_array($id, $title_ids, true)) {
        return 'step_title';
    }
    if (
        $type instanceof QuestionTypeLongText
        && ($single_long_text || in_array($id, $content_ids, true))
    ) {
        return 'step_description';
    }

    return 'step_other';
}
