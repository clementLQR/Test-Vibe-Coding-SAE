<?php

declare(strict_types=1);

namespace App\Demo;

use App\Article\ArticleStatus;
use App\Article\ArticleType;
use App\Article\BlockType;
use App\Dataset\CsvParser;
use App\Dataset\DatasetAnalyzer;
use App\Dataset\DatasetSource;
use App\Dataset\SourceType;
use App\Dataset\VariableType;
use App\Entity\Article;
use App\Entity\Block;
use App\Entity\Dataset;
use App\Entity\MapItem;
use App\Entity\Page;
use App\Entity\ProgramSlot;
use App\Entity\TicketOffer;
use App\Entity\User;
use App\Entity\Venue;
use App\Entity\Visualization;
use App\Repository\SiteSettingsRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\String\Slugger\SluggerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

/**
 * Fills a fresh installation with a complete fictional event (demo for the defence,
 * first contact for new users): data sets, charts, articles, program, map, tickets, a page.
 */
final class DemoContentLoader
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly DatasetSource $source,
        private readonly CsvParser $parser,
        private readonly DatasetAnalyzer $analyzer,
        private readonly ValidatorInterface $validator,
        private readonly SiteSettingsRepository $settings,
        private readonly SluggerInterface $slugger,
        #[Autowire('%kernel.project_dir%/resources/demo')]
        private readonly string $demoDirectory,
    ) {
    }

    /** True when the site already has content: demo data is only added to an empty site. */
    public function hasContent(): bool
    {
        return $this->em->getRepository(Article::class)->count([]) > 0
            || $this->em->getRepository(Dataset::class)->count([]) > 0;
    }

    public function load(User $owner): void
    {
        $datasets = [
            'affluence' => $this->dataset('festival-affluence.csv', 'Affluence par scène', $owner),
            'tickets' => $this->dataset('billetterie-ventes.csv', 'Ventes de billets', $owner),
            'trail' => $this->dataset('trail-resultats.csv', 'Résultats du trail', $owner, categorical: ['Dossard']),
            'fair' => $this->dataset('salon-stands.csv', 'Stands du salon', $owner),
            'survey' => $this->dataset('enquete-festivaliers.csv', 'Enquête festivaliers', $owner, categorical: ['Répondant']),
        ];

        $charts = [
            'stages' => $this->chart($owner, $datasets['affluence'], 'Public par scène', 'La grande scène réunit à elle seule près de la moitié du public sur les trois jours.', 'bar', ['x' => 'Scène', 'y' => 'Spectateurs'], ['aggregation' => 'sum']),
            'slots' => $this->chart($owner, $datasets['affluence'], 'Affluence par jour et créneau', 'Le samedi à 22 h est le moment le plus fréquenté du festival.', 'heatmap', ['x' => 'Créneau', 'y' => 'Jour', 'value' => 'Spectateurs'], ['aggregation' => 'sum']),
            'sales' => $this->chart($owner, $datasets['tickets'], 'Billets vendus par semaine', 'Les ventes démarrent fort, ralentissent au printemps puis repartent juste avant l’événement.', 'line', ['x' => 'Semaine', 'y' => 'Billets vendus', 'series' => 'Type de billet'], ['aggregation' => 'sum']),
            'times' => $this->chart($owner, $datasets['trail'], 'Répartition des temps d’arrivée', 'La plupart des coureurs arrivent entre une et trois heures après le départ.', 'histogram', ['value' => 'Temps (min)'], ['bins' => 12]),
            'booths' => $this->chart($owner, $datasets['fair'], 'Surface et fréquentation des stands', 'Plus un stand est grand, plus il attire de visiteurs, quel que soit le secteur.', 'scatter', ['x' => 'Surface (m²)', 'y' => 'Visiteurs', 'color' => 'Secteur'], []),
            'transport' => $this->chart($owner, $datasets['survey'], 'Moyens de transport des festivaliers', 'La voiture reste majoritaire, mais train et covoiturage représentent ensemble plus d’un tiers des venues.', 'pie', ['category' => 'Transport'], ['aggregation' => 'count', 'donut' => true]),
        ];

        $review = $this->article($owner, 'Bilan de l’affluence', 'Trois jours, quatre scènes : ce que disent les chiffres de fréquentation.', ArticleType::Dashboard, 'fr', [
            [BlockType::Text, 'Cette année encore, le public a répondu présent. Voici comment il s’est réparti entre les scènes et au fil des soirées.'],
            [BlockType::Heading, 'Les scènes'],
            [BlockType::Visualization, $charts['stages']],
            [BlockType::Heading, 'Les moments forts'],
            [BlockType::Visualization, $charts['slots']],
            [BlockType::Text, 'Survolez les cases pour voir le nombre exact de spectateurs, ou affichez **les données** sous le graphique.'],
        ]);
        $reviewEn = $this->article($owner, 'Attendance review', 'Three days, four stages: what the attendance figures tell us.', ArticleType::Dashboard, 'en', [
            [BlockType::Text, 'Once again, the audience turned up. Here is how it spread across the stages and the evenings.'],
            [BlockType::Visualization, $charts['stages']],
            [BlockType::Visualization, $charts['slots']],
        ]);
        $key = bin2hex(random_bytes(16));
        $review->setTranslationKey($key);
        $reviewEn->setTranslationKey($key);

        $this->article($owner, 'La billetterie semaine après semaine', 'Pass, billets à la journée, camping : le rythme des ventes.', ArticleType::Dashboard, 'fr', [
            [BlockType::Visualization, $charts['sales']],
            [BlockType::Text, 'Les deux pics correspondent à l’ouverture de la billetterie et à l’annonce de la programmation complète.'],
        ]);
        $this->article($owner, 'Trail des Crêtes : les résultats', '190 coureurs sur trois distances.', ArticleType::Dashboard, 'fr', [
            [BlockType::Visualization, $charts['times']],
        ]);
        $this->article($owner, 'Salon pro : quels stands ont attiré le public ?', 'Surface, secteur et fréquentation des 48 stands.', ArticleType::Dashboard, 'fr', [
            [BlockType::Visualization, $charts['booths']],
        ]);
        $this->article($owner, 'Venir au festival', 'Train, covoiturage, navettes : comment viennent les festivaliers.', ArticleType::Dashboard, 'fr', [
            [BlockType::Visualization, $charts['transport']],
            [BlockType::Text, "Pour limiter l’empreinte carbone de l’événement :\n\n- des navettes gratuites depuis la gare ;\n- un parking réservé au covoiturage ;\n- un garage à vélos surveillé."],
        ]);

        $venues = $this->program();
        $this->map($venues);
        $this->tickets();
        $this->practicalInformation();

        $this->em->flush();
    }

    /**
     * @param list<string> $categorical identifiers detected as numbers but meant as categories
     */
    private function dataset(string $file, string $name, User $owner, array $categorical = []): Dataset
    {
        $path = $this->demoDirectory.'/'.$file;
        $table = $this->parser->parse((string) file_get_contents($path));
        $dataset = (new Dataset(SourceType::File, $this->source->storeCopy($path), $owner))
            ->setName($name)
            ->setDescription('Données fictives de démonstration.');
        $this->analyzer->createVariables($dataset, $table);
        foreach ($dataset->getVariables() as $variable) {
            if (\in_array($variable->getName(), $categorical, true)) {
                $variable->setType(VariableType::Categorical);
            }
        }
        $dataset->markValidated();
        $this->em->persist($dataset);

        return $dataset;
    }

    /**
     * @param array<string, string> $mapping
     * @param array<string, mixed>  $options
     */
    private function chart(User $owner, Dataset $dataset, string $title, string $description, string $type, array $mapping, array $options): Visualization
    {
        $chart = (new Visualization())
            ->setTitle($title)
            ->setDescription($description)
            ->setChartType($type)
            ->setDataset($dataset)
            ->setMapping($mapping)
            ->setOptions($options)
            ->setCreatedBy($owner);

        // The demo must be a showcase of valid content: fail loudly if a mapping drifts from the CSV files
        $violations = $this->validator->validate($chart);
        if (\count($violations) > 0) {
            throw new \LogicException(sprintf('Invalid demo chart "%s": %s', $title, (string) $violations));
        }
        $this->em->persist($chart);

        return $chart;
    }

    /**
     * @param list<array{0: BlockType, 1: string|Visualization}> $blocks
     */
    private function article(User $owner, string $title, string $summary, ArticleType $type, string $locale, array $blocks): Article
    {
        $article = (new Article($owner))
            ->setTitle($title)
            ->setSummary($summary)
            ->setType($type)
            ->setLocale($locale)
            ->setStatus(ArticleStatus::Published)
            // The site is empty when the demo is loaded: plain slugs are unique
            ->setSlug($this->slugger->slug($title)->lower()->toString());

        foreach ($blocks as $position => [$blockType, $content]) {
            $block = (new Block($article, $blockType))->setPosition($position);
            if ($content instanceof Visualization) {
                $block->setVisualization($content);
            } else {
                $block->setText($content);
                if (BlockType::Heading === $blockType) {
                    $block->setHeadingLevel(2);
                }
            }
        }
        $this->em->persist($article);

        return $article;
    }

    /** @return array<string, Venue> */
    private function program(): array
    {
        $venues = [];
        foreach ([['Grande scène', '#14213d'], ['Scène du lac', '#0e7490'], ['Chapiteau', '#b45309'], ['Scène découverte', '#7c3aed']] as $position => [$name, $color]) {
            $venues[$name] = (new Venue())->setName($name)->setColor($color)->setPosition($position);
            $this->em->persist($venues[$name]);
        }

        $start = $this->settings->findCurrent()?->getEventStart() ?? new \DateTimeImmutable('2027-07-09');
        $slots = [
            [0, '18:00', '19:15', 'Scène découverte', 'Les Lauréats du tremplin', 'Concert'],
            [0, '20:30', '22:00', 'Grande scène', 'Concert d’ouverture', 'Concert'],
            [0, '22:30', '00:30', 'Chapiteau', 'Nuit électro', 'DJ set'],
            [1, '14:00', '15:30', 'Scène du lac', 'Atelier percussions', 'Atelier'],
            [1, '18:00', '19:30', 'Scène du lac', 'Fanfare des Bords de Loire', 'Concert'],
            [1, '21:00', '23:00', 'Grande scène', 'Tête d’affiche du samedi', 'Concert'],
            [2, '11:00', '12:00', 'Chapiteau', 'Conte musical pour les enfants', 'Jeune public'],
            [2, '16:00', '17:30', 'Grande scène', 'Concert de clôture', 'Concert'],
        ];
        foreach ($slots as [$day, $from, $to, $venue, $title, $category]) {
            $date = $start->modify("+$day days");
            $end = $date->modify($to < $from ? '+1 day' : '+0 day');
            $this->em->persist((new ProgramSlot())
                ->setTitle($title)
                ->setStartsAt(new \DateTimeImmutable($date->format('Y-m-d').' '.$from))
                ->setEndsAt(new \DateTimeImmutable($end->format('Y-m-d').' '.$to))
                ->setVenue($venues[$venue] ?? null)
                ->setCategory($category));
        }

        return $venues;
    }

    /** @param array<string, Venue> $venues */
    private function map(array $venues): void
    {
        // Around the default map centre (Tours, banks of the Loire)
        $points = [
            ['Grande scène', 47.3949, 0.6835, $venues['Grande scène']],
            ['Scène du lac', 47.3936, 0.6872, $venues['Scène du lac']],
            ['Chapiteau', 47.3929, 0.6841, $venues['Chapiteau']],
            ['Poste de secours', 47.3942, 0.6856, null],
        ];
        foreach ($points as [$label, $lat, $lng, $venue]) {
            $this->em->persist((new MapItem())->setLabel($label)->setKind('point')->setCoordinates([[$lat, $lng]])
                ->setColor($venue?->getColor() ?? '#dc2626')->setVenue($venue));
        }
        $this->em->persist((new MapItem())->setLabel('Camping')->setKind('zone')->setColor('#15803d')
            ->setDescription('Ouvert du vendredi 12 h au lundi 12 h.')
            ->setCoordinates([[47.3958, 0.6812], [47.3962, 0.6834], [47.3953, 0.6839], [47.3949, 0.6816]]));
    }

    private function tickets(): void
    {
        $offers = [
            ['Pass 3 jours', 11900, 'available', 'Accès aux trois jours du festival.'],
            ['Billet 1 jour', 4900, 'available', 'Vendredi, samedi ou dimanche.'],
            ['Pass camping', 14500, 'soon', 'Pass 3 jours avec un emplacement au camping.'],
            ['Tarif réduit', 3500, 'sold_out', 'Étudiants et demandeurs d’emploi, sur justificatif.'],
        ];
        foreach ($offers as $position => [$name, $price, $availability, $description]) {
            $this->em->persist((new TicketOffer())->setName($name)->setPriceCents($price)->setAvailability($availability)
                ->setDescription($description)->setPosition($position)->setExternalUrl('https://billetterie.example.org/'.$position));
        }
    }

    private function practicalInformation(): void
    {
        $page = (new Page())->setTitle('Infos pratiques')->setSlug('infos-pratiques')->setTemplate('contact')
            ->setStatus(ArticleStatus::Published)->setMenuOrder(1);
        (new Block($page, BlockType::Text))->setPosition(0)
            ->setText("Le site ouvre chaque jour à 14 h.\n\nUne question ? Écrivez-nous à [contact@example.org](mailto:contact@example.org).");
        $this->em->persist($page);
    }
}
