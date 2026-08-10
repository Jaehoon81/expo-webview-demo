export const TAB_TAGS = ["f0", "f1", "f2", "f3"] as const;

export type TabTag = (typeof TAB_TAGS)[number];
export type TabIndex = 0 | 1 | 2 | 3;

export function isTabIndex(value: number): value is TabIndex {
  return Number.isInteger(value) && value >= 0 && value < TAB_TAGS.length;
}

export function tabIndexToTag(index: TabIndex): TabTag {
  return TAB_TAGS[index];
}

export function tabTagToIndex(tag: string): TabIndex | null {
  const index = TAB_TAGS.indexOf(tag as TabTag);
  return isTabIndex(index) ? index : null;
}
