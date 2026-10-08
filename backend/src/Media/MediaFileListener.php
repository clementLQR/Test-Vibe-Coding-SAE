<?php

declare(strict_types=1);

namespace App\Media;

use App\Entity\Media;
use Doctrine\Bundle\DoctrineBundle\Attribute\AsEntityListener;
use Doctrine\ORM\Events;

/**
 * Removes the image files once the Media row is deleted.
 */
#[AsEntityListener(event: Events::postRemove, method: 'postRemove', entity: Media::class)]
final class MediaFileListener
{
    public function __construct(private readonly MediaStorage $storage)
    {
    }

    public function postRemove(Media $media): void
    {
        $this->storage->delete($media);
    }
}
