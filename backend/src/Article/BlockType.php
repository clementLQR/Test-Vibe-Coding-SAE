<?php

declare(strict_types=1);

namespace App\Article;

enum BlockType: string
{
    case Heading = 'heading';
    case Text = 'text';
    case Image = 'image';
    case Visualization = 'visualization';
}
