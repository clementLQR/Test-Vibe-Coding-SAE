<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20261008183930 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Event modules: venues, program, interactive map, ticket offers';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE map_config (id INT AUTO_INCREMENT NOT NULL, mode VARCHAR(10) NOT NULL, center_lat DOUBLE PRECISION NOT NULL, center_lng DOUBLE PRECISION NOT NULL, zoom INT NOT NULL, background_image_id INT DEFAULT NULL, INDEX IDX_900EF440E6DA28AA (background_image_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE map_item (id INT AUTO_INCREMENT NOT NULL, label VARCHAR(120) NOT NULL, description VARCHAR(1000) DEFAULT NULL, kind VARCHAR(10) NOT NULL, coordinates JSON NOT NULL, color VARCHAR(7) NOT NULL, venue_id INT DEFAULT NULL, INDEX IDX_8C33828B40A73EBA (venue_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE program_slot (id INT AUTO_INCREMENT NOT NULL, title VARCHAR(160) NOT NULL, description LONGTEXT DEFAULT NULL, starts_at DATETIME NOT NULL, ends_at DATETIME NOT NULL, speakers VARCHAR(255) DEFAULT NULL, category VARCHAR(60) DEFAULT NULL, locale VARCHAR(2) NOT NULL, venue_id INT DEFAULT NULL, INDEX IDX_A1E8756040A73EBA (venue_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE ticket_offer (id INT AUTO_INCREMENT NOT NULL, name VARCHAR(120) NOT NULL, description VARCHAR(1000) DEFAULT NULL, price_cents INT NOT NULL, currency VARCHAR(3) NOT NULL, external_url VARCHAR(2048) DEFAULT NULL, availability VARCHAR(10) NOT NULL, position INT NOT NULL, locale VARCHAR(2) NOT NULL, PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE venue (id INT AUTO_INCREMENT NOT NULL, name VARCHAR(120) NOT NULL, description VARCHAR(1000) DEFAULT NULL, color VARCHAR(7) NOT NULL, position INT NOT NULL, PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE map_config ADD CONSTRAINT FK_900EF440E6DA28AA FOREIGN KEY (background_image_id) REFERENCES media (id) ON DELETE RESTRICT');
        $this->addSql('ALTER TABLE map_item ADD CONSTRAINT FK_8C33828B40A73EBA FOREIGN KEY (venue_id) REFERENCES venue (id) ON DELETE SET NULL');
        $this->addSql('ALTER TABLE program_slot ADD CONSTRAINT FK_A1E8756040A73EBA FOREIGN KEY (venue_id) REFERENCES venue (id) ON DELETE SET NULL');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE map_config DROP FOREIGN KEY FK_900EF440E6DA28AA');
        $this->addSql('ALTER TABLE map_item DROP FOREIGN KEY FK_8C33828B40A73EBA');
        $this->addSql('ALTER TABLE program_slot DROP FOREIGN KEY FK_A1E8756040A73EBA');
        $this->addSql('DROP TABLE map_config');
        $this->addSql('DROP TABLE map_item');
        $this->addSql('DROP TABLE program_slot');
        $this->addSql('DROP TABLE ticket_offer');
        $this->addSql('DROP TABLE venue');
    }
}
