<?php

declare(strict_types=1);

namespace App\Tests\Api;

use App\Tests\ApiTestCase;

final class RatingTest extends ApiTestCase
{
    /** @var array<mixed> */
    private array $article;

    protected function setUp(): void
    {
        parent::setUp();
        $this->client->loginUser($this->createUser('author@example.com', ['ROLE_AUTHOR']));
        $this->article = $this->jsonRequest('POST', '/api/articles', [
            'title' => 'Bilan',
            'status' => 'published',
            'blocks' => [['type' => 'text', 'text' => 'Premier'], ['type' => 'text', 'text' => 'Second']],
        ], contentType: 'application/ld+json');
    }

    public function testSubscribersRateBlocksAndCanChangeTheirMind(): void
    {
        [$first, $second] = array_column($this->article['blocks'], 'id');

        $this->client->loginUser($this->createUser('sam@example.com'));
        // JSON turns 4.0 into 4: compare values, not PHP types
        self::assertEquals(['average' => 4, 'count' => 1, 'mine' => 4], $this->rate($first, 4));
        self::assertEquals(['average' => 2, 'count' => 1, 'mine' => 2], $this->rate($first, 2));

        $this->client->loginUser($this->createUser('lou@example.com'));
        self::assertEquals(['average' => 3.5, 'count' => 2, 'mine' => 5], $this->rate($first, 5));
        $this->rate($second, 0);

        $summary = $this->jsonRequest('GET', '/api/articles/'.$this->article['id'].'/ratings')['blocks'];
        self::assertEquals(['average' => 3.5, 'count' => 2, 'mine' => 5], $summary[$first]);
        self::assertEquals(['average' => 0, 'count' => 1, 'mine' => 0], $summary[$second]);

        $this->client->getCookieJar()->clear();
        $summary = $this->jsonRequest('GET', '/api/articles/'.$this->article['id'].'/ratings')['blocks'];
        self::assertNull($summary[$first]['mine'], 'visitors see averages only');
    }

    public function testVisitorsMustLogInAndScoresStayBetweenZeroAndFive(): void
    {
        $block = $this->article['blocks'][0]['id'];

        $this->client->getCookieJar()->clear();
        $this->jsonRequest('PUT', "/api/blocks/$block/rating", ['score' => 3]);
        self::assertResponseStatusCodeSame(401);

        $this->client->loginUser($this->createUser('sam@example.com'));
        foreach ([6, -1, '3', 2.5] as $score) {
            $this->jsonRequest('PUT', "/api/blocks/$block/rating", ['score' => $score]);
            self::assertResponseStatusCodeSame(422);
        }
    }

    public function testOnlyPublishedArticlesCanBeRated(): void
    {
        $draft = $this->jsonRequest('POST', '/api/articles', ['title' => 'Brouillon', 'blocks' => [['type' => 'text', 'text' => 'x']]], contentType: 'application/ld+json');

        $this->client->loginUser($this->createUser('sam@example.com'));
        $this->jsonRequest('PUT', '/api/blocks/'.$draft['blocks'][0]['id'].'/rating', ['score' => 5]);

        self::assertResponseStatusCodeSame(422);
    }

    /**
     * @return array<mixed>
     */
    private function rate(int $block, int $score): array
    {
        $json = $this->jsonRequest('PUT', "/api/blocks/$block/rating", ['score' => $score]);
        self::assertResponseIsSuccessful();

        return $json;
    }
}
