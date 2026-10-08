<?php

$finder = (new PhpCsFixer\Finder())
    ->in(__DIR__)
    ->exclude(['var', 'vendor'])
    ->notPath('config/reference.php')
;

return (new PhpCsFixer\Config())
    ->setRules([
        '@Symfony' => true,
        'declare_strict_types' => true,
        'phpdoc_to_comment' => false,
    ])
    ->setCacheFile(__DIR__.'/var/cache/.php-cs-fixer.cache')
    ->setRiskyAllowed(true)
    ->setFinder($finder)
;
