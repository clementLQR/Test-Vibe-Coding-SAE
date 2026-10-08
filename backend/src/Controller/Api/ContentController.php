<?php

declare(strict_types=1);

namespace App\Controller\Api;

use App\Repository\ArticleRepository;
use App\Repository\PageRepository;
use App\Security\Voter\ArticleVoter;
use App\Security\Voter\PageVoter;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Serializer\Normalizer\NormalizerInterface;

/**
 * Public site: articles and pages by address (slug), and the main menu.
 */
#[Route('/api')]
final class ContentController extends AbstractController
{
    public function __construct(private readonly NormalizerInterface $normalizer)
    {
    }

    #[Route('/articles/by-slug/{slug}', name: 'api_article_by_slug', methods: ['GET'])]
    public function article(string $slug, ArticleRepository $articles): JsonResponse
    {
        $article = $articles->findOneBy(['slug' => $slug]) ?? throw $this->createNotFoundException();
        $this->denyAccessUnlessGranted(ArticleVoter::VIEW, $article);

        return new JsonResponse($this->normalizer->normalize($article, 'json', ['groups' => ['content:read']]));
    }

    #[Route('/pages/by-slug/{slug}', name: 'api_page_by_slug', methods: ['GET'])]
    public function page(string $slug, PageRepository $pages): JsonResponse
    {
        $page = $pages->findOneBy(['slug' => $slug]) ?? throw $this->createNotFoundException();
        $this->denyAccessUnlessGranted(PageVoter::VIEW, $page);

        return new JsonResponse($this->normalizer->normalize($page, 'json', ['groups' => ['content:read']]));
    }

    /** Published pages of the menu, in the requested language (?locale=fr|en). */
    #[Route('/menu', name: 'api_menu', methods: ['GET'])]
    public function menu(Request $request, PageRepository $pages): JsonResponse
    {
        $locale = 'en' === $request->query->get('locale') ? 'en' : 'fr';
        $items = array_map(
            static fn ($page): array => ['title' => $page->getTitle(), 'slug' => $page->getSlug()],
            $pages->menu($locale),
        );

        return new JsonResponse($items);
    }
}
