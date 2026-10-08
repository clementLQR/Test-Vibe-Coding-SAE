<?php

declare(strict_types=1);

namespace App\Command;

use App\Demo\DemoContentLoader;
use App\Repository\UserRepository;
use App\Security\Role;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

/**
 * bin/console app:demo — fills an installed but empty site with the demo event.
 */
#[AsCommand(name: 'app:demo', description: 'Adds the demo event content (data sets, charts, articles, program, map, tickets) to an empty site')]
final class DemoCommand extends Command
{
    public function __construct(
        private readonly DemoContentLoader $loader,
        private readonly UserRepository $users,
    ) {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        $admin = $this->users->createQueryBuilder('u')
            ->where('u.roles LIKE :role')->setParameter('role', '%"'.Role::ADMIN.'"%')
            ->setMaxResults(1)->getQuery()->getOneOrNullResult();
        if (null === $admin) {
            $io->error('Install the site first (an administrator owns the demo content).');

            return Command::FAILURE;
        }
        if ($this->loader->hasContent()) {
            $io->error('The site already has articles or data sets: the demo is only added to an empty site.');

            return Command::FAILURE;
        }

        $this->loader->load($admin);
        $io->success('Demo content added.');

        return Command::SUCCESS;
    }
}
