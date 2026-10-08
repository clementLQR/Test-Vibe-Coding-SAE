<?php

declare(strict_types=1);

namespace App\Tests\Api;

use App\Tests\ApiTestCase;

final class VisualizationTest extends ApiTestCase
{
    use ContentFixtures;

    public function testChartTypesArePublicAndDescribeRolesAndOptions(): void
    {
        $json = $this->jsonRequest('GET', '/api/chart-types');

        self::assertResponseIsSuccessful();
        self::assertSame(['bar', 'line', 'pie', 'histogram', 'scatter', 'heatmap', 'treemap'], array_column($json, 'name'));
        self::assertSame(
            [['name' => 'category', 'variableType' => 'categorical', 'required' => true], ['name' => 'value', 'variableType' => 'numerical', 'required' => false]],
            $json[2]['roles'],
        );
        self::assertSame(['name' => 'bins', 'default' => 10, 'min' => 3, 'max' => 50], $json[3]['options'][0]);
    }

    public function testAnAuthorCreatesAChart(): void
    {
        $author = $this->createUser('author@example.com', ['ROLE_AUTHOR']);
        $this->client->loginUser($author);
        $dataset = $this->validatedDataset();

        $json = $this->jsonRequest('POST', '/api/visualizations', $this->payload($dataset->getId()), contentType: 'application/ld+json');

        self::assertResponseStatusCodeSame(201);
        self::assertSame(['pie', $dataset->getId(), $author->getId()], [$json['chartType'], $json['datasetId'], $json['createdById']]);
        // MySQL reorders JSON object keys: the order of roles does not matter
        self::assertEquals(['category' => 'Scène', 'value' => 'Spectateurs'], $json['mapping']);
    }

    public function testVariablesMustMatchTheRolesOfTheChart(): void
    {
        $this->client->loginUser($this->createUser('author@example.com', ['ROLE_AUTHOR']));
        $dataset = $this->validatedDataset();

        $json = $this->jsonRequest('POST', '/api/visualizations', $this->payload($dataset->getId(), [
            'chartType' => 'scatter',
            'mapping' => ['x' => 'Scène', 'color' => 'Inconnue', 'z' => 'Jour'],
            'options' => ['donut' => true],
            'colors' => ['#12345', '#abcdef'],
        ]), ['HTTP_ACCEPT_LANGUAGE' => 'fr'], 'application/ld+json');

        self::assertResponseStatusCodeSame(422);
        self::assertEqualsCanonicalizing(
            ['mapping[z]', 'mapping[x]', 'mapping[y]', 'mapping[color]', 'options[donut]', 'colors[0]'],
            self::violationPaths($json),
        );
        $messages = array_column($json['violations'], 'message', 'propertyPath');
        self::assertSame('« Scène » est catégorielle : ce rôle attend une variable numérique.', $messages['mapping[x]']);
    }

    public function testOnlyValidatedDatasetsCanBeCharted(): void
    {
        $this->client->loginUser($this->createUser('author@example.com', ['ROLE_AUTHOR']));
        $dataset = $this->validatedDataset(validated: false);

        $json = $this->jsonRequest('POST', '/api/visualizations', $this->payload($dataset->getId()), contentType: 'application/ld+json');

        self::assertResponseStatusCodeSame(422);
        self::assertSame(['dataset'], self::violationPaths($json));
    }

    public function testSubscribersCannotCreateCharts(): void
    {
        $this->client->loginUser($this->createUser('sam@example.com'));
        $dataset = $this->validatedDataset();

        $this->jsonRequest('POST', '/api/visualizations', $this->payload($dataset->getId()), contentType: 'application/ld+json');

        self::assertResponseStatusCodeSame(403);
    }

    public function testOnlyTheCreatorOrAnEditorEditsAChart(): void
    {
        $chart = $this->visualization($this->createUser('author@example.com', ['ROLE_AUTHOR']));
        $id = $chart->getId();

        $this->client->loginUser($this->createUser('other@example.com', ['ROLE_AUTHOR']));
        $this->jsonRequest('PATCH', "/api/visualizations/$id", ['title' => 'Piraté'], contentType: 'application/merge-patch+json');
        self::assertResponseStatusCodeSame(403);

        $this->client->loginUser($this->createUser('editor@example.com', ['ROLE_EDITOR']));
        $json = $this->jsonRequest('PATCH', "/api/visualizations/$id", ['title' => 'Public par scène'], contentType: 'application/merge-patch+json');
        self::assertResponseIsSuccessful();
        self::assertSame('Public par scène', $json['title']);
    }

    public function testChartsAreReadableByVisitors(): void
    {
        $id = $this->visualization(null)->getId();

        $json = $this->jsonRequest('GET', "/api/visualizations/$id");

        self::assertResponseIsSuccessful();
        self::assertSame('bar', $json['chartType']);
    }

    public function testADatasetUsedByAChartCannotBeDeleted(): void
    {
        $dataset = $this->validatedDataset();
        $this->visualization(null, $dataset);
        $this->client->loginUser($this->createUser('admin@example.com', ['ROLE_ADMIN']));

        $json = $this->jsonRequest('DELETE', '/api/datasets/'.$dataset->getId(), headers: ['HTTP_ACCEPT_LANGUAGE' => 'en']);

        self::assertResponseStatusCodeSame(409);
        self::assertSame('This data set is used by 1 chart(s). Delete them before deleting the data set.', $json['detail']);
    }

    /**
     * @param array<string, mixed> $override
     *
     * @return array<string, mixed>
     */
    private function payload(?int $datasetId, array $override = []): array
    {
        return [
            'title' => 'Part des scènes',
            'description' => 'La grande scène réunit près de la moitié du public.',
            'chartType' => 'pie',
            'dataset' => '/api/datasets/'.$datasetId,
            'mapping' => ['category' => 'Scène', 'value' => 'Spectateurs'],
            'colors' => ['#1d4ed8', '#f59e0b'],
            'options' => ['aggregation' => 'sum', 'donut' => true],
            ...$override,
        ];
    }
}
