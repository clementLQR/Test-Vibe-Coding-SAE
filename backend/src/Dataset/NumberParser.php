<?php

declare(strict_types=1);

namespace App\Dataset;

/**
 * Reads numbers written the French or English way: "1 234,5", "1,234.5", "-3", "12.5".
 */
final class NumberParser
{
    private const SPACES = [' ', "\u{00A0}", "\u{202F}"];

    /** Returns null for an empty cell or a value that is not a number. */
    public static function parse(string $raw): ?float
    {
        $value = str_replace(self::SPACES, '', trim($raw));
        if ('' === $value) {
            return null;
        }

        $comma = strrpos($value, ',');
        $dot = strrpos($value, '.');
        if (false !== $comma && false !== $dot) {
            // Both separators: the last one is the decimal separator
            $value = $comma > $dot
                ? str_replace(['.', ','], ['', '.'], $value)
                : str_replace(',', '', $value);
        } elseif (false !== $comma) {
            if (substr_count($value, ',') > 1) {
                return null;
            }
            $value = str_replace(',', '.', $value);
        }

        return is_numeric($value) ? (float) $value : null;
    }
}
