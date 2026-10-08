<?php

declare(strict_types=1);

namespace App\Tests\Dataset;

use App\Dataset\CsvException;
use App\Dataset\DatasetSource;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpClient\MockHttpClient;
use Symfony\Component\HttpClient\Response\MockResponse;

final class DatasetSourceTest extends TestCase
{
    public function testDownloadsAPublicCsv(): void
    {
        $source = $this->source(new MockResponse("a;b\n1;2\n"));

        self::assertSame("a;b\n1;2\n", $source->download('http://93.184.215.14/data.csv'));
    }

    /**
     * @return iterable<string, array{string}>
     */
    public static function internalUrls(): iterable
    {
        yield 'loopback' => ['http://127.0.0.1/data.csv'];
        yield 'private network' => ['http://10.0.0.5/data.csv'];
        yield 'docker network' => ['http://172.18.0.3/data.csv'];
        yield 'cloud metadata' => ['http://169.254.169.254/latest/meta-data'];
        yield 'ipv6 loopback' => ['http://[::1]/data.csv'];
    }

    #[DataProvider('internalUrls')]
    public function testRefusesInternalAddresses(string $url): void
    {
        $this->expectExceptionObject(new CsvException('dataset.source.unreachable'));

        $this->source(new MockResponse('secret'))->download($url);
    }

    public function testRefusesOtherSchemes(): void
    {
        $this->expectExceptionObject(new CsvException('dataset.source.bad_url'));

        $this->source(new MockResponse(''))->download('file:///etc/passwd');
    }

    public function testReportsHttpErrors(): void
    {
        try {
            $this->source(new MockResponse('', ['http_code' => 404]))->download('http://93.184.215.14/missing.csv');
            self::fail('A CsvException was expected.');
        } catch (CsvException $e) {
            self::assertSame(['dataset.source.http_status', ['%status%' => 404]], [$e->translationKey, $e->parameters]);
        }
    }

    public function testStopsOversizedDownloads(): void
    {
        $body = str_repeat("a;b\n", (int) (DatasetSource::MAX_BYTES / 4) + 10);

        try {
            $this->source(new MockResponse($body))->download('http://93.184.215.14/huge.csv');
            self::fail('A CsvException was expected.');
        } catch (CsvException $e) {
            self::assertSame('dataset.source.too_large', $e->translationKey);
        }
    }

    private function source(MockResponse $response): DatasetSource
    {
        return new DatasetSource(sys_get_temp_dir().'/evently-datasets-test', new MockHttpClient($response));
    }
}
