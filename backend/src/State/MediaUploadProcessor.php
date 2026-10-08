<?php

declare(strict_types=1);

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use ApiPlatform\Validator\Exception\ValidationException;
use App\Entity\Media;
use App\Entity\User;
use App\Media\MediaStorage;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Validator\Constraints as Assert;
use Symfony\Component\Validator\Validator\ValidatorInterface;

/**
 * POST /api/media (multipart/form-data): fields "file", optional "altFr" and "altEn".
 *
 * @implements ProcessorInterface<mixed, Media>
 */
final class MediaUploadProcessor implements ProcessorInterface
{
    public const MAX_SIZE = '10M';
    public const MAX_PIXELS = 25_000_000;

    /**
     * @param ProcessorInterface<Media, Media> $persistProcessor
     */
    public function __construct(
        #[Autowire(service: 'api_platform.doctrine.orm.state.persist_processor')]
        private readonly ProcessorInterface $persistProcessor,
        private readonly MediaStorage $storage,
        private readonly ValidatorInterface $validator,
        private readonly Security $security,
    ) {
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): Media
    {
        $request = $context['request'] ?? null;
        \assert($request instanceof Request);
        $file = $request->files->get('file');

        $violations = $this->validator->validate($file, [
            new Assert\NotNull(message: 'media.file.required'),
            new Assert\Image(
                maxSize: self::MAX_SIZE,
                mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
                mimeTypesMessage: 'media.file.type',
                maxPixels: self::MAX_PIXELS,
            ),
        ]);
        if (\count($violations) > 0) {
            throw new ValidationException($violations);
        }

        $user = $this->security->getUser();
        $media = $this->storage->store($file, $user instanceof User ? $user : null);
        $media->setAltFr((string) $request->request->get('altFr', ''));
        $media->setAltEn((string) $request->request->get('altEn', ''));

        try {
            return $this->persistProcessor->process($media, $operation, $uriVariables, $context);
        } catch (\Throwable $e) {
            $this->storage->delete($media);

            throw $e;
        }
    }
}
