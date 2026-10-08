<?php

declare(strict_types=1);

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\Metadata\Post;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\Theme;
use App\Entity\User;
use App\Security\Role;
use App\Theme\ThemeStatus;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\DependencyInjection\Attribute\Autowire;

/**
 * A designer's theme always goes (back) to review: new proposals and edits of
 * proposed or rejected themes become "proposed". Administrators edit without review.
 *
 * @implements ProcessorInterface<Theme, Theme>
 */
final class ThemeWriteProcessor implements ProcessorInterface
{
    /**
     * @param ProcessorInterface<Theme, Theme> $persistProcessor
     */
    public function __construct(
        #[Autowire(service: 'api_platform.doctrine.orm.state.persist_processor')]
        private readonly ProcessorInterface $persistProcessor,
        private readonly Security $security,
    ) {
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): Theme
    {
        $user = $this->security->getUser();
        if ($operation instanceof Post) {
            $data->setProposedBy($user instanceof User ? $user : null);
            $data->setStatus(ThemeStatus::Proposed);
        } elseif (!$this->security->isGranted(Role::ADMIN)) {
            $data->setStatus(ThemeStatus::Proposed);
            $data->setReviewComment(null);
        }

        return $this->persistProcessor->process($data, $operation, $uriVariables, $context);
    }
}
