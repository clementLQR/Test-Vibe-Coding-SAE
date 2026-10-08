<?php

declare(strict_types=1);

namespace App\Dto;

use App\Entity\Page;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * Whole page as sent by the editor (same block rules as articles).
 */
final class PageInput
{
    #[Assert\NotBlank]
    #[Assert\Length(max: 200)]
    public string $title = '';

    #[Assert\Choice(choices: Page::TEMPLATES)]
    public string $template = 'blank';

    #[Assert\Choice(choices: ['draft', 'published', 'hidden'])]
    public string $status = 'draft';

    public bool $showInMenu = true;

    #[Assert\Range(min: 0, max: 999)]
    public int $menuOrder = 0;

    #[Assert\Choice(choices: ['fr', 'en'])]
    public string $locale = 'fr';

    /** @var list<BlockInput> */
    #[Assert\Valid]
    #[Assert\Count(max: 200)]
    public array $blocks = [];
}
