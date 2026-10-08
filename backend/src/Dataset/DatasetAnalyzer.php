<?php

declare(strict_types=1);

namespace App\Dataset;

use App\Entity\Dataset;
use App\Entity\DatasetVariable;

/**
 * Describes the columns of a data set so the data provider can check that the
 * system understood the file: detected type and simple statistics per column,
 * plus the first rows as a table.
 */
final class DatasetAnalyzer
{
    public const PREVIEW_ROWS = 50;

    /**
     * Numerical when every non-empty value is a number, categorical otherwise.
     *
     * @param list<string> $values
     */
    public function detectType(array $values): VariableType
    {
        $nonEmpty = array_filter($values, static fn (string $value): bool => '' !== $value);
        if ([] === $nonEmpty) {
            return VariableType::Categorical;
        }
        foreach ($nonEmpty as $value) {
            if (null === NumberParser::parse($value)) {
                return VariableType::Categorical;
            }
        }

        return VariableType::Numerical;
    }

    /** Creates the variables of a new data set from its columns. */
    public function createVariables(Dataset $dataset, CsvTable $table): void
    {
        foreach ($table->headers as $index => $name) {
            new DatasetVariable($dataset, $index, $name, $this->detectType($table->column($index)));
        }
        $dataset->setRowCount(\count($table->rows));
    }

    /**
     * @param list<string> $values
     *
     * @return array{filled: int, empty: int, distinct: int, numeric: int, min: float|null, max: float|null, mean: float|null, examples: list<string>}
     */
    public function stats(array $values): array
    {
        $filled = array_values(array_filter($values, static fn (string $value): bool => '' !== $value));
        $numbers = array_values(array_filter(array_map(NumberParser::parse(...), $filled), static fn (?float $n): bool => null !== $n));
        $distinct = array_values(array_unique($filled));

        return [
            'filled' => \count($filled),
            'empty' => \count($values) - \count($filled),
            'distinct' => \count($distinct),
            'numeric' => \count($numbers),
            'min' => [] === $numbers ? null : min($numbers),
            'max' => [] === $numbers ? null : max($numbers),
            'mean' => [] === $numbers ? null : round(array_sum($numbers) / \count($numbers), 4),
            'examples' => \array_slice($distinct, 0, 5),
        ];
    }

    /**
     * @return array{rowCount: int, columns: list<array{index: int, name: string, detectedType: string, stats: array<string, mixed>}>, rows: list<list<string>>}
     */
    public function preview(CsvTable $table): array
    {
        $columns = [];
        foreach ($table->headers as $index => $name) {
            $values = $table->column($index);
            $columns[] = [
                'index' => $index,
                'name' => $name,
                'detectedType' => $this->detectType($values)->value,
                'stats' => $this->stats($values),
            ];
        }

        return [
            'rowCount' => \count($table->rows),
            'columns' => $columns,
            'rows' => \array_slice($table->rows, 0, self::PREVIEW_ROWS),
        ];
    }

    /**
     * Rows converted according to the confirmed variable types, in variable order:
     * numbers (or null when empty/invalid) for numerical variables, strings (or null) otherwise.
     *
     * @return list<list<string|float|null>>
     */
    public function typedRows(Dataset $dataset, CsvTable $table): array
    {
        $columns = [];
        foreach ($dataset->getVariables() as $variable) {
            $index = array_search($variable->getName(), $table->headers, true);
            if (false === $index) {
                throw new CsvException('dataset.source.columns_changed', ['%name%' => $variable->getName()]);
            }
            $columns[] = [$index, VariableType::Numerical === $variable->getType()];
        }

        $rows = [];
        foreach ($table->rows as $row) {
            $typed = [];
            foreach ($columns as [$index, $numerical]) {
                $value = $row[$index];
                $typed[] = $numerical ? NumberParser::parse($value) : ('' === $value ? null : $value);
            }
            $rows[] = $typed;
        }

        return $rows;
    }
}
