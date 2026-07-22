export const API_BATCH_MAX = 30

export function splitUniqueIds(ids: string[], size = API_BATCH_MAX): string[][] {
  const unique = Array.from(new Set(ids))
  const chunks: string[][] = []
  for (let index = 0; index < unique.length; index += size) {
    chunks.push(unique.slice(index, index + size))
  }
  return chunks
}
