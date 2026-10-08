<?php

declare(strict_types=1);

namespace App\Dataset;

enum DatasetStatus: string
{
    /** Uploaded, variables not yet confirmed by the data provider. */
    case Pending = 'pending';
    /** Confirmed: usable in visualizations. */
    case Validated = 'validated';
}
