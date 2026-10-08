<?php

declare(strict_types=1);

namespace App\Tests\Api;

use App\Entity\User;
use App\Tests\ApiTestCase;

final class ArticleTest extends ApiTestCase
{
    use ContentFixtures;

    private User $author;

    protected function setUp(): void
    {
        parent::setUp();
        $this->author = $this->createUser('author@example.com', ['ROLE_AUTHOR'], 'Ana');
    }

    public function testAnAuthorWritesAClassicArticle(): void
    {
        $this->client->loginUser($this->author);
        $media = $this->media();

        $json = $this->save('POST', '/api/articles', [
            'title' => 'Le festival en images',
            'summary' => 'Trois jours de fête.',
            'blocks' => [
                ['type' => 'heading', 'headingLevel' => 2, 'text' => 'Ambiance'],
                ['type' => 'text', 'text' => 'Une **belle** édition.'],
                ['type' => 'image', 'mediaId' => $media->getId(), 'text' => 'La scène au coucher du soleil'],
            ],
        ]);

        self::assertResponseStatusCodeSame(201);
        self::assertSame(['le-festival-en-images', 'classic', 'draft', 'Ana'], [$json['slug'], $json['type'], $json['status'], $json['authorName']]);
        self::assertSame(['heading', 'text', 'image'], array_column($json['blocks'], 'type'));
        self::assertSame([0, 1, 2], array_column($json['blocks'], 'position'));
        self::assertSame(['La scène', 'The stage'], [$json['blocks'][2]['media']['altFr'], $json['blocks'][2]['media']['altEn']]);
    }

    public function testBlocksAreValidated(): void
    {
        $this->client->loginUser($this->author);
        $chart = $this->visualization($this->author);

        $json = $this->save('POST', '/api/articles', [
            'title' => 'Brouillon',
            'blocks' => [
                ['type' => 'text', 'text' => '   '],
                ['type' => 'image', 'mediaId' => $this->media(withAlt: false)->getId()],
                ['type' => 'visualization', 'visualizationId' => $chart->getId()],
                ['type' => 'heading', 'headingLevel' => 1, 'text' => 'Trop grand'],
            ],
        ]);

        self::assertResponseStatusCodeSame(422);
        // The heading level is checked first (input), the other rules after
        self::assertSame(['blocks[3].headingLevel'], self::violationPaths($json));

        $json = $this->save('POST', '/api/articles', [
            'title' => 'Brouillon',
            'blocks' => [
                ['type' => 'text', 'text' => '   '],
                ['type' => 'image', 'mediaId' => $this->media(withAlt: false)->getId()],
                ['type' => 'visualization', 'visualizationId' => $chart->getId()],
            ],
        ]);
        self::assertResponseStatusCodeSame(422);
        self::assertSame(['blocks[0].text', 'blocks[1].mediaId', 'blocks[2]'], self::violationPaths($json));
    }

    public function testADashboardNeedsAChartToBePublished(): void
    {
        $this->client->loginUser($this->author);
        $chart = $this->visualization($this->author);

        $this->save('POST', '/api/articles', ['title' => 'Bilan', 'type' => 'dashboard', 'status' => 'published', 'blocks' => [['type' => 'text', 'text' => 'Sans graphique']]]);
        self::assertResponseStatusCodeSame(422);

        $json = $this->save('POST', '/api/articles', [
            'title' => 'Bilan',
            'type' => 'dashboard',
            'status' => 'published',
            'blocks' => [['type' => 'visualization', 'visualizationId' => $chart->getId()]],
        ]);
        self::assertResponseStatusCodeSame(201);
        self::assertNotNull($json['publishedAt']);
        self::assertSame('Spectateurs par scène', $json['blocks'][0]['visualization']['title']);
        self::assertSame(['x' => 'Scène', 'y' => 'Spectateurs'], $json['blocks'][0]['visualization']['mapping']);
    }

    public function testUpdatingKeepsExistingBlocksAndTheirIds(): void
    {
        $this->client->loginUser($this->author);
        $json = $this->save('POST', '/api/articles', ['title' => 'Programme', 'blocks' => [
            ['type' => 'heading', 'text' => 'Vendredi'],
            ['type' => 'text', 'text' => 'Ouverture'],
            ['type' => 'text', 'text' => 'À supprimer'],
        ]]);
        [$heading, $text] = array_column($json['blocks'], 'id');

        $json = $this->save('PUT', '/api/articles/'.$json['id'], ['title' => 'Programme', 'blocks' => [
            ['id' => $text, 'type' => 'text', 'text' => 'Ouverture des portes à 16 h'],
            ['id' => $heading, 'type' => 'heading', 'headingLevel' => 3, 'text' => 'Vendredi'],
            ['type' => 'text', 'text' => 'Nouveau'],
        ]]);

        self::assertResponseIsSuccessful();
        self::assertSame($text, $json['blocks'][0]['id']);
        self::assertSame($heading, $json['blocks'][1]['id']);
        self::assertSame([3, 'Ouverture des portes à 16 h'], [$json['blocks'][1]['headingLevel'], $json['blocks'][0]['text']]);
        self::assertCount(3, $json['blocks']);
        self::assertSame(1, (int) $this->em()->getConnection()->fetchOne('SELECT COUNT(*) FROM block WHERE text = ?', ['Nouveau']));
        self::assertSame(0, (int) $this->em()->getConnection()->fetchOne('SELECT COUNT(*) FROM block WHERE text = ?', ['À supprimer']));
    }

    public function testSlugsAreUniqueAndStableOncePublished(): void
    {
        $this->client->loginUser($this->author);
        $first = $this->save('POST', '/api/articles', ['title' => 'Bilan 2027', 'status' => 'published']);
        $second = $this->save('POST', '/api/articles', ['title' => 'Bilan 2027']);
        self::assertSame(['bilan-2027', 'bilan-2027-2'], [$first['slug'], $second['slug']]);

        $renamed = $this->save('PUT', '/api/articles/'.$first['id'], ['title' => 'Bilan final', 'status' => 'published']);
        self::assertSame('bilan-2027', $renamed['slug']);

        $draft = $this->save('PUT', '/api/articles/'.$second['id'], ['title' => 'Brouillon renommé']);
        self::assertSame('brouillon-renomme', $draft['slug']);
    }

    public function testAuthorsEditTheirOwnArticlesAndEditorsAll(): void
    {
        $this->client->loginUser($this->author);
        $id = $this->save('POST', '/api/articles', ['title' => 'Mon article'])['id'];

        $this->client->loginUser($this->createUser('other@example.com', ['ROLE_AUTHOR']));
        $this->save('PUT', "/api/articles/$id", ['title' => 'Volé']);
        self::assertResponseStatusCodeSame(403);
        $this->jsonRequest('DELETE', "/api/articles/$id");
        self::assertResponseStatusCodeSame(403);

        $this->client->loginUser($this->createUser('editor@example.com', ['ROLE_EDITOR']));
        $this->save('PUT', "/api/articles/$id", ['title' => 'Relu par l’éditeur']);
        self::assertResponseIsSuccessful();
    }

    public function testVisitorsOnlySeePublishedArticles(): void
    {
        $this->client->loginUser($this->author);
        $draft = $this->save('POST', '/api/articles', ['title' => 'Brouillon'])['id'];
        $this->save('POST', '/api/articles', ['title' => 'En ligne', 'status' => 'published']);

        $this->client->loginUser($this->createUser('other@example.com', ['ROLE_AUTHOR']));
        $this->save('POST', '/api/articles', ['title' => 'Brouillon d’un autre']);

        $this->client->loginUser($this->author);
        self::assertEqualsCanonicalizing(['Brouillon', 'En ligne'], array_column($this->jsonRequest('GET', '/api/articles'), 'title'));

        $this->client->loginUser($this->createUser('editor@example.com', ['ROLE_EDITOR']));
        self::assertCount(3, $this->jsonRequest('GET', '/api/articles'));

        $this->client->getCookieJar()->clear();
        self::assertSame(['En ligne'], array_column($this->jsonRequest('GET', '/api/articles'), 'title'));
        $this->jsonRequest('GET', "/api/articles/$draft");
        self::assertResponseStatusCodeSame(401);
    }

    public function testMediaAndChartsUsedInAnArticleCannotBeDeleted(): void
    {
        $this->client->loginUser($this->author);
        $media = $this->media();
        $chart = $this->visualization($this->author);
        $this->save('POST', '/api/articles', ['title' => 'Bilan', 'type' => 'dashboard', 'blocks' => [
            ['type' => 'image', 'mediaId' => $media->getId()],
            ['type' => 'visualization', 'visualizationId' => $chart->getId()],
        ]]);

        $this->client->loginUser($this->createUser('editor@example.com', ['ROLE_EDITOR']));
        $json = $this->jsonRequest('DELETE', '/api/media/'.$media->getId(), headers: ['HTTP_ACCEPT_LANGUAGE' => 'fr']);
        self::assertResponseStatusCodeSame(409);
        self::assertSame('Cette image est utilisée dans : Bilan. Retirez-la de ces articles avant de la supprimer.', $json['detail']);

        $this->jsonRequest('DELETE', '/api/visualizations/'.$chart->getId());
        self::assertResponseStatusCodeSame(409);
    }

    /**
     * @param array<string, mixed> $article
     *
     * @return array<mixed>
     */
    private function save(string $method, string $uri, array $article): array
    {
        return $this->jsonRequest($method, $uri, $article, contentType: 'application/ld+json');
    }
}
