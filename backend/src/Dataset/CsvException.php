<?php

declare(strict_types=1);

namespace App\Dataset;

/**
 * A data source that cannot be read. Carries a translation key (messages domain)
 * so the API can explain the problem in the user's language.
 */
final class CsvException extends \RuntimeException
{
    /**
     * @param array<string, string|int> $parameters
     */
    public function __construct(
        public readonly string $translationKey,
        public readonly array $parameters = [],
        ?\Throwable $previous = null,
    ) {
        parent::__construct($translationKey, 0, $previous);
    }
}
