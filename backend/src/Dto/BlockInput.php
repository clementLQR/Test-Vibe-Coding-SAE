<?php

declare(strict_types=1);

namespace App\Dto;

use Symfony\Component\Validator\Constraints as Assert;

final class BlockInput
{
    public ?int $id = null;

    #[Assert\Choice(choices: ['heading', 'text', 'image', 'visualization'])]
    public string $type = 'text';

    #[Assert\Range(min: 2, max: 4)]
    public ?int $headingLevel = null;

    #[Assert\Length(max: 10000)]
    public ?string $text = null;

    public ?int $mediaId = null;

    public ?int $visualizationId = null;
}
