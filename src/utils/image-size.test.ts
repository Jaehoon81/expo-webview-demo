// [파일 역할] 사진 resize 입력 계산의 작은 이미지, 가로·세로 긴 변과 invalid dimension 경계를 검증합니다.
// [검증 경계] 숫자 계산만 확인하며 실제 image decode, 종횡비 rendering, PNG/base64 생성과 memory 사용은 확인하지 않습니다.
import { getConstrainedImageSize } from "@/src/utils/image-size";

describe("getConstrainedImageSize", () => {
  it("이미 작은 이미지는 resize하지 않는다", () => {
    expect(getConstrainedImageSize(800, 600)).toEqual({
      width: null,
      height: null,
    });
  });

  it("가로와 세로 이미지의 긴 변만 1000으로 제한한다", () => {
    // 한 축만 지정하고 다른 축은 null로 남겨 ImageManipulator가 비율을 유지하도록 하는 계약입니다.
    expect(getConstrainedImageSize(4000, 3000)).toEqual({
      width: 1_000,
      height: null,
    });
    expect(getConstrainedImageSize(2000, 3000)).toEqual({
      width: null,
      height: 1_000,
    });
  });

  it("잘못된 크기를 거부한다", () => {
    expect(() => getConstrainedImageSize(0, 100)).toThrow();
  });
});
