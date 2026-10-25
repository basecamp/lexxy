// Partition a stretch of text into consecutive { start, end, range } segments,
// where offsets are relative to the text and range is the covering source
// range — expressed in outer coordinates as { start, end, ... } — or null for
// the stretches no range covers. Ranges must be sorted and non-overlapping.
export function segmentTextByRanges(text, textStart, ranges) {
  const segments = []
  let cursor = 0

  for (const range of ranges) {
    const from = Math.max(range.start - textStart, cursor)
    const to = Math.min(range.end - textStart, text.length)

    if (from < to) {
      if (from > cursor) {
        segments.push({ start: cursor, end: from, range: null })
      }
      segments.push({ start: from, end: to, range })
      cursor = to
    }
  }

  if (cursor < text.length) {
    segments.push({ start: cursor, end: text.length, range: null })
  }

  return segments
}
