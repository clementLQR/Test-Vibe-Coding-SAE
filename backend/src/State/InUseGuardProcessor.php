<?php

declare(strict_types=1);

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\Dataset;
use App\Entity\Media;
use App\Entity\Visualization;
use App\Repository\ArticleRepository;
use App\Repository\VisualizationRepository;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;
use Symfony\Contracts\Translation\TranslatorInterface;

/**
 * Refuses to delete something still in use, with an explanation (409):
 * a media or a chart used in an article, a data set used by a chart.
 *
 * @implements ProcessorInterface<Media|Visualization|Dataset, null>
 */
final class InUseGuardProcessor implements ProcessorInterface
{
    /**
     * @param ProcessorInterface<object, null> $removeProcessor
     */
    public function __construct(
        #[Autowire(service: 'api_platform.doctrine.orm.state.remove_processor')]
        private readonly ProcessorInterface $removeProcessor,
        private readonly ArticleRepository $articles,
        private readonly VisualizationRepository $visualizations,
        private readonly TranslatorInterface $translator,
    ) {
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): null
    {
        if ($data instanceof Dataset) {
            $count = $this->visualizations->countUsingDataset($data);
            if ($count > 0) {
                throw new ConflictHttpException($this->translator->trans('in_use.dataset', ['%count%' => $count]));
            }
        } else {
            $titles = $this->articles->titlesUsing($data);
            if ([] !== $titles) {
                $key = $data instanceof Media ? 'in_use.media' : 'in_use.visualization';
                throw new ConflictHttpException($this->translator->trans($key, ['%articles%' => implode(', ', $titles)]));
            }
        }

        $this->removeProcessor->process($data, $operation, $uriVariables, $context);

        return null;
    }
}
