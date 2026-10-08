<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20261008174731 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Articles, blocks and visualizations';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE article (id INT AUTO_INCREMENT NOT NULL, title VARCHAR(200) NOT NULL, slug VARCHAR(220) NOT NULL, summary LONGTEXT NOT NULL, type VARCHAR(12) NOT NULL, status VARCHAR(12) NOT NULL, locale VARCHAR(2) NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL, published_at DATETIME DEFAULT NULL, author_id INT DEFAULT NULL, UNIQUE INDEX UNIQ_23A0E66989D9B62 (slug), INDEX IDX_23A0E66F675F31B (author_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE block (id INT AUTO_INCREMENT NOT NULL, position INT NOT NULL, type VARCHAR(15) NOT NULL, heading_level SMALLINT DEFAULT NULL, text LONGTEXT DEFAULT NULL, article_id INT NOT NULL, media_id INT DEFAULT NULL, visualization_id INT DEFAULT NULL, INDEX IDX_831B97227294869C (article_id), INDEX IDX_831B9722EA9FDD75 (media_id), INDEX IDX_831B9722B695AE45 (visualization_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE visualization (id INT AUTO_INCREMENT NOT NULL, title VARCHAR(160) NOT NULL, description LONGTEXT NOT NULL, chart_type VARCHAR(30) NOT NULL, mapping JSON NOT NULL, colors JSON NOT NULL, options JSON NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL, dataset_id INT NOT NULL, created_by_id INT DEFAULT NULL, INDEX IDX_E0936C40D47C2D1B (dataset_id), INDEX IDX_E0936C40B03A8386 (created_by_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE article ADD CONSTRAINT FK_23A0E66F675F31B FOREIGN KEY (author_id) REFERENCES `user` (id) ON DELETE SET NULL');
        $this->addSql('ALTER TABLE block ADD CONSTRAINT FK_831B97227294869C FOREIGN KEY (article_id) REFERENCES article (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE block ADD CONSTRAINT FK_831B9722EA9FDD75 FOREIGN KEY (media_id) REFERENCES media (id) ON DELETE RESTRICT');
        $this->addSql('ALTER TABLE block ADD CONSTRAINT FK_831B9722B695AE45 FOREIGN KEY (visualization_id) REFERENCES visualization (id) ON DELETE RESTRICT');
        $this->addSql('ALTER TABLE visualization ADD CONSTRAINT FK_E0936C40D47C2D1B FOREIGN KEY (dataset_id) REFERENCES dataset (id) ON DELETE RESTRICT');
        $this->addSql('ALTER TABLE visualization ADD CONSTRAINT FK_E0936C40B03A8386 FOREIGN KEY (created_by_id) REFERENCES `user` (id) ON DELETE SET NULL');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE article DROP FOREIGN KEY FK_23A0E66F675F31B');
        $this->addSql('ALTER TABLE block DROP FOREIGN KEY FK_831B97227294869C');
        $this->addSql('ALTER TABLE block DROP FOREIGN KEY FK_831B9722EA9FDD75');
        $this->addSql('ALTER TABLE block DROP FOREIGN KEY FK_831B9722B695AE45');
        $this->addSql('ALTER TABLE visualization DROP FOREIGN KEY FK_E0936C40D47C2D1B');
        $this->addSql('ALTER TABLE visualization DROP FOREIGN KEY FK_E0936C40B03A8386');
        $this->addSql('DROP TABLE article');
        $this->addSql('DROP TABLE block');
        $this->addSql('DROP TABLE visualization');
    }
}
