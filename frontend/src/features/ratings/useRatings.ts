import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch, jsonBody } from '../../lib/api/client'

export interface BlockRating {
  average: number
  count: number
  mine: number | null
}

const key = (articleId: number) => ['articles', articleId, 'ratings']

/** Ratings of every rated block of an article (one request). */
export function useArticleRatings(articleId: number, enabled = true) {
  return useQuery({
    queryKey: key(articleId),
    queryFn: () => apiFetch<{ blocks: Record<string, BlockRating> }>(`/articles/${articleId}/ratings`),
    select: (data) => data.blocks,
    enabled,
  })
}

export function useRateBlock(articleId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ blockId, score }: { blockId: number; score: number }) =>
      apiFetch<BlockRating>(`/blocks/${blockId}/rating`, jsonBody('PUT', { score })),
    onSuccess: (rating, { blockId }) => {
      queryClient.setQueryData<{ blocks: Record<string, BlockRating> }>(key(articleId), (current) => ({
        blocks: { ...current?.blocks, [blockId]: rating },
      }))
    },
  })
}
