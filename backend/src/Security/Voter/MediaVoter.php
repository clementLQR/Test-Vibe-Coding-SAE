<?php

declare(strict_types=1);

namespace App\Security\Voter;

use App\Entity\Media;
use App\Entity\User;
use App\Security\Role;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Vote;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;

/**
 * MEDIA_LIBRARY: browse and upload (authors, editors, designers, admins).
 * MEDIA_EDIT: edit alt texts or delete a media (its uploader, editors, admins).
 *
 * @extends Voter<string, Media|null>
 */
final class MediaVoter extends Voter
{
    public const LIBRARY = 'MEDIA_LIBRARY';
    public const EDIT = 'MEDIA_EDIT';

    public function __construct(private readonly Security $security)
    {
    }

    protected function supports(string $attribute, mixed $subject): bool
    {
        return self::LIBRARY === $attribute || (self::EDIT === $attribute && $subject instanceof Media);
    }

    protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token, ?Vote $vote = null): bool
    {
        $user = $token->getUser();
        if (!$user instanceof User) {
            return false;
        }

        $canUseLibrary = $this->security->isGranted(Role::AUTHOR) || $this->security->isGranted(Role::DESIGNER);
        if (self::LIBRARY === $attribute) {
            return $canUseLibrary;
        }

        return $this->security->isGranted(Role::EDITOR)
            || ($canUseLibrary && $subject instanceof Media && $subject->getUploadedBy() === $user);
    }
}
