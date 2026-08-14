// [파일 역할] 사진 비율은 그대로 두고 긴 쪽만 최대 크기로 줄일 값을 계산합니다.

// ======================================= 이미지 크기 계산 ========================================

// [역할] `getConstrainedImageSize`는 사진 크기를 검사하고 비율을 유지할 한쪽 제한값을 계산합니다.
// [문법] 세 번째 값을 생략하면 `maxDimension`은 기본값 1,000을 사용합니다. 숫자의 `_`는 읽기 편한 구분자입니다.
export function getConstrainedImageSize(
  width: number,
  height: number,
  maxDimension = 1_000,
): { width: number | null; height: number | null } {
  // 너비나 높이가 0 이하이면 사진 비율을 계산할 수 없으므로 ImageManipulator를 부르기 전에 오류를 냅니다.
  if (width <= 0 || height <= 0) {
    throw new Error("선택한 이미지의 크기 정보가 올바르지 않습니다.");
  }

  if (Math.max(width, height) <= maxDimension) {
    // 두 값이 모두 `null`이면 이미 충분히 작으므로 크기를 바꾸지 말라는 뜻입니다.
    return { width: null, height: null };
  }

  // [문법] 삼항 연산자는 가로가 더 길면 첫 객체를, 세로가 더 길면 둘째 객체를 선택합니다.
  // [라이브러리] ImageManipulator에 한쪽 크기만 주면 다른 쪽은 원래 사진 비율에 맞춰 자동 계산됩니다.
  return width >= height
    ? { width: maxDimension, height: null }
    : { width: null, height: maxDimension };
}

// =================================================================================================
