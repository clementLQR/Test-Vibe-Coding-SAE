<?php

declare(strict_types=1);

namespace App\Controller\Api;

use App\Dataset\CsvException;
use App\Dataset\DatasetAnalyzer;
use App\Dataset\DatasetReader;
use App\Dataset\VariableType;
use App\Entity\Dataset;
use App\Security\Voter\DatasetVoter;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Serializer\Normalizer\NormalizerInterface;
use Symfony\Contracts\Translation\TranslatorInterface;

/**
 * Data set actions that are not plain CRUD: preview, variable types, validation, typed data.
 */
#[Route('/api/datasets/{id}', requirements: ['id' => '\d+'])]
final class DatasetController extends AbstractController
{
    public function __construct(
        private readonly DatasetReader $reader,
        private readonly DatasetAnalyzer $analyzer,
        private readonly TranslatorInterface $translator,
    ) {
    }

    /** First rows as a table, with the detected type and statistics of each column. */
    #[Route('/preview', name: 'api_dataset_preview', methods: ['GET'])]
    public function preview(Dataset $dataset): JsonResponse
    {
        $this->denyAccessUnlessGranted(DatasetVoter::MANAGE, $dataset);

        try {
            return new JsonResponse($this->analyzer->preview($this->reader->table($dataset)));
        } catch (CsvException $e) {
            return $this->sourceError($e);
        }
    }

    /**
     * Body: {"variables": [{"id": 1, "label": "...", "type": "categorical|numerical"}]}.
     * Labels can always change; types only before validation (charts rely on them).
     */
    #[Route('/variables', name: 'api_dataset_variables', methods: ['PUT'])]
    public function updateVariables(Dataset $dataset, Request $request, EntityManagerInterface $em, NormalizerInterface $normalizer): JsonResponse
    {
        $this->denyAccessUnlessGranted(DatasetVoter::MANAGE, $dataset);

        /** @var array{variables?: list<array{id?: int, label?: string, type?: string}>} $payload */
        $payload = $request->toArray();
        $variablesById = [];
        foreach ($dataset->getVariables() as $variable) {
            $variablesById[$variable->getId()] = $variable;
        }

        $violations = [];
        foreach ($payload['variables'] ?? [] as $position => $input) {
            $variable = $variablesById[$input['id'] ?? 0] ?? null;
            if (null === $variable) {
                $violations[] = $this->violationArray("variables[$position].id", $this->translator->trans('dataset.variables.unknown'));
                continue;
            }
            if (isset($input['label'])) {
                $variable->setLabel($input['label']);
            }
            if (isset($input['type'])) {
                $type = VariableType::tryFrom($input['type']);
                if (null === $type) {
                    $violations[] = $this->violationArray("variables[$position].type", $this->translator->trans('dataset.variables.bad_type'));
                } elseif ($type !== $variable->getType() && $dataset->isValidated()) {
                    $violations[] = $this->violationArray("variables[$position].type", $this->translator->trans('dataset.variables.locked'));
                } else {
                    $variable->setType($type);
                }
            }
        }

        if ([] !== $violations) {
            return new JsonResponse(['violations' => $violations], Response::HTTP_UNPROCESSABLE_ENTITY);
        }
        $em->flush();

        return new JsonResponse($normalizer->normalize($dataset, 'json', ['groups' => ['dataset:read']]));
    }

    /** Confirms the variables. A numerical variable must contain at least one number. */
    #[Route('/validate', name: 'api_dataset_validate', methods: ['POST'])]
    public function validate(Dataset $dataset, EntityManagerInterface $em, NormalizerInterface $normalizer): JsonResponse
    {
        $this->denyAccessUnlessGranted(DatasetVoter::MANAGE, $dataset);

        try {
            $table = $this->reader->table($dataset);
        } catch (CsvException $e) {
            return $this->sourceError($e);
        }

        $violations = [];
        foreach ($dataset->getVariables() as $position => $variable) {
            $index = array_search($variable->getName(), $table->headers, true);
            if (false === $index) {
                return $this->sourceError(new CsvException('dataset.source.columns_changed', ['%name%' => $variable->getName()]));
            }
            if (VariableType::Numerical === $variable->getType() && 0 === $this->analyzer->stats($table->column($index))['numeric']) {
                $violations[] = $this->violationArray(
                    "variables[$position].type",
                    $this->translator->trans('dataset.variables.no_number', ['%name%' => $variable->getLabel()]),
                );
            }
        }
        if ([] !== $violations) {
            return new JsonResponse(['violations' => $violations], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $dataset->setRowCount(\count($table->rows));
        $dataset->markValidated();
        $em->flush();

        return new JsonResponse($normalizer->normalize($dataset, 'json', ['groups' => ['dataset:read']]));
    }

    /**
     * Typed rows for charts: {"variables": [{name, label, type}], "rows": [[...], ...]}.
     * Rows are arrays in variable order (smaller than objects).
     */
    #[Route('/data', name: 'api_dataset_data', methods: ['GET'])]
    public function data(Dataset $dataset): JsonResponse
    {
        $this->denyAccessUnlessGranted(DatasetVoter::DATA, $dataset);

        try {
            $rows = $this->analyzer->typedRows($dataset, $this->reader->table($dataset));
        } catch (CsvException $e) {
            return $this->sourceError($e);
        }

        $variables = [];
        foreach ($dataset->getVariables() as $variable) {
            $variables[] = ['name' => $variable->getName(), 'label' => $variable->getLabel(), 'type' => $variable->getType()->value];
        }

        $response = new JsonResponse(['variables' => $variables, 'rows' => $rows]);
        if ($dataset->isValidated()) {
            $response->setPublic()->setMaxAge(300);
        }

        return $response;
    }

    private function sourceError(CsvException $e): JsonResponse
    {
        return new JsonResponse(
            ['message' => $this->translator->trans($e->translationKey, $e->parameters)],
            Response::HTTP_UNPROCESSABLE_ENTITY,
        );
    }

    /**
     * @return array{propertyPath: string, message: string}
     */
    private function violationArray(string $path, string $message): array
    {
        return ['propertyPath' => $path, 'message' => $message];
    }
}
