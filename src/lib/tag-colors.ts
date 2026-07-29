export const TAG_COLORS = [
  '#2563eb',
  '#16a34a',
  '#d97706',
  '#dc2626',
  '#7c3aed',
  '#0891b2',
  '#db2777',
  '#65a30d',
  '#ea580c',
  '#4f46e5',
] as const

export const DEFAULT_TAG_COLOR = TAG_COLORS[0]

export function tagColorForIndex(index: number) {
  return TAG_COLORS[index % TAG_COLORS.length]
}
