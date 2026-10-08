<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20261008173009 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Data sets and their variables';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE dataset (id INT AUTO_INCREMENT NOT NULL, name VARCHAR(120) NOT NULL, description VARCHAR(1000) DEFAULT NULL, source_type VARCHAR(10) NOT NULL, source_uri VARCHAR(2048) NOT NULL, delimiter VARCHAR(1) NOT NULL, status VARCHAR(10) NOT NULL, row_count INT DEFAULT NULL, created_at DATETIME NOT NULL, validated_at DATETIME DEFAULT NULL, provider_id INT DEFAULT NULL, INDEX IDX_B7A041D0A53A8AA (provider_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE dataset_variable (id INT AUTO_INCREMENT NOT NULL, column_index INT NOT NULL, name VARCHAR(255) NOT NULL, label VARCHAR(255) NOT NULL, type VARCHAR(12) NOT NULL, detected_type VARCHAR(12) NOT NULL, dataset_id INT NOT NULL, UNIQUE INDEX UNIQ_53D9B104D47C2D1BBD34D0E1 (dataset_id, column_index), INDEX IDX_53D9B104D47C2D1B (dataset_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE dataset ADD CONSTRAINT FK_B7A041D0A53A8AA FOREIGN KEY (provider_id) REFERENCES `user` (id) ON DELETE SET NULL');
        $this->addSql('ALTER TABLE dataset_variable ADD CONSTRAINT FK_53D9B104D47C2D1B FOREIGN KEY (dataset_id) REFERENCES dataset (id) ON DELETE CASCADE');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE dataset DROP FOREIGN KEY FK_B7A041D0A53A8AA');
        $this->addSql('ALTER TABLE dataset_variable DROP FOREIGN KEY FK_53D9B104D47C2D1B');
        $this->addSql('DROP TABLE dataset');
        $this->addSql('DROP TABLE dataset_variable');
    }
}
