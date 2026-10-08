<?php

declare(strict_types=1);

namespace App\Tests\Dataset;

use App\Dataset\CsvException;
use App\Dataset\CsvParser;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

final class CsvParserTest extends TestCase
{
    public function testParsesTheBriefFormat(): void
    {
        $table = (new CsvParser())->parse("Scène;Spectateurs\nGrande scène;1200\nChapiteau;850\n");

        self::assertSame(['Scène', 'Spectateurs'], $table->headers);
        self::assertSame([['Grande scène', '1200'], ['Chapiteau', '850']], $table->rows);
        self::assertSame(['1200', '850'], $table->column(1));
    }

    public function testHandlesBomWindowsLineEndingsQuotesBlankLinesAndTrailingSemicolons(): void
    {
        $csv = "\xEF\xBB\xBFNom;Note\r\n\r\n\"Dupont; Jean\";4,5;\r\nMartin;3\r\n";

        $table = (new CsvParser())->parse($csv);

        self::assertSame(['Nom', 'Note'], $table->headers);
        self::assertSame([['Dupont; Jean', '4,5'], ['Martin', '3']], $table->rows);
    }

    public function testConvertsWindows1252ToUtf8(): void
    {
        $table = (new CsvParser())->parse(mb_convert_encoding("Ville;Été\nOrléans;12\n", 'Windows-1252', 'UTF-8'));

        self::assertSame(['Ville', 'Été'], $table->headers);
        self::assertSame('Orléans', $table->rows[0][0]);
    }

    /**
     * @return iterable<string, array{string, string}>
     */
    public static function invalidFiles(): iterable
    {
        yield 'empty' => ['', 'dataset.csv.empty'];
        yield 'header only' => ["a;b\n", 'dataset.csv.no_rows'];
        yield 'comma separated' => ["a,b\n1,2\n", 'dataset.csv.wrong_delimiter'];
        yield 'empty header' => ["a;;c\n1;2;3\n", 'dataset.csv.empty_header'];
        yield 'duplicate header' => ["a;a\n1;2\n", 'dataset.csv.duplicate_header'];
        yield 'missing value' => ["a;b;c\n1;2;3\n4;5\n", 'dataset.csv.column_count'];
        yield 'extra value' => ["a;b\n1;2;3\n", 'dataset.csv.column_count'];
    }

    #[DataProvider('invalidFiles')]
    public function testRejectsUntrustworthyFiles(string $csv, string $expectedKey): void
    {
        try {
            (new CsvParser())->parse($csv);
            self::fail('A CsvException was expected.');
        } catch (CsvException $e) {
            self::assertSame($expectedKey, $e->translationKey);
        }
    }

    public function testReportsTheLineOfAMalformedRow(): void
    {
        try {
            (new CsvParser())->parse("a;b\n1;2\n\n3\n");
            self::fail('A CsvException was expected.');
        } catch (CsvException $e) {
            self::assertSame(['%line%' => 4, '%expected%' => 2, '%found%' => 1], $e->parameters);
        }
    }
}
