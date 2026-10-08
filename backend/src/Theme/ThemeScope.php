<?php

declare(strict_types=1);

namespace App\Theme;

/** What a theme applies to; themes cascade article > page > site. */
enum ThemeScope: string
{
    case Site = 'site';
    case Page = 'page';
    case Article = 'article';
}
