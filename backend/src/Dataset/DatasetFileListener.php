<?php

declare(strict_types=1);

namespace App\Dataset;

use App\Entity\Dataset;
use Doctrine\Bundle\DoctrineBundle\Attribute\AsEntityListener;
use Doctrine\ORM\Events;

/**
 * Removes the stored CSV and its cached parse once the data set is deleted.
 */
#[AsEntityListener(event: Events::postRemove, method: 'postRemove', entity: Dataset::class)]
final class DatasetFileListener
{
    public function __construct(
        private readonly DatasetSource $source,
        private readonly DatasetReader $reader,
    ) {
    }

    public function postRemove(Dataset $dataset): void
    {
        $this->source->delete($dataset);
        $this->reader->forget($dataset);
    }
}
