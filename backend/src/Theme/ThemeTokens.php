<?php

declare(strict_types=1);

namespace App\Theme;

/**
 * The closed list of settings a designer can change (docs/architecture.md §7).
 * Themes are data, never raw CSS: every value is checked against its kind.
 */
final class ThemeTokens
{
    public const FONTS = ['system', 'serif', 'rounded', 'mono'];
    public const MAX_PALETTE = 8;

    /**
     * token => kind: "color" (#rrggbb), "font", [min, max] number, or "palette" (list of colors).
     *
     * @var array<string, 'color'|'font'|'palette'|array{0: int|float, 1: int|float}>
     */
    public const DEFINITIONS = [
        'headerBg' => 'color',
        'headerFg' => 'color',
        'pageBg' => 'color',
        'pageFg' => 'color',
        'accent' => 'color',
        'accentFg' => 'color',
        'titleColor' => 'color',
        'blockBg' => 'color',
        'blockFg' => 'color',
        'titleSize' => [1.5, 3.5],   // rem
        'blockRadius' => [0, 2],     // rem
        'fontSizeBase' => [14, 20],  // px
        'fontBody' => 'font',
        'fontHeading' => 'font',
        'chartPalette' => 'palette',
    ];

    /**
     * Returns the problem with each invalid token, as translation keys.
     *
     * @param array<mixed> $tokens
     *
     * @return array<string, string> token => translation key
     */
    public static function errors(array $tokens): array
    {
        $errors = [];
        foreach ($tokens as $name => $value) {
            $kind = self::DEFINITIONS[$name] ?? null;
            $valid = match (true) {
                null === $kind => false,
                'color' === $kind => self::isColor($value),
                'font' === $kind => \in_array($value, self::FONTS, true),
                'palette' === $kind => \is_array($value) && array_is_list($value) && \count($value) <= self::MAX_PALETTE
                    && [] === array_filter($value, static fn (mixed $c): bool => !self::isColor($c)),
                default => (\is_int($value) || \is_float($value)) && $value >= $kind[0] && $value <= $kind[1],
            };
            if (!$valid) {
                $errors[(string) $name] = null === $kind ? 'theme.token.unknown' : 'theme.token.invalid';
            }
        }

        return $errors;
    }

    private static function isColor(mixed $value): bool
    {
        return \is_string($value) && 1 === preg_match('/^#[0-9a-fA-F]{6}$/', $value);
    }
}
