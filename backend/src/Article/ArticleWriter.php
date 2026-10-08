<?php

declare(strict_types=1);

namespace App\Article;

use App\Dto\ArticleInput;
use App\Entity\Article;
use App\Repository\ArticleRepository;
use Symfony\Component\Validator\ConstraintViolationList;

/**
 * Applies an ArticleInput to an article. On top of the block rules (BlockWriter):
 * - charts only go in dashboard articles;
 * - a dashboard needs at least one chart to be published;
 * - the address (slug) stays stable once the article has been published.
 */
final class ArticleWriter
{
    public function __construct(
        private readonly BlockWriter $blocks,
        private readonly ArticleRepository $articles,
    ) {
    }

    /** Returns the violations; the article is only modified when there are none. */
    public function apply(Article $article, ArticleInput $input): ConstraintViolationList
    {
        $violations = new ConstraintViolationList();
        $type = ArticleType::from($input->type);
        $status = ArticleStatus::from($input->status);

        $resolved = $this->blocks->resolve($input->blocks, ArticleType::Dashboard === $type, $violations);
        $chartCount = \count(array_filter($input->blocks, static fn ($block): bool => 'visualization' === $block->type));
        if (ArticleType::Dashboard === $type && ArticleStatus::Published === $status && 0 === $chartCount) {
            $this->blocks->violation($violations, 'blocks', 'article.dashboard.needs_chart');
        }
        if (\count($violations) > 0) {
            return $violations;
        }

        $titleChanged = $article->getTitle() !== trim($input->title);
        $article->setTitle($input->title)
            ->setSummary($input->summary)
            ->setType($type)
            ->setLocale($input->locale)
            ->setStatus($status);
        if ('' === $article->getSlug() || ($titleChanged && null === $article->getPublishedAt())) {
            $id = $article->getId();
            $article->setSlug($this->blocks->uniqueSlug($input->title, fn (string $slug): bool => $this->articles->slugExists($slug, $id), 'article'));
        }

        $this->blocks->sync($article, $input->blocks, $resolved);

        return $violations;
    }
}
