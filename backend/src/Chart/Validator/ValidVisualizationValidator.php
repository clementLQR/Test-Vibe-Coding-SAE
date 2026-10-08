<?php

declare(strict_types=1);

namespace App\Chart\Validator;

use App\Chart\ChartTypeRegistry;
use App\Entity\Visualization;
use Symfony\Component\Validator\Constraint;
use Symfony\Component\Validator\ConstraintValidator;
use Symfony\Component\Validator\Exception\UnexpectedTypeException;

final class ValidVisualizationValidator extends ConstraintValidator
{
    private const MAX_COLORS = 12;

    public function __construct(private readonly ChartTypeRegistry $registry)
    {
    }

    public function validate(mixed $value, Constraint $constraint): void
    {
        if (!$constraint instanceof ValidVisualization) {
            throw new UnexpectedTypeException($constraint, ValidVisualization::class);
        }
        if (!$value instanceof Visualization) {
            return;
        }

        $type = $value->getChartType();
        if (!$this->registry->has($type)) {
            $this->fail('chartType', 'visualization.chart_type.unknown', ['%type%' => $type]);

            return;
        }

        $this->validateMapping($value, $type);
        $this->validateOptions($value, $type);
        $this->validateColors($value);
    }

    private function validateMapping(Visualization $visualization, string $type): void
    {
        $dataset = $visualization->getDataset();
        if (null === $dataset) {
            return; // reported by NotNull
        }
        if (!$dataset->isValidated()) {
            $this->fail('dataset', 'visualization.dataset.not_validated');

            return;
        }

        $variables = [];
        foreach ($dataset->getVariables() as $variable) {
            $variables[$variable->getName()] = $variable;
        }

        $roles = $this->registry->roles($type);
        $mapping = $visualization->getMapping();
        foreach (array_diff_key($mapping, $roles) as $role => $unused) {
            $this->fail("mapping[$role]", 'visualization.mapping.unknown_role', ['%role%' => (string) $role]);
        }

        foreach ($roles as $role => [$expectedType, $required]) {
            $name = $mapping[$role] ?? null;
            if (null === $name) {
                if ($required) {
                    $this->fail("mapping[$role]", 'visualization.mapping.required');
                }
                continue;
            }
            $variable = $variables[$name] ?? null;
            if (null === $variable) {
                $this->fail("mapping[$role]", 'visualization.mapping.unknown_variable', ['%name%' => $name]);
            } elseif (null !== $expectedType && $variable->getType() !== $expectedType) {
                $this->fail("mapping[$role]", 'visualization.mapping.wrong_type.'.$expectedType->value, ['%name%' => $variable->getLabel()]);
            }
        }
    }

    private function validateOptions(Visualization $visualization, string $type): void
    {
        $definitions = $this->registry->options($type);
        foreach ($visualization->getOptions() as $option => $value) {
            if (!isset($definitions[$option])) {
                $this->fail("options[$option]", 'visualization.option.unknown', ['%option%' => (string) $option]);
                continue;
            }
            [$default, $allowed] = $definitions[$option];
            $valid = \is_int($default)
                ? \is_int($value) && $value >= $allowed[0] && $value <= $allowed[1]
                : \in_array($value, $allowed, true);
            if (!$valid) {
                $this->fail("options[$option]", 'visualization.option.invalid', ['%option%' => (string) $option]);
            }
        }
    }

    private function validateColors(Visualization $visualization): void
    {
        $colors = $visualization->getColors();
        if (\count($colors) > self::MAX_COLORS) {
            $this->fail('colors', 'visualization.colors.too_many', ['%max%' => self::MAX_COLORS]);
        }
        foreach ($colors as $index => $color) {
            if (!\is_string($color) || !preg_match('/^#[0-9a-fA-F]{6}$/', $color)) {
                $this->fail("colors[$index]", 'visualization.colors.invalid');
            }
        }
    }

    /**
     * @param array<string, string|int> $parameters
     */
    private function fail(string $path, string $message, array $parameters = []): void
    {
        $this->context->buildViolation($message, $parameters)->atPath($path)->addViolation();
    }
}
