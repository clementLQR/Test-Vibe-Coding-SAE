<?php

declare(strict_types=1);

namespace App\Media;

use App\Entity\Media;
use App\Entity\User;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\Filesystem\Filesystem;
use Symfony\Component\HttpFoundation\File\UploadedFile;

/**
 * Converts uploaded images to resized WebP variants (eco-design: the original is not kept).
 */
final class MediaStorage
{
    public const MAIN_MAX_WIDTH = 1600;
    public const THUMB_MAX_WIDTH = 400;
    private const WEBP_QUALITY = 80;

    private readonly Filesystem $filesystem;

    public function __construct(
        #[Autowire('%app.media_dir%')]
        private readonly string $directory,
    ) {
        $this->filesystem = new Filesystem();
    }

    /**
     * The file must already be validated as a JPEG, PNG or WebP image.
     */
    public function store(UploadedFile $file, ?User $uploadedBy): Media
    {
        $source = $this->load($file->getPathname(), (string) $file->getMimeType());

        $key = bin2hex(random_bytes(16));
        $this->filesystem->mkdir($this->directory);

        $main = $this->resize($source, self::MAIN_MAX_WIDTH);
        $mainPath = $this->path($key);
        imagewebp($main, $mainPath, self::WEBP_QUALITY);
        imagewebp($this->resize($source, self::THUMB_MAX_WIDTH), $this->path($key, '-thumb'), self::WEBP_QUALITY);

        return new Media(
            storageKey: $key,
            originalName: mb_substr($file->getClientOriginalName(), 0, 255),
            size: (int) filesize($mainPath),
            width: imagesx($main),
            height: imagesy($main),
            uploadedBy: $uploadedBy,
        );
    }

    public function delete(Media $media): void
    {
        $this->filesystem->remove([$this->path($media->getStorageKey()), $this->path($media->getStorageKey(), '-thumb')]);
    }

    private function path(string $key, string $suffix = ''): string
    {
        return $this->directory.'/'.$key.$suffix.'.webp';
    }

    private function load(string $path, string $mimeType): \GdImage
    {
        $image = match ($mimeType) {
            'image/jpeg' => @imagecreatefromjpeg($path),
            'image/png' => @imagecreatefrompng($path),
            'image/webp' => @imagecreatefromwebp($path),
            default => false,
        };

        if (false === $image) {
            throw new \InvalidArgumentException(sprintf('Unsupported or corrupted image (%s).', $mimeType));
        }

        // Keep PNG/WebP transparency when encoding to WebP
        imagepalettetotruecolor($image);
        imagealphablending($image, false);
        imagesavealpha($image, true);

        return 'image/jpeg' === $mimeType ? $this->applyExifOrientation($image, $path) : $image;
    }

    private function resize(\GdImage $source, int $maxWidth): \GdImage
    {
        $width = imagesx($source);
        if ($width <= $maxWidth) {
            return $source;
        }

        $newHeight = max(1, (int) round(imagesy($source) * $maxWidth / $width));
        $resized = imagescale($source, $maxWidth, $newHeight, \IMG_BICUBIC);
        if (false === $resized) {
            throw new \RuntimeException('Image resize failed.');
        }
        imagesavealpha($resized, true);

        return $resized;
    }

    /** Phone photos are often stored rotated, with the real orientation in their EXIF data. */
    private function applyExifOrientation(\GdImage $image, string $path): \GdImage
    {
        if (!\function_exists('exif_read_data')) {
            return $image;
        }

        $exif = @exif_read_data($path);
        $angle = match (\is_array($exif) ? ($exif['Orientation'] ?? 1) : 1) {
            3 => 180,
            6 => -90,
            8 => 90,
            default => 0,
        };

        if (0 === $angle) {
            return $image;
        }

        $rotated = imagerotate($image, $angle, 0);

        return false === $rotated ? $image : $rotated;
    }
}
