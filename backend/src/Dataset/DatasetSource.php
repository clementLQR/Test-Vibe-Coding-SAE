<?php

declare(strict_types=1);

namespace App\Dataset;

use App\Entity\Dataset;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\Filesystem\Filesystem;
use Symfony\Component\HttpClient\NoPrivateNetworkHttpClient;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Contracts\HttpClient\Exception\ExceptionInterface as HttpException;
use Symfony\Contracts\HttpClient\HttpClientInterface;

/**
 * Raw access to the CSV of a data set: uploaded files are kept on disk outside
 * the public folder, remote URLs are downloaded on demand.
 */
final class DatasetSource
{
    public const MAX_BYTES = 5 * 1024 * 1024;
    private const TIMEOUT_SECONDS = 10;

    private readonly Filesystem $filesystem;
    private readonly HttpClientInterface $httpClient;

    public function __construct(
        #[Autowire('%app.dataset_dir%')]
        private readonly string $directory,
        HttpClientInterface $httpClient,
    ) {
        $this->filesystem = new Filesystem();
        // SSRF protection: refuses private, loopback and link-local addresses, including after redirects
        $this->httpClient = new NoPrivateNetworkHttpClient($httpClient);
    }

    /** Moves an uploaded CSV into the storage and returns its file name. */
    public function storeUpload(UploadedFile $file): string
    {
        $name = bin2hex(random_bytes(16)).'.csv';
        $this->filesystem->mkdir($this->directory);
        $file->move($this->directory, $name);

        return $name;
    }

    /** Copies a CSV shipped with the application (demo content) into the storage. */
    public function storeCopy(string $path): string
    {
        $name = bin2hex(random_bytes(16)).'.csv';
        $this->filesystem->copy($path, $this->directory.'/'.$name);

        return $name;
    }

    public function read(Dataset $dataset): string
    {
        return match ($dataset->getSourceType()) {
            SourceType::File => $this->readFile($dataset->getSourceUri()),
            SourceType::Url => $this->download($dataset->getSourceUri()),
        };
    }

    public function readFile(string $name): string
    {
        $content = @file_get_contents($this->directory.'/'.basename($name));
        if (false === $content) {
            throw new CsvException('dataset.source.missing_file');
        }

        return $content;
    }

    public function download(string $url): string
    {
        $scheme = parse_url($url, \PHP_URL_SCHEME);
        if (!\in_array($scheme, ['http', 'https'], true)) {
            throw new CsvException('dataset.source.bad_url');
        }

        try {
            $response = $this->httpClient->request('GET', $url, [
                'timeout' => self::TIMEOUT_SECONDS,
                'max_duration' => self::TIMEOUT_SECONDS * 2,
                'max_redirects' => 3,
                'headers' => ['Accept' => 'text/csv, text/plain;q=0.9, */*;q=0.5'],
                'on_progress' => static function (int $downloaded): void {
                    if ($downloaded > self::MAX_BYTES) {
                        throw new CsvException('dataset.source.too_large', ['%max%' => self::MAX_BYTES / 1024 / 1024]);
                    }
                },
            ]);

            if (200 !== $response->getStatusCode()) {
                throw new CsvException('dataset.source.http_status', ['%status%' => $response->getStatusCode()]);
            }

            return $response->getContent();
        } catch (CsvException $e) {
            throw $e;
        } catch (HttpException $e) {
            // The size check above surfaces wrapped in a transport exception
            if ($e->getPrevious() instanceof CsvException) {
                throw $e->getPrevious();
            }

            throw new CsvException('dataset.source.unreachable', previous: $e);
        }
    }

    public function delete(Dataset $dataset): void
    {
        if (SourceType::File === $dataset->getSourceType()) {
            $this->filesystem->remove($this->directory.'/'.basename($dataset->getSourceUri()));
        }
    }
}
