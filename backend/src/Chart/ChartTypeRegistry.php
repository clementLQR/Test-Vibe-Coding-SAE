<?php

declare(strict_types=1);

namespace App\Chart;

use App\Dataset\VariableType;

/**
 * Single source of truth for chart types: which variable goes in which role,
 * and which options exist. Exposed by GET /api/chart-types; the front end builds
 * its forms from it and the server validates every visualization against it.
 */
final class ChartTypeRegistry
{
    public const AGGREGATIONS = ['sum', 'mean', 'count'];

    /**
     * Role: [variable type (null = any), required].
     * Options: name => [default, allowed values] or [default, [min, max]] for integers.
     *
     * @var array<string, array{roles: array<string, array{0: VariableType|null, 1: bool}>, options: array<string, array{0: mixed, 1: list<mixed>}>}>
     */
    private const TYPES = [
        // Quantity (or count) per category, optionally split by a second category
        'bar' => [
            'roles' => ['x' => [VariableType::Categorical, true], 'y' => [VariableType::Numerical, false], 'series' => [VariableType::Categorical, false]],
            'options' => ['aggregation' => ['sum', self::AGGREGATIONS], 'horizontal' => [false, [true, false]], 'stacked' => [false, [true, false]]],
        ],
        // Evolution along an ordered axis
        'line' => [
            'roles' => ['x' => [null, true], 'y' => [VariableType::Numerical, true], 'series' => [VariableType::Categorical, false]],
            'options' => ['aggregation' => ['sum', self::AGGREGATIONS], 'area' => [false, [true, false]]],
        ],
        // Share of each category in a total
        'pie' => [
            'roles' => ['category' => [VariableType::Categorical, true], 'value' => [VariableType::Numerical, false]],
            'options' => ['aggregation' => ['sum', self::AGGREGATIONS], 'donut' => [false, [true, false]]],
        ],
        // Distribution of one numerical variable
        'histogram' => [
            'roles' => ['value' => [VariableType::Numerical, true]],
            'options' => ['bins' => [10, [3, 50]]],
        ],
        // Relation between two numerical variables
        'scatter' => [
            'roles' => ['x' => [VariableType::Numerical, true], 'y' => [VariableType::Numerical, true], 'color' => [VariableType::Categorical, false], 'size' => [VariableType::Numerical, false]],
            'options' => [],
        ],
        // Intensity at the crossing of two categories
        'heatmap' => [
            'roles' => ['x' => [VariableType::Categorical, true], 'y' => [VariableType::Categorical, true], 'value' => [VariableType::Numerical, false]],
            'options' => ['aggregation' => ['sum', self::AGGREGATIONS]],
        ],
        // Proportions as nested rectangles
        'treemap' => [
            'roles' => ['category' => [VariableType::Categorical, true], 'value' => [VariableType::Numerical, false]],
            'options' => ['aggregation' => ['sum', self::AGGREGATIONS]],
        ],
    ];

    public function has(string $type): bool
    {
        return isset(self::TYPES[$type]);
    }

    /** @return list<string> */
    public function names(): array
    {
        return array_keys(self::TYPES);
    }

    /** @return array<string, array{0: VariableType|null, 1: bool}> */
    public function roles(string $type): array
    {
        return self::TYPES[$type]['roles'];
    }

    /** @return array<string, array{0: mixed, 1: list<mixed>}> */
    public function options(string $type): array
    {
        return self::TYPES[$type]['options'];
    }

    /**
     * Description for the API: roles with their accepted variable type, options with defaults.
     *
     * @return list<array{name: string, roles: list<array{name: string, variableType: string|null, required: bool}>, options: list<array{name: string, default: mixed, values?: list<mixed>, min?: int, max?: int}>}>
     */
    public function describe(): array
    {
        $types = [];
        foreach (self::TYPES as $name => $definition) {
            $roles = [];
            foreach ($definition['roles'] as $role => [$variableType, $required]) {
                $roles[] = ['name' => $role, 'variableType' => $variableType?->value, 'required' => $required];
            }
            $options = [];
            foreach ($definition['options'] as $option => [$default, $allowed]) {
                $options[] = \is_int($default)
                    ? ['name' => $option, 'default' => $default, 'min' => (int) $allowed[0], 'max' => (int) $allowed[1]]
                    : ['name' => $option, 'default' => $default, 'values' => $allowed];
            }
            $types[] = ['name' => $name, 'roles' => $roles, 'options' => $options];
        }

        return $types;
    }
}
