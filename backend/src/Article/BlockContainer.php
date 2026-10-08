<?php

declare(strict_types=1);

namespace App\Article;

use App\Entity\Block;
use Doctrine\Common\Collections\Collection;

/**
 * Something made of ordered blocks: an article or a page.
 */
interface BlockContainer
{
    /** @return Collection<int, Block> */
    public function getBlocks(): Collection;

    public function addBlock(Block $block): static;

    public function removeBlock(Block $block): static;
}
