<?php

declare(strict_types=1);

namespace App\Chart\Validator;

use Symfony\Component\Validator\Constraint;

/**
 * Checks a visualization against the ChartTypeRegistry and its data set.
 */
#[\Attribute(\Attribute::TARGET_CLASS)]
final class ValidVisualization extends Constraint
{
    public function getTargets(): string
    {
        return self::CLASS_CONSTRAINT;
    }
}
