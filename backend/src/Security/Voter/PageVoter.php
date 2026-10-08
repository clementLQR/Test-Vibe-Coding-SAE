<?php

declare(strict_types=1);

namespace App\Security\Voter;

use App\Entity\Page;
use App\Security\Role;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Vote;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;

/**
 * PAGE_EDIT: editors (and admins) manage pages and the menu.
 * PAGE_VIEW: anyone when published, editors otherwise.
 *
 * @extends Voter<string, Page|null>
 */
final class PageVoter extends Voter
{
    public const EDIT = 'PAGE_EDIT';
    public const VIEW = 'PAGE_VIEW';

    public function __construct(private readonly Security $security)
    {
    }

    protected function supports(string $attribute, mixed $subject): bool
    {
        return self::EDIT === $attribute || (self::VIEW === $attribute && $subject instanceof Page);
    }

    protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token, ?Vote $vote = null): bool
    {
        if (self::VIEW === $attribute && $subject instanceof Page && $subject->isPublished()) {
            return true;
        }

        return $this->security->isGranted(Role::EDITOR);
    }
}
