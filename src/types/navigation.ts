// [파일 역할] 탭 index와 bridge tag 사이의 제한된 값 집합 및 안전한 변환 함수를 제공합니다.
export const TAB_TAGS = ["f0", "f1", "f2", "f3"] as const;

// `as const`와 indexed access type으로 실제 배열 값만 TabTag로 허용합니다.
export type TabTag = (typeof TAB_TAGS)[number];
export type TabIndex = 0 | 1 | 2 | 3;

export function isTabIndex(value: number): value is TabIndex {
  // [주의] 외부 query나 persisted JSON의 number는 이 runtime guard를 통과해야 TypeScript의 TabIndex로 좁혀집니다.
  return Number.isInteger(value) && value >= 0 && value < TAB_TAGS.length;
}

export function tabIndexToTag(index: TabIndex): TabTag {
  return TAB_TAGS[index];
}

export function tabTagToIndex(tag: string): TabIndex | null {
  // 찾지 못한 index는 -1이므로 isTabIndex가 거부하고 caller가 null 분기를 처리합니다.
  const index = TAB_TAGS.indexOf(tag as TabTag);
  return isTabIndex(index) ? index : null;
}
