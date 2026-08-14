// [파일 역할] 탭 번호와 `f0`~`f3` tag가 가질 수 있는 값과 서로 바꾸는 방법을 정합니다.
// [문법] `as const`는 각 값을 일반 string이 아니라 정확한 `"f0"`~`"f3"` 값으로 기억하게 합니다.
// 배열도 함부로 바꿀 수 없는 고정된 배열로 판단합니다.

// ========================================= 탭 type 계약 ==========================================

export const TAB_TAGS = ["f0", "f1", "f2", "f3"] as const;

// [문법] `(typeof TAB_TAGS)[number]`는 배열 안의 값들을 꺼내 `"f0" | ... | "f3"` type을 만듭니다.
// 따라서 TabTag에는 이 네 문자열만 들어갈 수 있습니다.
export type TabTag = (typeof TAB_TAGS)[number];
export type TabIndex = 0 | 1 | 2 | 3;

// =================================================================================================

// ========================================= 탭 변환 함수 ==========================================

// [역할] `isTabIndex`는 외부 숫자가 실제 탭 범위인 0부터 3 사이의 정수인지 확인합니다.
// [문법] `value is TabIndex`는 이 함수가 true를 돌려주면 value가 0~3이라고 TypeScript도 믿게 합니다.
export function isTabIndex(value: number): value is TabIndex {
  // [주의] 주소나 저장 파일에서 읽은 숫자는 앱 밖에서 온 값입니다. 정수 0~3인지 여기서 다시 확인합니다.
  return Number.isInteger(value) && value >= 0 && value < TAB_TAGS.length;
}

// [역할] `tabIndexToTag`는 검사된 탭 번호를 같은 위치의 `f0`~`f3` tag로 바꿉니다.
export function tabIndexToTag(index: TabIndex): TabTag {
  // index는 이미 0~3으로 제한되어 있으므로 항상 맞는 tag 하나를 찾을 수 있습니다.
  return TAB_TAGS[index];
}

// [역할] `tabTagToIndex`는 문자열 tag를 탭 번호로 바꾸고, 목록에 없으면 `null`을 돌려줍니다.
export function tabTagToIndex(tag: string): TabIndex | null {
  // [문법] `as TabTag`는 `indexOf`에 넣기 위한 TypeScript 표시일 뿐, 실제 문자열이 맞다고 검증하지는 않습니다.
  // 그래서 찾은 번호를 `isTabIndex`로 다시 확인합니다. 찾지 못하면 -1이므로 `null`을 돌려줍니다.
  const index = TAB_TAGS.indexOf(tag as TabTag);
  return isTabIndex(index) ? index : null;
}

// =================================================================================================
