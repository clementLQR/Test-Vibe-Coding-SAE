<?php

declare(strict_types=1);

namespace App\Tests\Api;

use App\Entity\User;
use App\Tests\ApiTestCase;
use Symfony\Component\HttpFoundation\File\UploadedFile;

final class DatasetTest extends ApiTestCase
{
    private const CSV = "Jour;Scène;Spectateurs;Dossard\nVendredi;Grande scène;1200;1\nSamedi;Chapiteau;850,5;2\nDimanche;Chapiteau;;3\n";

    private User $provider;

    protected function setUp(): void
    {
        parent::setUp();
        $this->provider = $this->createUser('provider@example.com', ['ROLE_DATA_PROVIDER'], 'Pia');
    }

    protected function tearDown(): void
    {
        $dir = (string) static::getContainer()->getParameter('app.dataset_dir');
        array_map('unlink', glob($dir.'/*.csv') ?: []);
        parent::tearDown();
    }

    public function testAProviderImportsACsvAndGetsTheDetectedVariables(): void
    {
        $this->client->loginUser($this->provider);

        $json = $this->import('Affluence');

        self::assertResponseStatusCodeSame(201);
        self::assertSame(['Affluence', 'file', null, 'pending', 3, 'Pia'], [$json['name'], $json['sourceType'], $json['sourceUrl'], $json['status'], $json['rowCount'], $json['providerName']]);
        self::assertSame(
            [['Jour', 'categorical'], ['Scène', 'categorical'], ['Spectateurs', 'numerical'], ['Dossard', 'numerical']],
            array_map(static fn (array $v): array => [$v['name'], $v['type']], $json['variables']),
        );
        self::assertFileExists((string) static::getContainer()->getParameter('app.dataset_dir').'/'.$this->storedFileName((int) $json['id']));
    }

    public function testOnlyDataProvidersCanImport(): void
    {
        $this->client->loginUser($this->createUser('author@example.com', ['ROLE_AUTHOR']));
        $this->import('Affluence');
        self::assertResponseStatusCodeSame(403);

        $this->client->loginUser($this->createUser('sam@example.com'));
        $this->jsonRequest('GET', '/api/datasets');
        self::assertResponseStatusCodeSame(403);
    }

    public function testAnUnreadableFileIsRejectedWithAnExplanation(): void
    {
        $this->client->loginUser($this->provider);

        $json = $this->import('Cassé', "a;b\n1;2\n3\n", ['HTTP_ACCEPT_LANGUAGE' => 'fr']);

        self::assertResponseStatusCodeSame(422);
        self::assertSame('file', $json['violations'][0]['propertyPath']);
        self::assertSame('Ligne 3 : 1 valeurs au lieu de 2.', $json['violations'][0]['message']);
    }

    public function testASourceIsRequiredAndUrlsMustBeHttp(): void
    {
        $this->client->loginUser($this->provider);

        $this->client->request('POST', '/api/datasets', ['name' => ''], [], ['HTTP_ACCEPT' => 'application/json']);
        self::assertResponseStatusCodeSame(422);
        self::assertEqualsCanonicalizing(['name', 'file'], self::violationPaths($this->responseJson()));

        $this->client->request('POST', '/api/datasets', ['name' => 'Distant', 'url' => 'ftp://example.org/data.csv'], [], ['HTTP_ACCEPT' => 'application/json']);
        self::assertResponseStatusCodeSame(422);
        self::assertSame(['url'], self::violationPaths($this->responseJson()));
    }

    public function testPreviewShowsRowsTypesAndStatisticsToTheOwnerOnly(): void
    {
        $this->client->loginUser($this->provider);
        $id = $this->import('Affluence')['id'];

        $json = $this->jsonRequest('GET', "/api/datasets/$id/preview");
        self::assertResponseIsSuccessful();
        self::assertSame(3, $json['rowCount']);
        self::assertSame(['Vendredi', 'Grande scène', '1200', '1'], $json['rows'][0]);
        // JSON turns 1200.0 into 1200: compare values, not PHP types
        self::assertEquals(['numerical', 2, 1, 850.5, 1200], [
            $json['columns'][2]['detectedType'],
            $json['columns'][2]['stats']['numeric'],
            $json['columns'][2]['stats']['empty'],
            $json['columns'][2]['stats']['min'],
            $json['columns'][2]['stats']['max'],
        ]);

        $this->client->loginUser($this->createUser('other@example.com', ['ROLE_DATA_PROVIDER']));
        $this->jsonRequest('GET', "/api/datasets/$id/preview");
        self::assertResponseStatusCodeSame(403);
    }

    public function testTheProviderConfirmsVariablesThenValidates(): void
    {
        $this->client->loginUser($this->provider);
        $dataset = $this->import('Affluence');
        $id = $dataset['id'];
        [$day, , $spectators, $bib] = array_column($dataset['variables'], 'id');

        // Dossard is an identifier, not a quantity; "Jour" cannot be numerical
        $json = $this->jsonRequest('PUT', "/api/datasets/$id/variables", ['variables' => [
            ['id' => $bib, 'type' => 'categorical', 'label' => 'N° de dossard'],
            ['id' => $day, 'type' => 'numerical'],
        ]]);
        self::assertResponseIsSuccessful();
        self::assertSame(['N° de dossard', 'categorical'], [$json['variables'][3]['label'], $json['variables'][3]['type']]);

        $json = $this->jsonRequest('POST', "/api/datasets/$id/validate", headers: ['HTTP_ACCEPT_LANGUAGE' => 'en']);
        self::assertResponseStatusCodeSame(422);
        self::assertSame('"Jour" contains no number: it cannot be numerical.', $json['violations'][0]['message']);

        $this->jsonRequest('PUT', "/api/datasets/$id/variables", ['variables' => [['id' => $day, 'type' => 'categorical']]]);
        $json = $this->jsonRequest('POST', "/api/datasets/$id/validate");
        self::assertResponseIsSuccessful();
        self::assertSame('validated', $json['status']);
        self::assertNotNull($json['validatedAt']);

        // Once validated, labels can change but types are locked
        $json = $this->jsonRequest('PUT', "/api/datasets/$id/variables", ['variables' => [['id' => $spectators, 'type' => 'categorical']]]);
        self::assertResponseStatusCodeSame(422);
        self::assertSame(['variables[0].type'], self::violationPaths($json));

        $this->jsonRequest('PUT', "/api/datasets/$id/variables", ['variables' => [['id' => $spectators, 'label' => 'Public']]]);
        self::assertResponseIsSuccessful();
    }

    public function testAuthorsOnlySeeValidatedDatasets(): void
    {
        $this->client->loginUser($this->provider);
        $this->import('Brouillon');
        $validated = $this->import('Publié')['id'];
        $this->jsonRequest('POST', "/api/datasets/$validated/validate");
        self::assertCount(2, $this->jsonRequest('GET', '/api/datasets'));

        $this->client->loginUser($this->createUser('author@example.com', ['ROLE_AUTHOR']));
        self::assertSame(['Publié'], array_column($this->jsonRequest('GET', '/api/datasets'), 'name'));
    }

    public function testTypedDataIsPublicOnceValidated(): void
    {
        $this->client->loginUser($this->provider);
        $id = $this->import('Affluence')['id'];

        // Forget the session: the next requests are anonymous
        $this->client->getCookieJar()->clear();
        $this->jsonRequest('GET', "/api/datasets/$id/data");
        self::assertResponseStatusCodeSame(401);

        $this->client->loginUser($this->provider);
        $this->jsonRequest('POST', "/api/datasets/$id/validate");
        $this->client->getCookieJar()->clear();

        $json = $this->jsonRequest('GET', "/api/datasets/$id/data");
        self::assertResponseIsSuccessful();
        self::assertSame('Spectateurs', $json['variables'][2]['name']);
        self::assertEquals(
            [['Vendredi', 'Grande scène', 1200, 1], ['Samedi', 'Chapiteau', 850.5, 2], ['Dimanche', 'Chapiteau', null, 3]],
            $json['rows'],
        );
        self::assertNull($json['rows'][2][2], 'an empty numerical cell stays null, not 0');
    }

    public function testOnlyTheOwnerOrAnAdminDeletesAndTheFileIsRemoved(): void
    {
        $this->client->loginUser($this->provider);
        $id = (int) $this->import('Affluence')['id'];
        $path = static::getContainer()->getParameter('app.dataset_dir').'/'.$this->storedFileName($id);

        $this->client->loginUser($this->createUser('other@example.com', ['ROLE_DATA_PROVIDER']));
        $this->jsonRequest('DELETE', "/api/datasets/$id");
        self::assertResponseStatusCodeSame(403);

        $this->client->loginUser($this->createUser('admin@example.com', ['ROLE_ADMIN']));
        $this->jsonRequest('DELETE', "/api/datasets/$id");
        self::assertResponseStatusCodeSame(204);
        self::assertFileDoesNotExist($path);
    }

    /**
     * @param array<string, string> $headers
     *
     * @return array<mixed>
     */
    private function import(string $name, string $csv = self::CSV, array $headers = []): array
    {
        $path = (string) tempnam(sys_get_temp_dir(), 'csv');
        file_put_contents($path, $csv);
        $this->client->request(
            'POST',
            '/api/datasets',
            ['name' => $name],
            ['file' => new UploadedFile($path, 'data.csv', 'text/csv', test: true)],
            ['HTTP_ACCEPT' => 'application/json', ...$headers],
        );

        return $this->responseJson();
    }

    private function storedFileName(int $id): string
    {
        $uri = $this->em()->getConnection()->fetchOne('SELECT source_uri FROM dataset WHERE id = ?', [$id]);

        return (string) $uri;
    }
}
