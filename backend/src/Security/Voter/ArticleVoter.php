<?php

declare(strict_types=1);

namespace App\Security\Voter;

use App\Entity\Article;
use App\Entity\User;
use App\Security\Role;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Vote;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;

/**
 * ARTICLE_CREATE: authors (and editors, admins).
 * ARTICLE_EDIT: editors on every article, authors on their own only (brief).
 * ARTICLE_VIEW: anyone when published, otherwise whoever may edit it.
 *
 * @extends Voter<string, Article|null>
 */
final class ArticleVoter extends Voter
{
    public const CREATE = 'ARTICLE_CREATE';
    public const EDIT = 'ARTICLE_EDIT';
    public const VIEW = 'ARTICLE_VIEW';

    public function __construct(private readonly Security $security)
    {
    }

    protected function supports(string $attribute, mixed $subject): bool
    {
        return self::CREATE === $attribute || (\in_array($attribute, [self::EDIT, self::VIEW], true) && $subject instanceof Article);
    }

    protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token, ?Vote $vote = null): bool
    {
        if (self::VIEW === $attribute && $subject instanceof Article && $subject->isPublished()) {
            return true;
        }

        $user = $token->getUser();
        if (!$user instanceof User) {
            return false;
        }
        if (self::CREATE === $attribute) {
            return $this->security->isGranted(Role::AUTHOR);
        }

        return $this->security->isGranted(Role::EDITOR)
            || ($this->security->isGranted(Role::AUTHOR) && $subject instanceof Article && $subject->getAuthor() === $user);
    }
}
