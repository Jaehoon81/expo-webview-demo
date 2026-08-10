export function getConstrainedImageSize(
  width: number,
  height: number,
  maxDimension = 1_000,
): { width: number | null; height: number | null } {
  if (width <= 0 || height <= 0) {
    throw new Error("선택한 이미지의 크기 정보가 올바르지 않습니다.");
  }

  if (Math.max(width, height) <= maxDimension) {
    return { width: null, height: null };
  }

  return width >= height
    ? { width: maxDimension, height: null }
    : { width: null, height: maxDimension };
}
