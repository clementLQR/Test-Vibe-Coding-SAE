<?php

declare(strict_types=1);

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\Metadata\Put;
use ApiPlatform\State\ProcessorInterface;
use ApiPlatform\Validator\Exception\ValidationException;
use App\Article\ArticleStatus;
use App\Article\BlockWriter;
use App\Dto\PageInput;
use App\Entity\Page;
use App\Repository\PageRepository;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Validator\ConstraintViolationList;

/**
 * POST /api/pages and PUT /api/pages/{id}: the whole page with its blocks.
 *
 * @implements ProcessorInterface<PageInput, Page>
 */
final class PageWriteProcessor implements ProcessorInterface
{
    /**
     * @param ProcessorInterface<Page, Page> $persistProcessor
     */
    public function __construct(
        #[Autowire(service: 'api_platform.doctrine.orm.state.persist_processor')]
        private readonly ProcessorInterface $persistProcessor,
        private readonly BlockWriter $blocks,
        private readonly PageRepository $pages,
    ) {
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): Page
    {
        \assert($data instanceof PageInput);
        $page = $operation instanceof Put
            ? ($this->pages->find($uriVariables['id'] ?? 0) ?? throw new NotFoundHttpException())
            : new Page();

        $violations = new ConstraintViolationList();
        $resolved = $this->blocks->resolve($data->blocks, true, $violations);
        if (\count($violations) > 0) {
            throw new ValidationException($violations);
        }

        $titleChanged = $page->getTitle() !== trim($data->title);
        $page->setTitle($data->title)
            ->setTemplate($data->template)
            ->setStatus(ArticleStatus::from($data->status))
            ->setShowInMenu($data->showInMenu)
            ->setMenuOrder($data->menuOrder)
            ->setLocale($data->locale);
        // The address stays stable once the page has been published
        if ('' === $page->getSlug() || ($titleChanged && null === $page->getPublishedAt())) {
            $id = $page->getId();
            $page->setSlug($this->blocks->uniqueSlug($data->title, fn (string $slug): bool => $this->pages->slugExists($slug, $id), 'page'));
        }
        $this->blocks->sync($page, $data->blocks, $resolved);

        return $this->persistProcessor->process($page, $operation, $uriVariables, $context);
    }
}
