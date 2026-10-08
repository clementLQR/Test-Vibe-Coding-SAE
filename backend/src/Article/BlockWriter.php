<?php

declare(strict_types=1);

namespace App\Article;

use App\Dto\BlockInput;
use App\Entity\Block;
use App\Entity\Media;
use App\Entity\Visualization;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\String\Slugger\SluggerInterface;
use Symfony\Component\Validator\ConstraintViolation;
use Symfony\Component\Validator\ConstraintViolationList;
use Symfony\Contracts\Translation\TranslatorInterface;

/**
 * Block rules shared by articles and pages:
 * - a heading has a text and a level from 2 to 4, a text block is not empty;
 * - an image comes from the media library and has its alt texts (accessibility);
 * - a chart is allowed only where the container accepts charts.
 * Blocks sent with an id are updated in place (their ratings are kept), missing ones are removed.
 */
final class BlockWriter
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly SluggerInterface $slugger,
        private readonly TranslatorInterface $translator,
    ) {
    }

    /**
     * Checks the blocks and loads their media and charts.
     *
     * @param list<BlockInput> $inputs
     *
     * @return list<array{media: Media|null, visualization: Visualization|null}>
     */
    public function resolve(array $inputs, bool $chartsAllowed, ConstraintViolationList $violations): array
    {
        $resolved = [];
        foreach ($inputs as $index => $input) {
            $path = "blocks[$index]";
            $item = ['media' => null, 'visualization' => null];

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
                    $item['media'] = $media;
                    break;
                case 'visualization':
                    if (!$chartsAllowed) {
                        $this->violation($violations, $path, 'block.visualization.classic');
                        break;
                    }
                    $visualization = null === $input->visualizationId ? null : $this->em->find(Visualization::class, $input->visualizationId);
                    if (null === $visualization) {
                        $this->violation($violations, "$path.visualizationId", 'block.visualization.required');
                    }
                    $item['visualization'] = $visualization;
                    break;
            }
            $resolved[] = $item;
        }

        return $resolved;
    }

    /**
     * @param list<BlockInput>                                                  $inputs
     * @param list<array{media: Media|null, visualization: Visualization|null}> $resolved
     */
    public function sync(BlockContainer $container, array $inputs, array $resolved): void
    {
        $existing = [];
        foreach ($container->getBlocks() as $block) {
            $existing[$block->getId()] = $block;
        }

        $kept = [];
        foreach ($inputs as $position => $input) {
            $type = BlockType::from($input->type);
            $block = null !== $input->id && isset($existing[$input->id]) ? $existing[$input->id] : new Block($container, $type);
            $kept[spl_object_id($block)] = true;

            $block->setType($type)->setPosition($position);
            match ($type) {
                BlockType::Heading => $block->setHeadingLevel($input->headingLevel ?? 2)->setText(trim((string) $input->text)),
                BlockType::Text => $block->setText(trim((string) $input->text)),
                BlockType::Image => $block->setMedia($resolved[$position]['media'])->setText($this->nullIfEmpty($input->text)),
                BlockType::Visualization => $block->setVisualization($resolved[$position]['visualization']),
            };
        }

        foreach ($container->getBlocks()->toArray() as $block) {
            if (!isset($kept[spl_object_id($block)])) {
                $container->removeBlock($block);
            }
        }
    }

    /**
     * URL-friendly unique slug.
     *
     * @param callable(string): bool $exists
     */
    public function uniqueSlug(string $title, callable $exists, string $fallback): string
    {
        $base = mb_substr($this->slugger->slug($title)->lower()->toString(), 0, 200) ?: $fallback;
        $slug = $base;
        for ($suffix = 2; $exists($slug); ++$suffix) {
            $slug = $base.'-'.$suffix;
        }

        return $slug;
    }

    public function violation(ConstraintViolationList $violations, string $path, string $key): void
    {
        $message = $this->translator->trans($key, domain: 'validators');
        $violations->add(new ConstraintViolation($message, $key, [], null, $path, null));
    }

    private function nullIfEmpty(?string $value): ?string
    {
        $value = null === $value ? null : trim($value);

        return '' === $value ? null : $value;
    }
}
