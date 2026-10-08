<?php

declare(strict_types=1);

namespace App\Tests\Dataset;

use App\Dataset\DatasetAnalyzer;
use App\Dataset\NumberParser;
use App\Dataset\VariableType;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

final class NumberParserTest extends TestCase
{
    /**
     * @return iterable<array{string, float|null}>
     */
    public static function values(): iterable
    {
        yield ['12', 12.0];
        yield ['-3,5', -3.5];
        yield ['4.25', 4.25];
        yield ['1 234,5', 1234.5];
        yield ["1\u{202F}234", 1234.0];
        yield ['1.234,5', 1234.5];
        yield ['1,234.5', 1234.5];
        yield ['  7  ', 7.0];
        yield ['', null];
        yield ['abc', null];
        yield ['12:30', null];
        yield ['1,2,3', null];
        yield ['2027-03-01', null];
    }

    #[DataProvider('values')]
    public function testParsesFrenchAndEnglishNumbers(string $raw, ?float $expected): void
    {
        self::assertSame($expected, NumberParser::parse($raw));
    }

    public function testDetectsTypesAndIgnoresEmptyCells(): void
    {
        $analyzer = new DatasetAnalyzer();

        self::assertSame(VariableType::Numerical, $analyzer->detectType(['1', '', '2,5']));
        self::assertSame(VariableType::Categorical, $analyzer->detectType(['1', 'N/A', '2']));
        self::assertSame(VariableType::Categorical, $analyzer->detectType(['', '']));
    }

    public function testComputesColumnStatistics(): void
    {
        $stats = (new DatasetAnalyzer())->stats(['10', '', '20', '30', '20']);

        self::assertSame(4, $stats['filled']);
        self::assertSame(1, $stats['empty']);
        self::assertSame(3, $stats['distinct']);
        self::assertSame(4, $stats['numeric']);
        self::assertSame([10.0, 30.0, 20.0], [$stats['min'], $stats['max'], $stats['mean']]);
    }
}
