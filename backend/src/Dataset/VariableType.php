<?php

declare(strict_types=1);

namespace App\Dataset;

enum VariableType: string
{
    case Categorical = 'categorical';
    case Numerical = 'numerical';
}
