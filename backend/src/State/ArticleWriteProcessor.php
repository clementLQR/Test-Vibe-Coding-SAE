<?php

declare(strict_types=1);

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\Metadata\Put;
use ApiPlatform\State\ProcessorInterface;
use ApiPlatform\Validator\Exception\ValidationException;
use App\Article\ArticleWriter;
use App\Dto\ArticleInput;
use App\Entity\Article;
use App\Entity\User;
use App\Repository\ArticleRepository;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * POST /api/articles and PUT /api/articles/{id}: the whole article with its blocks.
 *
 * @implements ProcessorInterface<ArticleInput, Article>
 */
final class ArticleWriteProcessor implements ProcessorInterface
{
    /**
     * @param ProcessorInterface<Article, Article> $persistProcessor
     */
    public function __construct(
        #[Autowire(service: 'api_platform.doctrine.orm.state.persist_processor')]
        private readonly ProcessorInterface $persistProcessor,
        private readonly ArticleWriter $writer,
        private readonly ArticleRepository $articles,
        private readonly Security $security,
    ) {
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): Article
    {
        \assert($data instanceof ArticleInput);

        if ($operation instanceof Put) {
            $article = $this->articles->find($uriVariables['id'] ?? 0) ?? throw new NotFoundHttpException();
        } else {
            $user = $this->security->getUser();
            $article = new Article($user instanceof User ? $user : null);
        }

        $violations = $this->writer->apply($article, $data);
        if (\count($violations) > 0) {
            throw new ValidationException($violations);
        }

        return $this->persistProcessor->process($article, $operation, $uriVariables, $context);
    }
}
