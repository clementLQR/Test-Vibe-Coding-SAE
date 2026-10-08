import { useTranslation } from 'react-i18next'
import type { Block } from '../../lib/api/types'
import { renderMarkdown } from '../../lib/markdown'
import { ChartFigure } from '../charts/ChartFigure'

export interface ArticleViewModel {
  title: string
  summary: string
  blocks: Omit<Block, 'id' | 'position'>[]
}

/** Renders an article as readers see it (preview in the editor, public page). */
export function ArticleView({ article }: { article: ArticleViewModel }) {
  return (
    <article className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-3">
        <h1 className="font-heading text-3xl font-bold sm:text-4xl">{article.title}</h1>
        {article.summary && <p className="text-lg text-muted">{article.summary}</p>}
      </header>
      {article.blocks.map((block, i) => (
        <BlockView key={i} block={block} />
      ))}
    </article>
  )
}

function BlockView({ block }: { block: ArticleViewModel['blocks'][number] }) {
  const { i18n } = useTranslation()

  switch (block.type) {
    case 'heading': {
      const Tag = `h${block.headingLevel ?? 2}` as 'h2' | 'h3' | 'h4'
      const size = { h2: 'text-2xl', h3: 'text-xl', h4: 'text-lg' }[Tag]
      return <Tag className={`font-heading font-semibold ${size}`}>{block.text}</Tag>
    }
    case 'text':
      return <div className="space-y-3 leading-relaxed">{renderMarkdown(block.text ?? '')}</div>
    case 'image':
      if (!block.media) return null
      return (
        <figure className="space-y-2">
          <img
            src={block.media.url}
            alt={i18n.language === 'en' ? block.media.altEn : block.media.altFr}
            width={block.media.width}
            height={block.media.height}
            loading="lazy"
            className="h-auto w-full rounded-block"
          />
          {block.text && <figcaption className="text-sm text-muted">{block.text}</figcaption>}
        </figure>
      )
    case 'visualization':
      if (!block.visualization) return null
      return (
        <ChartFigure
          title={block.visualization.title}
          description={block.visualization.description}
          datasetId={block.visualization.datasetId}
          chartType={block.visualization.chartType}
          mapping={block.visualization.mapping}
          options={block.visualization.options}
          colors={block.visualization.colors}
        />
      )
  }
}
