<?php

declare(strict_types=1);

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use ApiPlatform\Validator\Exception\ValidationException;
use App\Dataset\CsvException;
use App\Dataset\CsvParser;
use App\Dataset\DatasetAnalyzer;
use App\Dataset\DatasetSource;
use App\Dataset\SourceType;
use App\Entity\Dataset;
use App\Entity\User;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Validator\Constraints as Assert;
use Symfony\Component\Validator\ConstraintViolation;
use Symfony\Component\Validator\ConstraintViolationList;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Contracts\Translation\TranslatorInterface;

/**
 * POST /api/datasets (multipart/form-data): "name", optional "description",
 * and either "file" (CSV upload) or "url" (remote CSV).
 * The source is read once to check it and to create the variables.
 *
 * @implements ProcessorInterface<mixed, Dataset>
 */
final class DatasetCreateProcessor implements ProcessorInterface
{
    /**
     * @param ProcessorInterface<Dataset, Dataset> $persistProcessor
     */
    public function __construct(
        #[Autowire(service: 'api_platform.doctrine.orm.state.persist_processor')]
        private readonly ProcessorInterface $persistProcessor,
        private readonly DatasetSource $source,
        private readonly CsvParser $parser,
        private readonly DatasetAnalyzer $analyzer,
        private readonly ValidatorInterface $validator,
        private readonly TranslatorInterface $translator,
        private readonly Security $security,
    ) {
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): Dataset
    {
        $request = $context['request'] ?? null;
        \assert($request instanceof Request);

        $file = $request->files->get('file');
        $url = trim((string) $request->request->get('url', ''));
        $this->validateInput($request, $file, $url);

        $user = $this->security->getUser();
        $provider = $user instanceof User ? $user : null;
        $sourceField = $file instanceof UploadedFile ? 'file' : 'url';

        try {
            if ($file instanceof UploadedFile) {
                $content = (string) file_get_contents($file->getPathname());
                $table = $this->parser->parse($content);
                $dataset = new Dataset(SourceType::File, $this->source->storeUpload($file), $provider);
            } else {
                $table = $this->parser->parse($this->source->download($url));
                $dataset = new Dataset(SourceType::Url, $url, $provider);
            }
        } catch (CsvException $e) {
            throw $this->violation($sourceField, $this->translator->trans($e->translationKey, $e->parameters));
        }

        $dataset->setName((string) $request->request->get('name'));
        $dataset->setDescription((string) $request->request->get('description', ''));
        $this->analyzer->createVariables($dataset, $table);

        try {
            return $this->persistProcessor->process($dataset, $operation, $uriVariables, $context);
        } catch (\Throwable $e) {
            $this->source->delete($dataset);

            throw $e;
        }
    }

    private function validateInput(Request $request, mixed $file, string $url): void
    {
        $violations = new ConstraintViolationList();
        $name = (string) $request->request->get('name', '');
        foreach ($this->validator->validate($name, [new Assert\NotBlank(), new Assert\Length(max: 120)]) as $violation) {
            $violations->add($this->withPath($violation, 'name'));
        }

        if (null === $file && '' === $url) {
            $violations->add($this->violationItem('file', $this->translator->trans('dataset.source.required', domain: 'validators')));
        } elseif (null !== $file && '' !== $url) {
            $violations->add($this->violationItem('file', $this->translator->trans('dataset.source.both', domain: 'validators')));
        } elseif (null !== $file) {
            foreach ($this->validator->validate($file, [new Assert\File(
                maxSize: DatasetSource::MAX_BYTES,
                // CSV files are often detected as text/plain; the parser checks the content anyway
                extensions: [
                    'csv' => ['text/csv', 'text/plain', 'application/csv', 'text/x-csv', 'application/vnd.ms-excel'],
                    'txt' => ['text/plain', 'text/csv'],
                ],
                extensionsMessage: 'dataset.file.extension',
            )]) as $violation) {
                $violations->add($this->withPath($violation, 'file'));
            }
        } else {
            foreach ($this->validator->validate($url, [new Assert\Url(protocols: ['http', 'https'], requireTld: true)]) as $violation) {
                $violations->add($this->withPath($violation, 'url'));
            }
        }

        if (\count($violations) > 0) {
            throw new ValidationException($violations);
        }
    }

    private function violation(string $path, string $message): ValidationException
    {
        return new ValidationException(new ConstraintViolationList([$this->violationItem($path, $message)]));
    }

    private function violationItem(string $path, string $message): ConstraintViolation
    {
        return new ConstraintViolation($message, $message, [], null, $path, null);
    }

    private function withPath(mixed $violation, string $path): ConstraintViolation
    {
        \assert($violation instanceof ConstraintViolation);

        return new ConstraintViolation(
            $violation->getMessage(),
            $violation->getMessageTemplate(),
            $violation->getParameters(),
            $violation->getRoot(),
            $path,
            $violation->getInvalidValue(),
            $violation->getPlural(),
            $violation->getCode(),
            $violation->getConstraint(),
        );
    }
}
