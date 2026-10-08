<?php

declare(strict_types=1);

namespace App\Controller\Api;

use App\Entity\Article;
use App\Entity\Block;
use App\Entity\Rating;
use App\Entity\User;
use App\Repository\RatingRepository;
use App\Security\Role;
use App\Security\Voter\ArticleVoter;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Contracts\Translation\TranslatorInterface;

/**
 * Block ratings: any logged-in user (subscriber or more) rates the blocks of a published article from 0 to 5.
 */
final class RatingController extends AbstractController
{
    public function __construct(private readonly RatingRepository $ratings)
    {
    }

    /** {"blocks": {"<blockId>": {"average": 4.2, "count": 12, "mine": 5|null}}} for every rated block. */
    #[Route('/api/articles/{id}/ratings', name: 'api_article_ratings', requirements: ['id' => '\d+'], methods: ['GET'])]
    public function summary(Article $article): JsonResponse
    {
        $this->denyAccessUnlessGranted(ArticleVoter::VIEW, $article);
        $user = $this->getUser();

        return new JsonResponse(['blocks' => (object) $this->ratings->summaryForArticle($article, $user instanceof User ? $user : null)]);
    }

    /** Body {"score": 0..5}; creates or replaces the user's rating of the block. */
    #[Route('/api/blocks/{id}/rating', name: 'api_block_rating', requirements: ['id' => '\d+'], methods: ['PUT'])]
    public function rate(Block $block, Request $request, EntityManagerInterface $em, TranslatorInterface $translator): JsonResponse
    {
        $this->denyAccessUnlessGranted(Role::SUBSCRIBER);
        $user = $this->getUser();
        \assert($user instanceof User);

        $article = $block->getArticle();
        if (null === $article || !$article->isPublished()) {
            return new JsonResponse(['message' => $translator->trans('rating.not_ratable')], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $score = $request->toArray()['score'] ?? null;
        if (!\is_int($score) || $score < Rating::MIN || $score > Rating::MAX) {
            return new JsonResponse(
                ['violations' => [['propertyPath' => 'score', 'message' => $translator->trans('rating.invalid_score')]]],
                Response::HTTP_UNPROCESSABLE_ENTITY,
            );
        }

        $rating = $this->ratings->findOneBy(['user' => $user, 'block' => $block]);
        if (null === $rating) {
            $em->persist(new Rating($user, $block, $score));
        } else {
            $rating->changeScore($score);
        }
        $em->flush();

        return new JsonResponse([...$this->ratings->summaryForBlock($block), 'mine' => $score]);
    }
}
