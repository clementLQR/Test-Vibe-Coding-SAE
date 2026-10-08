<?php

declare(strict_types=1);

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\User;
use App\Entity\Visualization;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\DependencyInjection\Attribute\Autowire;

/**
 * Records the creator of a new chart (who may then edit it).
 *
 * @implements ProcessorInterface<Visualization, Visualization>
 */
final class VisualizationCreateProcessor implements ProcessorInterface
{
    /**
     * @param ProcessorInterface<Visualization, Visualization> $persistProcessor
     */
    public function __construct(
        #[Autowire(service: 'api_platform.doctrine.orm.state.persist_processor')]
        private readonly ProcessorInterface $persistProcessor,
        private readonly Security $security,
    ) {
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): Visualization
    {
        $user = $this->security->getUser();
        $data->setCreatedBy($user instanceof User ? $user : null);

        return $this->persistProcessor->process($data, $operation, $uriVariables, $context);
    }
}
