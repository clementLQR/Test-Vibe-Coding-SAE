<?php

declare(strict_types=1);

namespace App\Dataset;

/**
 * Raw content of a CSV file: headers and rows of strings, all rows having as many cells as headers.
 */
final class CsvTable
{
    /**
     * @param list<string>       $headers
     * @param list<list<string>> $rows
     */
    public function __construct(
        public readonly array $headers,
        public readonly array $rows,
    ) {
    }

    /** @return list<string> */
    public function column(int $index): array
    {
        return array_column($this->rows, $index);
    }
}
