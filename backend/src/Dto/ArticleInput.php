<?php

declare(strict_types=1);

namespace App\Dto;

use Symfony\Component\Validator\Constraints as Assert;

/**
 * Whole article as sent by the editor: blocks in display order.
 * Blocks with an id are updated in place (their ratings are kept), missing ones are removed.
 */
final class ArticleInput
{
    #[Assert\NotBlank]
    #[Assert\Length(max: 200)]
    public string $title = '';

    #[Assert\Length(max: 1000)]
    public string $summary = '';

    #[Assert\Choice(choices: ['classic', 'dashboard'])]
    public string $type = 'classic';

    #[Assert\Choice(choices: ['draft', 'published', 'hidden'])]
    public string $status = 'draft';

    #[Assert\Choice(choices: ['fr', 'en'])]
    public string $locale = 'fr';

    /** @var list<BlockInput> */
    #[Assert\Valid]
    #[Assert\Count(max: 200)]
    public array $blocks = [];
}
