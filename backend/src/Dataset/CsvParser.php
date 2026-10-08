<?php

declare(strict_types=1);

namespace App\Dataset;

/**
 * Parses the CSV format of the brief: a header line with the variable names,
 * then one line per individual, fields separated by ";".
 *
 * Tolerates a UTF-8 BOM, Windows-1252 files (Excel), blank lines and empty
 * trailing cells; rejects files whose structure cannot be trusted.
 */
final class CsvParser
{
    public const MAX_ROWS = 100_000;

    public function parse(string $content, string $delimiter = ';'): CsvTable
    {
        $content = $this->toUtf8($content);

        $stream = fopen('php://memory', 'r+');
        \assert(false !== $stream);
        fwrite($stream, $content);
        rewind($stream);

        $headers = null;
        $rows = [];
        $line = 0;
        try {
            while (false !== ($cells = fgetcsv($stream, null, $delimiter, '"', ''))) {
                ++$line;
                $cells = array_map(static fn (?string $cell): string => trim((string) $cell), $cells);
                if ([''] === array_values(array_unique($cells))) {
                    continue; // blank line
                }

                if (null === $headers) {
                    $headers = $this->checkHeaders($cells, $delimiter);
                    continue;
                }

                $rows[] = $this->fitRow($cells, \count($headers), $line);
                if (\count($rows) > self::MAX_ROWS) {
                    throw new CsvException('dataset.csv.too_many_rows', ['%max%' => self::MAX_ROWS]);
                }
            }
        } finally {
            fclose($stream);
        }

        if (null === $headers) {
            throw new CsvException('dataset.csv.empty');
        }
        if ([] === $rows) {
            throw new CsvException('dataset.csv.no_rows');
        }

        return new CsvTable($headers, $rows);
    }

    private function toUtf8(string $content): string
    {
        if (str_starts_with($content, "\xEF\xBB\xBF")) {
            $content = substr($content, 3);
        }

        return mb_check_encoding($content, 'UTF-8') ? $content : mb_convert_encoding($content, 'UTF-8', 'Windows-1252');
    }

    /**
     * @param list<string> $cells
     *
     * @return list<string>
     */
    private function checkHeaders(array $cells, string $delimiter): array
    {
        $cells = $this->trimTrailingEmpty($cells);

        if (1 === \count($cells) && ';' === $delimiter && preg_match('/[,\t]/', $cells[0])) {
            throw new CsvException('dataset.csv.wrong_delimiter');
        }
        foreach ($cells as $index => $name) {
            if ('' === $name) {
                throw new CsvException('dataset.csv.empty_header', ['%column%' => $index + 1]);
            }
        }
        $duplicates = array_keys(array_filter(array_count_values($cells), static fn (int $count): bool => $count > 1));
        if ([] !== $duplicates) {
            throw new CsvException('dataset.csv.duplicate_header', ['%name%' => (string) $duplicates[0]]);
        }

        return $cells;
    }

    /**
     * @param list<string> $cells
     *
     * @return list<string>
     */
    private function fitRow(array $cells, int $expected, int $line): array
    {
        if (\count($cells) > $expected) {
            // Extra cells are accepted only when empty (trailing ";" added by spreadsheets)
            $cells = \count($this->trimTrailingEmpty($cells)) <= $expected ? \array_slice($cells, 0, $expected) : $cells;
        }
        if (\count($cells) !== $expected) {
            throw new CsvException('dataset.csv.column_count', ['%line%' => $line, '%expected%' => $expected, '%found%' => \count($cells)]);
        }

        return $cells;
    }

    /**
     * @param list<string> $cells
     *
     * @return list<string>
     */
    private function trimTrailingEmpty(array $cells): array
    {
        while ([] !== $cells && '' === end($cells)) {
            array_pop($cells);
        }

        return $cells;
    }
}
