<?php

declare(strict_types=1);

namespace App\Article;

enum ArticleType: string
{
    /** Text and images. */
    case Classic = 'classic';
    /** Data story: at least one visualization. */
    case Dashboard = 'dashboard';
}
