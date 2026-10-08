<?php

declare(strict_types=1);

namespace App\Article;

use App\Dto\ArticleInput;
use App\Dto\BlockInput;
use App\Entity\Article;
use App\Entity\Block;
use App\Entity\Media;
use App\Entity\Visualization;
use App\Repository\ArticleRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\String\Slugger\SluggerInterface;
use Symfony\Component\Validator\ConstraintViolation;
use Symfony\Component\Validator\ConstraintViolationList;
use Symfony\Contracts\Translation\TranslatorInterface;

/**
 * Applies an ArticleInput to an article and enforces the editorial rules:
 * - a heading has a text and a level from 2 to 4, a text block is not empty;
 * - an image comes from the media library and has its alt texts (accessibility);
 * - visualizations only go in dashboard articles;
 * - a dashboard needs at least one visualization to be published.
 */
final class ArticleWriter
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly ArticleRepository $articles,
        private readonly SluggerInterface $slugger,
        private readonly TranslatorInterface $translator,
    ) {
    }

    /** Returns the violations; the article is only modified when there are none. */
    public function apply(Article $article, ArticleInput $input): ConstraintViolationList
    {
        $violations = new ConstraintViolationList();
        $type = ArticleType::from($input->type);
        $status = ArticleStatus::from($input->status);

        $resolved = [];
        $chartCount = 0;
        foreach ($input->blocks as $index => $blockInput) {
            $resolved[] = $this->resolveBlock($blockInput, $index, $type, $violations);
            $chartCount += 'visualization' === $blockInput->type ? 1 : 0;
        }
        if (ArticleType::Dashboard === $type && ArticleStatus::Published === $status && 0 === $chartCount) {
            $this->violation($violations, 'blocks', 'article.dashboard.needs_chart');
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
        // The address stays stable once the article has been published
        if ('' === $article->getSlug() || ($titleChanged && null === $article->getPublishedAt())) {
            $article->setSlug($this->uniqueSlug($input->title, $article->getId()));
        }

        $this->syncBlocks($article, $input->blocks, $resolved);

        return $violations;
    }

    /**
     * @param list<BlockInput>                                                  $inputs
     * @param list<array{media: Media|null, visualization: Visualization|null}> $resolved
     */
    private function syncBlocks(Article $article, array $inputs, array $resolved): void
    {
        $existing = [];
        foreach ($article->getBlocks() as $block) {
            $existing[$block->getId()] = $block;
        }

        $kept = [];
        foreach ($inputs as $position => $input) {
            $type = BlockType::from($input->type);
            $block = null !== $input->id && isset($existing[$input->id]) ? $existing[$input->id] : new Block($article, $type);
            $kept[spl_object_id($block)] = true;

            $block->setType($type)->setPosition($position);
            match ($type) {
                BlockType::Heading => $block->setHeadingLevel($input->headingLevel ?? 2)->setText(trim((string) $input->text)),
                BlockType::Text => $block->setText(trim((string) $input->text)),
                BlockType::Image => $block->setMedia($resolved[$position]['media'])->setText($this->nullIfEmpty($input->text)),
                BlockType::Visualization => $block->setVisualization($resolved[$position]['visualization']),
            };
        }

        foreach ($article->getBlocks()->toArray() as $block) {
            if (!isset($kept[spl_object_id($block)])) {
                $article->removeBlock($block);
            }
        }
    }

    /**
     * @return array{media: Media|null, visualization: Visualization|null}
     */
    private function resolveBlock(BlockInput $input, int $index, ArticleType $articleType, ConstraintViolationList $violations): array
    {
        $path = "blocks[$index]";
        $resolved = ['media' => null, 'visualization' => null];

        switch ($input->type) {
            case 'heading':
            case 'text':
                if ('' === trim((string) $input->text)) {
                    $this->violation($violations, "$path.text", 'block.text.required');
                }
                break;
            case 'image':
                $media = null === $input->mediaId ? null : $this->em->find(Media::class, $input->mediaId);
                if (null === $media) {
                    $this->violation($violations, "$path.mediaId", 'block.image.required');
                } elseif (!$media->isAltComplete()) {
                    $this->violation($violations, "$path.mediaId", 'block.image.alt_missing');
                }
                $resolved['media'] = $media;
                break;
            case 'visualization':
                if (ArticleType::Dashboard !== $articleType) {
                    $this->violation($violations, $path, 'block.visualization.classic');
                    break;
                }
                $visualization = null === $input->visualizationId ? null : $this->em->find(Visualization::class, $input->visualizationId);
                if (null === $visualization) {
                    $this->violation($violations, "$path.visualizationId", 'block.visualization.required');
                }
                $resolved['visualization'] = $visualization;
                break;
        }

        return $resolved;
    }

    private function uniqueSlug(string $title, ?int $articleId): string
    {
        $base = mb_substr($this->slugger->slug($title)->lower()->toString(), 0, 200) ?: 'article';
        $slug = $base;
        for ($suffix = 2; $this->articles->slugExists($slug, $articleId); ++$suffix) {
            $slug = $base.'-'.$suffix;
        }

        return $slug;
    }

    private function nullIfEmpty(?string $value): ?string
    {
        $value = null === $value ? null : trim($value);

        return '' === $value ? null : $value;
    }

    private function violation(ConstraintViolationList $violations, string $path, string $key): void
    {
        $message = $this->translator->trans($key, domain: 'validators');
        $violations->add(new ConstraintViolation($message, $key, [], null, $path, null));
    }
}
