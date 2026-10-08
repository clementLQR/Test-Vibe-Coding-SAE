<?php

declare(strict_types=1);

namespace App\Dataset;

use App\Entity\Dataset;
use Symfony\Contracts\Cache\CacheInterface;
use Symfony\Contracts\Cache\ItemInterface;

/**
 * Reads and parses the source of a data set, with a cache so that charts do not
 * re-read the CSV on every page view (eco-design). Uploaded files never change,
 * remote sources are refreshed regularly.
 */
final class DatasetReader
{
    private const REMOTE_TTL_SECONDS = 600;

    public function __construct(
        private readonly DatasetSource $source,
        private readonly CsvParser $parser,
        private readonly CacheInterface $cache,
    ) {
    }

    public function table(Dataset $dataset): CsvTable
    {
        return $this->cache->get($this->cacheKey($dataset), function (ItemInterface $item) use ($dataset): CsvTable {
            if (SourceType::Url === $dataset->getSourceType()) {
                $item->expiresAfter(self::REMOTE_TTL_SECONDS);
            }

            return $this->parser->parse($this->source->read($dataset), $dataset->getDelimiter());
        });
    }

    public function forget(Dataset $dataset): void
    {
        $this->cache->delete($this->cacheKey($dataset));
    }

    private function cacheKey(Dataset $dataset): string
    {
        return 'dataset_'.hash('xxh128', $dataset->getSourceType()->value.$dataset->getSourceUri().$dataset->getDelimiter());
    }
}
