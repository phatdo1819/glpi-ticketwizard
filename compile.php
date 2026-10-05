<?php
/**
 * GLPI Ticket Guided Wizard — Locale Compiler
 *
 * Compiles all .po files in locales/ to binary .mo files that GLPI can load.
 * Run from CLI:  php compile.php
 * Or locally via browser (localhost only).
 */

// Restrict web access to localhost
if (PHP_SAPI !== 'cli') {
    $remote = $_SERVER['REMOTE_ADDR'] ?? '';
    if (!in_array($remote, ['127.0.0.1', '::1'], true)) {
        http_response_code(403);
        exit('403 Forbidden');
    }
}

/**
 * Parse a .po text file into an associative array [ original => translation ].
 * Handles multi-line strings, escape sequences, and plural forms (discarded).
 */
function parse_po(string $path): array {
    $content = file_get_contents($path);
    if ($content === false) {
        return [];
    }

    // Normalise line endings
    $lines = explode("\n", str_replace("\r\n", "\n", $content));

    $messages   = [];
    $currentId  = null;
    $currentStr = null;
    $inId       = false;
    $inStr      = false;
    $plural     = false;   // skip msgid_plural / msgstr[n] blocks

    $unescape = static function (string $s): string {
        return stripcslashes($s);
    };

    $flush = static function () use (&$messages, &$currentId, &$currentStr, &$plural): void {
        if ($currentId !== null && $currentStr !== null && !$plural) {
            $messages[$currentId] = $currentStr;
        }
        $currentId  = null;
        $currentStr = null;
        $plural     = false;
    };

    foreach ($lines as $raw) {
        $line = trim($raw);

        // Blank line — separator between entries
        if ($line === '') {
            $flush();
            $inId  = false;
            $inStr = false;
            continue;
        }

        // Comment
        if ($line[0] === '#') {
            continue;
        }

        // msgid "..."
        if (str_starts_with($line, 'msgid "')) {
            $flush();
            $inId   = true;
            $inStr  = false;
            $plural = false;
            $currentId = $unescape(substr($line, 7, -1));
            continue;
        }

        // msgid_plural — skip the whole entry
        if (str_starts_with($line, 'msgid_plural')) {
            $plural = true;
            continue;
        }

        // msgstr "..."
        if (str_starts_with($line, 'msgstr "') && !$plural) {
            $inId   = false;
            $inStr  = true;
            $currentStr = $unescape(substr($line, 8, -1));
            continue;
        }

        // msgstr[n] — skip
        if (str_starts_with($line, 'msgstr[')) {
            $inId  = false;
            $inStr = false;
            continue;
        }

        // Continuation string "..."
        if ($line[0] === '"' && substr($line, -1) === '"') {
            $val = $unescape(substr($line, 1, -1));
            if ($inId)  { $currentId  .= $val; }
            if ($inStr) { $currentStr .= $val; }
            continue;
        }
    }
    $flush();

    // Keep the header entry (empty msgid): it declares the charset (UTF-8),
    // without which gettext readers fall back to ASCII.

    return $messages;
}

/**
 * Generate a binary GNU MO file from a messages array.
 *
 * MO format (little-endian):
 *   [0]  magic          = 0x950412DE
 *   [4]  revision       = 0
 *   [8]  N              = number of strings
 *   [12] orig_offset    = offset of original-strings table
 *   [16] trans_offset   = offset of translation-strings table
 *   [20] hash_size      = 0 (no hash table)
 *   [24] hash_offset    = 28 + N*16 (right after the two tables)
 *
 * Each table is N × (length, offset) 32-bit pairs.
 */
function generate_mo(array $messages): string {
    // GNU gettext requires original strings sorted (binary search)
    ksort($messages);

    $N = count($messages);

    // Header is 7 × 4 = 28 bytes
    // Orig  table: N × 8 bytes  → starts at 28
    // Trans table: N × 8 bytes  → starts at 28 + N*8
    // Strings start after both tables → at 28 + N*16
    $origTableOffset  = 28;
    $transTableOffset = 28 + $N * 8;
    $stringsOffset    = 28 + $N * 16;

    // Build string blobs and offset tables in one pass
    $origTable  = '';   // packed (length, offset) pairs for originals
    $transTable = '';   // packed (length, offset) pairs for translations
    $origBlob   = '';   // concatenated original strings (NUL-terminated)
    $transBlob  = '';   // concatenated translation strings (NUL-terminated)

    $origPos  = $stringsOffset;
    $transPos = $stringsOffset; // will be corrected below after origBlob is built

    // First pass: build origBlob and origTable
    foreach (array_keys($messages) as $id) {
        $len = strlen($id);
        $origTable .= pack('VV', $len, $origPos);
        $origBlob  .= $id . "\0";
        $origPos   += $len + 1;
    }

    // Translations start right after all original strings
    $transPos = $stringsOffset + strlen($origBlob);

    // Second pass: build transBlob and transTable with corrected offsets
    foreach ($messages as $str) {
        $len = strlen($str);
        $transTable .= pack('VV', $len, $transPos);
        $transBlob  .= $str . "\0";
        $transPos   += $len + 1;
    }

    // Assemble the full MO binary
    $header = pack(
        'V7',
        0x950412DE,      // magic
        0,               // revision
        $N,              // number of strings
        $origTableOffset,
        $transTableOffset,
        0,               // hash table size (none)
        28 + $N * 16     // hash table offset (points past both index tables)
    );

    return $header . $origTable . $transTable . $origBlob . $transBlob;
}

/* ── Main ─────────────────────────────────────────────────────────────── */

$localesDir = __DIR__ . '/locales';

if (!is_dir($localesDir)) {
    fwrite(STDERR, "ERROR: locales/ directory not found at: {$localesDir}\n");
    exit(1);
}

$files = glob($localesDir . '/*.po');
if (empty($files)) {
    echo "No .po files found in {$localesDir}\n";
    exit(0);
}

$compiled = 0;
$errors   = 0;

foreach ($files as $poPath) {
    $base   = pathinfo($poPath, PATHINFO_FILENAME);
    $moPath = $localesDir . '/' . $base . '.mo';

    echo "Compiling {$base}.po ... ";

    $messages = parse_po($poPath);

    if (empty($messages)) {
        echo "SKIP (no translatable strings found)\n";
        continue;
    }

    $binary = generate_mo($messages);

    if (file_put_contents($moPath, $binary) === false) {
        echo "ERROR (could not write {$moPath})\n";
        $errors++;
    } else {
        echo "OK (" . count($messages) . " strings → " . strlen($binary) . " bytes)\n";
        $compiled++;
    }
}

echo "\nDone. Compiled: {$compiled}  Errors: {$errors}\n";
exit($errors > 0 ? 1 : 0);
