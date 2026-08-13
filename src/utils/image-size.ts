// [파일 역할] 원본 종횡비를 유지하면서 긴 변만 제한하도록 ImageManipulator resize 입력을 계산합니다.
export function getConstrainedImageSize(
  width: number,
  height: number,
  maxDimension = 1_000,
): { width: number | null; height: number | null } {
  if (width <= 0 || height <= 0) {
    throw new Error("선택한 이미지의 크기 정보가 올바르지 않습니다.");
  }

  if (Math.max(width, height) <= maxDimension) {
    // null은 해당 축을 직접 지정하지 않으며 작은 이미지는 resize 자체를 생략하라는 신호입니다.
    return { width: null, height: null };
  }

  return width >= height
    ? { width: maxDimension, height: null }
    : { width: null, height: maxDimension };
}
