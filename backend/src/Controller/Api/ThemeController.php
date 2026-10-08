<?php

declare(strict_types=1);

namespace App\Controller\Api;

use App\Entity\Theme;
use App\Repository\ThemeRepository;
use App\Security\Role;
use App\Theme\ThemeStatus;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Serializer\Normalizer\NormalizerInterface;

/**
 * Theme review (administrators) and the public list of active themes.
 */
final class ThemeController extends AbstractController
{
    public function __construct(
        private readonly ThemeRepository $themes,
        private readonly EntityManagerInterface $em,
        private readonly NormalizerInterface $normalizer,
    ) {
    }

    /** Active themes with their target, for the public site: [{scope, pageId, articleId, tokens}]. */
    #[Route('/api/active-themes', name: 'api_themes_active', methods: ['GET'])]
    public function active(): JsonResponse
    {
        $active = array_map(static fn (Theme $theme): array => [
            'scope' => $theme->getScope()->value,
            'pageId' => $theme->getPageId(),
            'articleId' => $theme->getArticleId(),
            'tokens' => (object) $theme->getTokens(),
        ], $this->themes->findActive());

        return (new JsonResponse($active))->setPublic()->setMaxAge(60);
    }

    /** Approves and applies the theme; the theme it replaces on the same target is archived. */
    #[Route('/api/themes/{id}/approve', name: 'api_theme_approve', requirements: ['id' => '\d+'], methods: ['POST'])]
    public function approve(Theme $theme): JsonResponse
    {
        $this->denyAccessUnlessGranted(Role::ADMIN);

        $this->themes->activeSameTarget($theme)?->setStatus(ThemeStatus::Archived);
        $theme->setStatus(ThemeStatus::Active)->setReviewComment(null);
        $this->em->flush();

        return $this->themeResponse($theme);
    }

    /** Body {"comment": "..."}: tells the designer what to change. An active theme is withdrawn. */
    #[Route('/api/themes/{id}/reject', name: 'api_theme_reject', requirements: ['id' => '\d+'], methods: ['POST'])]
    public function reject(Theme $theme, Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted(Role::ADMIN);

        $comment = trim((string) ($request->toArray()['comment'] ?? ''));
        $theme->setStatus(ThemeStatus::Rejected)->setReviewComment('' === $comment ? null : mb_substr($comment, 0, 1000));
        $this->em->flush();

        return $this->themeResponse($theme);
    }

    private function themeResponse(Theme $theme): JsonResponse
    {
        return new JsonResponse($this->normalizer->normalize($theme, 'json', ['groups' => ['theme:read']]));
    }
}
