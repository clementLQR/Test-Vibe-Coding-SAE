<?php

declare(strict_types=1);

use Symfony\Component\Dotenv\Dotenv;

require dirname(__DIR__).'/vendor/autoload.php';

(new Dotenv())->bootEnv(dirname(__DIR__).'/.env');

if ($_SERVER['APP_DEBUG']) {
    umask(0000);
}

// Fresh test database built from the migrations, once per run
$console = 'php '.escapeshellarg(dirname(__DIR__).'/bin/console').' --env=test -q ';
passthru($console.'doctrine:database:drop --force --if-exists');
passthru($console.'doctrine:database:create');
passthru($console.'doctrine:migrations:migrate -n', $exitCode);
if (0 !== $exitCode) {
    exit($exitCode);
}
