<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20261008181356 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Pages, block ratings and themes';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE page (id INT AUTO_INCREMENT NOT NULL, title VARCHAR(200) NOT NULL, slug VARCHAR(220) NOT NULL, template VARCHAR(20) NOT NULL, status VARCHAR(12) NOT NULL, show_in_menu TINYINT NOT NULL, menu_order INT NOT NULL, locale VARCHAR(2) NOT NULL, published_at DATETIME DEFAULT NULL, updated_at DATETIME NOT NULL, UNIQUE INDEX UNIQ_140AB620989D9B62 (slug), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE rating (id INT AUTO_INCREMENT NOT NULL, score SMALLINT NOT NULL, rated_at DATETIME NOT NULL, user_id INT NOT NULL, block_id INT NOT NULL, UNIQUE INDEX UNIQ_D8892622A76ED395E9ED820C (user_id, block_id), INDEX IDX_D8892622A76ED395 (user_id), INDEX IDX_D8892622E9ED820C (block_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE theme (id INT AUTO_INCREMENT NOT NULL, name VARCHAR(120) NOT NULL, scope VARCHAR(10) NOT NULL, tokens JSON NOT NULL, status VARCHAR(10) NOT NULL, review_comment VARCHAR(1000) DEFAULT NULL, updated_at DATETIME NOT NULL, page_id INT DEFAULT NULL, article_id INT DEFAULT NULL, proposed_by_id INT DEFAULT NULL, INDEX IDX_9775E708C4663E4 (page_id), INDEX IDX_9775E7087294869C (article_id), INDEX IDX_9775E708DAB5A938 (proposed_by_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE rating ADD CONSTRAINT FK_D8892622A76ED395 FOREIGN KEY (user_id) REFERENCES `user` (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE rating ADD CONSTRAINT FK_D8892622E9ED820C FOREIGN KEY (block_id) REFERENCES block (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE theme ADD CONSTRAINT FK_9775E708C4663E4 FOREIGN KEY (page_id) REFERENCES page (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE theme ADD CONSTRAINT FK_9775E7087294869C FOREIGN KEY (article_id) REFERENCES article (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE theme ADD CONSTRAINT FK_9775E708DAB5A938 FOREIGN KEY (proposed_by_id) REFERENCES `user` (id) ON DELETE SET NULL');
        $this->addSql('ALTER TABLE block ADD page_id INT DEFAULT NULL, CHANGE article_id article_id INT DEFAULT NULL');
        $this->addSql('ALTER TABLE block ADD CONSTRAINT FK_831B9722C4663E4 FOREIGN KEY (page_id) REFERENCES page (id) ON DELETE CASCADE');
        $this->addSql('CREATE INDEX IDX_831B9722C4663E4 ON block (page_id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE rating DROP FOREIGN KEY FK_D8892622A76ED395');
        $this->addSql('ALTER TABLE rating DROP FOREIGN KEY FK_D8892622E9ED820C');
        $this->addSql('ALTER TABLE theme DROP FOREIGN KEY FK_9775E708C4663E4');
        $this->addSql('ALTER TABLE theme DROP FOREIGN KEY FK_9775E7087294869C');
        $this->addSql('ALTER TABLE theme DROP FOREIGN KEY FK_9775E708DAB5A938');
        $this->addSql('DROP TABLE page');
        $this->addSql('DROP TABLE rating');
        $this->addSql('DROP TABLE theme');
        $this->addSql('ALTER TABLE block DROP FOREIGN KEY FK_831B9722C4663E4');
        $this->addSql('DROP INDEX IDX_831B9722C4663E4 ON block');
        $this->addSql('ALTER TABLE block DROP page_id, CHANGE article_id article_id INT NOT NULL');
    }
}
